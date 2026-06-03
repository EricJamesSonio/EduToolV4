export interface GradeRange {
  label:      string
  minScore:   number
  maxScore:   number
  gradeValue: string
}

export interface GradingScalePreset {
  key:    string
  name:   string
  ranges: GradeRange[]
}

export const GRADING_SCALE_PRESETS: GradingScalePreset[] = [
  {
    key:  "deped_k12",
    name: "DepEd K–12 (Proficiency-Based)",
    ranges: [
      { label: "Outstanding",              minScore: 90, maxScore: 100, gradeValue: "A"  },
      { label: "Very Satisfactory",        minScore: 85, maxScore: 89,  gradeValue: "B+" },
      { label: "Satisfactory",             minScore: 80, maxScore: 84,  gradeValue: "B"  },
      { label: "Fairly Satisfactory",      minScore: 75, maxScore: 79,  gradeValue: "C"  },
      { label: "Did Not Meet Expectation", minScore: 0,  maxScore: 74,  gradeValue: "F"  },
    ],
  },
  {
    key:  "college_5pt",
    name: "College 5-Point Scale (CHED)",
    ranges: [
      { label: "Excellent",         minScore: 97, maxScore: 100, gradeValue: "1.00" },
      { label: "Superior",          minScore: 94, maxScore: 96,  gradeValue: "1.25" },
      { label: "Very Good",         minScore: 91, maxScore: 93,  gradeValue: "1.50" },
      { label: "Good",              minScore: 88, maxScore: 90,  gradeValue: "1.75" },
      { label: "Meritorious",       minScore: 85, maxScore: 87,  gradeValue: "2.00" },
      { label: "Very Satisfactory", minScore: 82, maxScore: 84,  gradeValue: "2.25" },
      { label: "Satisfactory",      minScore: 79, maxScore: 81,  gradeValue: "2.50" },
      { label: "Fairly Good",       minScore: 76, maxScore: 78,  gradeValue: "2.75" },
      { label: "Passing",           minScore: 75, maxScore: 75,  gradeValue: "3.00" },
      { label: "Failure",           minScore: 0,  maxScore: 74,  gradeValue: "5.00" },
    ],
  },
  {
    key:  "letter_grade",
    name: "Standard Letter Grade (A–F)",
    ranges: [
      { label: "A+", minScore: 97, maxScore: 100, gradeValue: "A+" },
      { label: "A",  minScore: 93, maxScore: 96,  gradeValue: "A"  },
      { label: "A−", minScore: 90, maxScore: 92,  gradeValue: "A−" },
      { label: "B+", minScore: 87, maxScore: 89,  gradeValue: "B+" },
      { label: "B",  minScore: 83, maxScore: 86,  gradeValue: "B"  },
      { label: "B−", minScore: 80, maxScore: 82,  gradeValue: "B−" },
      { label: "C+", minScore: 77, maxScore: 79,  gradeValue: "C+" },
      { label: "C",  minScore: 73, maxScore: 76,  gradeValue: "C"  },
      { label: "C−", minScore: 70, maxScore: 72,  gradeValue: "C−" },
      { label: "D",  minScore: 60, maxScore: 69,  gradeValue: "D"  },
      { label: "F",  minScore: 0,  maxScore: 59,  gradeValue: "F"  },
    ],
  },
  {
    key:  "pass_fail",
    name: "Pass / Fail",
    ranges: [
      { label: "Pass", minScore: 75, maxScore: 100, gradeValue: "P" },
      { label: "Fail", minScore: 0,  maxScore: 74,  gradeValue: "F" },
    ],
  },
]
