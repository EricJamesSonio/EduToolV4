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

export function registerPhase3And4() {
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
        params: { schoolYearId: run.schoolYearId! },
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
        { params: { schoolYearId: run.schoolYearId! }, headers },
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

}