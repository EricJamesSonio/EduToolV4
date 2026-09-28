export const WEEK_COLORS = [
  "bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD]",
  "bg-[#98FB98] text-[#0B1E3A] border border-[#86EFAC]",
  "bg-[#DDD6FE] text-[#0B1E3A] border border-[#C4B5FD]",
  "bg-[#FDE68A] text-[#0B1E3A] border border-[#FCD34D]",
  "bg-[#93C5FD] text-[#0B1E3A] border border-[#60A5FA]",
  "bg-[#DDD6FE] text-[#0B1E3A] border border-[#C4B5FD]",
  "bg-[#FBCFE8] text-[#0B1E3A] border border-[#F9A8D4]",
  "bg-[#93C5FD] text-[#0B1E3A] border border-[#60A5FA]",
  "bg-[#FED7AA] text-[#0B1E3A] border border-[#FDBA74]",
  "bg-[#FBCFE8] text-[#0B1E3A] border border-[#F9A8D4]",
];

/* ── Named icon tones (same hues as WEEK_COLORS, but addressable by name) ── */

export type IconTone = "blue" | "green" | "purple" | "yellow" | "pink" | "orange";

export const ICON_TONES: Record<IconTone, string> = {
  blue: "bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD]",
  green: "bg-[#98FB98] text-[#0B1E3A] border border-[#86EFAC]",
  purple: "bg-[#DDD6FE] text-[#0B1E3A] border border-[#C4B5FD]",
  yellow: "bg-[#FDE68A] text-[#0B1E3A] border border-[#FCD34D]",
  pink: "bg-[#FBCFE8] text-[#0B1E3A] border border-[#F9A8D4]",
  orange: "bg-[#FED7AA] text-[#0B1E3A] border border-[#FDBA74]",
};

const TONE_ORDER: IconTone[] = ["blue", "green", "purple", "yellow", "pink", "orange"];

/** Fixed color per department so each one is recognizable at a glance. */
const DEPARTMENT_TONES: Record<string, IconTone> = {
  daycare: "pink",
  kinder: "orange",
  kindergarten: "orange",
  elementary: "green",
  jhs: "purple",
  shs: "yellow",
  college: "blue",
};

export function departmentTone(type: string): IconTone {
  const known = DEPARTMENT_TONES[type];
  if (known) return known;
  // Unknown key → stable fallback so it never flips color between renders.
  let hash = 0;
  for (let i = 0; i < type.length; i++) hash = (hash * 31 + type.charCodeAt(i)) >>> 0;
  return TONE_ORDER[hash % TONE_ORDER.length];
}