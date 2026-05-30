// src/components/educator/presentation-builder/types.ts

export const FONT_SIZES = [
  { label: "S",  value: "sm", textClass: "text-sm md:text-base"   },
  { label: "M",  value: "md", textClass: "text-base md:text-xl"   },
  { label: "L",  value: "lg", textClass: "text-lg md:text-2xl"    },
  { label: "XL", value: "xl", textClass: "text-xl md:text-3xl"    },
] as const;

export type FontSize = typeof FONT_SIZES[number]["value"];

// ── Presentation-friendly font families ──────────────────────────────────────
// Each entry uses a Google Fonts-safe stack that renders well at large sizes.
export const FONT_FAMILIES = [
  { label: "Default",     value: "default",     stack: "inherit"                                           },
  { label: "Inter",       value: "inter",        stack: "'Inter', sans-serif"                              },
  { label: "Playfair",    value: "playfair",     stack: "'Playfair Display', Georgia, serif"               },
  { label: "Merriweather",value: "merriweather", stack: "'Merriweather', Georgia, serif"                   },
  { label: "Montserrat",  value: "montserrat",   stack: "'Montserrat', Arial, sans-serif"                  },
  { label: "Raleway",     value: "raleway",      stack: "'Raleway', Arial, sans-serif"                     },
  { label: "Lato",        value: "lato",         stack: "'Lato', Arial, sans-serif"                        },
  { label: "Roboto Slab", value: "robotoslab",   stack: "'Roboto Slab', Georgia, serif"                    },
  { label: "Oswald",      value: "oswald",       stack: "'Oswald', Impact, sans-serif"                     },
  { label: "Caveat",      value: "caveat",       stack: "'Caveat', 'Comic Sans MS', cursive"               },
] as const;

export type FontFamily = typeof FONT_FAMILIES[number]["value"];

export function getFontStack(family: FontFamily): string {
  return FONT_FAMILIES.find((f) => f.value === family)?.stack ?? "inherit";
}

// ── Google Fonts import URL (add to <head> or @import in globals.css) ─────────
// Inter, Playfair Display, Merriweather, Montserrat, Raleway,
// Lato, Roboto Slab, Oswald, Caveat
export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Raleway:wght@400;600;700&family=Lato:wght@400;700&family=Roboto+Slab:wght@400;700&family=Oswald:wght@400;600;700&family=Caveat:wght@400;700&display=swap";

export interface SlideDraft {
  id:         string;
  slideNumber: number;
  title:      string;
  content:    string;
  charStart:  number | null;
  charEnd:    number | null;
  fontSize:   FontSize;
  fontFamily: FontFamily;   // ← NEW
}

export interface WordSeg {
  word:  string;
  start: number;
  end:   number;
}

export const SLIDE_COLORS = [
  { bg: "bg-amber-200 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-800/60",     ring: "ring-amber-400"   },
  { bg: "bg-rose-200 dark:bg-rose-900/50 hover:bg-rose-300 dark:hover:bg-rose-800/60",         ring: "ring-rose-400"    },
  { bg: "bg-sky-200 dark:bg-sky-900/50 hover:bg-sky-300 dark:hover:bg-sky-800/60",             ring: "ring-sky-400"     },
  { bg: "bg-emerald-200 dark:bg-emerald-900/50 hover:bg-emerald-300 dark:hover:bg-emerald-800/60", ring: "ring-emerald-400" },
  { bg: "bg-violet-200 dark:bg-violet-900/50 hover:bg-violet-300 dark:hover:bg-violet-800/60", ring: "ring-violet-400"  },
  { bg: "bg-orange-200 dark:bg-orange-900/50 hover:bg-orange-300 dark:hover:bg-orange-800/60", ring: "ring-orange-400"  },
  { bg: "bg-teal-200 dark:bg-teal-900/50 hover:bg-teal-300 dark:hover:bg-teal-800/60",         ring: "ring-teal-400"    },
  { bg: "bg-pink-200 dark:bg-pink-900/50 hover:bg-pink-300 dark:hover:bg-pink-800/60",         ring: "ring-pink-400"    },
];