// @/modules/student/student.utils.ts

/**
 * Generates a system password — 10 alphanumeric characters.
 * Returned in plain text once to Admin for distribution.
 */
export function generateSystemPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}

/**
 * Parses a raw CSV string into rows of key-value objects.
 * Expects the first row to be headers.
 */
export function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.trim().split('\n').map((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return headers.reduce(
      (acc, header, i) => {
        acc[header] = values[i] ?? '';
        return acc;
      },
      {} as Record<string, string>,
    );
  });
}

/**
 * Converts an array of student credential objects to a CSV string.
 * Columns: Full Name, Student ID, Email, Password, Level ID, Section ID, Account Status
 */
export function buildCredentialsCsv(
  students: Array<{
    fullName: string;
    studentId: string;
    email: string;
    plainPassword: string;
    levelId: string;
    sectionId: string;
    status: string;
  }>,
): string {
  const headers = [
    'Full Name',
    'Student ID',
    'Email',
    'Password',
    'Level ID',
    'Section ID',
    'Account Status',
  ];

  const rows = students.map((s) =>
    [
      s.fullName,
      s.studentId,
      s.email,
      s.plainPassword,
      s.levelId,
      s.sectionId,
      s.status,
    ].join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}