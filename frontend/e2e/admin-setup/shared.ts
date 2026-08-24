import {
  expect,
  type APIRequestContext,
  type APIResponse,
  type Locator,
  type Page,
} from "@playwright/test";
import { API_BASE, apiLogin, login, waitForApi, waitForToast } from "../helpers";

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
  // Generated level names (e.g. "1", "2", "3") keyed by id, so UI helpers can
  // pick the right option in the class/subject dialogs.
  levelNamesById: Record<string, string>;
  // Section captured per level after Phase 2 extends the section test to all
  // three JHS levels.
  sectionByLevel: Record<string, { id: string; name: string }>;
  // Minor subject created per level via the subject UI in Phase 2e.
  subjectByLevel: Record<string, { id: string; title: string }>;
  sectionName?: string;
  sectionId?: string;
  student1?: { id: string; fullName: string };
  student2?: { id: string; fullName: string };
  student3?: { id: string; fullName: string };
  programEnrollmentId?: string;
  classItem?: ClassItem;
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
  scaleName?: string;
  scaleId?: string;
  schemeTemplateIds: Record<string, string>;
  schemeTemplateName?: string;
  semesterTemplateName?: string;
  semesterTemplateId?: string;
} = {
  platformEmail: "platform@edutool.dev",
  platformPassword: "platform123",
  levelNamesById: {},
  sectionByLevel: {},
  subjectByLevel: {},
  programIds: {},
  placements: {},
  schemeTemplateIds: {},
};

// Shape of a created class row returned by POST /classes (used for the class
// the Phase 2e/2f modal creates for JHS level 1).
export type ClassItem = {
  id: string;
  subject_id: string;
  educator_id: string;
  section_id: string;
  school_year_id: string;
  semester_id: string;
  capacity: number;
  schedules: Array<{ weekday: number; start_time: string; end_time: string }>;
};

// Authenticated API headers for the run's admin account.
export const adminHeaders = async (
  request: APIRequestContext,
): Promise<{ Authorization: string }> => {
  const token = await apiLogin(request, run.adminEmail!, run.adminPassword!);
  return { Authorization: `Bearer ${token}` };
};

// Unwrap the ResponseInterceptor envelope `{ success, data }` down to its `data`
// payload. Accepts both the APIRequestContext response and the page-level
// Response type (for waitForApi).
export const unwrapData = async <T>(res: { json(): Promise<unknown> }): Promise<T> => {
  const body = (await res.json()) as { success?: boolean; data?: T };
  return body.data as T;
};

// Several admin pages wrap dialog-open buttons in `ensureOrganization()`,
// which silently drops the click while the org query is still loading. Retry
// the click until the dialog actually appears so the test is timing-proof.
export const openDialog = async (
  page: Page,
  trigger: Locator,
  content: Locator,
): Promise<void> => {
  // Some pages render a duplicate "New <Entity>" button in the empty state
  // (toolbar + empty-state action). Both open the same dialog, so click the
  // first to keep the strict-mode locator happy.
  const target = trigger.first();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await target.click();
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
export const unwrapList = async <T>(res: APIResponse): Promise<T[]> => {
  const body = (await res.json()) as { data?: T[] | { data?: T[] } };
  const d = body?.data;
  return (Array.isArray(d) ? d : (d?.data ?? [])) as T[];
};

// ── UI-driven creation helpers ────────────────────────────────────────────────
// Every ORM entity in the later phases is now created through the real admin
// dialogs (Subjects page + Classes page modal), so the modal interactions the
// backend serves are exercised end to end.

// Pick a free 30-minute block in the class modal's educator schedule grid.
// Interactive cells are `div[role="button"][tabindex="0"]` while free; the grid
// DOM is ordered weekday (Mon..Sun) then minute, so the first adjacent row pair
// in the same weekday column is a free contiguous block. The first click starts
// the draft, the second (same day, later minute) commits the range.
export async function pickFreeSlot(modal: Locator): Promise<void> {
  const free = modal.locator("div[role='button'][tabindex='0']");
  await expect(free.first()).toBeVisible({ timeout: 15_000 });

  const cells = await free.evaluateAll((els) =>
    els.map((el) => {
      const style = (el as HTMLElement).style;
      const col = Number(style.gridColumn.split(" ")[0]);
      const row = Number(style.gridRow.split(" ")[0]);
      return { col, row };
    }),
  );

  let start = -1;
  for (let i = 0; i < cells.length - 1; i += 1) {
    if (cells[i].col === cells[i + 1].col && cells[i + 1].row === cells[i].row + 1) {
      start = i;
      break;
    }
  }
  expect(start, "expected a free contiguous slot in the educator schedule").toBeGreaterThanOrEqual(0);

  await free.nth(start).click();
  await free.nth(start + 1).click();
}

// Create a subject (major or minor) through the /admin/subjects dialog. For JHS
// the dialog requires a department AND a level regardless of type, so the level
// is always picked; minor subjects become level-bound by construction.
export async function createSubjectViaUI(
  page: Page,
  params: {
    programName: string;
    subjectType: "major" | "minor";
    levelId: string;
    name: string;
  },
): Promise<{ id: string; title: string }> {
  await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
  await page.goto("/admin/subjects");

  const minor = params.subjectType === "minor";
  if (minor) {
    await page.getByRole("tab", { name: "Minor Subjects" }).click();
  }

  const trigger = page.getByRole("button", {
    name: minor ? "New Minor Subject" : "New Subject",
  });
  await trigger.waitFor({ state: "visible", timeout: 15_000 });

  const dialog = page.locator('[data-slot="dialog-content"]');
  await openDialog(page, trigger, dialog);

  // Department
  await dialog.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: params.programName, exact: true }).click();
  // Level (generated name, e.g. "1"); for minors "— None —" is skipped by name.
  await dialog.getByRole("combobox").nth(1).click();
  await page
    .getByRole("option", { name: run.levelNamesById[params.levelId] ?? "", exact: true })
    .click();

  await dialog.getByPlaceholder(/e\.g\./).fill(params.name);

  const respPromise = waitForApi(page, "POST", "/subjects");
  await dialog.getByRole("button", { name: "Create Subject" }).click();
  const resp = await respPromise;
  await waitForToast(page, "Subject created.");
  return await unwrapData<{ id: string; title: string }>(resp);
}

