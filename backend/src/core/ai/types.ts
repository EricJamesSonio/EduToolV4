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

/**
 * Question types the AI generator can produce.
 *
 * TICK-ASSESS-005: these must stay spelled identically to
 * `QUESTION_TYPES` in `modules/assessment/dto/assessment.dto.ts` and to the
 * frontend `QuestionType` union. The values previously used `true_false` while
 * every other layer used `true_or_false`; because the call site used an
 * unchecked `as QuestionBlueprint['type']` cast, the mismatch compiled fine and
 * then failed at runtime by missing the prompt-builder lookup and silently
 * falling back to the `identification` format. Use `toBlueprintType()` to
 * convert instead of casting.
 */
export type AiQuestionType =
  | 'identification'
  | 'true_or_false'
  | 'multiple_choice'
  | 'essay'
  | 'enumeration';

export interface QuestionBlueprint {
  type: AiQuestionType;
  sections: string[];
  numbers: string;
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
