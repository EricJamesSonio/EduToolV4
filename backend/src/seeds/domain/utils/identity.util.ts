/**
 * identity.util.ts
 *
 * Pure helpers for turning a school/person name into the identifiers the
 * seed needs: org email-extension slugs, org-scoped educator/student email
 * addresses (mirroring EducatorService/StudentService.buildOrgEmail exactly),
 * and randomized display IDs.
 */

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Build the org-scoped educator email matching EducatorService.buildOrgEmail */
export function buildEducatorEmail(
  orgEmailExtension: string,
  localPart: string,
): string {
  const base = orgEmailExtension
    .replace(/^@/, '')
    .replace(/\.(student|educator)\./g, '.')
    .trim();
  const dotIdx = base.indexOf('.');
  const domain =
    dotIdx >= 0
      ? `${base.slice(0, dotIdx)}.educator${base.slice(dotIdx)}`
      : `educator.${base}`;
  return `${localPart}@${domain}`.toLowerCase();
}

/** Build the org-scoped student email matching StudentService.buildOrgEmail */
export function buildStudentEmail(
  orgEmailExtension: string,
  localPart: string,
): string {
  const base = orgEmailExtension
    .replace(/^@/, '')
    .replace(/\.(student|educator)\./g, '.')
    .trim();
  const dotIdx = base.indexOf('.');
  const domain =
    dotIdx >= 0
      ? `${base.slice(0, dotIdx)}.student${base.slice(dotIdx)}`
      : `student.${base}`;
  return `${localPart}@${domain}`.toLowerCase();
}

export function generateStudentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `STU-${random}`;
}

export function generateEducatorId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `EDU-${random}`;
}
