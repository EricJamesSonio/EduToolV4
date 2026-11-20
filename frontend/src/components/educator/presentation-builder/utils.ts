import { WordSeg, FontSize, FONT_SIZES, SlideDraft } from "./types";

export function newSlideId() { return crypto.randomUUID(); }

export function parseWords(text: string): WordSeg[] {
  const words: WordSeg[] = [];
  const re = /\S+\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    words.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  return words;
}

export function getFontSizeTextClass(fontSize: FontSize): string {
  return FONT_SIZES.find((f) => f.value === fontSize)?.textClass ?? "text-base md:text-xl";
}

export interface SlideRangeResult {
  slideNumber: number;
  start: number;
  end: number;
}

function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  let prevSpace = true;
  for (let i = 0; i < text.length; i++) {
    const isSpace = /\s/.test(text[i]);
    if (isSpace) {
      if (prevSpace) continue;
      norm += " ";
      map.push(i);
      prevSpace = true;
    } else {
      norm += text[i];
      map.push(i);
      prevSpace = false;
    }
  }
  return { norm, map };
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function computeSlideRanges(
  detail: string,
  slides: SlideDraft[],
): Array<SlideRangeResult | null> {
  const { norm, map } = normalizeWithMap(detail);
  let cursor = 0;

  return slides.map((s) => {
    if (s.charStart !== null && s.charEnd !== null) {
      return { slideNumber: s.slideNumber, start: s.charStart, end: s.charEnd };
    }

    const needle = collapseWhitespace(s.content);
    if (!needle) return null;

    let at = norm.indexOf(needle, cursor);
    if (at === -1) at = norm.indexOf(needle);
    if (at === -1) return null;

    const start = map[at];
    const lastNormIdx = at + needle.length - 1;
    let end = map[lastNormIdx] + 1;
    while (end < detail.length && /\s/.test(detail[end])) end++;

    cursor = at + needle.length;
    return { slideNumber: s.slideNumber, start, end };
  });
}