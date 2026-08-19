import { test } from "@playwright/test";
import { registerPhase0And1 } from "./admin-setup/phase-0-1";
import { registerPhase2 } from "./admin-setup/phase-2";
import { registerPhase3And4 } from "./admin-setup/phase-3-4";
import { registerPhase5And6 } from "./admin-setup/phase-5-6";
import { registerPhase6bAnd6c } from "./admin-setup/phase-6bc";
import { registerPhase6dAnd6e } from "./admin-setup/phase-6de";
import { registerPhase7 } from "./admin-setup/phase-7";
import { registerPhase7b } from "./admin-setup/phase-7b";

// Every phase depends on the previous phase's data (shared via the `run`
// object in ./admin-setup/shared.ts), so all phases must run — in this exact
// order — inside a single serial describe block. Splitting the *implementation*
// across files is safe because Playwright associates a test() call with
// whichever describe block is executing on the call stack at the moment it
// runs, not with the file it's physically defined in. As long as every
// registerPhaseX() call happens synchronously inside this callback, ordering
// and seriality are preserved exactly as in the original single-file suite.
test.describe("Admin Setup E2E", () => {
  test.describe.configure({ mode: "serial" });

  registerPhase0And1();
  registerPhase2();
  registerPhase3And4();
  registerPhase5And6();
  registerPhase6bAnd6c();
  registerPhase6dAnd6e();
  registerPhase7();
  registerPhase7b();
});