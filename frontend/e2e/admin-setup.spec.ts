import {
  test,
  expect,
  type APIRequestContext,
  type APIResponse,
  type Locator,
  type Page,
} from "@playwright/test";
import {
  API_BASE,
  apiLogin,
  login,
  logout,
  pickDate,
  uniqueEmail,
  uniqueName,
  uniqueStudentNumber,
  uniqueUsername,
  waitForApi,
  waitForToast,
} from "./helpers";

// Serial: every phase depends on the previous phase's data. Shared state flows
// through `run` so later tests (Phases 1-6) reuse the same entities.
export const run: {
  platformEmail: string;
  platformPassword: string;
  adminEmail?: string;
  adminPassword?: string;
  adminId?: string;
  orgName?: string;
  orgId?: string;
  orgExtension?: string;
  schoolYearName?: string;
  schoolYearId?: string;
  schoolYearRoute?: string;
  educatorEmail?: string;
  educatorPassword?: string;
  educatorName?: string;
  educatorId?: string;
  jhsProgramName?: string;
  jhsProgramId?: string;
  levelIds?: string[];
  sectionName?: string;
  sectionId?: string;
  student1?: { id: string; fullName: string };
  student2?: { id: string; fullName: string };
  student3?: { id: string; fullName: string };
  subject?: { id: string; title: string; programId: string };
  semesterId?: string;
  programEnrollmentId?: string;
  classItem?: {
    id: string;
    subject_id: string;
    educator_id: string;
    section_id: string;
    school_year_id: string;
    semester_id: string;
    capacity: number;
    schedules: Array<{ weekday: number; start_time: string; end_time: string }>;
  };
  programIds: Record<string, string>;
  // Per-department placement condition, captured after the Phase 7b enrollment
  // wizard places a student (keyed by programId). A student must be placed into
  // the department → level → section of a class before being eligible for it.
  placements: Record<
    string,
    {
      programId: string;
      name: string;
      levelId: string;
      levelName: string;
      sectionId: string;
      sectionName: string;
    }
  >;
  courseId?: string;
  scaleName?: string;
  scaleId?: string;
  schemeTemplateIds: Record<string, string>;
  schemeTemplateName?: string;
  semesterTemplateName?: string;
  semesterTemplateId?: string;
} = {
  platformEmail: "platform@edutool.dev",
  platformPassword: "platform123",
  programIds: {},
  placements: {},
  schemeTemplateIds: {},
};

// Authenticated API headers for the run's admin account.
const adminHeaders = async (
  request: APIRequestContext,
): Promise<{ Authorization: string }> => {
  const token = await apiLogin(request, run.adminEmail!, run.adminPassword!);
  return { Authorization: `Bearer ${token}` };
};

// Unwrap the ResponseInterceptor envelope `{ success, data }`.
const unwrapData = async <T>(res: APIResponse): Promise<T> =>
  (await res.json()).data as T;

// Several admin pages wrap dialog-open buttons in `ensureOrganization()`,
// which silently drops the click while the org query is still loading. Retry
// the click until the dialog actually appears so the test is timing-proof.
const openDialog = async (
  page: Page,
  trigger: Locator,
  content: Locator,
): Promise<void> => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await trigger.click();
    try {
      await content.waitFor({ state: "visible", timeout: 1500 });
      return;
    } catch {
      // The click was dropped (org still loading); try again.
    }
  }
  await content.waitFor({ state: "visible", timeout: 15_000 });
};

// Unwrap the `{ success, data }` envelope for LIST-shaped responses (either
// `data: T[]` or `data: { data: T[] }`).
const unwrapList = async <T>(res: APIResponse): Promise<T[]> => {
  const body = (await res.json()) as { data?: T[] | { data?: T[] } };
  const d = body?.data;
  return (Array.isArray(d) ? d : (d?.data ?? [])) as T[];
};

// Distinct weekly slots for the module-scope createClass below. Every
// readiness class is bound to the same run.educatorId, so reusing one
// (weekday 6, 08:00-09:30) slot tripped assertNoEducatorConflict the moment a
// second class landed in the same phase. Each call takes the next free slot.
const CLASS_SLOT_POOL: Array<{ weekday: number; startTime: string; endTime: string }> = [
  { weekday: 6, startTime: "08:00", endTime: "09:30" },
  { weekday: 6, startTime: "10:00", endTime: "11:30" },
  { weekday: 6, startTime: "13:00", endTime: "14:30" },
  { weekday: 6, startTime: "15:00", endTime: "16:30" },
  { weekday: 6, startTime: "17:00", endTime: "18:30" },
];
let classSlotCursor = 0;
const nextClassSchedule = () => {
  const schedule = [CLASS_SLOT_POOL[classSlotCursor % CLASS_SLOT_POOL.length]];
  classSlotCursor += 1;
  return schedule;
};

const createSection = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  levelId: string,
  baseName: string,
): Promise<string> => {
  const res = await request.post(`${API_BASE}/sections`, {
    data: {
      levelId,
      schoolYearId: run.schoolYearId,
      name: uniqueName(baseName),
      capacity: 30,
    },
    headers,
  });
  expect(res.status()).toBe(201);
  return (await unwrapData<{ id: string }>(res)).id;
};

const createSubject = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  baseName: string,
  opts: { programId?: string; levelId?: string } = {},
): Promise<{ id: string; title: string }> => {
  const res = await request.post(`${API_BASE}/subjects`, {
    data: {
      name: uniqueName(baseName),
      subjectType: opts.levelId ? "minor" : "major",
      programId: opts.programId ?? run.jhsProgramId,
      ...(opts.levelId ? { levelId: opts.levelId } : {}),
    },
    headers,
  });
  expect(res.status()).toBe(201);
  return await unwrapData<{ id: string; title: string }>(res);
};

const createClass = async (
  request: APIRequestContext,
  headers: { Authorization: string },
  subjectId: string,
  sectionId?: string,
): Promise<string> => {
  const res = await request.post(`${API_BASE}/classes`, {
    data: {
      subjectId,
      educatorId: run.educatorId,
      ...(sectionId ? { sectionId } : {}),
      schoolYearId: run.schoolYearId,
      semesterId: run.semesterId,
      capacity: 30,
      schedules: nextClassSchedule(),
    },
    headers,
  });
  expect(res.status()).toBe(201);
  return (await unwrapData<{ id: string }>(res)).id;
};

test.describe.configure({ mode: "serial" });

test("Phase 0 smoke — /login renders", async ({ page }) => {
  await test.step("navigate to /login", async () => {
    await page.goto("/login");
  });

  await test.step("assert the login form renders", async () => {
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  });
});

