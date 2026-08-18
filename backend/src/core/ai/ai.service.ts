import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from './ai-client.service';
import { parseJson } from './json-parser.util';
import { validateConceptBuild } from './concept-validator.util';
import { buildChunkPrompt } from './prompt-builder.util';
import {
  TOKEN_COST,
  SAFE_OUTPUT_BUDGET,
  ENVELOPE_OVERHEAD,
  CONCEPT_SYSTEM,
  CONCEPT_BUILD_SYSTEM,
  QUESTION_SYSTEM,
  CONCEPT_EXTRACT_PROMPT_VERSION,
  CONCEPT_BUILD_PROMPT_VERSION,
} from './constants';
import type {
  ConceptBuild,
  ConceptItem,
  ConceptExtractResult,
  QuestionBlueprint,
  GeneratedQuestion,
  GenerationProgress,
} from './types';

export type {
  ConceptSection,
  ConceptItem,
  ConceptBuild,
  ConceptExtractResult,
  QuestionBlueprint,
  GeneratedQuestion,
  GenerationProgress,
} from './types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly aiClient: AiClientService) {}

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

    const raw = await this.aiClient.callAi(CONCEPT_SYSTEM, prompt, 2000, 0.2);
    const parsed = parseJson<any>(raw);

    const sections: string[] = parsed.sections ?? [];
    const keywords: string[] = parsed.keywords ?? [];
    const concepts: ConceptItem[] = (parsed.concepts ?? []).map(
      (c: any, i: number) => ({
        name: c.name ?? `Concept ${i + 1}`,
        section: c.section ?? sections[0] ?? 'General',
        definition: c.definition ?? '',
        properties: c.properties ?? [],
        difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty)
          ? c.difficulty
          : 'medium',
      }),
    );

    let questionCapacity: Record<string, number> =
      parsed.question_capacity ?? {};
    if (!Object.keys(questionCapacity).length) {
      questionCapacity = Object.fromEntries(sections.map((s) => [s, 10]));
    } else {
      for (const s of sections) {
        questionCapacity[s] ??= 10;
      }
    }

    const conceptBuild: ConceptBuild = {
      sections,
      keywords,
      questionCapacity,
      concepts,
    };

    validateConceptBuild(conceptBuild);

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

    const raw = await this.aiClient.callAi(
      CONCEPT_BUILD_SYSTEM,
      prompt,
      2500,
      0.2,
    );
    const parsed = parseJson<any>(raw);

    const sections: string[] = parsed.sections ?? [];
    const keywords: string[] = parsed.keywords ?? [];
    const concepts: ConceptItem[] = (parsed.concepts ?? []).map(
      (c: any, i: number) => ({
        name: c.name ?? `Concept ${i + 1}`,
        section: c.section ?? sections[0] ?? 'General',
        definition: c.definition ?? '',
        properties: c.properties ?? [],
        difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty)
          ? c.difficulty
          : 'medium',
      }),
    );

    let questionCapacity: Record<string, number> =
      parsed.question_capacity ?? {};
    if (!Object.keys(questionCapacity).length) {
      questionCapacity = Object.fromEntries(sections.map((s) => [s, 10]));
    } else {
      for (const s of sections) {
        questionCapacity[s] ??= 10;
      }
    }

    const conceptBuild: ConceptBuild = {
      sections,
      keywords,
      questionCapacity,
      concepts,
    };

    validateConceptBuild(conceptBuild);

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
    const allChunks: QuestionBlueprint[] = [];
    for (const bp of blueprints) {
      allChunks.push(...this.splitByTokenBudget(bp));
    }

    const total = allChunks.length;
    this.logger.log(
      `[Generate] ${blueprints.length} blueprints → ${total} chunks`,
    );

    const compressedLesson = conceptBuild
      ? this.compressLesson(lessonDetail, conceptBuild)
      : lessonDetail;

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
        const result = await this.generateChunk(
          compressedLesson,
          chunk,
          4,
          undefined,
          signal,
        );
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
        throw new Error(
          `Question generation failed:\nChunk ${chunk.numbers}: ${err}`,
        );
      }

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

  private compressLesson(
    fullLesson: string,
    conceptBuild: ConceptBuild,
  ): string {
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
    const maxPerChunk = Math.max(
      1,
      Math.floor((SAFE_OUTPUT_BUDGET - ENVELOPE_OVERHEAD) / costPerQ),
    );

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

    const prompt = buildChunkPrompt(
      lessonDetail,
      type,
      sections,
      numbers,
      count,
      numList,
    );

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) throw new Error('Generation cancelled by user');
      try {
        const raw = await this.aiClient.callAi(
          QUESTION_SYSTEM,
          prompt,
          maxTokens,
          0.5,
          signal,
        );
        if (!raw?.trim()) throw new Error('Empty response from AI');

        let data: { questions: any[] } | null = null;
        try {
          data = parseJson<{ questions: any[] }>(raw);
        } catch (parseErr) {
          this.logger.warn(
            `[Chunk ${numbers}] Attempt ${attempt}/${maxRetries} parse failed. Full raw (${raw.length} chars): ${raw}`,
          );
          throw parseErr;
        }
        const questions: any[] = data?.questions;

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error(`'questions' missing or empty`);
        }
        if (typeof questions[0] !== 'object') {
          throw new Error(
            'AI returned plain strings instead of question objects',
          );
        }

        this.logger.log(`[Chunk ${numbers}] ✓ ${questions.length} questions`);
        return questions as GeneratedQuestion[];
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `[Chunk ${numbers}] Attempt ${attempt}/${maxRetries} failed`,
        );
        onRetry?.(attempt, maxRetries, String(err));

        if (attempt < maxRetries) {
          const isRateLimit = String(err).includes('429');
          const delay = isRateLimit ? 65_000 : 4_000 + Math.random() * 3_000;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    throw new Error(
      `Chunk ${numbers} failed after ${maxRetries} attempts: ${lastError}`,
    );
  }
}
