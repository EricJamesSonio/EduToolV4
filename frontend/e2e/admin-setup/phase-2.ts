import { test, expect } from "@playwright/test";
import {
  API_BASE,
  login,
  uniqueName,
  uniqueUsername,
  waitForApi,
  waitForToast,
} from "../helpers";
import {
  run,
  adminHeaders,
  unwrapData,
} from "./shared";

export function registerPhase2() {
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
      page.on("response", (r) => {
        if (r.status() >= 400 || r.url().includes("levels")) {
          console.log(`[TPL] ${r.status()} ${r.request().method()} ${r.url()}`);
        }
      });
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
      run.levelNamesById = Object.fromEntries(
        levels.map((l: { id: string; name: string }) => [l.id, l.name]),
      );

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

  test("Phase 2 — sections for every generated JHS level (UI)", async ({ page, request }) => {
    await test.step("admin login", async () => {
      await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
    });
    const headers = await adminHeaders(request);

    await test.step("create a section for each generated JHS level", async () => {
      // Same guard-race handling as Phase 1: "New Section" is wrapped in
      // ensureOrganization, which bails while GET /organization is still loading.
      const orgResp = waitForApi(page, "GET", "/organization");
      await page.goto("/admin/sections");
      await orgResp;

      const sectionBases = ["Section A", "Section B", "Section C"];
      for (const [i, levelId] of (run.levelIds ?? []).entries()) {
        await page.getByRole("button", { name: "New Section" }).first().click();

        const dialog = page.locator('[data-slot="dialog-content"]');
        // Department
        await dialog.getByRole("combobox").nth(0).click();
        await page.getByRole("option", { name: run.jhsProgramName!, exact: true }).click();
        // Level (generated name)
        await dialog.getByRole("combobox").nth(1).click();
        await page
          .getByRole("option", { name: run.levelNamesById[levelId] ?? "", exact: true })
          .click();

        const name = uniqueName(sectionBases[i]);
        await dialog.getByPlaceholder("Section A").fill(name);

        const secResp = waitForApi(page, "POST", "/sections");
        await dialog.getByRole("button", { name: "Create Section" }).click();
        const resp = await secResp;

        const section = (await resp.json()).data;
        expect(section.name).toBe(name);
        run.sectionByLevel[levelId] = { id: section.id, name };
        await waitForToast(page, "Section created.");
      }

      // Aliases for the level[0] section, referenced by the enrollment phases.
      run.sectionName = run.sectionByLevel[run.levelIds![0]].name;
      run.sectionId = run.sectionByLevel[run.levelIds![0]].id;
      expect(run.sectionId).toBeTruthy();

      for (const levelId of run.levelIds!) {
        await expect(
          page.getByText(run.sectionByLevel[levelId].name, { exact: true }).first(),
        ).toBeVisible();
      }
      await expect(page.getByText("Showing 1–3 of 3 results", { exact: false }).first()).toBeVisible();
    });

    await test.step("level_no_sections cleared for every generated level", async () => {
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
      for (const levelId of run.levelIds!) {
        expect(flaggedLevelIds).not.toContain(levelId);
      }
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
      const dotIndex = run.orgExtension!.indexOf(".");
      const eduDomain = `${run.orgExtension!.slice(0, dotIndex)}.educator${run.orgExtension!.slice(dotIndex)}`;
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
      await expect(credCard.getByText(run.educatorPassword!, { exact: true })).toBeVisible();
      await credCard.getByRole("button", { name: "Done" }).click();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 3 — Grading Scale: create an org-scoped scale via the UI, assign it to
  // the JHS department for the run's school year, and verify via the API.
  // ─────────────────────────────────────────────────────────────────────────────

}