// Create a class through the /admin/classes "New Class" modal: department →
// semester (first available — deterministic) → level → section → subject →
// educator → capacity, then a free schedule slot, then submit. Returns the full
// created class row so callers can pin it into `run.classItem`.
export async function createClassViaUI(
  page: Page,
  params: {
    programName: string;
    levelId: string;
    sectionName: string;
    subjectTitle: string;
    educatorFullName: string;
    capacity: number;
  },
): Promise<ClassItem> {
  await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
  await page.goto("/admin/classes");

  const trigger = page.getByRole("button", { name: "New Class" });
  await trigger.waitFor({ state: "visible", timeout: 15_000 });

  const dialog = page.locator('[data-slot="dialog-content"]');
  await openDialog(page, trigger, dialog);

  const levelName = run.levelNamesById[params.levelId] ?? "";

  // Department
  await dialog.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: params.programName, exact: true }).click();
  // Semester — always pick the first available option (template's first term set).
  // The select stays disabled until the semester-template assignment query lands.
  await expect(dialog.getByRole("combobox").nth(1)).toBeEnabled();
  await dialog.getByRole("combobox").nth(1).click();
  await page.getByRole("option").first().click();
  // Level
  await expect(dialog.getByRole("combobox").nth(2)).toBeEnabled();
  await dialog.getByRole("combobox").nth(2).click();
  await page.getByRole("option", { name: levelName, exact: true }).click();
  // Section
  await expect(dialog.getByRole("combobox").nth(3)).toBeEnabled();
  await dialog.getByRole("combobox").nth(3).click();
  await page.getByRole("option", { name: params.sectionName, exact: true }).click();
  // Subject
  await expect(dialog.getByRole("combobox").nth(4)).toBeEnabled();
  await dialog.getByRole("combobox").nth(4).click();
  await page.getByRole("option", { name: params.subjectTitle, exact: true }).click();
  // Educator
  await expect(dialog.getByRole("combobox").nth(5)).toBeEnabled();
  await dialog.getByRole("combobox").nth(5).click();
  await page.getByRole("option", { name: params.educatorFullName, exact: true }).click();
  // Capacity
  await dialog.getByRole("spinbutton").fill(String(params.capacity));

  // Schedule — the grid renders once the educator is chosen; pick a free block.
  await pickFreeSlot(dialog);

  const submit = dialog.getByRole("button", { name: "Create Class" });
  await expect(submit).toBeEnabled();

  const respPromise = waitForApi(page, "POST", "/classes");
  await submit.click();
  const resp = await respPromise;
  await waitForToast(page, "Class created.");
  return await unwrapData<ClassItem>(resp);
}