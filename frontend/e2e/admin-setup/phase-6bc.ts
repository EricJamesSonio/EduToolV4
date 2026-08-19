import { test, expect } from "@playwright/test";
import { API_BASE, login } from "../helpers";
import {
  run,
  adminHeaders,
  unwrapData,
} from "./shared";

// Phase 6b — School-year readiness gate (API + UI). The org starts with an
// unconfigured elementary department and JHS levels 2-3 lacking sections,
// subjects, and classes, so the enrollment gates (SCHOOL_YEAR_NOT_READY) block
// every write until the ORG is complete. Earlier phases now do the full JHS
// setup (sections in Phase 2, calendar + semester template in Phase 5/6,
// per-level subjects + classes via the UI modal in Phase 2e/2f, grading scale +
// scheme in Phase 3/4), so by the time this phase runs the school year is fully
// ready and the enrollment wizard is unlocked in the UI.
export function registerPhase6bAnd6c() {
  test("Phase 6b — readiness gate: school year is fully ready (API + UI)", async ({
    page,
    request,
  }) => {
    const headers = await adminHeaders(request);

    await test.step("readiness reports the school year ready", async () => {
      let ready = false;
      let issues: Array<{ code: string }> = [];
      for (let attempt = 0; attempt < 10 && !ready; attempt += 1) {
        const res = await request.get(
          `${API_BASE}/school-years/${run.schoolYearId}/readiness`,
          { headers },
        );
        expect(res.status()).toBe(200);
        const readiness = await unwrapData<{ ready: boolean; issues: Array<{ code: string }> }>(
          res,
        );
        ready = readiness.ready;
        issues = readiness.issues;
        if (!ready) await page.waitForTimeout(200);
      }
      expect(ready, `readiness issues: ${issues.map((i) => i.code).join(", ")}`).toBe(true);
    });

    await test.step("the enrollment wizard is unlocked in the UI", async () => {
      await login(page, run.adminEmail!, run.adminPassword!, "/admin/dashboard");
      await page.goto(`/admin/enrollment?schoolYearId=${run.schoolYearId}`);
      await expect(page.getByText(/this school year is not ready/i)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Enroll Students" })).toBeEnabled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 6d/6e — school-year enrollment + class-eligibility lifecycle that Phase
  // 2 originally ran while readiness was still incomplete. Moved to run AFTER
  // the readiness gate so the gated enrollment endpoints and the
  // placement-before-class rule are exercised against a ready school year.
  // ─────────────────────────────────────────────────────────────────────────────
}