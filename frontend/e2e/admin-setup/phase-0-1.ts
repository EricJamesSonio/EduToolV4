import { test, expect } from "@playwright/test";
import {
  login,
  logout,
  pickDate,
  uniqueEmail,
  uniqueName,
  waitForApi,
} from "../helpers";
import {
  run,
} from "./shared";

export function registerPhase0And1() {
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
      await expect(modal.locator(".font-mono")).toHaveText(run.adminPassword!);
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
    const syResp = waitForApi(page, "GET", `/school-years/${run.schoolYearId}`);
    await page.goto(run.schoolYearRoute!);
    await syResp;

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

}