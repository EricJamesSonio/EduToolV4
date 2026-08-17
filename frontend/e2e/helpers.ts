import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";

// The backend runs on 5000; the frontend (baseURL) runs on 3000.
export const API_BASE = "http://localhost:5000";

// ─── Unique data per run ─────────────────────────────────────────────────────

let counter = 0;
const stamp = (): string => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const uniqueName = (base: string): string => `${base}-${stamp()}`;

export const uniqueEmail = (base: string): string => `${base}.${stamp().replace(/-/g, "")}@test.local`;

/**
 * Letters+numbers only (backend USERNAME_REGEX). Never includes "-" or ".".
 */
export const uniqueUsername = (base: string): string =>
  `${base}${stamp().replace(/-/g, "")}`.toLowerCase();

export const uniqueStudentNumber = (base: string): string =>
  `${base}-${stamp().replace(/-/g, "")}`.toUpperCase();

/**
 * API login against the backend. Every response is wrapped by the global
 * ResponseInterceptor as `{ success: true, data: <body> }`, so the accessToken
 * lives at `body.data.accessToken`.
 */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
  });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { data?: { accessToken?: string } };
  const token = body?.data?.accessToken;
  expect(token).toBeTruthy();
  return token as string;
}

// ─── Network-verified waits (no blind sleeps) ───────────────────────────────

export async function waitForApi(
  page: Page,
  method: string,
  urlPart: string,
  accepted: number[] = [200, 201],
): Promise<Response> {
  const resp = await page.waitForResponse(
    (r) => r.request().method() === method && r.url().includes(urlPart),
    { timeout: 20_000 },
  );
  expect(accepted).toContain(resp.status());
  return resp;
}

export async function waitForReadiness(
  page: Page,
): Promise<{
  ready: boolean;
  blockingCount: number;
  warningCount: number;
  issues: Array<{ code: string; severity: string; message: string }>;
}> {
  const resp = await page.waitForResponse(
    (r) => r.request().method() === "GET" && r.url().endsWith("/readiness"),
    { timeout: 20_000 },
  );
  const body = await resp.json();
  return body?.data ?? body;
}

// ─── Auth flows ──────────────────────────────────────────────────────────────

export async function login(
  page: Page,
  email: string,
  password: string,
  expectedPath: string,
): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 20_000 });
}

export async function logout(page: Page): Promise<void> {
  const trigger = page.getByRole("button", { name: "Log out" }).first();
  try {
    await trigger.click({ timeout: 5_000 });
  } catch {
    // The sidebar is fixed-position; in a short headless viewport its "Log out"
    // action can sit outside the viewport and never be scrollable into view.
    // Fall back to the DOM click so the logout flow still runs to completion.
    await trigger.evaluate((el) => (el as HTMLElement).click());
  }
  await page.getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("**/login", { timeout: 20_000 });
}

// ─── UI state helpers ────────────────────────────────────────────────────────

export async function waitForToast(page: Page, text?: string): Promise<void> {
  const toast = page.locator('[data-sonner-toast]');
  const target = text ? toast.filter({ hasText: text }) : toast;
  await target.first().waitFor({ state: "visible", timeout: 15_000 });
}

/**
 * Pick a date from the app's react-day-picker DatePicker. The calendar opens in
 * days view; we jump straight to the target via Years -> Months -> Days to stay
 * deterministic regardless of the default month. Month labels are 3-letter
 * caps ("Aug", "Jun").
 */
export async function pickDate(
  page: Page,
  trigger: Locator,
  year: number,
  month: string,
  day: number,
): Promise<void> {
  await trigger.click();
  const popup = page.locator('[data-slot="popover-content"][data-open]');
  await popup.waitFor({ state: "visible" });

  // days view -> years view (header reads e.g. "August 2026")
  await popup.getByRole("button", { name: /^[A-Z][a-z]+ \d{4}$/ }).click();
  // years view -> months view
  await popup.getByRole("button", { name: String(year), exact: true }).click();
  // months view -> days view
  await popup.getByRole("button", { name: month, exact: true }).click();
  // days view -> select the day cell
  const dayButton = popup.getByRole("button").filter({ hasText: new RegExp(`^${day}$`) });
  await dayButton.click();
}

export async function expectTextVisible(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
}

export async function expectRowVisible(page: Page, text: string): Promise<void> {
  const row = page.getByRole("row").filter({ hasText: text }).first();
  await expect(row).toBeAttached();
}