import { test } from "@playwright/test";
import { registerPhase0And1 } from "./admin-setup/phase-0-1";
import { registerPhase2 } from "./admin-setup/phase-2";
import { registerPhase5And6 } from "./admin-setup/phase-5-6";
import { registerPhaseClasses } from "./admin-setup/phase-classes";
import { registerPhase3And4 } from "./admin-setup/phase-3-4";
import { registerPhase6bAnd6c } from "./admin-setup/phase-6bc";
import { registerPhase6dAnd6e } from "./admin-setup/phase-6de";
import { registerPhase7 } from "./admin-setup/phase-7";

// Every phase depends on the previous phase's data (shared via the `run`
// object in ./admin-setup/shared.ts), so all phases must run — in this exact
// order — inside a single serial describe block. Splitting the *implementation*
// across files is safe because Playwright associates a test() call with
// whichever describe block is executing on the call stack at the moment it
// runs, not with the file it's physically defined in. As long as every
// registerPhaseX() call happens synchronously inside this callback, ordering
// and seriality are preserved exactly as in the original single-file suite.
//
// Ordering notes:
// - Phase 2 creates the department, three levels, three sections, and educator
//   via the UI; it no longer creates classes (that moved to Phase 2e/2f).
// - Phase 5/6 runs directly after Phase 2 because the class modal needs the
//   semester template assigned — and needs no classes itself.
// - Phase 2e/2f creates per-level subjects + classes through the real admin
//   dialogs, and 2g re-checks class RBAC.
// - Phase 3/4 runs after 2e/2f because its scheme-template apply is what stamps
//   existing classes under the program.
// - Phase 6b then proves the school year READY (API + UI), Phase 6d/6e run
//   enrollment against it, and Phase 7 drives the class-enrollment lifecycle +
//   wizard.
test.describe("Admin Setup E2E", () => {
  test.describe.configure({ mode: "serial" });

  registerPhase0And1();
  registerPhase2();
  registerPhase5And6();
  registerPhaseClasses();
  registerPhase3And4();
  registerPhase6bAnd6c();
  registerPhase6dAnd6e();
  registerPhase7();
});