import { Role } from "@/types/auth.types";

/**
 * Returns the home path for each role after login.
 */
export function getRoleHomePath(role: Role): string {
  switch (role) {
    case "platform_owner":
      return "/platform";
    case "admin":
      return "/admin";
    case "educator":
      return "/educator";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}

export function isPlatformOwner(role: Role | null | undefined): boolean {
  return role === "platform_owner";
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "admin";
}

export function isEducator(role: Role | null | undefined): boolean {
  return role === "educator";
}

export function isStudent(role: Role | null | undefined): boolean {
  return role === "student";
}