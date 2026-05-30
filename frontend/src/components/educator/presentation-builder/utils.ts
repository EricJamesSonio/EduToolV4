import { WordSeg, FontSize, FONT_SIZES } from "./types";

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