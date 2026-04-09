// ===== File: src/types/admin/grading-scheme-template.types.ts =====
import { ComponentType } from './grading-scheme.types';

export interface GradingSchemeTemplateComponent {
  id: string;
  orgId: string;
  templateId: string;
  name: string;
  type: ComponentType;
  weight: number;
  maxScore?: number | null;
  createdAt: string;
}

export interface GradingSchemeTemplate {
  id: string;
  orgId: string;
  name: string;
  programType?: string | null; // optional: "college" | "shs" | "jhs" etc
  createdAt: string;
  components: GradingSchemeTemplateComponent[];
}

export interface CreateGradingSchemeTemplateDto {
  name: string;
  programType?: string;
  components: Array<{
    name: string;
    type: ComponentType;
    weight: number;
    maxScore?: number | null;
  }>;
}

export interface ApplyTemplateToClassDto {
  classId: string;
  templateId: string;
  name?: string; // optional: override template name
}