test("Phase 1 — platform → admin → org → school year", async ({ page }) => {
  await test.step("platform login", async () => {
    await login(page, run.platformEmail, run.platformPassword, "/platform");
  });

  await test.step("create platform admin (capture generated password)", async () => {
    await page.goto("/platform/admins");
    await page.getByRole("button", { name: "Create Admin" }).click();

    run.adminEmail = uniqueEmail("e2e.admin");
    const modal = page.locator('[data-slot="dialog-content"]');
    await modal.locator("#create-fullname").fill("E2E Admin");
    await modal.locator("#create-email").fill(run.adminEmail);

    const respPromise = waitForApi(page, "POST", "/platform/admins");
    await modal.getByRole("button", { name: "Create Account" }).click();
    const resp = await respPromise;

    const admin = (await resp.json()).data;
    run.adminId = admin.id;
    run.adminPassword = admin.password;
    expect(admin.email).toBe(run.adminEmail);
    expect(run.adminPassword).toBeTruthy();

    // Credentials card surfaces the same generated password
    await expect(modal.getByText("Admin account created")).toBeVisible();
    await expect(modal.locator(".font-mono")).toHaveText(run.adminPassword);
    await modal.getByRole("button", { name: "Done" }).click();
  });

  await test.step("platform logout clears the session", async () => {
    await logout(page);
    const cookies = await page.context().cookies("http://localhost:5000");
    const refresh = cookies.find((c) => c.name === "refreshToken");
    expect(refresh).toBeUndefined();
  });

  await test.step("admin login lands on /admin/dashboard", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await expect(page.getByText("Welcome, Admin!")).toBeVisible();
  });

  await test.step("create organization via welcome modal", async () => {
    const modal = page.locator('[data-slot="dialog-content"]');
    await modal.getByRole("button", { name: "Create Organization" }).click();

    run.orgName = uniqueName("E2E Org");
    await modal.locator("#org-name").fill(run.orgName);
    await modal.locator("#org-desc").fill("Created by the E2E admin-setup test");

    const respPromise = waitForApi(page, "POST", "/organization");
    await modal.getByRole("button", { name: "Create Organization" }).click();
    const resp = await respPromise;

    const org = (await resp.json()).data;
    run.orgId = org.id;
    expect(org.name).toBe(run.orgName);

    await expect(page.locator('[data-slot="dialog-content"]')).toBeHidden({ timeout: 15_000 });
  });

  await test.step("create school year 2026-2027", async () => {
    // The school-years page's org query (useOrganization) must resolve before
    // clicking "New School Year", otherwise ensureOrganization() bails while
    // isLoading is still true and no dialog opens. Register the wait first so
    // navigation-triggered fetches are caught.
    const orgResp = waitForApi(page, "GET", "/organization");
    await page.goto("/admin/school-years");
    await orgResp;

    await page.getByRole("button", { name: "New School Year" }).click();

    const modal = page.locator('[data-slot="dialog-content"]');
    run.schoolYearName = uniqueName("SY 2026-2027");
    await modal.locator("#sy-name").fill(run.schoolYearName);

    await pickDate(page, modal.getByRole("button").filter({ hasText: "Select date" }).nth(0), 2026, "Aug", 20);
    // After the start date is picked, its trigger reads "Aug 20, 2026";
    // only the end-date trigger still says "Select date".
    await pickDate(page, modal.getByRole("button").filter({ hasText: "Select date" }), 2027, "Jun", 30);

    const respPromise = waitForApi(page, "POST", "/school-years");
    await modal.getByRole("button", { name: "Create" }).click();
    const resp = await respPromise;

    const body = await resp.json();
    const schoolYear = body.data.data;
    run.schoolYearId = schoolYear.id;
    run.schoolYearRoute = `/admin/school-years/${schoolYear.id}`;
    expect(schoolYear.name).toBe(run.schoolYearName);
    expect(schoolYear.start_date).toMatch(/^2026-08-20/);
    expect(schoolYear.end_date).toMatch(/^2027-06-30/);
  });

  await test.step("assert school year status pending", async () => {
    await page.goto(run.schoolYearRoute!);
    await expect(page.getByText(run.schoolYearName!, { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Pending", { exact: true }).first()).toBeVisible();
  });

  console.log(
    `[Phase 1] org=${run.orgName} (${run.orgId}) | admin=${run.adminEmail} / ${run.adminPassword} | schoolYear=${run.schoolYearName} (${run.schoolYearId}) status=pending`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — School Year Readiness: org email extension, base data (department
// → levels → sections → educator → students), then classes + enrollment gating.
// All API responses are wrapped as `{ success, data }` (ResponseInterceptor);
// error responses are `{ success:false, statusCode, error:{ message, ... } }`.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 2 — email extension set on the organization (UI)", async ({ page }) => {
  await test.step("admin login and open the organization page", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto("/admin/organization");
    await expect(page.getByText("Email Extension", { exact: true })).toBeVisible();
  });

  await test.step("set extension (no accounts exist yet → enabled)", async () => {
    await page.getByRole("button", { name: "Set Extension" }).first().click();

    // Backend requires a dot + TLD (UpdateOrganizationDto must match /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/).
    run.orgExtension = `${uniqueUsername("e2eorg")}.edu`;
    await page.getByPlaceholder("example.com").fill(run.orgExtension);

    const validateResp = waitForApi(page, "POST", "/organization/validate-email-extension");
    await page.getByRole("button", { name: "Continue" }).click();
    await validateResp;

    await expect(page.getByText("Set Email Extension?", { exact: true })).toBeVisible();

    const patchResp = waitForApi(page, "PATCH", "/organization");
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole("button", { name: "Set Extension" })
      .click();
    const resp = await patchResp;

    const org = (await resp.json()).data;
    expect(org.email_extension).toBe(`@${run.orgExtension}`);
  });

  await test.step("extension is saved and surfaced", async () => {
    await waitForToast(page, "Email extension saved successfully.");
    await expect(page.getByText(`@${run.orgExtension}`, { exact: true })).toBeVisible();
  });
});

test("Phase 2 — department + generated levels (UI), readiness ordering (API)", async ({
  page,
  request,
}) => {
  await test.step("admin login", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
  });
  const headers = await adminHeaders(request);

  await test.step("create the JHS department", async () => {
    await page.goto(`/admin/programs?schoolYearId=${run.schoolYearId}`);
    await page.getByRole("button", { name: "Add Department" }).click();

    const modal = page.locator('[data-slot="dialog-content"]');
    run.jhsProgramName = uniqueName("JHS");
    await modal.locator("#prog-name").fill(run.jhsProgramName);
    await modal.getByRole("combobox").click();
    await page.getByRole("option", { name: "Junior High School" }).click();

    const progResp = waitForApi(page, "POST", "/programs");
    await modal.getByRole("button", { name: "Create" }).click();
    const resp = await progResp;

    const program = (await resp.json()).data;
    run.jhsProgramId = program.id;
    expect(program.name).toBe(run.jhsProgramName);
    await waitForToast(page, "Department created.");
  });

  await test.step("readiness BLOCKS until levels exist (ordering)", async () => {
    const res = await request.get(
      `${API_BASE}/school-years/${run.schoolYearId}/readiness`,
      { headers },
    );
    expect(res.status()).toBe(200);
    const readiness = await unwrapData<{ issues: Array<{ code: string }> }>(res);
    expect(readiness.issues.map((i) => i.code)).toContain("program_no_levels");
  });

  await test.step("generate levels for JHS via the levels page", async () => {
    await page.goto(`/admin/school-years/${run.schoolYearId}/levels`);
    await expect(page.getByText(run.jhsProgramName!, { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Generate levels" }).click();
    await expect(page.getByText("1 → 3", { exact: true })).toBeVisible();

    const genResp = waitForApi(page, "POST", "/levels/bulk-generate");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    const resp = await genResp;

    const levels = (await resp.json()).data;
    expect(levels.length).toBe(3);
    run.levelIds = levels.map((l: { id: string }) => l.id);

    await expect(page.getByText("3 levels", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("1", { exact: true }).first()).toBeVisible();
  });

  await test.step("program_no_levels readiness cleared after generation", async () => {
    const res = await request.get(
      `${API_BASE}/school-years/${run.schoolYearId}/readiness`,
      { headers },
    );
    const readiness = await unwrapData<{ issues: Array<{ code: string }> }>(res);
    expect(readiness.issues.some((i) => i.code === "program_no_levels")).toBe(false);
  });
});

test("Phase 2 — section for the generated JHS level (UI)", async ({ page, request }) => {
  await test.step("admin login", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
  });
  const headers = await adminHeaders(request);

  await test.step("create section bound to the JHS level", async () => {
    // Same guard-race handling as Phase 1: "New Section" is wrapped in
    // ensureOrganization, which bails while GET /organization is still loading.
    const orgResp = waitForApi(page, "GET", "/organization");
    await page.goto("/admin/sections");
    await orgResp;

    await page.getByRole("button", { name: "New Section" }).first().click();

    const dialog = page.locator('[data-slot="dialog-content"]');
    // Department
    await dialog.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: run.jhsProgramName!, exact: true }).click();
    // Level (generated name "1")
    await dialog.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "1", exact: true }).click();

    run.sectionName = uniqueName("Section A");
    await dialog.getByPlaceholder("Section A").fill(run.sectionName);

    const secResp = waitForApi(page, "POST", "/sections");
    await dialog.getByRole("button", { name: "Create Section" }).click();
    const resp = await secResp;

    const section = (await resp.json()).data;
    run.sectionId = section.id;
    expect(section.name).toBe(run.sectionName);
    await waitForToast(page, "Section created.");
    await expect(page.getByText(run.sectionName!, { exact: true }).first()).toBeVisible();
  });

  await test.step("level_no_sections cleared for the sectioned level", async () => {
    const res = await request.get(
      `${API_BASE}/school-years/${run.schoolYearId}/readiness`,
      { headers },
    );
    const readiness = await unwrapData<{ issues: Array<{ code: string; ref?: { id: string } }> }>(
      res,
    );
    const flaggedLevelIds = readiness.issues
      .filter((i) => i.code === "level_no_sections")
      .map((i) => i.ref?.id);
    expect(flaggedLevelIds).not.toContain(run.levelIds![0]);
  });
});

test("Phase 2 — educator account with extension-derived email (UI)", async ({ page }) => {
  await test.step("admin login", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
  });

  await test.step("create educator via dialog", async () => {
    await page.goto("/admin/educators");
    await page.getByRole("button", { name: "New Educator" }).first().click();

    const modal = page.locator('[data-slot="dialog-content"]');
    run.educatorName = uniqueName("Edu");
    await modal.locator("#edu-fullname").fill(run.educatorName);

    const username = uniqueUsername("e2eedu");
    await modal.locator("#edu-email").fill(username);

    // Mirrors buildFullEmail: role sub-domain is inserted before the TLD.
    const dotIndex = run.orgExtension.indexOf(".");
    const eduDomain = `${run.orgExtension.slice(0, dotIndex)}.educator${run.orgExtension.slice(dotIndex)}`;
    const fullEmail = `${username}@${eduDomain}`;
    await expect(modal.getByText(fullEmail, { exact: true }).first()).toBeVisible();

    const eduResp = waitForApi(page, "POST", "/educators");
    await modal.getByRole("button", { name: "Create Account" }).click();
    const resp = await eduResp;

    const educator = (await resp.json()).data;
    run.educatorId = educator.id;
    run.educatorEmail = educator.email;
    run.educatorPassword = educator.plainPassword;
    expect(run.educatorEmail).toBe(fullEmail);
    expect(run.educatorPassword).toBeTruthy();

    // Credentials card reveals the one-time password
    const credCard = page.locator('[data-slot="dialog-content"]').last();
    await expect(
      credCard.getByText("Educator account created", { exact: true }),
    ).toBeVisible();
    await expect(credCard.getByText(run.educatorPassword, { exact: true })).toBeVisible();
    await credCard.getByRole("button", { name: "Done" }).click();
  });
});

