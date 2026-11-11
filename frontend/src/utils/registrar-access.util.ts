export const REGISTRAR_HOME_PATH = "/admin/dashboard";

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

export function isRegistrarPathAllowed(pathname: string): boolean {
  if (pathname === "/admin") return true;
  if (BLOCKED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return false;
  }
  return ALLOWED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}