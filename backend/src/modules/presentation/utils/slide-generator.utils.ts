export interface SlideContent {
  title?: string;
  content: string[];
}

export interface SlideInput {
  slideNumber: number;
  title?: string;
  content: string;
  lessonSection?: string;
}

export interface LessonData {
  title: string;
  description?: string | null;
  detail?: string | null;
}

const COMMON_ABBREVIATIONS = /\b(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|Ave|Blvd|Dept|Est|Govt|Co|Inc|Ltd|Corp|vs|etc|e\.g|i\.e|al|approx|appt|apt|assn|atty|bldg|ctr|dept|ed|est|ext|fig|fl|ft|gen|govt|hosp|hr|hwy|ib|id|inc|inst|intl|jr|lbs|mdse|mfg|mgmt|misc|mkt|mm|mt|natl|no|nos|nr|ont|orig|pl|pop|pp|pr|pref|prof|pvt|qt|reed|ref|reg|rel|rep|res|retd|rev|rms|sch|sec|secy|sen|sig|sq|sr|st|sub|supt|surg|tel|temp|tng|treas|tsp|univ|v|vol|vs|wk|yrs)\./gi;

const ABBREVIATION_PLACEHOLDER = '\x00ABBR\x00';

function protectAbbreviations(text: string): { text: string; abbreviations: Map<string, string> } {
  const abbreviations = new Map<string, string>();
  let index = 0;
  const result = text.replace(COMMON_ABBREVIATIONS, (match) => {
    const placeholder = `\x00ABBR${index}\x00`;
    abbreviations.set(placeholder, match);
    index++;
    return placeholder;
  });
  return { text: result, abbreviations };
}

function restoreAbbreviations(text: string, abbreviations: Map<string, string>): string {
  let result = text;
  for (const [placeholder, abbr] of abbreviations) {
    result = result.replaceAll(placeholder, abbr);
  }
  return result;
}

export function splitIntoSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const { text: protectedText, abbreviations } = protectAbbreviations(normalized);

  const rawSentences = protectedText.split(/(?<=[.!?])\s+/);

  const sentences: string[] = [];
  for (const raw of rawSentences) {
    const restored = restoreAbbreviations(raw, abbreviations).trim();
    if (restored) {
      sentences.push(restored);
    }
  }

  if (sentences.length === 0 && normalized.length > 0) {
    return [normalized];
  }

  return sentences;
}

export function detectTitle(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (!trimmed) return false;

  const words = trimmed.split(/\s+/);
  if (words.length < 1 || words.length > 8) return false;
  if (trimmed.length > 80) return false;

  const lastChar = trimmed[trimmed.length - 1];
  if (lastChar === '.' || lastChar === '?' || lastChar === '!') return false;

  const firstWord = words[0];
  if (firstWord[0] !== firstWord[0].toUpperCase()) return false;

  return true;
}

export function groupIntoSlides(
  sentences: string[],
  maxWordsPerSlide: number = 30,
): SlideContent[] {
  const slides: SlideContent[] = [];

  let pendingTitle: string | undefined;
  let currentContent: string[] = [];
  let currentWordCount = 0;

  function flush() {
    if (currentContent.length > 0) {
      slides.push({ title: pendingTitle, content: currentContent });
      pendingTitle = undefined;
      currentContent = [];
      currentWordCount = 0;
    } else if (pendingTitle) {
      slides.push({ title: pendingTitle, content: [] });
      pendingTitle = undefined;
    }
  }

  for (const sentence of sentences) {
    const sentenceWordCount = sentence.split(/\s+/).length;

    if (detectTitle(sentence)) {
      flush();
      pendingTitle = sentence;
      continue;
    }

    if (currentWordCount + sentenceWordCount > maxWordsPerSlide && currentContent.length > 0) {
      flush();
    }

    currentContent.push(sentence);
    currentWordCount += sentenceWordCount;
  }

  flush();

  return slides;
}

export function parseSections(detail: string): { heading?: string; body: string }[] {
  if (!detail.trim()) return [];

  const lines = detail.split('\n');
  const sections: { heading?: string; body: string }[] = [];
  let currentHeading: string | undefined;
  let currentBody: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{2,4}\s+(.+)$/);
    if (headingMatch) {
      if (currentBody.length > 0 || currentHeading) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join('\n').trim(),
        });
      }
      currentHeading = headingMatch[1];
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  if (currentBody.length > 0 || currentHeading) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join('\n').trim(),
    });
  }

  return sections;
}

export function generateSlidesFromLesson(
  lesson: LessonData,
  maxWordsPerSlide: number = 30,
): SlideInput[] {
  const slides: SlideInput[] = [];
  let slideNum = 1;

  slides.push({
    slideNumber: slideNum++,
    title: lesson.title,
    content: lesson.description ?? lesson.title,
    lessonSection: 'title',
  });

  const detail = lesson.detail ?? '';
  if (!detail) return slides;

  const sections = parseSections(detail);

  if (sections.length === 0) {
    const sentences = splitIntoSentences(detail);
    const grouped = groupIntoSlides(sentences, maxWordsPerSlide);
    for (const group of grouped) {
      slides.push({
        slideNumber: slideNum++,
        title: group.title,
        content: group.content.join(' '),
        lessonSection: 'content',
      });
    }
  } else {
    for (const section of sections) {
      const sentences = splitIntoSentences(section.body);
      const grouped = groupIntoSlides(sentences, maxWordsPerSlide);
      for (let i = 0; i < grouped.length; i++) {
        const group = grouped[i];
        const title = i === 0 && section.heading ? section.heading : group.title;
        slides.push({
          slideNumber: slideNum++,
          title,
          content: group.content.join(' '),
          lessonSection: section.heading?.toLowerCase().replace(/\s+/g, '_') ?? 'content',
        });
      }
    }
  }

  return slides;
}
