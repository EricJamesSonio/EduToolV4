import {
  splitIntoSentences,
  detectTitle,
  groupIntoSlides,
  parseSections,
  generateSlidesFromLesson,
} from './slide-generator.utils';

describe('splitIntoSentences', () => {
  it('splits basic sentences separated by periods', () => {
    expect(splitIntoSentences('A. B. C.')).toEqual(['A.', 'B.', 'C.']);
  });

  it('handles question marks and exclamation points', () => {
    expect(splitIntoSentences('What is this? It is a test. Wow!')).toEqual([
      'What is this?',
      'It is a test.',
      'Wow!',
    ]);
  });

  it('preserves common abbreviations like Dr. Mr. etc.', () => {
    const result = splitIntoSentences('Dr. Smith arrived. Mr. Jones left.');
    expect(result).toEqual(['Dr. Smith arrived.', 'Mr. Jones left.']);
  });

  it('preserves e.g. and i.e. abbreviations', () => {
    const result = splitIntoSentences(
      'Some colors (e.g. red, blue) are nice. They are primary.',
    );
    expect(result).toEqual([
      'Some colors (e.g. red, blue) are nice.',
      'They are primary.',
    ]);
  });

  it('does not split on decimal numbers', () => {
    const result = splitIntoSentences('Pi is 3.14. It is useful.');
    expect(result).toEqual(['Pi is 3.14.', 'It is useful.']);
  });

  it('returns empty array for empty string', () => {
    expect(splitIntoSentences('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(splitIntoSentences('   ')).toEqual([]);
  });

  it('handles a single sentence without trailing punctuation', () => {
    expect(splitIntoSentences('Just one sentence')).toEqual([
      'Just one sentence',
    ]);
  });

  it('normalizes excess whitespace', () => {
    expect(splitIntoSentences('Hello.    World.')).toEqual([
      'Hello.',
      'World.',
    ]);
  });

  it('handles newlines as whitespace', () => {
    expect(splitIntoSentences('Line one.\nLine two.')).toEqual([
      'Line one.',
      'Line two.',
    ]);
  });

  it('handles ellipsis without false split', () => {
    const result = splitIntoSentences('Wait... Let me think. Okay.');
    expect(result).toEqual(['Wait...', 'Let me think.', 'Okay.']);
  });
});

describe('detectTitle', () => {
  it('returns true for a short capitalized line', () => {
    expect(detectTitle('Introduction')).toBe(true);
  });

  it('returns true for a multi-word short title', () => {
    expect(detectTitle('Photosynthesis Overview')).toBe(true);
  });

  it('returns false when line ends with a period', () => {
    expect(detectTitle('Introduction.')).toBe(false);
  });

  it('returns false when line ends with a question mark', () => {
    expect(detectTitle('Is this a title?')).toBe(false);
  });

  it('returns false when line ends with an exclamation', () => {
    expect(detectTitle('Warning!')).toBe(false);
  });

  it('returns false for very long lines (>8 words)', () => {
    expect(
      detectTitle('This is a very long title that exceeds eight words easily'),
    ).toBe(false);
  });

  it('returns true for a single capitalized word', () => {
    expect(detectTitle('Hello')).toBe(true);
  });

  it('returns false for lines starting with lowercase', () => {
    expect(detectTitle('introduction to topic')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(detectTitle('')).toBe(false);
  });

  it('returns true for exactly 8 word title', () => {
    expect(detectTitle('A B C D E F G H')).toBe(true);
  });

  it('returns false for exactly 9 word title', () => {
    expect(detectTitle('A B C D E F G H I')).toBe(false);
  });

  it('returns false for very long single-word string (no spaces, >80 chars)', () => {
    expect(detectTitle('A'.repeat(81))).toBe(false);
  });
});

describe('groupIntoSlides', () => {
  const MAX_WORDS = 30;

  it('groups sentences under the word limit into one slide', () => {
    const sentences = ['A short sentence.', 'Another short one.', 'Third one.'];
    const slides = groupIntoSlides(sentences, MAX_WORDS);
    expect(slides).toHaveLength(1);
    expect(slides[0].content).toEqual(sentences);
  });

  it('splits into multiple slides when word limit is exceeded', () => {
    const sentences = Array.from(
      { length: 5 },
      () =>
        'This is a ten word sentence that will add up quickly over the limit.',
    );
    const slides = groupIntoSlides(sentences, MAX_WORDS);
    expect(slides.length).toBeGreaterThan(1);
  });

  it('never cuts a sentence mid-way', () => {
    const sentences = [
      'A tiny sentence.',
      'This is a very long sentence that contains many words and should be kept whole even if it exceeds the limit when added.',
      'Another tiny sentence.',
    ];
    const slides = groupIntoSlides(sentences, 10);
    expect(slides).toHaveLength(3);
    expect(slides[0].content).toEqual(['A tiny sentence.']);
    expect(slides[1].content).toEqual([sentences[1]]);
    expect(slides[2].content).toEqual(['Another tiny sentence.']);
  });

  it('promotes title-like sentences to slide title and starts new slide', () => {
    const sentences = [
      'Some introductory content here.',
      'Key Concept',
      'This explains the key concept in detail with many words.',
      'Another detail sentence here.',
    ];
    const slides = groupIntoSlides(sentences, MAX_WORDS);
    expect(slides).toHaveLength(2);
    expect(slides[0].content).toEqual(['Some introductory content here.']);
    expect(slides[0].title).toBeUndefined();
    expect(slides[1].title).toBe('Key Concept');
    expect(slides[1].content).toEqual([
      'This explains the key concept in detail with many words.',
      'Another detail sentence here.',
    ]);
  });

  it('handles consecutive title-like sentences gracefully', () => {
    const sentences = ['First Title', 'Second Title', 'Some content here.'];
    const slides = groupIntoSlides(sentences, MAX_WORDS);
    expect(slides).toHaveLength(2);
    expect(slides[0].title).toBe('First Title');
    expect(slides[0].content).toEqual([]);
    expect(slides[1].title).toBe('Second Title');
    expect(slides[1].content).toEqual(['Some content here.']);
  });

  it('starts with a title as first slide title', () => {
    const sentences = ['Overview', 'Content goes here.'];
    const slides = groupIntoSlides(sentences, MAX_WORDS);
    expect(slides).toHaveLength(1);
    expect(slides[0].title).toBe('Overview');
    expect(slides[0].content).toEqual(['Content goes here.']);
  });

  it('handles empty input', () => {
    expect(groupIntoSlides([], MAX_WORDS)).toEqual([]);
  });

  it('handles all-title input', () => {
    const sentences = ['Title A', 'Title B', 'Title C'];
    const slides = groupIntoSlides(sentences, MAX_WORDS);
    expect(slides).toHaveLength(3);
    expect(slides[0].title).toBe('Title A');
    expect(slides[1].title).toBe('Title B');
    expect(slides[2].title).toBe('Title C');
  });
});

describe('parseSections', () => {
  it('parses ## headings into sections', () => {
    const detail =
      '## Overview\nSome overview content.\n## Details\nSpecific details here.';
    const sections = parseSections(detail);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('Overview');
    expect(sections[0].body).toBe('Some overview content.');
    expect(sections[1].heading).toBe('Details');
    expect(sections[1].body).toBe('Specific details here.');
  });

  it('parses multi-level headings (##, ###, ####)', () => {
    const detail = '## Section 1\nBody 1.\n### Subsection\nBody 2.';
    const sections = parseSections(detail);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe('Section 1');
    expect(sections[1].heading).toBe('Subsection');
  });

  it('handles content before first heading as body without heading', () => {
    const detail = 'Preamble text here.\n## Section\nBody text.';
    const sections = parseSections(detail);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBeUndefined();
    expect(sections[0].body).toBe('Preamble text here.');
    expect(sections[1].heading).toBe('Section');
    expect(sections[1].body).toBe('Body text.');
  });

  it('returns empty for empty string', () => {
    expect(parseSections('')).toEqual([]);
  });

  it('returns a single section with no heading for text without markdown', () => {
    const result = parseSections('Just some plain text.\nNo headers here.');
    expect(result).toHaveLength(1);
    expect(result[0].heading).toBeUndefined();
  });
});

describe('generateSlidesFromLesson', () => {
  const MAX_WORDS = 30;

  it('creates a title slide from lesson title and description', () => {
    const lesson = { title: 'Test Lesson', description: 'A description.' };
    const slides = generateSlidesFromLesson(lesson, MAX_WORDS);
    expect(slides).toHaveLength(1);
    expect(slides[0].slideNumber).toBe(1);
    expect(slides[0].title).toBe('Test Lesson');
    expect(slides[0].content).toBe('A description.');
    expect(slides[0].lessonSection).toBe('title');
  });

  it('creates content slides from detail text', () => {
    const lesson = {
      title: 'Test',
      description: 'Desc.',
      detail: 'First sentence here. Second sentence here. Third sentence here.',
    };
    const slides = generateSlidesFromLesson(lesson, MAX_WORDS);
    expect(slides.length).toBeGreaterThan(1);
    expect(slides[0].lessonSection).toBe('title');
    expect(slides[1].lessonSection).toBe('content');
  });

  it('respects word limit per slide', () => {
    const lesson = {
      title: 'T',
      description: 'D.',
      detail: Array.from({ length: 10 }, () => 'A short sentence.').join(' '),
    };
    const slides = generateSlidesFromLesson(lesson, 20);
    for (const slide of slides) {
      if (slide.lessonSection === 'content') {
        expect(slide.content.split(/\s+/).length).toBeLessThanOrEqual(25);
      }
    }
  });

  it('uses section headings as slide titles when markdown is present', () => {
    const lesson = {
      title: 'Lesson',
      description: 'Desc.',
      detail:
        '## Intro\nIntroduction content here.\n## Core\nCore content here.',
    };
    const slides = generateSlidesFromLesson(lesson, MAX_WORDS);
    const contentSlides = slides.filter((s) => s.lessonSection !== 'title');
    expect(contentSlides).toHaveLength(2);
    expect(contentSlides[0].title).toBe('Intro');
    expect(contentSlides[1].title).toBe('Core');
  });

  it('handles long sections by splitting across multiple slides', () => {
    const lesson = {
      title: 'Lesson',
      description: 'Desc.',
      detail:
        '## Long Section\n' +
        Array.from(
          { length: 10 },
          () => 'This is a short sentence with few words.',
        ).join(' '),
    };
    const slides = generateSlidesFromLesson(lesson, 20);
    const sectionSlides = slides.filter(
      (s) => s.lessonSection === 'long_section',
    );
    expect(sectionSlides.length).toBeGreaterThan(1);
  });

  it('handles lesson with no detail text', () => {
    const lesson = { title: 'No Detail', description: 'Just a description.' };
    const slides = generateSlidesFromLesson(lesson, MAX_WORDS);
    expect(slides).toHaveLength(1);
    expect(slides[0].title).toBe('No Detail');
  });

  it('handles lesson with no description (falls back to title)', () => {
    const lesson = { title: 'Only Title' };
    const slides = generateSlidesFromLesson(lesson, MAX_WORDS);
    expect(slides).toHaveLength(1);
    expect(slides[0].title).toBe('Only Title');
    expect(slides[0].content).toBe('Only Title');
  });

  it('handles very long single sentence without splitting', () => {
    const longSentence = 'A'.repeat(200);
    const lesson = { title: 'T', description: 'D.', detail: longSentence };
    const slides = generateSlidesFromLesson(lesson, MAX_WORDS);
    expect(slides).toHaveLength(2);
    expect(slides[1].content).toBe(longSentence);
  });

  it('produces slides with correct sequential numbering', () => {
    const lesson = {
      title: 'Test',
      description: 'Desc.',
      detail: 'Sentence one. Sentence two. Sentence three. Sentence four.',
    };
    const slides = generateSlidesFromLesson(lesson, 5);
    for (let i = 0; i < slides.length; i++) {
      expect(slides[i].slideNumber).toBe(i + 1);
    }
  });
});