test("Phase 2 — subject, semester, and class created and linked (API + UI)", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  await test.step("create the JHS subject", async () => {
    const res = await request.post(`${API_BASE}/subjects`, {
      data: {
        name: uniqueName("Mathematics"),
        subjectType: "major",
        programId: run.jhsProgramId,
      },
      headers,
    });
    expect(res.status()).toBe(201);
    const subject = await unwrapData<{ id: string; title: string; programId: string }>(res);
    run.subject = subject;
    expect(run.subject.programId).toBe(run.jhsProgramId);
  });

  await test.step("create the semester (1st Semester w/ two terms)", async () => {
    const res = await request.post(`${API_BASE}/semester-settings`, {
      data: {
        schoolYearId: run.schoolYearId,
        name: "1st Semester",
        startDate: "2026-08-24",
        endDate: "2026-12-18",
        terms: [
          { name: "Term 1", orderIndex: 1, startDate: "2026-08-24", endDate: "2026-10-16" },
          { name: "Term 2", orderIndex: 2, startDate: "2026-10-19", endDate: "2026-12-18" },
        ],
      },
      headers,
    });
    expect(res.status()).toBe(201);
    run.semesterId = (await unwrapData<{ id: string }>(res)).id;
  });

  await test.step("create the class bound to subject + educator + section", async () => {
    const res = await request.post(`${API_BASE}/classes`, {
      data: {
        subjectId: run.subject!.id,
        educatorId: run.educatorId,
        sectionId: run.sectionId,
        schoolYearId: run.schoolYearId,
        semesterId: run.semesterId,
        capacity: 30,
        schedules: [{ weekday: 1, startTime: "08:00", endTime: "09:30" }],
      },
      headers,
    });
    expect(res.status()).toBe(201);
    run.classItem = await unwrapData<{
      id: string;
      subject_id: string;
      educator_id: string;
      section_id: string;
      school_year_id: string;
      semester_id: string;
      capacity: number;
      schedules: Array<{ weekday: number; start_time: string; end_time: string }>;
    }>(res);
    expect(run.classItem.subject_id).toBe(run.subject!.id);
    expect(run.classItem.educator_id).toBe(run.educatorId);
    expect(run.classItem.section_id).toBe(run.sectionId);
    expect(run.classItem.school_year_id).toBe(run.schoolYearId);
    expect(run.classItem.semester_id).toBe(run.semesterId);
    expect(run.classItem.schedules).toHaveLength(1);
    expect(run.classItem.schedules[0].weekday).toBe(1);
  });

  await test.step("class appears in /classes for this school year", async () => {
    const res = await request.get(
      `${API_BASE}/classes?schoolYearId=${run.schoolYearId}`,
      { headers },
    );
    expect(res.status()).toBe(200);
    const page_ = await unwrapData<{ data: Array<{ id: string }> }>(res);
    expect(page_.data.some((c) => c.id === run.classItem!.id)).toBe(true);
  });

  await test.step("class visible on the admin classes page", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto(`/admin/classes?schoolYearId=${run.schoolYearId}`);
    await expect(page.getByText(run.subject!.title, { exact: false }).first()).toBeVisible();
  });
});

