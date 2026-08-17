import { test, expect, type APIRequestContext, type APIResponse } from "@playwright/test";
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
  courseId?: string;
  scaleId?: string;
  schemeTemplateIds: Record<string, string>;
  semesterTemplateId?: string;
} = {
  platformEmail: "platform@edutool.dev",
  platformPassword: "platform123",
  programIds: {},
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
    await page.goto("/admin/sections");
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

test("Phase 2 — students enrolled in the school year with program + section (API)", async ({
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

test("Phase 2 — class enrollment is gated on academic placement (API)", async ({
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
    // Minimal elementary program + level + section for the same school year.
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
    const elemSection = await unwrapData<{ id: string }>(secRes);

    const syeRes = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments`,
      { data: { student_id: run.student3!.id }, headers },
    );
    expect(syeRes.status()).toBe(201);

    const peRes = await request.post(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/students/${run.student3!.id}/programs`,
      { data: { program_id: elemProgram.id, level_id: elemLevel.id }, headers },
    );
    expect(peRes.status()).toBe(201);
    const peData = await unwrapData<{ id: string }>(peRes);

    const updRes = await request.patch(
      `${API_BASE}/school-years/${run.schoolYearId}/enrollments/programs/${peData.id}`,
      { data: { section_id: elemSection.id }, headers },
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