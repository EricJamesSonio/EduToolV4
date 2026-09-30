import type { AiQuestionType } from './types';

/**
 * Per-type JSON example + rules for the chunk prompt.
 *
 * TICK-ASSESS-005: keyed by `AiQuestionType`, so a key can no longer silently
 * miss. `true_false` → `true_or_false` is the fix for the T/F bug: the old key
 * never matched what the wizard sent, and the `?? identification` fallback below
 * quietly generated identification-shaped questions for a True/False section.
 */
const EXAMPLE_AND_RULES: Record<
  AiQuestionType,
  { example: string; rules: string }
> = {
  identification: {
    example: `{"number": N, "type": "identification", "section": "...", "question": "...", "answer": "short correct answer"}`,
    rules: '"answer" must be a short specific correct answer, not empty',
  },
  multiple_choice: {
    example: `{"number": N, "type": "multiple_choice", "section": "...", "question": "...", "choices": ["Option A", "Option B", "Option C", "Option D"], "correct_answer": "Option A"}`,
    rules:
      '"choices" must be exactly 4 options. "correct_answer" must exactly match one of the 4 choices',
  },
  true_or_false: {
    example: `{"number": N, "type": "true_or_false", "section": "...", "question": "...", "answer": "True"}`,
    rules:
      '"answer" must be exactly "True" or "False" — nothing else. Do NOT include a "choices" or "correct_answer" field',
  },
  essay: {
    example: `{"number": N, "type": "essay", "section": "...", "question": "..."}`,
    rules: 'Essay questions have no answer field',
  },
  enumeration: {
    example: `{"number": N, "type": "enumeration", "section": "...", "question": "List the ...", "answer": "item1, item2, item3"}`,
    rules: '"answer" must be a comma-separated list of correct items',
  },
};

export function buildChunkPrompt(
  lessonDetail: string,
  type: AiQuestionType,
  sections: string[],
  numbers: string,
  count: number,
  numList: number[],
): string {
  const spec = EXAMPLE_AND_RULES[type];

  // TICK-ASSESS-005: throw instead of `?? exampleAndRules.identification`.
  // The silent fallback is what turned a True/False section into
  // identification-shaped output that the UI then rendered as Multiple Choice.
  // Failing loudly here surfaces any future drift at the call site rather than
  // as a mysteriously wrong assessment weeks later.
  if (!spec) {
    throw new Error(
      `No prompt format defined for question type "${type}". Known types: ${Object.keys(EXAMPLE_AND_RULES).join(', ')}`,
    );
  }

  const { example, rules } = spec;

  return `Generate exactly ${count} ${type} questions from the lesson below.
Use ONLY content from these sections: ${sections.join(', ')}
Number the questions: ${JSON.stringify(numList)}

=== LESSON ===
${lessonDetail}
=== END LESSON ===

Each question MUST be a JSON object in this exact format:
${example}

IMPORTANT RULES:
- Every item in "questions" must be a JSON object — NOT a plain string
- Generate exactly ${count} questions numbered ${numList[0]} to ${numList.at(-1)}
- Use ONLY the sections listed above
- Do NOT repeat questions
- ${rules}

Return ONLY valid JSON. Start with { and end with }. No markdown. No explanation:
{"questions": [/* exactly ${count} question objects here */]}`;
}
