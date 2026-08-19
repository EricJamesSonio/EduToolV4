import { test, expect } from "@playwright/test";
import {
  API_BASE,
  login,
  uniqueName,
  waitForApi,
  waitForToast,
} from "../helpers";
import {
  run,
  adminHeaders,
  unwrapData,
  openDialog,
} from "./shared";

export function registerPhase5And6() {
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
        params: { programId: run.jhsProgramId!, schoolYearId: run.schoolYearId! },
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
        { params: { schoolYearId: run.schoolYearId! }, headers },
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

}