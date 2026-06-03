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
