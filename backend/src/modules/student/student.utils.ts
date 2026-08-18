// backend/src/modules/student/student.utils.ts

/**
 * Generates a random 10-character alphanumeric system password.
 * Never log or persist the returned value.
 */
export function generateSystemPassword(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
}

/**
 * Generates a system student ID.
 * Format: STU-XXXXXXXX (8 random alphanumeric chars)
 */
export function generateStudentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const random = Array.from({ length: 8 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join('');
  return `STU-${random}`;
}

/**
 * RFC 4180-compliant CSV parser.
 * Handles quoted fields, embedded commas, and escaped quotes ("").
 * Strips BOM if present (common in Excel exports).
 */
export function parseCsv(raw: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present
  const cleaned = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const lines = tokenizeCsvLines(cleaned.trim());

  if (lines.length < 2) return [];

  const headers = lines[0].map((h) => h.trim());

  return lines
    .slice(1)
    .filter((cols) => cols.some((c) => c.trim() !== '')) // skip blank rows
    .map((cols) =>
      headers.reduce(
        (acc, header, i) => {
          acc[header] = (cols[i] ?? '').trim();
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
}

/**
 * Tokenizes raw CSV text into a 2D array of string values,
 * correctly handling quoted fields with embedded commas and escaped quotes.
 */
function tokenizeCsvLines(raw: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote ("") → literal quote character
        if (raw[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field);
        field = '';
        i++;
      } else if (ch === '\r' && raw[i + 1] === '\n') {
        row.push(field);
        result.push(row);
        row = [];
        field = '';
        i += 2;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field);
        result.push(row);
        row = [];
        field = '';
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }

  // Flush last field and row
  if (field !== '' || row.length > 0) {
    row.push(field);
    result.push(row);
  }

  return result;
}

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

  const escape = (val: string): string =>
    val.includes(',') || val.includes('"') || val.includes('\n')
      ? `"${val.replace(/"/g, '""')}"`
      : val;

  const rows = students.map((s) =>
    [
      s.fullName,
      s.studentId,
      s.email,
      s.plainPassword,
      s.levelId,
      s.sectionId,
      s.status,
    ]
      .map(escape)
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}
