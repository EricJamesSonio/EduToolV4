import type { SeedStage } from "./SeedProgressDialog";

export interface BuildSeedStagesOptions {
  hasCollege: boolean;
  hasShs: boolean;
  programCalendars?: boolean;
  semesterTemplates?: boolean;
}

export function buildSeedStages(opts: BuildSeedStagesOptions): SeedStage[] {
  const stages: SeedStage[] = [
    { key: "programs", label: "Departments", resultKeys: ["programs"] },
  ];

  if (opts.hasCollege) {
    stages.push({ key: "courses", label: "Courses", resultKeys: ["courses"] });
  }

  if (opts.hasShs) {
    stages.push({ key: "strands", label: "Strands", resultKeys: ["strands"] });
  }

  stages.push(
    { key: "levels", label: "Levels", resultKeys: ["levels"] },
    { key: "sections", label: "Sections", resultKeys: ["sections"] },
    { key: "subjects", label: "Subjects", resultKeys: ["subjects"] },
  );

  if (opts.programCalendars) {
    stages.push({
      key: "programCalendars",
      label: "Academic Calendars",
      resultKeys: ["programCalendars"],
    });
  }

  if (opts.semesterTemplates) {
    stages.push({
      key: "semesterTemplates",
      label: "Semester Templates",
      resultKeys: ["semesterTemplates"],
    });
  }

  return stages;
}