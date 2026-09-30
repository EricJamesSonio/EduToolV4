export const TOKEN_COST: Record<string, number> = {
  identification: 120,
  // TICK-ASSESS-005: this was `true_false` while the wizard/DTO/frontend/DB all
  // used `true_or_false`, so `TOKEN_COST['true_or_false']` missed and silently
  // fell back to 150 — wrong chunk sizing and `maxTokens` for every T/F chunk.
  true_or_false: 80,
  multiple_choice: 280,
  enumeration: 150,
  essay: 100,
};

export const SAFE_OUTPUT_BUDGET = 1000;
export const ENVELOPE_OVERHEAD = 20;

export const CONCEPT_EXTRACT_PROMPT_VERSION = 'concept-extract-v1';
export const CONCEPT_BUILD_PROMPT_VERSION = 'concept-build-v1';

export const CONCEPT_SYSTEM = `You are an educational content analyzer. Return ONLY valid JSON exactly matching the requested schema. No markdown.`;

export const CONCEPT_BUILD_SYSTEM = `You are a curriculum design expert. Return ONLY valid JSON exactly matching the requested schema. No markdown.`;

export const QUESTION_SYSTEM = `You are an assessment question generator. Return ONLY valid JSON. All strings must be properly closed. No markdown. No explanation. No trailing commas.`;
