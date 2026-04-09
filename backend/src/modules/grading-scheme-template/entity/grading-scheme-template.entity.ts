
import { ComponentType } from '@/modules/grading-scheme/dto/grading-scheme.dto';

export class GradingSchemeTemplateComponentEntity {
  id!: string;
  orgId!: string;
  templateId!: string;
  name!: string;
  type!: ComponentType;
  weight!: number;
  maxScore!: number | null;
}

export class GradingSchemeTemplateEntity {
  id!: string;
  orgId!: string;
  name!: string;
  programType!: string | null;
  createdAt!: Date;
  components!: GradingSchemeTemplateComponentEntity[];
}