import type { Level } from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";
import type { Section } from "@/types/admin/section.types";

export interface ScopeSelection {
  programIds: string[];
  courseIds: string[];
  strandIds: string[];
  sectionIds: string[];
}

/** Minimal subject shape the scope math needs. */
export interface ScopeSubject {
  id: string;
  programId: string;
  courseId: string | null;
  strandId: string | null;
}

export interface ScopeLevelGroup {
  id: string;
  name: string;
  courseId: string | null;
  strandId: string | null;
  sections: Pick<Section, "id" | "name">[];
}

export interface ScopeCourseGroup {
  id: string;
  name: string;
  /** course | strand, or null when levels attach directly to the program. */
  kind: "course" | "strand" | null;
  levels: ScopeLevelGroup[];
}

export interface ScopeDepartment {
  id: string;
  name: string;
  groups: ScopeCourseGroup[];
}

/**
 * Department → course/strand (when the program has any) → level → section.
 * Sections hang under their level by level_id; the course/strand of a group
 * comes from the level, mirroring how the admin hierarchy pages organize
 * the same data. Selection state lives in the caller — this only shapes.
 */
export function buildScopeTree(
  programs: Program[],
  levels: Level[],
  sections: Pick<Section, "id" | "name" | "level_id">[],
): ScopeDepartment[] {
  const sectionsByLevel = new Map<string, Pick<Section, "id" | "name">[]>();
  for (const s of sections) {
    const list = sectionsByLevel.get(s.level_id) ?? [];
    list.push({ id: s.id, name: s.name });
    sectionsByLevel.set(s.level_id, list);
  }

  return programs.map((p) => {
    const programLevels = levels.filter((l) => l.program_id === p.id);
    const hasCourses = (p.courses ?? []).length > 0;
    const hasStrands = (p.strands ?? []).length > 0;
    const useGroups = hasCourses || hasStrands;

    const toLevelGroup = (l: Level): ScopeLevelGroup => ({
      id: l.id,
      name: l.name,
      courseId: l.course_id ?? null,
      strandId: l.strand_id ?? null,
      sections: sectionsByLevel.get(l.id) ?? [],
    });

    if (!useGroups) {
      return {
        id: p.id,
        name: p.name,
        groups: [
          {
            id: `${p.id}:direct`,
            name: p.name,
            kind: null,
            levels: programLevels.map(toLevelGroup),
          },
        ],
      };
    }

    const groupOrder: ScopeCourseGroup[] = [];
    const groupById = new Map<string, ScopeCourseGroup>();
    const groupFor = (
      id: string,
      name: string,
      kind: "course" | "strand",
    ): ScopeCourseGroup => {
      let g = groupById.get(id);
      if (!g) {
        g = { id, name, kind, levels: [] };
        groupById.set(id, g);
        groupOrder.push(g);
      }
      return g;
    };

    for (const l of programLevels) {
      if (l.course_id) {
        const c = (p.courses ?? []).find((c) => c.id === l.course_id);
        groupFor(l.course_id, c?.name ?? "Course", "course").levels.push(
          toLevelGroup(l),
        );
      } else if (l.strand_id) {
        const s = (p.strands ?? []).find((s) => s.id === l.strand_id);
        groupFor(l.strand_id, s?.name ?? "Strand", "strand").levels.push(
          toLevelGroup(l),
        );
      } else {
        // Level without a course/strand in a grouped program: keep it
        // visible under its own heading rather than dropping it.
        groupFor(
          `${p.id}:other`,
          "Other levels",
          hasCourses ? "course" : "strand",
        ).levels.push(toLevelGroup(l));
      }
    }

    return { id: p.id, name: p.name, groups: groupOrder };
  });
}

/** Section ids visible under the department/course/strand selection. */
export function visibleSectionIds(
  tree: ScopeDepartment[],
  sel: Pick<ScopeSelection, "programIds" | "courseIds" | "strandIds">,
): string[] {
  const out: string[] = [];
  for (const d of tree) {
    if (!sel.programIds.includes(d.id)) continue;
    for (const g of d.groups) {
      if (g.kind === "course" && !sel.courseIds.includes(g.id)) continue;
      if (g.kind === "strand" && !sel.strandIds.includes(g.id)) continue;
      for (const l of g.levels) {
        for (const s of l.sections) out.push(s.id);
      }
    }
  }
  return out;
}

/**
 * Subjects the generator will consider for the selection. Mirrors the
 * backend scope query: direct course_id/strand_id match only. A subject with
 * no course set does not belong to any course filter.
 */
export function subjectsInScope<TSubject extends ScopeSubject>(
  subjects: TSubject[],
  sel: Pick<ScopeSelection, "programIds" | "courseIds" | "strandIds">,
): TSubject[] {
  return subjects.filter((s) => {
    if (!sel.programIds.includes(s.programId)) return false;
    if (sel.courseIds.length > 0) {
      if (!s.courseId || !sel.courseIds.includes(s.courseId)) return false;
    }
    if (sel.strandIds.length > 0) {
      if (!s.strandId || !sel.strandIds.includes(s.strandId)) return false;
    }
    return true;
  });
}

export interface ScopeCoverage {
  /** In-scope subjects no selected educator can teach. */
  uncoveredSubjectIds: string[];
  /** In-scope teachable count per selected educator id. */
  coveredCountByEducator: Map<string, number>;
}

/**
 * Frontend-instant version of the backend scope_no_coverage check: which
 * in-scope subjects lose every teachable educator under the current
 * educator selection. selectedIds null/empty = everyone selected.
 */
export function computeCoverage(
  inScopeSubjects: Pick<ScopeSubject, "id">[],
  teachableByEducator: Map<string, string[]>,
  selectedIds: string[] | null,
): ScopeCoverage {
  const selected =
    selectedIds && selectedIds.length > 0
      ? new Set(selectedIds)
      : new Set(teachableByEducator.keys());
  const coveredCountByEducator = new Map<string, number>();
  for (const id of selected) coveredCountByEducator.set(id, 0);

  const uncoveredSubjectIds: string[] = [];
  for (const s of inScopeSubjects) {
    let covered = false;
    for (const [educatorId, subjectIds] of teachableByEducator) {
      if (!selected.has(educatorId)) continue;
      if (subjectIds.includes(s.id)) {
        covered = true;
        coveredCountByEducator.set(
          educatorId,
          (coveredCountByEducator.get(educatorId) ?? 0) + 1,
        );
      }
    }
    if (!covered) uncoveredSubjectIds.push(s.id);
  }
  return { uncoveredSubjectIds, coveredCountByEducator };
}
