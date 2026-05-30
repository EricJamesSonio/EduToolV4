export const FONT_SIZES = [
  { label: "S", value: "sm", textClass: "text-sm md:text-base" },
  { label: "M", value: "md", textClass: "text-base md:text-xl" },
  { label: "L", value: "lg", textClass: "text-lg md:text-2xl" },
  { label: "XL", value: "xl", textClass: "text-xl md:text-3xl" },
] as const;

export type FontSize = typeof FONT_SIZES[number]["value"];

export interface SlideDraft {
  id: string;
  slideNumber: number;
  title: string;
  content: string;
  charStart: number | null;
  charEnd: number | null;
  fontSize: FontSize;
}

export interface WordSeg {
  word: string;
  start: number;
  end: number;
}

export const SLIDE_COLORS = [
  { bg: "bg-amber-200 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-800/60", ring: "ring-amber-400" },
  { bg: "bg-rose-200 dark:bg-rose-900/50 hover:bg-rose-300 dark:hover:bg-rose-800/60", ring: "ring-rose-400" },
  { bg: "bg-sky-200 dark:bg-sky-900/50 hover:bg-sky-300 dark:hover:bg-sky-800/60", ring: "ring-sky-400" },
  { bg: "bg-emerald-200 dark:bg-emerald-900/50 hover:bg-emerald-300 dark:hover:bg-emerald-800/60", ring: "ring-emerald-400" },
  { bg: "bg-violet-200 dark:bg-violet-900/50 hover:bg-violet-300 dark:hover:bg-violet-800/60", ring: "ring-violet-400" },
  { bg: "bg-orange-200 dark:bg-orange-900/50 hover:bg-orange-300 dark:hover:bg-orange-800/60", ring: "ring-orange-400" },
  { bg: "bg-teal-200 dark:bg-teal-900/50 hover:bg-teal-300 dark:hover:bg-teal-800/60", ring: "ring-teal-400" },
  { bg: "bg-pink-200 dark:bg-pink-900/50 hover:bg-pink-300 dark:hover:bg-pink-800/60", ring: "ring-pink-400" },
];