test("Phase 2 — educator role cannot create classes (RBAC)", async ({ request }) => {
  const educatorToken = await apiLogin(request, run.educatorEmail!, run.educatorPassword!);
  const headers = { Authorization: `Bearer ${educatorToken}` };

  await test.step("educator may read classes", async () => {
    const res = await request.get(`${API_BASE}/classes`, { headers });
    expect(res.status()).toBe(200);
  });

  await test.step("educator may NOT create classes (admin-only)", async () => {
    const res = await request.post(`${API_BASE}/classes`, {
      data: {
        subjectId: run.subject!.id,
        educatorId: run.educatorId,
        sectionId: run.sectionId,
        schoolYearId: run.schoolYearId,
        semesterId: run.semesterId,
        capacity: 30,
        schedules: [{ weekday: 2, startTime: "10:00", endTime: "11:30" }],
      },
      headers,
    });
    expect(res.status()).toBe(403);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Access denied");
  });

  console.log(
    `[Phase 2] extension=@${run.orgExtension} | program=${run.jhsProgramName} | levels=${run.levelIds?.length} | section=${run.sectionName} | educator=${run.educatorEmail} | class=${run.classItem?.id} | enrolled students=${run.student1?.fullName}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Grading Scale: create an org-scoped scale via the UI, assign it to
// the JHS department for the run's school year, and verify via the API.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 3 — grading scale created (UI) and assigned to the JHS department", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  await test.step("admin login and open grading scales", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto("/admin/grading-scales");
    await expect(page.getByRole("button", { name: "New Scale" }).first()).toBeVisible();
  });

  await test.step("create the JHS grading scale via the dialog", async () => {
    const modal = page.locator('[data-slot="dialog-content"]');
    await openDialog(page, page.getByRole("button", { name: "New Scale" }).first(), modal);

    run.scaleName = uniqueName("E2E Scale");
    await modal.getByPlaceholder("e.g. Standard Grading Scale").fill(run.scaleName);

    await modal.getByRole("combobox").click();
    await page.getByRole("option", { name: "Junior High School", exact: true }).click();

    const scaleResp = waitForApi(page, "POST", "/grading-scales");
    await modal.getByRole("button", { name: "Create Scale" }).click();
    const resp = await scaleResp;

    const scale = (await resp.json()).data;
    run.scaleId = scale.id;
    expect(scale.name).toBe(run.scaleName);
    expect(scale.programType).toBe("jhs");
    expect(scale.ranges).toHaveLength(2);

    await waitForToast(page, "Grading scale created.");
    await expect(page.locator('[data-slot="dialog-content"]')).toBeHidden();
  });

  await test.step("assign the scale to the JHS department", async () => {
    // The assignment section renders only once at least one scale exists.
    await expect(page.getByText("Assign to Departments", { exact: true })).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: run.jhsProgramName! });
    await row.getByRole("button", { name: "Assign" }).click();

    const dialog = page.locator('[data-slot="dialog-content"]');
    await dialog.getByRole("combobox").click();
    await page.getByRole("option").filter({ hasText: run.scaleName! }).click();

    const assignResp = waitForApi(
      page,
      "POST",
      `/grading-scales/programs/${run.jhsProgramId}/grading-scale`,
    );
    await dialog.getByRole("button", { name: "Yes, Assign" }).click();
    await assignResp;

    await waitForToast(page, "Grading scale assigned successfully.");
    await expect(row.getByText(run.scaleName!, { exact: true })).toBeVisible();
  });

  await test.step("assignment is registered via the API", async () => {
    const res = await request.get(`${API_BASE}/grading-scales/assignments`, {
      params: { schoolYearId: run.schoolYearId },
      headers,
    });
    expect(res.status()).toBe(200);
    const list = await unwrapData<
      Array<{ programId: string; gradingScaleId: string }>
    >(res);
    const match = list.find((a) => a.programId === run.jhsProgramId);
    expect(match?.gradingScaleId).toBe(run.scaleId);
  });

  console.log(
    `[Phase 3] scale=${run.scaleName} (${run.scaleId}) assigned to ${run.jhsProgramId}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4 — Grading Scheme: create a JHS-scoped grading scheme template via the
// UI (4 default components, weights auto-balanced to 100), apply it to the JHS
// program, and verify the program assignment through the API.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 4 — grading scheme template created (UI) and applied to the JHS program", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  await test.step("admin login and open grading scheme templates", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto("/admin/grading-schemes");
    await expect(page.getByRole("button", { name: "New Template" }).first()).toBeVisible();
  });

  await test.step("create the JHS grading scheme template", async () => {
    const dialog = page.locator('[data-slot="dialog-content"]');
    await openDialog(page, page.getByRole("button", { name: "New Template" }).first(), dialog);

    run.schemeTemplateName = uniqueName("E2E Scheme");
    await dialog.getByPlaceholder('e.g. "Standard Semester Scheme"').fill(run.schemeTemplateName);

    // The dialog has 5 comboboxes: 1 "Department type" select plus one Type
    // select per category row. Target the department one by its placeholder.
    await dialog
      .getByRole("combobox")
      .filter({ hasText: "All departments" })
      .click();
    await page.getByRole("option", { name: "Junior High School", exact: true }).click();

    const tplResp = waitForApi(page, "POST", "/grading-scheme-templates");
    await dialog.getByRole("button", { name: "Save" }).click();
    const resp = await tplResp;

    const template = (await resp.json()).data;
    run.schemeTemplateIds.jhs = template.id;
    expect(template.name).toBe(run.schemeTemplateName);
    expect(template.programType).toBe("jhs");
    expect(template.components).toHaveLength(4);

    await expect(page.locator('[data-slot="dialog-content"]')).toBeHidden();
  });

  await test.step("apply the template to the JHS department", async () => {
    await expect(page.getByText("Template Assignment", { exact: true })).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: run.jhsProgramName! });
    await row.getByRole("button", { name: "Assign" }).click();

    const dialog = page.locator('[data-slot="dialog-content"]');
    await dialog.getByRole("combobox").click();
    await page.getByRole("option").filter({ hasText: run.schemeTemplateName! }).click();

    const applyResp = waitForApi(
      page,
      "POST",
      "/grading-scheme-templates/apply/program",
    );
    await dialog.getByRole("button", { name: "Yes, Assign" }).click();
    const resp = await applyResp;

    const result = (await resp.json()).data as {
      success: boolean;
      appliedCount: number;
    };
    expect(result.success).toBe(true);
    // The JHS subject → class pair created in Phase 2 lives under this program.
    expect(result.appliedCount).toBeGreaterThanOrEqual(1);

    await waitForToast(page, "Applied");
    await expect(row.getByText(run.schemeTemplateName!, { exact: true })).toBeVisible();
  });

  await test.step("program assignment registers the template via the API", async () => {
    const res = await request.get(
      `${API_BASE}/grading-scheme-templates/assignments/program`,
      { params: { schoolYearId: run.schoolYearId }, headers },
    );
    expect(res.status()).toBe(200);
    const list = await unwrapData<
      Array<{ programId: string; templateId: string | null }>
    >(res);
    const match = list.find((a) => a.programId === run.jhsProgramId);
    expect(match?.templateId).toBe(run.schemeTemplateIds.jhs);
  });

  console.log(
    `[Phase 4] scheme template=${run.schemeTemplateName} (${run.schemeTemplateIds.jhs}) applied to ${run.jhsProgramId}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — Academic Calendar: set up the JHS department calendar with two
// semester breaks so the Phase 6 semester template (2 semesters) can be assigned.
// Verified via the per-program calendar endpoint.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 5 — JHS department calendar with two semester breaks", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  const syStart = "2026-08-20";
  const syEnd = "2027-06-30";
  const break1End = "2026-12-18";
  const break2Start = "2026-12-19";

  await test.step("admin login and open the department calendars tab", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto("/admin/academic-calendar");
    await page.getByRole("button", { name: "Department Calendars" }).click();
    await expect(
      page.getByText(run.jhsProgramName!, { exact: true }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  await test.step("create the JHS calendar with two breaks", async () => {
    const card = page
      .locator("div.rounded-lg.border.bg-card.overflow-hidden")
      .filter({ hasText: run.jhsProgramName! })
      .first();
    await card.getByRole("button", { name: "Setup Calendar" }).click();

    // Break 1's start is locked to the calendar start; setting its end date
    // cascades Break 2's start to the next day, and Break 2's end stays locked
    // to the calendar end (the school-year end).
    const breakBlocks = card.locator("div.rounded-lg.border.bg-muted\\/20");
    await expect(breakBlocks).toHaveCount(2);
    await breakBlocks.nth(0).locator('input[type="date"]').nth(1).fill(break1End);

    const createResp = waitForApi(page, "POST", "/program-calendars");
    await card.getByRole("button", { name: "Create Calendar" }).click();
    const resp = await createResp;

    const calendar = (await resp.json()).data;
    expect(calendar.programId).toBe(run.jhsProgramId);
    expect(calendar.startDate).toMatch(/^2026-08-20/);
    expect(calendar.endDate).toMatch(/^2027-06-30/);
    expect(calendar.breaks).toHaveLength(2);

    await waitForToast(page, "Calendar created.");
  });

  await test.step("calendar is queryable per program with persisted breaks", async () => {
    const res = await request.get(`${API_BASE}/program-calendars/by-program`, {
      params: { programId: run.jhsProgramId, schoolYearId: run.schoolYearId },
      headers,
    });
    expect(res.status()).toBe(200);
    const calendar = await unwrapData<{
      id: string;
      startDate: string;
      endDate: string;
      breaks: Array<{ label: string; startDate: string; endDate: string }>;
    }>(res);
    expect(calendar.startDate).toMatch(/^2026-08-20/);
    const breaks = calendar.breaks.map((b) => ({
      label: b.label,
      startDate: b.startDate.slice(0, 10),
      endDate: b.endDate.slice(0, 10),
    }));
    expect(breaks[0]).toMatchObject({
      label: "Break 1",
      startDate: syStart,
      endDate: break1End,
    });
    expect(breaks[1]).toMatchObject({
      label: "Break 2",
      startDate: break2Start,
      endDate: syEnd,
    });
  });

  console.log(
    `[Phase 5] calendar for ${run.jhsProgramId}: breaks [${break1End}, ${break2Start}] within ${syStart} → ${syEnd}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6 — Semester Settings: create a JHS semester template via the UI (the
// 2-semester default pre-filled when the department type is picked), assign it
// to the JHS department through the term-dates modal using auto-configured
// dates, and verify the assignment + term dates through the API.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 6 — JHS semester template created and assigned with term dates", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  await test.step("admin login and open semester settings", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto("/admin/semester-settings");
    await expect(page.getByRole("button", { name: "New Template" }).first()).toBeVisible();
  });

  await test.step("create the JHS semester template", async () => {
    const dialog = page.locator('[data-slot="dialog-content"]');
    await openDialog(page, page.getByRole("button", { name: "New Template" }).first(), dialog);

    run.semesterTemplateName = uniqueName("E2E Semester");
    await dialog.getByPlaceholder('e.g. "Standard 2-Semester"').fill(run.semesterTemplateName);

    // Picking "Junior High School" pre-fills the 2-semester × 4-terms default.
    await dialog.getByRole("combobox").click();
    await page
      .getByRole("option")
      .filter({ hasText: "Junior High School (Grades 7-10)" })
      .click();

    const tplResp = waitForApi(page, "POST", "/semester-templates");
    await dialog.getByRole("button", { name: "Create Template" }).click();
    const resp = await tplResp;

    const template = (await resp.json()).data;
    run.semesterTemplateId = template.id;
    expect(template.name).toBe(run.semesterTemplateName);
    expect(template.program_type).toBe("jhs");
    expect(template.semesters).toHaveLength(2);

    await waitForToast(page, "Template created.");
  });

  await test.step("assign the template with auto-configured term dates", async () => {
    await expect(page.getByText("Assign to Departments", { exact: true })).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: run.jhsProgramName! });
    await row.getByRole("combobox").click();
    await page.getByRole("option").filter({ hasText: run.semesterTemplateName! }).click();

    const modal = page.locator('[data-slot="dialog-content"]').last();
    await expect(modal.getByText("Configure Term Dates", { exact: true })).toBeVisible();

    // View mode → edit mode → auto-fill dates from the calendar breaks.
    await modal.getByRole("button", { name: "Edit" }).click();
    const defaultsResp = waitForApi(page, "GET", "/default-term-dates");
    await modal.getByRole("button", { name: "Auto-Configure Dates" }).click();
    await defaultsResp;

    const applyBtn = modal.getByRole("button", { name: "Apply Template" });
    await expect(applyBtn).toBeEnabled();
    const assignResp = waitForApi(page, "POST", "/semester-templates/assignments");
    await applyBtn.click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByText("Save term dates?", { exact: true })).toBeVisible();
    await confirm.getByRole("button", { name: "Save" }).click();
    await assignResp;

    await waitForToast(page, "Template assigned with term dates.");
  });

  await test.step("assignment with term dates is registered via the API", async () => {
    const res = await request.get(
      `${API_BASE}/semester-templates/assignments/by-school-year`,
      { params: { schoolYearId: run.schoolYearId }, headers },
    );
    expect(res.status()).toBe(200);
    const list = await unwrapData<
      Array<{
        program_id: string;
        template_id: string;
        termDates?: Array<{ term_id: string; start_date: string; end_date: string }>;
      }>
    >(res);
    const match = list.find((a) => a.program_id === run.jhsProgramId);
    expect(match?.template_id).toBe(run.semesterTemplateId);
    expect(match?.termDates).toHaveLength(8);
  });

  console.log(
    `[Phase 6] semester template=${run.semesterTemplateName} (${run.semesterTemplateId}) assigned to ${run.jhsProgramId}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6b/6c — School-year readiness gate (API + UI): the org starts with an
// unconfigured elementary department and JHS levels 2-3 lacking sections,
// subjects, and classes, so the new enrollment gates (SCHOOL_YEAR_NOT_READY)
// block every write. These tests do the full setup — sections/subjects/classes
// for JHS 2-3, then calendar, grading scale, semester template, scheme, and one
// class for the elementary department — so all lifecycle tests that follow run
// against a ready school year.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 6b — readiness gate: school year not ready before full setup", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  // The program_* blockers below are only observable when the org contains a
  // program that isn't fully configured. JHS is already configured by Phases
  // 3-6, so create the elementary department here (unconfigured); Phase 6c
  // completes it, and Phase 6e's "placed in another program" case reuses it.
  await test.step("readiness: create the unconfigured elementary department", async () => {
    const progRes = await request.post(`${API_BASE}/programs`, {
      data: {
        schoolYearId: run.schoolYearId,
        name: uniqueName("Elem Dept"),
        type: "elementary",
      },
      headers,
    });
    expect(progRes.status()).toBe(201);
    const elemProgram = await unwrapData<{ id: string }>(progRes);

    const lvlRes = await request.post(`${API_BASE}/levels`, {
      data: { programId: elemProgram.id, name: "Grade 1", schoolYearId: run.schoolYearId },
      headers,
    });
    expect(lvlRes.status()).toBe(201);
    const elemLevel = await unwrapData<{ id: string }>(lvlRes);

    const secRes = await request.post(`${API_BASE}/sections`, {
      data: {
        levelId: elemLevel.id,
        schoolYearId: run.schoolYearId,
        name: uniqueName("Section G1"),
        capacity: 30,
      },
      headers,
    });
    expect(secRes.status()).toBe(201);
  });

  await test.step("readiness gate: school year not ready, wizard locked in the UI", async () => {
    const res = await request.get(`${API_BASE}/school-years/${run.schoolYearId}/readiness`, {
      headers,
    });
    expect(res.status()).toBe(200);
    const readiness = await unwrapData<{ ready: boolean; issues: Array<{ code: string }> }>(res);
    expect(readiness.ready).toBe(false);
    const codes = readiness.issues.map((i) => i.code);
    // Org-wide blockers: JHS levels 2-3 lack sections/subjects/classes; the
    // Elem department lacks its calendar, grading scale, and semester template.
    expect(codes).toContain("level_no_sections");
    expect(codes).toContain("level_no_subjects");
    expect(codes).toContain("program_no_calendar");
    expect(codes).toContain("program_no_grading_scale");
    expect(codes).toContain("program_no_semester_assignment");

    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto(`/admin/enrollment?schoolYearId=${run.schoolYearId}`);
    await expect(
      page.getByText(/this school year is not ready/i).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Enroll Students" })).toBeDisabled();
  });
});

test("Phase 6c — complete school-year readiness (JHS levels 2-3 + elementary department)", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  await test.step("readiness: add sections/subjects/classes for JHS levels 2 and 3", async () => {
    for (const [i, levelId] of (run.levelIds ?? []).slice(1).entries()) {
      const sectionId = await createSection(request, headers, levelId, `Section L${i + 2}`);
      const subject = await createSubject(request, headers, `Level ${i + 2} Elective`, {
        levelId,
      });
      await createClass(request, headers, subject.id, sectionId);
    }
    // Level 1 counts toward the readiness contract too: every level needs a
    // level-bound subject and every subject needs a class. Section A already
    // has classItem, so only the subject + its class are missing here.
    const level1Subject = await createSubject(request, headers, "Level 1 Elective", {
      levelId: run.levelIds![0],
    });
    await createClass(request, headers, level1Subject.id, run.sectionId);
  });

  await test.step("readiness: complete the elementary department setup", async () => {
    const programs = await unwrapList<{
      id: string;
      name: string;
      type?: string;
      program_type?: string;
    }>(
      await request.get(`${API_BASE}/programs`, {
        params: { schoolYearId: run.schoolYearId },
        headers,
      }),
    );
    const elem = programs.find((p) => (p.type ?? p.program_type) === "elementary");
    expect(elem, "expected an elementary department in the school year").toBeTruthy();

    const levels = await unwrapList<{ id: string; programId?: string; program_id?: string }>(
      await request.get(`${API_BASE}/levels`, {
        params: { schoolYearId: run.schoolYearId },
        headers,
      }),
    );
    const elemLevel = levels.find((l) => (l.programId ?? l.program_id) === elem!.id);
    expect(elemLevel, "expected the elementary level (Grade 1)").toBeTruthy();

    const sections = await unwrapList<{ id: string; levelId?: string; level_id?: string }>(
      await request.get(`${API_BASE}/sections`, {
        params: { schoolYearId: run.schoolYearId },
        headers,
      }),
    );
    const elemSection = sections.find((s) => (s.levelId ?? s.level_id) === elemLevel!.id);
    expect(elemSection, "expected the elementary section (Section G1)").toBeTruthy();

    // 1. Calendar — the semester-template assignment requires one.
    const cal = await request.post(`${API_BASE}/program-calendars`, {
      data: {
        programId: elem!.id,
        schoolYearId: run.schoolYearId,
        startDate: "2026-08-20",
        endDate: "2027-06-30",
        breaks: [
          { label: "Break 1", startDate: "2026-08-20", endDate: "2026-12-18" },
          { label: "Break 2", startDate: "2026-12-19", endDate: "2027-06-30" },
        ],
      },
      headers,
    });
    expect(cal.status()).toBe(201);

    // 2. Elementary grading scale + program assignment.
    const scale = await request.post(`${API_BASE}/grading-scales`, {
      data: {
        name: uniqueName("E2E Elem Scale"),
        programType: "elementary",
        ranges: [
          { minPercent: 75, maxPercent: 100, gradeValue: "Pass", remark: "Pass", isPassing: true },
          { minPercent: 0, maxPercent: 74, gradeValue: "Needs Improvement", remark: "Below passing", isPassing: false },
        ],
      },
      headers,
    });
    expect(scale.status()).toBe(201);
    const elemScale = await unwrapData<{ id: string }>(scale);
    const assignScale = await request.post(
      `${API_BASE}/grading-scales/programs/${elem!.id}/grading-scale`,
      { data: { scaleId: elemScale.id, schoolYearId: run.schoolYearId }, headers },
    );
    expect(assignScale.status()).toBe(201);

    // 3. Elementary semester template + assignment + auto-configured term dates.
    const sem = await request.post(`${API_BASE}/semester-templates`, {
      data: {
        name: uniqueName("E2E Elem Semester"),
        programType: "elementary",
        semesters: [
          {
            name: "Semester 1",
            orderIndex: 1,
            terms: [1, 2, 3, 4].map((n) => ({ name: `Term ${n}`, orderIndex: n })),
          },
          {
            name: "Semester 2",
            orderIndex: 2,
            terms: [1, 2, 3, 4].map((n) => ({ name: `Term ${n}`, orderIndex: n })),
          },
        ],
      },
      headers,
    });
    expect(sem.status()).toBe(201);
    const elemSemTemplate = await unwrapData<{ id: string }>(sem);
    const assignSem = await request.post(`${API_BASE}/semester-templates/assignments`, {
      data: { programId: elem!.id, templateId: elemSemTemplate.id },
      headers,
    });
    expect(assignSem.status()).toBe(201);
    const datesRes = await request.get(
      `${API_BASE}/semester-templates/assignments/${elem!.id}/default-term-dates`,
      { params: { templateId: elemSemTemplate.id }, headers },
    );
    expect(datesRes.status()).toBe(200);
    const termDates = await unwrapList<{ termId: string; startDate: string; endDate: string }>(
      datesRes,
    );
    expect(termDates.length).toBe(8);
    const saveDates = await request.post(
      `${API_BASE}/semester-templates/assignments/${elem!.id}/term-dates`,
      { data: { termDates }, headers },
    );
    expect([200, 201]).toContain(saveDates.status());

    // 4. Elementary scheme template — applied to the class after it exists
    //    (Elem has no pre-existing classes to auto-inherit from, so the first
    //    Elem class is the anchor that stamps the program template).
    const scheme = await request.post(`${API_BASE}/grading-scheme-templates`, {
      data: {
        name: uniqueName("E2E Elem Scheme"),
        programType: "elementary",
        components: [
          { name: "Written Work", type: "written_work", weight: 25 },
          { name: "Performance Task", type: "performance_task", weight: 25 },
          { name: "Quarterly Assessment", type: "quarterly_assessment", weight: 25 },
          { name: "Exam", type: "exam", weight: 25 },
        ],
      },
      headers,
    });
    expect(scheme.status()).toBe(201);
    const elemScheme = await unwrapData<{ id: string }>(scheme);

    // 5. Elem minor subject (bound to Grade 1) + class in Section G1.
    const elemSubject = await createSubject(request, headers, "Elem Grade 1", {
      programId: elem!.id,
      levelId: elemLevel!.id,
    });
    const elemClassId = await createClass(request, headers, elemSubject.id, elemSection!.id);
    const applyScheme = await request.post(
      `${API_BASE}/grading-scheme-templates/apply/class`,
      { data: { classId: elemClassId, templateId: elemScheme.id }, headers },
    );
    expect([200, 201]).toContain(applyScheme.status());
  });

  await test.step("readiness gate: the school year is now ready", async () => {
    let ready = false;
    for (let attempt = 0; attempt < 10 && !ready; attempt += 1) {
      const res = await request.get(`${API_BASE}/school-years/${run.schoolYearId}/readiness`, {
        headers,
      });
      expect(res.status()).toBe(200);
      ready = (await unwrapData<{ ready: boolean }>(res)).ready;
      if (!ready) await page.waitForTimeout(200);
    }
    expect(ready).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 6d/6e — school-year enrollment + class-eligibility lifecycle that Phase
// 2 originally ran while readiness was still incomplete. Moved to run AFTER
// Phase 6c so the gated enrollment endpoints and the placement-before-class
// rule are exercised against a school year that is actually ready.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 6d — students enrolled in the school year with program + section (API)", async ({
  request,
}) => {
  const headers = await adminHeaders(request);

  const createStudent = async (base: string) => {
    const res = await request.post(`${API_BASE}/students`, {
      data: {
        fullName: uniqueName(base),
        emailName: uniqueUsername("stu"),
        studentId: uniqueStudentNumber("STU"),
      },
      headers,
    });
    expect(res.status()).toBe(201);
    return await unwrapData<{ id: string; fullName: string; status: string }>(res);
  };

  await test.step("create three students", async () => {
    const s1 = await createStudent("Student One");
    const s2 = await createStudent("Student Two");
    const s3 = await createStudent("Student Three");
    run.student1 = s1;
    run.student2 = s2;
    run.student3 = s3;
    expect(s1.id).toBeTruthy();
    expect(s2.id).toBeTruthy();
    expect(s3.id).toBeTruthy();
  });

  await test.step("school-year enrollment for student1", async () => {
    const res = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
      { data: { student_id: run.student1!.id }, headers },
    );
    expect(res.status()).toBe(201);
    const sye = await unwrapData<{
      id: string;
      student_id: string;
      school_year_id: string;
    }>(res);
    expect(sye.student_id).toBe(run.student1!.id);
    expect(sye.school_year_id).toBe(run.schoolYearId);
  });

  await test.step("program enrollment pins the JHS level", async () => {
    const res = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${run.student1!.id}/programs`,
      { data: { program_id: run.jhsProgramId, level_id: run.levelIds![0] }, headers },
    );
    expect(res.status()).toBe(201);
    const pe = await unwrapData<{
      id: string;
      program_id: string;
      level: { id: string } | null;
      section: { id: string } | null;
    }>(res);
    expect(pe.program_id).toBe(run.jhsProgramId);
    expect(pe.level?.id).toBe(run.levelIds![0]);
    expect(pe.section).toBeNull();
    run.programEnrollmentId = pe.id;
  });

  await test.step("assign the created section", async () => {
    const res = await request.patch(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/programs/${run.programEnrollmentId}`,
      { data: { section_id: run.sectionId }, headers },
    );
    expect(res.status()).toBe(200);
    const pe = await unwrapData<{ section: { id: string } | null }>(res);
    expect(pe.section?.id).toBe(run.sectionId);
  });

  await test.step("enrollment list reflects student1 only", async () => {
    const res = await request.get(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
      { headers, params: { limit: 100 } },
    );
    expect(res.status()).toBe(200);
    const list = await unwrapData<{ data: Array<{ student_id: string }> }>(res);
    expect(list.data.some((e) => e.student_id === run.student1!.id)).toBe(true);
    expect(list.data.some((e) => e.student_id === run.student2!.id)).toBe(false);
  });
});

test("Phase 6e — class enrollment is gated on academic placement (API)", async ({
  request,
}) => {
  const headers = await adminHeaders(request);

  await test.step("student1 (JHS placement) can be enrolled", async () => {
    const res = await request.post(`${API_BASE}/classes/${run.classItem!.id}/enroll`, {
      data: { studentId: run.student1!.id },
      headers,
    });
    expect(res.status()).toBe(201);
    const enr = await unwrapData<{ student_id: string; status: string }>(res);
    expect(enr.student_id).toBe(run.student1!.id);
    expect(enr.status).toBe("active");
  });

  await test.step("enrollments endpoint lists student1", async () => {
    const res = await request.get(`${API_BASE}/classes/${run.classItem!.id}/enrollments`, {
      headers,
    });
    expect(res.status()).toBe(200);
    const list = await unwrapData<Array<{ student_id: string; status: string }>>(res);
    expect(
      list.some((e) => e.student_id === run.student1!.id && e.status === "active"),
    ).toBe(true);
  });

  await test.step("student2 (no placement) is rejected with exact reason", async () => {
    const res = await request.post(`${API_BASE}/classes/${run.classItem!.id}/enroll`, {
      data: { studentId: run.student2!.id },
      headers,
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("Student is not eligible for this class");
    expect(body.message).toContain(
      "The student has no active academic placement for this school year.",
    );
  });

  await test.step("student3 (placed in another program) is rejected with exact reason", async () => {
    // Reuse the elementary department Phase 6b created and Phase 6c configured.
    // Creating a second, unconfigured elementary program here would flip
    // org-wide readiness back to not-ready and break Phase 7's gated calls.
    const programs = await unwrapList<{ id: string; type?: string; program_type?: string }>(
      await request.get(`${API_BASE}/programs`, {
        params: { schoolYearId: run.schoolYearId },
        headers,
      }),
    );
    const elemProgram = programs.find((p) => (p.type ?? p.program_type) === "elementary");
    expect(elemProgram, "expected the elementary department from Phase 6b/6c").toBeTruthy();

    const levels = await unwrapList<{ id: string; programId?: string; program_id?: string }>(
      await request.get(`${API_BASE}/levels`, {
        params: { schoolYearId: run.schoolYearId },
        headers,
      }),
    );
    const elemLevel = levels.find((l) => (l.programId ?? l.program_id) === elemProgram!.id);
    expect(elemLevel, "expected the elementary level (Grade 1)").toBeTruthy();

    const sections = await unwrapList<{ id: string; levelId?: string; level_id?: string }>(
      await request.get(`${API_BASE}/sections`, {
        params: { schoolYearId: run.schoolYearId },
        headers,
      }),
    );
    const elemSection = sections.find((s) => (s.levelId ?? s.level_id) === elemLevel!.id);
    expect(elemSection, "expected the elementary section (Section G1)").toBeTruthy();

    const syeRes = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
      { data: { student_id: run.student3!.id }, headers },
    );
    expect(syeRes.status()).toBe(201);

    const peRes = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${run.student3!.id}/programs`,
      { data: { program_id: elemProgram!.id, level_id: elemLevel!.id }, headers },
    );
    expect(peRes.status()).toBe(201);
    const peData = await unwrapData<{ id: string }>(peRes);

    const updRes = await request.patch(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/programs/${peData.id}`,
      { data: { section_id: elemSection!.id }, headers },
    );
    expect(updRes.status()).toBe(200);

    const res = await request.post(`${API_BASE}/classes/${run.classItem!.id}/enroll`, {
      data: { studentId: run.student3!.id },
      headers,
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toContain("Student is not eligible for this class");
    expect(body.message).toContain(
      "The student does not belong to the same program, course/strand, or level assigned to this class.",
    );
  });

  await test.step("eligible-students only surfaces non-enrolled candidates", async () => {
    const res = await request.get(
      `${API_BASE}/classes/${run.classItem!.id}/eligible-students`,
      { headers },
    );
    expect(res.status()).toBe(200);
    const list = await unwrapData<Array<{ id: string }>>(res);
    const ids = list.map((s) => s.id);
    expect(ids).not.toContain(run.student1!.id);
    expect(ids).not.toContain(run.student2!.id);
    expect(ids).not.toContain(run.student3!.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 7 — Class enrollment lifecycle (UI + API): enrolling the students
// created in Phase 2 into the class, the gating rule (same department AND level
// where the class is registered), duplicate/capacity/removal behaviors, and the
// year-end guard. The auto-unenroll SCRUB itself is proven at the backend layer
// (backend/test/lane1-item9-enrollment-auto-unenroll.e2e-spec.ts) because the
// API only ends an ACTIVE school year while this suite's year is `pending`.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 7 — class enrollment lifecycle: gating, duplicates, capacity, and year-end guard", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  let classBId = "";
  let classCId = "";
  let classDId = "";
  let classEId = "";
  let student4Id = "";
  let student5Id = "";

  const createSubject = async (name: string, minorLevelId?: string) => {
    const res = await request.post(`${API_BASE}/subjects`, {
      data: {
        name: uniqueName(name),
        subjectType: minorLevelId ? "minor" : "major",
        programId: run.jhsProgramId,
        ...(minorLevelId ? { levelId: minorLevelId } : {}),
      },
      headers,
    });
    expect(res.status()).toBe(201);
    return (await unwrapData<{ id: string }>(res)).id;
  };

  const createClass = async (subjectId: string, capacity: number, weekday: number, sectionId?: string) => {
    const res = await request.post(`${API_BASE}/classes`, {
      data: {
        subjectId,
        educatorId: run.educatorId,
        ...(sectionId ? { sectionId } : {}),
        schoolYearId: run.schoolYearId,
        semesterId: run.semesterId,
        capacity,
        schedules: [{ weekday, startTime: "08:00", endTime: "09:30" }],
      },
      headers,
    });
    expect(res.status()).toBe(201);
    return (await unwrapData<{ id: string }>(res)).id;
  };

  const enrollStudent = (classId: string, studentId: string) =>
    request.post(`${API_BASE}/classes/${classId}/enroll`, {
      data: { studentId },
      headers,
    });

  const enrollmentsOf = async (classId: string) =>
    unwrapData<Array<{ id: string; student_id: string; status: string }>>(
      await request.get(`${API_BASE}/classes/${classId}/enrollments`, { headers }),
    );

  const eligibleOf = async (classId: string) =>
    unwrapData<Array<{ id: string }>>(
      await request.get(`${API_BASE}/classes/${classId}/eligible-students`, { headers }),
    );

  const placeJhsStudent = async (name: string, levelId: string) => {
    const created = await request.post(`${API_BASE}/students`, {
      data: {
        fullName: uniqueName(name),
        emailName: uniqueUsername("stu"),
        studentId: uniqueStudentNumber("STU"),
      },
      headers,
    });
    expect(created.status()).toBe(201);
    const student = await unwrapData<{ id: string }>(created);
    await request.post(`${API_BASE}/school-years/${run.schoolYearId}/enrollments`, {
      data: { student_id: student.id },
      headers,
    });
    const pe = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${student.id}/programs`,
      { data: { program_id: run.jhsProgramId, level_id: levelId }, headers },
    );
    expect(pe.status()).toBe(201);
    return { studentId: student.id, programEnrollmentId: (await unwrapData<{ id: string }>(pe)).id };
  };

  await test.step("build extra JHS classes and students for the enrollment tests", async () => {
    const subjectB = await createSubject("Elective Math");
    const subjectD = await createSubject("Elective Science");
    // Minor subject bound to level[0] → the class inherits a LEVEL constraint.
    const subjectE = await createSubject("Elective English", run.levelIds![0]);

    // classB = UI enroll target; classC reuses subjectB to prove the
    // "same subject in the same semester" duplicate guard; classD has
    // capacity 1 to prove the overflow branch; classE is the level-gating target.
    classBId = await createClass(subjectB, 30, 2, run.sectionId);
    classCId = await createClass(subjectB, 30, 3, run.sectionId);
    classDId = await createClass(subjectD, 1, 4, run.sectionId);
    classEId = await createClass(subjectE, 30, 5);

    // student4: JHS + level[0] + Section A → eligible for the level/section
    // bound classes (used for the overflow candidate).
    const s4 = await placeJhsStudent("Student Four", run.levelIds![0]);
    student4Id = s4.studentId;
    await request.patch(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/programs/${s4.programEnrollmentId}`,
      { data: { section_id: run.sectionId }, headers },
    );

    // student5: JHS but on a DIFFERENT level → proves the same-level rule.
    const s5 = await placeJhsStudent("Student Five", run.levelIds![1]);
    student5Id = s5.studentId;

    // The roster dialog only lists ACTIVE student accounts, while POST /students
    // creates them as `pending`. Activate the candidates we expect to appear
    // (student1 was created in Phase 2; student5 intentionally stays pending).
    for (const id of [run.student1!.id, student4Id]) {
      const act = await request.patch(`${API_BASE}/students/${id}/status`, {
        data: { status: "active" },
        headers,
      });
      expect(act.status()).toBe(200);
    }

    expect(classBId).toBeTruthy();
    expect(student4Id).toBeTruthy();
    expect(student5Id).toBeTruthy();
  });

  await test.step("UI: admin enrolls the eligible JHS student via the class roster", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto(`/admin/classes/${classBId}`);

    await expect(page.getByRole("heading", { level: 2, name: /Enrolled Students/ })).toBeVisible();
    await expect(page.getByText("No students enrolled yet.", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Enroll Student" }).click();
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog).toBeVisible();

    // The dialog itself states the gating rule under test.
    await expect(
      dialog.getByText(
        "Only students matching this class's program, course/strand, and level are listed.",
        { exact: true },
      ),
    ).toBeVisible();

    // student1 (same JHS program + level + section) is the ONLY eligible one.
    await expect(
      dialog.getByRole("button").filter({ hasText: run.student1!.fullName }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button").filter({ hasText: run.student2!.fullName }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("button").filter({ hasText: run.student3!.fullName }),
    ).toHaveCount(0);

    await dialog.getByRole("button").filter({ hasText: run.student1!.fullName }).click();
    await waitForToast(page, "Student enrolled.");
    await expect(dialog).toBeHidden();

    // Roster now lists student1 (active).
    await expect(
      page
        .locator("div.rounded-lg.border.bg-card.overflow-hidden.divide-y")
        .first()
        .getByText(run.student1!.fullName),
    ).toBeVisible();
  });

  await test.step("duplicate enrollments are rejected (same class + same subject/semester)", async () => {
    // The duplicate-subject check runs before the same-class check, so both a
    // re-enroll into the very same class and a parallel class for the same
    // subject/semester surface the subject-scoped 409.
    const sameClass = await enrollStudent(classBId, run.student1!.id);
    expect(sameClass.status()).toBe(409);
    expect(((await sameClass.json()) as { message: string }).message).toContain(
      "Student is already enrolled in a class for this subject in the same semester.",
    );

    const sameSubjectSem = await enrollStudent(classCId, run.student1!.id);
    expect(sameSubjectSem.status()).toBe(409);
    expect(((await sameSubjectSem.json()) as { message: string }).message).toContain(
      "Student is already enrolled in a class for this subject in the same semester.",
    );
  });

  await test.step("enrollment requires the same department AND level where the class is registered", async () => {
    // classE is registered against level[0] (minor subject binding). student1 is
    // placed on level[0] → enrollable; student5 is on level[1] → rejected.
    const ok = await enrollStudent(classEId, run.student1!.id);
    expect(ok.status()).toBe(201);

    const wrongLevel = await enrollStudent(classEId, student5Id);
    expect(wrongLevel.status()).toBe(400);
    expect(((await wrongLevel.json()) as { message: string }).message).toContain(
      "Student is not eligible for this class",
    );
    expect(((await wrongLevel.json()) as { message: string }).message).toContain(
      "The student does not belong to the same program, course/strand, or level assigned to this class.",
    );

    // eligible-students mirrors the rule: only the level[0] JHS candidate is
    // offered; the enrolled student and the wrong-level student are not.
    const eligible = await eligibleOf(classEId);
    const ids = eligible.map((s) => s.id);
    expect(ids).toContain(student4Id);
    expect(ids).not.toContain(run.student1!.id);
    expect(ids).not.toContain(student5Id);
  });

  await test.step("status transitions + removal + re-enroll on the class enrollment", async () => {
    let enrollments = await enrollmentsOf(classBId);
    const enr = enrollments.find((e) => e.student_id === run.student1!.id)!;
    expect(enr.status).toBe("active");

    const pending = await request.patch(
      `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
      { data: { status: "pending" }, headers },
    );
    expect(pending.status()).toBe(200);
    enrollments = await enrollmentsOf(classBId);
    expect(enrollments.find((e) => e.id === enr.id)?.status).toBe("pending");

    const backToActive = await request.patch(
      `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
      { data: { status: "active" }, headers },
    );
    expect(backToActive.status()).toBe(200);

    const removed = await request.delete(
      `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
      { headers },
    );
    expect(removed.status()).toBe(200);
    enrollments = await enrollmentsOf(classBId);
    expect(enrollments.some((e) => e.student_id === run.student1!.id)).toBe(false);

    // A previously-removed enrollment does not block a fresh row.
    const reEnroll = await enrollStudent(classBId, run.student1!.id);
    expect(reEnroll.status()).toBe(201);
    enrollments = await enrollmentsOf(classBId);
    expect(
      enrollments.some((e) => e.student_id === run.student1!.id && e.status === "active"),
    ).toBe(true);

    // Removing the already-removed original row is a conflict.
    const doubleRemove = await request.delete(
      `${API_BASE}/classes/${classBId}/enrollments/${enr.id}`,
      { headers },
    );
    expect(doubleRemove.status()).toBe(409);
    expect(((await doubleRemove.json()) as { message: string }).message).toContain(
      "Enrollment has already been removed.",
    );
  });

  await test.step("capacity overflow is reported, not an error", async () => {
    const fill = await enrollStudent(classDId, run.student1!.id);
    expect(fill.status()).toBe(201);
    expect(((await fill.json()) as { data: { status: string } }).data.status).toBe("active");

    const overflow = await enrollStudent(classDId, student4Id);
    expect(overflow.status()).toBe(201);
    const body = (await overflow.json()) as {
      data: { overflow: boolean; message: string };
    };
    expect(body.data.overflow).toBe(true);
    expect(body.data.message).toContain("Class is at full capacity (1 students)");
  });

  await test.step("a pending school year cannot be ended directly (guard)", async () => {
    const res = await request.patch(
      `${API_BASE}/school-years/${run.schoolYearId}/end`,
      { headers },
    );
    expect(res.status()).toBe(400);
    expect(((await res.json()) as { message: string }).message).toContain(
      "A pending school year cannot be ended. Activate it first.",
    );
  });

  console.log(
    `[Phase 7] enrolled ${run.student1!.fullName} into ${classBId}; gating/dup/overflow/status guards verified; SY end guard verified for ${run.schoolYearId}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 7b — /admin/enrollment wizard (UI). Readiness setup now lives in
// Phase 6b/6c (a school year cannot enroll students until EVERY department is
// structurally ready), so this test only drives the wizard end to end: it
// places a student department → level → section through the UI, and only THEN
// does the student become eligible for a section-bound class in the wizard's
// class panel — proving the placement-before-class rule without any API bypass
// on the enrollment side.
// ─────────────────────────────────────────────────────────────────────────────

test("Phase 7b — enrollment locked until SY ready; wizard places student dept → level → section → class (UI)", async ({
  page,
  request,
}) => {
  const headers = await adminHeaders(request);

  let level0Name = "";
  let subjectFTitle = "";
  let classFId = "";
  let student6Name = "";
  let student6Id = "";
  let wrongLevelName = "";

  // ── 3. Wizard fixtures ─────────────────────────────────────────────────────
  await test.step("wizard fixtures: level-bound class + placed/not-yet-placed candidates", async () => {
    const levels = await unwrapList<{ id: string; name: string }>(
      await request.get(`${API_BASE}/levels`, {
        params: { schoolYearId: run.schoolYearId },
        headers,
      }),
    );
    const level0 = levels.find((l) => l.id === run.levelIds![0]);
    expect(level0, "expected the generated JHS level 1").toBeTruthy();
    level0Name = level0!.name;

    // classF: minor subject bound to level[0] + Section A → listed under level[0]
    // in the wizard class panel; its eligible set comes from the section.
    const subjectF = await createSubject(request, headers, "Wizard Elective", {
      levelId: run.levelIds![0],
    });
    subjectFTitle = subjectF.title;
    classFId = await createClass(request, headers, subjectF.id, run.sectionId);

    // student6: brand-new, nothing placed yet → the wizard will place it.
    student6Name = uniqueName("Student Wizard");
    const created = await request.post(`${API_BASE}/students`, {
      data: {
        studentId: uniqueStudentNumber("STU"),
        fullName: student6Name,
        emailName: uniqueUsername("stu"),
      },
      headers,
    });
    expect(created.status()).toBe(201);
    student6Id = (await unwrapData<{ id: string }>(created)).id;

    // wrong-level candidate: placed at level 2 (no section) via API → must NEVER
    // surface in classF's eligible list (level-mismatch negative control).
    wrongLevelName = uniqueName("Wrong Level Student");
    const wrong = await request.post(`${API_BASE}/students`, {
      data: {
        studentId: uniqueStudentNumber("STU"),
        fullName: wrongLevelName,
        emailName: uniqueUsername("stu"),
      },
      headers,
    });
    expect(wrong.status()).toBe(201);
    const wrongId = (await unwrapData<{ id: string }>(wrong)).id;
    const sye = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
      { data: { student_id: wrongId }, headers },
    );
    expect(sye.status()).toBe(201);
    const pe = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${wrongId}/programs`,
      { data: { program_id: run.jhsProgramId, level_id: run.levelIds![1] }, headers },
    );
    expect(pe.status()).toBe(201);

    // Record the per-program placement condition the wizard drives into.
    run.placements[run.jhsProgramId!] = {
      programId: run.jhsProgramId!,
      name: run.jhsProgramName!,
      levelId: run.levelIds![0],
      levelName: level0Name,
      sectionId: run.sectionId!,
      sectionName: run.sectionName!,
    };
  });

  // ── 4. Wizard UI ───────────────────────────────────────────────────────────
  await test.step("wizard UI: unlock via /admin/enrollment and pick department + level", async () => {
    await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    await page.goto(`/admin/enrollment?schoolYearId=${run.schoolYearId}`);

    const enrollBtn = page.getByRole("button", { name: "Enroll Students" });
    await expect(enrollBtn).toBeEnabled();
    await enrollBtn.click();
    await page.waitForURL("**/admin/enrollment/enroll**", { timeout: 20_000 });

    const programCard = page.getByRole("button").filter({ hasText: run.jhsProgramName! }).first();
    await programCard.click();

    await page.getByRole("button", { name: level0Name, exact: true }).first().click();
  });

  await test.step("wizard UI: class panel BEFORE placement — unplaced and wrong-level students are NOT eligible", async () => {
    const header = page.getByRole("button").filter({ hasText: subjectFTitle }).first();
    await header.click();

    const card = page
      .locator("div.rounded-lg.border.bg-card.overflow-hidden")
      .filter({ hasText: subjectFTitle })
      .last();
    // Anchor on the eligible-list footer so the empty checks are meaningful.
    await expect(
      card.getByText(/select students to enroll in this class/i).first(),
    ).toBeVisible();
    await expect(card.getByText(student6Name, { exact: true })).toHaveCount(0);
    await expect(card.getByText(wrongLevelName, { exact: true })).toHaveCount(0);

    // Collapse again so the left panel's "Enroll (1)" button is unambiguous.
    await header.click();
  });

  await test.step("wizard UI: enroll the student into the department and level (Enroll Student tab)", async () => {
    await page.getByRole("tab", { name: "Enroll Student" }).click();
    await page
      .getByPlaceholder("Search by name, student ID, or email")
      .fill(student6Name);

    const row = page.getByRole("button").filter({ hasText: student6Name }).first();
    await expect(row).toBeVisible();
    await row.click();

    await page.getByRole("button", { name: "Enroll (1)" }).click();
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog.getByText("Enroll students?", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Enroll", exact: true }).click();
    await waitForToast(page, "student(s) enrolled.");
  });

  await test.step("wizard UI: assign the section on the Pending Section tab", async () => {
    await page.getByRole("tab", { name: "Pending Section" }).click();
    const row = page.locator("tr").filter({ hasText: student6Name }).first();
    await expect(row).toBeVisible();
    await row.getByRole("combobox").click();
    await page.getByRole("option", { name: run.sectionName!, exact: true }).click();
    await row.getByRole("button", { name: "Assign" }).click();
    await waitForToast(page, "Section assigned.");
  });

  await test.step("wizard UI: placed student6 is now eligible for classF and enrolls in it", async () => {
    const header = page.getByRole("button").filter({ hasText: subjectFTitle }).first();
    await header.click();

    const card = page
      .locator("div.rounded-lg.border.bg-card.overflow-hidden")
      .filter({ hasText: subjectFTitle })
      .last();
    await expect(card.getByText(student6Name, { exact: true })).toBeVisible();
    await expect(card.getByText(wrongLevelName, { exact: true })).toHaveCount(0);

    await card.getByRole("button").filter({ hasText: student6Name }).click();
    await card.getByRole("button", { name: "Enroll (1)" }).click();
    await waitForToast(page, "student(s) enrolled in");
  });

  // ── 5. API verification ────────────────────────────────────────────────────
  await test.step("verify: student6 is placed (dept → level → section) and enrolled in classF", async () => {
    const sye = await request.get(`${API_BASE}/school-years/${run.schoolYearId}/enrollments`, {
      headers,
    });
    expect(sye.status()).toBe(200);
    const enrollList = await unwrapList<{
      student_id: string;
      programEnrollments: Array<{
        program_id: string;
        level: { id: string } | null;
        section: { id: string } | null;
      }>;
    }>(sye);
    const enr = enrollList.find((e) => e.student_id === student6Id);
    expect(enr, "expected student6 in the school-year enrollments").toBeTruthy();
    const pe = enr?.programEnrollments.find((p) => p.program_id === run.jhsProgramId);
    expect(pe?.level?.id).toBe(run.levelIds![0]);
    expect(pe?.section?.id).toBe(run.sectionId);

    const classEnr = await request.get(`${API_BASE}/classes/${classFId}/enrollments`, {
      headers,
    });
    expect(classEnr.status()).toBe(200);
    const classList = await unwrapList<{ student_id: string; status: string }>(classEnr);
    expect(classList.some((e) => e.student_id === student6Id && e.status === "active")).toBe(true);
  });

  console.log(
    `[Phase 7b] readiness gate verified; wizard placed ${student6Name} (JHS → level "${level0Name}" → ${run.sectionName}) and enrolled in class ${classFId}`,
  );
});