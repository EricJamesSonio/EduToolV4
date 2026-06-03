import type { QuestionType } from "@/types/educator/assessment.types";
import type { LessonConcept } from "@/types/educator/lesson.types";
import type {
  AssessmentSection,
  ConceptContent,
  ConceptItemInfo,
  RangeRow,
} from "./types";

let secIdCounter = 0;

export function makeSection(
  from: number,
  to: number,
  questionType?: QuestionType
): AssessmentSection {
  const base: AssessmentSection = {
    id: `sec-${++secIdCounter}`,
    title: "",
    from,
    to,
    questionType: questionType ?? "multiple_choice",
    selectedItemIndices: [],
  };
  if (questionType === "manual") {
    base.manualMaxScore = 1;
    base.manualQuestionText = "";
  }
  return base;
}

export function defaultSectionTitle(type: QuestionType): string {
  const map: Record<string, string> = {
    multiple_choice: "Multiple Choice Questions",
    true_or_false: "True or False Questions",
    identification: "Identification Questions",
    enumeration: "Enumeration Questions",
    manual: "Manual Questions",
  };
  return map[type] ?? `${type.replace(/_/g, " ")} Questions`;
}

export function getConceptContent(
  concept: LessonConcept | null
): ConceptContent {
  if (!concept?.content)
    return { sections: [], keywords: [], questionCapacity: {}, conceptItems: [] };
  const raw = concept.content as any;
  const items: ConceptItemInfo[] = Array.isArray(raw.concepts)
    ? raw.concepts.map((c: any, i: number) => ({
        index: i,
        name: c.name ?? `Item ${i + 1}`,
        section: c.section ?? "",
        definition: c.definition ?? "",
        difficulty: c.difficulty ?? "medium",
      }))
    : [];
  return {
    sections: Array.isArray(raw.sections) ? raw.sections : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    questionCapacity: raw.questionCapacity ?? {},
    conceptItems: items,
  };
}

export function getSectionsForRanges(
  sections: AssessmentSection[],
  conceptItems: ConceptItemInfo[]
): RangeRow[] {
  return sections
    .filter(
      (sec) =>
        sec.selectedItemIndices.length >= sec.to - sec.from + 1 ||
        sec.questionType === "manual"
    )
    .map((sec) => {
      const selectedConcepts = sec.selectedItemIndices
        .map((idx) => conceptItems[idx])
        .filter(Boolean);
      const uniqueSections = [...new Set(selectedConcepts.map((c) => c.section))];
      return {
        from: sec.from,
        to: sec.to,
        questionType: sec.questionType,
        conceptSections: uniqueSections,
        manualQuestionText:
          sec.questionType === "manual" ? sec.manualQuestionText : undefined,
        manualMaxScore:
          sec.questionType === "manual" ? sec.manualMaxScore : undefined,
      };
    });
}
