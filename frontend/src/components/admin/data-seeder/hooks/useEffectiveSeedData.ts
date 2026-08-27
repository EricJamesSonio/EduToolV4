import { useMemo } from "react"
import type { SchoolProfileDepartment, SchoolProfileData } from "@/types/admin/school-profile.types"
import type { GradingScalePreset } from "../constants/grading-scales"
import type { GradingSchemeTemplate } from "../constants/grading-schemes"

export interface EffectiveSeedOverrides {
  collegeCourses: { code: string; name: string; years: number }[] | null
  shsStrands: string[] | null
  levelDefsByEntity: Record<string, string[]>
  sectionsByLevelName: Record<string, { name: string; capacity: number }[]>
  levelSubjectsByLevelName: Record<string, string[]>
  courseSubjectsByCode: Record<string, string[]>
  strandSubjectsByName: Record<string, string[]>
  gradingScalesByProgram: Record<string, GradingScalePreset> | null
  gradingSchemesByProgram: Record<string, GradingSchemeTemplate> | null
  semesterTermNamesByProgram: Record<string, string[]> | null
}

export function useEffectiveSeedData(
  savedInput: SchoolProfileDepartment[] | SchoolProfileData,
): EffectiveSeedOverrides {
  return useMemo(() => {
    const savedDepartments: SchoolProfileDepartment[] = Array.isArray(savedInput) ? savedInput : (savedInput as SchoolProfileData).departments
    const savedGradingScales = Array.isArray(savedInput) ? [] : (savedInput as SchoolProfileData).gradingScales ?? []
    const savedGradingSchemes = Array.isArray(savedInput) ? [] : (savedInput as SchoolProfileData).gradingSchemes ?? []
    const savedSemesterTerms = Array.isArray(savedInput) ? [] : (savedInput as SchoolProfileData).semesterTermConfigs ?? []
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
        levelDefsByEntity[dept.type] = [...new Set(dept.levels.map((l) => l.name))]
        for (const level of dept.levels) {
          sectionsByLevelName[level.name] = level.sections.map((s) => ({
            name: s.name,
            capacity: s.capacity,
          }))
          levelSubjectsByLevelName[level.name] = [
            ...new Set(level.subjects.filter((s) => s.subjectType === "major").map((s) => s.name)),
          ]
        }
      }

      // Course-scoped (college)
      for (const course of dept.courses) {
        const entityKey = course.code ?? course.name
        levelDefsByEntity[entityKey] = [...new Set(course.levels.map((l) => l.name))]
        const allCourseSubjects: string[] = []
        for (const level of course.levels) {
          sectionsByLevelName[level.name] = level.sections.map((s) => ({
            name: s.name,
            capacity: s.capacity,
          }))
          const majors = level.subjects.filter((s) => s.subjectType === "major").map((s) => s.name)
          allCourseSubjects.push(...majors)
        }
        courseSubjectsByCode[entityKey] = [...new Set(allCourseSubjects)]
      }

      // Strand-scoped (shs)
      for (const strand of dept.strands) {
        levelDefsByEntity[strand.name] = [...new Set(strand.levels.map((l) => l.name))]
        const allStrandSubjects: string[] = []
        for (const level of strand.levels) {
          sectionsByLevelName[level.name] = level.sections.map((s) => ({
            name: s.name,
            capacity: s.capacity,
          }))
          const majors = level.subjects.filter((s) => s.subjectType === "major").map((s) => s.name)
          allStrandSubjects.push(...majors)
        }
        strandSubjectsByName[strand.name] = [...new Set(allStrandSubjects)]
      }
    }

    const gradingScalesByProgram: Record<string, GradingScalePreset> | null =
      savedGradingScales.length > 0
        ? Object.fromEntries(
            savedGradingScales.map((s) => [
              s.programType,
              { key: s.programType, name: s.name, ranges: s.ranges.map((r) => ({ label: r.label, minScore: r.minScore, maxScore: r.maxScore, gradeValue: r.gradeValue })) },
            ]),
          )
        : null

    const gradingSchemesByProgram: Record<string, GradingSchemeTemplate> | null =
      savedGradingSchemes.length > 0
        ? Object.fromEntries(
            savedGradingSchemes.map((s) => [
              s.programType,
              { name: s.name, programType: s.programType, components: s.components.map((c) => ({ name: c.name, type: c.type, weight: c.weight, isOptional: !!c.isOptional })) },
            ]),
          )
        : null

    const semesterTermNamesByProgram: Record<string, string[]> | null =
      savedSemesterTerms.length > 0
        ? Object.fromEntries(savedSemesterTerms.map((c) => [c.programType, [...c.terms]]))
        : null

    return {
      collegeCourses,
      shsStrands,
      levelDefsByEntity,
      sectionsByLevelName,
      levelSubjectsByLevelName,
      courseSubjectsByCode,
      strandSubjectsByName,
      gradingScalesByProgram,
      gradingSchemesByProgram,
      semesterTermNamesByProgram,
    }
  }, [savedInput])
}