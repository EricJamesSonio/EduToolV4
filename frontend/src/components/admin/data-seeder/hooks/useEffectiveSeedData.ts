import { useMemo } from "react"
import type { SchoolProfileDepartment } from "@/types/admin/school-profile.types"

export interface EffectiveSeedOverrides {
  collegeCourses: { code: string; name: string; years: number }[] | null
  shsStrands: string[] | null
  levelDefsByEntity: Record<string, string[]>
  sectionsByLevelName: Record<string, { name: string; capacity: number }[]>
  levelSubjectsByLevelName: Record<string, string[]>
  courseSubjectsByCode: Record<string, string[]>
  strandSubjectsByName: Record<string, string[]>
}

export function useEffectiveSeedData(
  savedDepartments: SchoolProfileDepartment[],
): EffectiveSeedOverrides {
  return useMemo(() => {
    const byType = new Map(savedDepartments.map((d) => [d.type, d]))

    const college = byType.get("college")
    const shs = byType.get("shs")

    const collegeCourses = college
      ? college.courses.map((c) => ({
          code: c.code ?? c.name,
          name: c.name,
          years: c.levels.length || 4,
        }))
      : null

    const shsStrands = shs ? shs.strands.map((s) => s.name) : null

    const levelDefsByEntity: Record<string, string[]> = {}
    const sectionsByLevelName: Record<string, { name: string; capacity: number }[]> = {}
    const levelSubjectsByLevelName: Record<string, string[]> = {}
    const courseSubjectsByCode: Record<string, string[]> = {}
    const strandSubjectsByName: Record<string, string[]> = {}

    for (const dept of savedDepartments) {
      // Department-level (no course/strand) — daycare/kinder/elementary/jhs
      if (dept.levels.length > 0) {
        levelDefsByEntity[dept.type] = dept.levels.map((l) => l.name)
        for (const level of dept.levels) {
          sectionsByLevelName[level.name] = level.sections.map((s) => ({
            name: s.name,
            capacity: s.capacity,
          }))
          levelSubjectsByLevelName[level.name] = level.subjects
            .filter((s) => s.subjectType === "major")
            .map((s) => s.name)
        }
      }

      // Course-scoped (college)
      for (const course of dept.courses) {
        const entityKey = course.code ?? course.name
        levelDefsByEntity[entityKey] = course.levels.map((l) => l.name)
        const allCourseSubjects: string[] = []
        for (const level of course.levels) {
          sectionsByLevelName[level.name] = level.sections.map((s) => ({
            name: s.name,
            capacity: s.capacity,
          }))
          const majors = level.subjects.filter((s) => s.subjectType === "major").map((s) => s.name)
          allCourseSubjects.push(...majors)
        }
        courseSubjectsByCode[entityKey] = allCourseSubjects
      }

      // Strand-scoped (shs)
      for (const strand of dept.strands) {
        levelDefsByEntity[strand.name] = strand.levels.map((l) => l.name)
        const allStrandSubjects: string[] = []
        for (const level of strand.levels) {
          sectionsByLevelName[level.name] = level.sections.map((s) => ({
            name: s.name,
            capacity: s.capacity,
          }))
          const majors = level.subjects.filter((s) => s.subjectType === "major").map((s) => s.name)
          allStrandSubjects.push(...majors)
        }
        strandSubjectsByName[strand.name] = allStrandSubjects
      }
    }

    return {
      collegeCourses,
      shsStrands,
      levelDefsByEntity,
      sectionsByLevelName,
      levelSubjectsByLevelName,
      courseSubjectsByCode,
      strandSubjectsByName,
    }
  }, [savedDepartments])
}