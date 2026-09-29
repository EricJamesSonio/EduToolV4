export function buildFullEmail(
  username: string,
  extension: string | null,
  role: "student" | "educator" | "registrar"
): string {
  const cleanUsername = username
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  if (!extension) return cleanUsername;

  const base = extension.replace(/^@/, "");

  const firstDot = base.indexOf(".");

  let domain: string;

  if (firstDot === -1) {
    domain = `${role}.${base}`;
  } else {
    const before = base.slice(0, firstDot);
    const after = base.slice(firstDot);

    domain = `${role}.${before}${after}`;
  }

  return `${cleanUsername}@${domain}`;
}