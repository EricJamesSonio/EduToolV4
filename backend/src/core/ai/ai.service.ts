import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConceptSection {
  name: string;
  summary?: string;
  questionCapacity: number;
}

export interface ConceptItem {
  name: string;
  section: string;
  definition: string;
  properties: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ConceptBuild {
  sections: string[];
  keywords: string[];
  questionCapacity: Record<string, number>;
  concepts: ConceptItem[];
}

export interface ConceptExtractResult {
  conceptBuild: ConceptBuild;
  rawResponse: string;
  rawRequest: string;
  promptVersion: string;
}

export interface QuestionBlueprint {
  type: 'identification' | 'true_false' | 'multiple_choice' | 'essay' | 'enumeration';
  sections: string[];
  numbers: string; // e.g. "1-5"
  count: number;
}

export interface GeneratedQuestion {
  number: number;
  type: string;
  section: string;
  question: string;
  answer?: string;
  choices?: string[];
  correct_answer?: string;
}

export interface GenerationProgress {
  status: 'generating' | 'completed' | 'failed';
  message: string;
  chunksTotal: number;
  chunksDone: number;
  currentChunk?: string;
  error?: string;
}

// ── Token budget constants (matching Python pipeline) ─────────────────────────

const TOKEN_COST: Record<string, number> = {
  identification: 120,
  true_false: 80,
  multiple_choice: 280,
  enumeration: 150,
  essay: 100,
};
const SAFE_OUTPUT_BUDGET = 1000;
const ENVELOPE_OVERHEAD = 20;

// ── Prompt versions ───────────────────────────────────────────────────────────

const CONCEPT_EXTRACT_PROMPT_VERSION = 'concept-extract-v1';
const CONCEPT_BUILD_PROMPT_VERSION = 'concept-build-v1';

// ── System prompts ────────────────────────────────────────────────────────────

const CONCEPT_SYSTEM = `You are an educational content analyzer. Return ONLY valid JSON exactly matching the requested schema. No markdown.`;

const CONCEPT_BUILD_SYSTEM = `You are a curriculum design expert. Return ONLY valid JSON exactly matching the requested schema. No markdown.`;

const QUESTION_SYSTEM = `You are an assessment question generator. Return ONLY valid JSON. All strings must be properly closed. No markdown. No explanation. No trailing commas.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY') ?? '';
    this.model = this.config.get<string>('AI_MODEL') ?? 'qwen/qwen3-235b-a22b:free';
  }

  // ── Core caller ─────────────────────────────────────────────────────────────

  async callAi(
    systemPrompt: string,
    userPrompt: string,
    maxTokens = 2000,
    temperature = 0.3,
    signal?: AbortSignal,
  ): Promise<string> {
    this.logger.log(`[AI] Calling model: ${this.model} | max_tokens: ${maxTokens} | temp: ${temperature}`);

    const response = await fetch(this.apiUrl, {
      signal,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'EduTool AI',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`OpenRouter error: ${data.error?.message ?? JSON.stringify(data.error)}`);
    }

    const content: string = data?.choices?.[0]?.message?.content ?? '';
    this.logger.log(`[AI] Response received (${content.length} chars)`);
    return content;
  }

  // ── JSON parser (handles markdown fences + truncated JSON repair) ──────────

  parseJson<T = any>(raw: string): T {
    let text = raw.trim();

    // Strip ```json ... ``` or ``` ... ``` fences
    if (text.startsWith('```')) {
      const lines = text.split('\n').slice(1);
      if (lines.at(-1)?.trim() === '```') lines.pop();
      text = lines.join('\n').trim();
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      // Fallback: extract first { ... }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(text.slice(start, end)) as T;
        } catch {
          // try repairing truncated JSON
        }
      }

      // Last resort: repair truncated JSON by closing unclosed brackets/strings
      if (start !== -1) {
        const repaired = this.repairTruncatedJson(text.slice(start));
        try {
          const result = JSON.parse(repaired) as T;
          this.logger.warn(`[Parse] Repaired truncated JSON successfully (${text.length} → ${repaired.length} chars)`);
          return result;
        } catch {
          // fall through to error
        }
      }

      throw new Error(`Could not parse AI response as JSON. Raw (first 500): ${text.slice(0, 500)}`);
    }
  }

  private repairTruncatedJson(s: string): string {
    // Close unclosed strings
    let result = s;
    const stack: string[] = [];
    let inString = false;
    let escape = false;
    for (let i = 0; i < result.length; i++) {
      const ch = result[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{' || ch === '[') stack.push(ch);
      else if (ch === '}') { if (stack.length && stack[stack.length - 1] === '{') stack.pop(); }
      else if (ch === ']') { if (stack.length && stack[stack.length - 1] === '[') stack.pop(); }
    }
    // Close unclosed string
    if (inString) result += '"';
    // Close unclosed brackets in reverse order
    for (let i = stack.length - 1; i >= 0; i--) {
      result += stack[i] === '{' ? '}' : ']';
    }
    return result;
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  private validateConceptBuild(build: ConceptBuild): void {
    if (!build.sections.length) {
      throw new Error('Validation failed: at least one section is required');
    }
    if (!build.concepts.length) {
      throw new Error('Validation failed: at least one concept is required');
    }

    for (const sec of build.sections) {
      if (!sec.trim()) {
        throw new Error('Validation failed: section name cannot be empty');
      }
    }

    for (const cap of Object.values(build.questionCapacity)) {
      if (typeof cap !== 'number' || cap <= 0) {
        throw new Error('Validation failed: question capacities must be positive numbers');
      }
    }

    const seenNames = new Set<string>();
    for (const c of build.concepts) {
      if (!c.name.trim()) {
        throw new Error('Validation failed: concept name cannot be empty');
      }
      if (seenNames.has(c.name)) {
        throw new Error(`Validation failed: duplicate concept "${c.name}"`);
      }
      seenNames.add(c.name);

      if (!build.sections.includes(c.section)) {
        throw new Error(
          `Validation failed: concept "${c.name}" references unknown section "${c.section}"`,
        );
      }
    }
  }

  // ── Concept extraction (lightweight, called on lesson create/update) ────────

  async extractConcepts(lessonDetail: string): Promise<ConceptExtractResult> {
    const prompt = `Analyze this lesson and extract teachable concepts.

Lesson: ${lessonDetail}

Return ONLY this JSON (no markdown, no explanation):
{
  "sections": ["Section Name 1", "Section Name 2"],
  "keywords": ["keyword1", "keyword2"],
  "question_capacity": {"Section Name 1": 10, "Section Name 2": 8},
  "concepts": [
    {
      "name": "Concept Name",
      "section": "Section Name",
      "definition": "One-sentence definition",
      "properties": ["property1", "property2"],
      "difficulty": "easy"
    }
  ]
}

Rules:
- sections = main topic headings in the lesson
- question_capacity = how many questions each section can support (must be positive integers)
- difficulty = easy, medium, or hard
- Do NOT create duplicate concept names
- Return JSON ONLY. Start with { end with }`;

    const raw = await this.callAi(CONCEPT_SYSTEM, prompt, 2000, 0.2);
    const parsed = this.parseJson<any>(raw);

    // Normalise + apply defaults (mirrors parse_concept_response)
    const sections: string[] = parsed.sections ?? [];
    const keywords: string[] = parsed.keywords ?? [];
    const concepts: ConceptItem[] = (parsed.concepts ?? []).map((c: any, i: number) => ({
      name: c.name ?? `Concept ${i + 1}`,
      section: c.section ?? sections[0] ?? 'General',
      definition: c.definition ?? '',
      properties: c.properties ?? [],
      difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium',
    }));

    let questionCapacity: Record<string, number> = parsed.question_capacity ?? {};
    if (!Object.keys(questionCapacity).length) {
      questionCapacity = Object.fromEntries(sections.map((s) => [s, 10]));
    } else {
      for (const s of sections) {
        questionCapacity[s] ??= 10;
      }
    }

    const conceptBuild: ConceptBuild = { sections, keywords, questionCapacity, concepts };

    this.validateConceptBuild(conceptBuild);

    this.logger.log(
      `[Concept] Extracted ${sections.length} sections, ${concepts.length} concepts`,
    );

    return {
      conceptBuild,
      rawResponse: raw,
      rawRequest: prompt,
      promptVersion: CONCEPT_EXTRACT_PROMPT_VERSION,
    };
  }

  // ── Concept build (full pipeline: concept intelligence) ─────────────────────

  async buildConcepts(lessonDetail: string): Promise<ConceptExtractResult> {
    const prompt = `You are a curriculum design expert. Analyze this lesson and produce a structured concept intelligence model.

Lesson:
${lessonDetail}

Organize the content into logical sections. For each section, identify:
- The key concepts that must be taught
- How many assessment questions each section can support

Return ONLY this JSON (no markdown, no explanation):
{
  "sections": ["Section Name 1", "Section Name 2"],
  "keywords": ["keyword1", "keyword2"],
  "question_capacity": {"Section Name 1": 10, "Section Name 2": 8},
  "concepts": [
    {
      "name": "Concept Name",
      "section": "Section Name",
      "definition": "One-sentence definition",
      "properties": ["property1", "property2"],
      "difficulty": "easy"
    }
  ]
}

Rules:
- sections = logical topic groupings taken from the lesson
- Each section MUST have at least one concept
- question_capacity values MUST be positive integers (total questions that section can support)
- difficulty must be exactly "easy", "medium", or "hard"
- concept names must be unique — no duplicates
- Return JSON ONLY. Start with { end with }`;

    const raw = await this.callAi(CONCEPT_BUILD_SYSTEM, prompt, 2500, 0.2);
    const parsed = this.parseJson<any>(raw);

    const sections: string[] = parsed.sections ?? [];
    const keywords: string[] = parsed.keywords ?? [];
    const concepts: ConceptItem[] = (parsed.concepts ?? []).map((c: any, i: number) => ({
      name: c.name ?? `Concept ${i + 1}`,
      section: c.section ?? sections[0] ?? 'General',
      definition: c.definition ?? '',
      properties: c.properties ?? [],
      difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium',
    }));

    let questionCapacity: Record<string, number> = parsed.question_capacity ?? {};
    if (!Object.keys(questionCapacity).length) {
      questionCapacity = Object.fromEntries(sections.map((s) => [s, 10]));
    } else {
      for (const s of sections) {
        questionCapacity[s] ??= 10;
      }
    }

    const conceptBuild: ConceptBuild = { sections, keywords, questionCapacity, concepts };

    this.validateConceptBuild(conceptBuild);

    this.logger.log(
      `[ConceptBuild] Built ${sections.length} sections, ${concepts.length} concepts`,
    );

    return {
      conceptBuild,
      rawResponse: raw,
      rawRequest: prompt,
      promptVersion: CONCEPT_BUILD_PROMPT_VERSION,
    };
  }

  // ── Question generation ──────────────────────────────────────────────────────

  async generateQuestions(
    lessonDetail: string,
    blueprints: QuestionBlueprint[],
    onProgress?: (progress: GenerationProgress) => void,
    signal?: AbortSignal,
    conceptBuild?: ConceptBuild,
  ): Promise<GeneratedQuestion[]> {
    // 1. Expand each blueprint into token-safe chunks
    const allChunks: QuestionBlueprint[] = [];
    for (const bp of blueprints) {
      allChunks.push(...this.splitByTokenBudget(bp));
    }

    const total = allChunks.length;
    this.logger.log(`[Generate] ${blueprints.length} blueprints → ${total} chunks`);

    // Compress lesson to concept summary if available (avoids sending full lesson per chunk)
    const compressedLesson = conceptBuild
      ? this.compressLesson(lessonDetail, conceptBuild)
      : lessonDetail;

    // 2. Process chunks sequentially (free model can't handle concurrent requests)
    const CHUNK_DELAY_MS = 1000;
    const allQuestions: GeneratedQuestion[] = [];

    for (let i = 0; i < total; i++) {
      if (signal?.aborted) {
        this.logger.warn(`[Generate] Cancelled by user`);
        throw new Error('Generation cancelled by user');
      }

      const chunk = allChunks[i];
      onProgress?.({
        status: 'generating',
        message: `Generating questions ${chunk.numbers}... (${i + 1}/${total})`,
        chunksTotal: total,
        chunksDone: i,
        currentChunk: chunk.numbers,
      });

      try {
        const result = await this.generateChunk(compressedLesson, chunk);
        allQuestions.push(...result);
      } catch (err) {
        this.logger.error(`[Generate] Chunk ${chunk.numbers} failed: ${err}`);
        onProgress?.({
          status: 'failed',
          message: `Failed: chunk ${chunk.numbers} — ${err}`,
          chunksTotal: total,
          chunksDone: i,
          currentChunk: chunk.numbers,
          error: String(err),
        });
        throw new Error(`Question generation failed:\nChunk ${chunk.numbers}: ${err}`);
      }

      // Pause between chunks (not after the last one)
      if (i < total - 1) {
        await new Promise((res) => setTimeout(res, CHUNK_DELAY_MS));
      }
    }

    allQuestions.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    this.logger.log(`[Generate] Complete — ${allQuestions.length} questions`);
    onProgress?.({
      status: 'completed',
      message: `Generated ${allQuestions.length} questions`,
      chunksTotal: total,
      chunksDone: total,
    });
    return allQuestions;
  }

  // ── Private: compress lesson using concept data ───────────────────────────────

  private compressLesson(fullLesson: string, conceptBuild: ConceptBuild): string {
    const sections = conceptBuild.sections
      .map((s) => {
        const concepts = conceptBuild.concepts
          .filter((c) => c.section === s)
          .map((c) => `- ${c.name}: ${c.definition}`)
          .join('\n');
        return `[${s}]\n${concepts || '  (no concepts)'}`;
      })
      .join('\n\n');

    const keywords = conceptBuild.keywords.join(', ');

    return `=== CONCEPT SUMMARY ===
Keywords: ${keywords}

${sections}
=== END SUMMARY ===`;
  }

  // ── Private: token-budget splitter ───────────────────────────────────────────

  private splitByTokenBudget(bp: QuestionBlueprint): QuestionBlueprint[] {
    const [startStr, endStr] = bp.numbers.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    const costPerQ = TOKEN_COST[bp.type] ?? 150;
    const maxPerChunk = Math.max(1, Math.floor((SAFE_OUTPUT_BUDGET - ENVELOPE_OVERHEAD) / costPerQ));

    const chunks: QuestionBlueprint[] = [];
    let cursor = start;
    while (cursor <= end) {
      const chunkEnd = Math.min(cursor + maxPerChunk - 1, end);
      chunks.push({
        ...bp,
        numbers: `${cursor}-${chunkEnd}`,
        count: chunkEnd - cursor + 1,
      });
      cursor = chunkEnd + 1;
    }

    if (chunks.length > 1) {
      this.logger.log(
        `[Split] ${bp.numbers} (${bp.type}) → ${chunks.length} chunks`,
      );
    }

    return chunks;
  }

  // ── Private: single chunk generation with retries ────────────────────────────

  private async generateChunk(
    lessonDetail: string,
    chunk: QuestionBlueprint,
    maxRetries = 4,
    onRetry?: (attempt: number, maxRetries: number, err: string) => void,
    signal?: AbortSignal,
  ): Promise<GeneratedQuestion[]> {
    const { type, sections, numbers, count } = chunk;
    const [startStr] = numbers.split('-');
    const startNum = parseInt(startStr, 10);
    const numList = Array.from({ length: count }, (_, i) => startNum + i);

    const maxTokens = Math.min(
      (TOKEN_COST[type] ?? 150) * count + ENVELOPE_OVERHEAD + 50,
      1200,
    );

    const prompt = this.buildChunkPrompt(lessonDetail, type, sections, numbers, count, numList);

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) throw new Error('Generation cancelled by user');
      try {
        const raw = await this.callAi(QUESTION_SYSTEM, prompt, maxTokens, 0.5, signal);
        if (!raw?.trim()) throw new Error('Empty response from AI');

        let data: { questions: any[] } | null = null;
        try {
          data = this.parseJson<{ questions: any[] }>(raw);
        } catch (parseErr) {
          this.logger.warn(`[Chunk ${numbers}] Attempt ${attempt}/${maxRetries} parse failed. Full raw (${raw.length} chars): ${raw}`);
          throw parseErr;
        }
        const questions: any[] = data?.questions;

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error(`'questions' missing or empty`);
        }
        if (typeof questions[0] !== 'object') {
          throw new Error('AI returned plain strings instead of question objects');
        }

        this.logger.log(`[Chunk ${numbers}] ✓ ${questions.length} questions`);
        return questions as GeneratedQuestion[];
      } catch (err) {
        lastError = err;
        this.logger.warn(`[Chunk ${numbers}] Attempt ${attempt}/${maxRetries} failed`);
        onRetry?.(attempt, maxRetries, String(err));

        if (attempt < maxRetries) {
          const isRateLimit = String(err).includes('429');
          const delay = isRateLimit ? 65_000 : 4_000 + Math.random() * 3_000;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    throw new Error(`Chunk ${numbers} failed after ${maxRetries} attempts: ${lastError}`);
  }

  // ── Private: prompt builders ─────────────────────────────────────────────────

  private buildChunkPrompt(
    lessonDetail: string,
    type: string,
    sections: string[],
    numbers: string,
    count: number,
    numList: number[],
  ): string {
    const exampleAndRules: Record<string, { example: string; rules: string }> = {
      identification: {
        example: `{"number": N, "type": "identification", "section": "...", "question": "...", "answer": "short correct answer"}`,
        rules: '"answer" must be a short specific correct answer, not empty',
      },
      multiple_choice: {
        example: `{"number": N, "type": "multiple_choice", "section": "...", "question": "...", "choices": ["Option A", "Option B", "Option C", "Option D"], "correct_answer": "Option A"}`,
        rules: '"choices" must be exactly 4 options. "correct_answer" must exactly match one of the 4 choices',
      },
      true_false: {
        example: `{"number": N, "type": "true_false", "section": "...", "question": "...", "answer": "True"}`,
        rules: '"answer" must be exactly "True" or "False" — nothing else',
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

    const { example, rules } = exampleAndRules[type] ?? exampleAndRules.identification;

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
}
