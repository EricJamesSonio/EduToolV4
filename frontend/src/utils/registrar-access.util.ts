const ADMIN_BASE = "/admin";
export const REGISTRAR_BASE = "/registrar";

const ADMIN_PROFILE_PATH = "/admin/data-seeder";
const REGISTRAR_PROFILE_PATH = "/registrar/school-profile";

export const REGISTRAR_HOME_PATH = "/registrar/dashboard";

const ALLOWED_PREFIXES: readonly string[] = [
  "/admin/dashboard",
  "/admin/organization",
  "/admin/data-seeder",
  "/admin/enrollment",
  "/admin/enrollment-portal",
  "/admin/sections",
  "/admin/students",
  "/admin/educators",
  "/admin/concerns",
  "/admin/profile",
];

const BLOCKED_PREFIXES: readonly string[] = [
  "/admin/organization/schedule",
  "/admin/students/import",
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** /admin/... -> /registrar/... (School Profile gets a friendly URL). */
export function toRegistrarPath(path: string): string {
  if (path === ADMIN_PROFILE_PATH) return REGISTRAR_PROFILE_PATH;
  if (matchesPrefix(path, ADMIN_BASE)) {
    return REGISTRAR_BASE + path.slice(ADMIN_BASE.length);
  }
  return path;
}

/** /registrar/... -> /admin/... (the real route the page lives at). */
export function toAdminPath(path: string): string {
  if (path === REGISTRAR_PROFILE_PATH) return ADMIN_PROFILE_PATH;
  if (matchesPrefix(path, REGISTRAR_BASE)) {
    return ADMIN_BASE + path.slice(REGISTRAR_BASE.length);
  }
  return path;
}

export function isRegistrarPathAllowed(rawPathname: string): boolean {
  const pathname = toAdminPath(rawPathname);
  if (pathname === "/admin") return true;
  if (BLOCKED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return false;
  }
  return ALLOWED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}