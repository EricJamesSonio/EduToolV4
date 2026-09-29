import { useMemo } from "react"
import { useAsyncQuery } from "@/hooks/hook-factory.utils"
import { queryKeys } from "@/hooks/queryKeys.factory"
import { programApi } from "@/api/admin/program.api"
import { levelApi } from "@/api/admin/level.api"
import { subjectApi } from "@/api/admin/subject.api"
import type {
  SchoolProfileDepartment,
  SchoolProfileLevel,
} from "@/types/admin/school-profile.types"

function levelsHaveSubjects(levels: SchoolProfileLevel[]): boolean {
  return levels.some((level) => level.subjects.length > 0)
}

function profileHasSubjects(dept: SchoolProfileDepartment): boolean {
  return (
    dept.subjects.length > 0 ||
    levelsHaveSubjects(dept.levels) ||
    dept.courses.some((course) => levelsHaveSubjects(course.levels)) ||
    dept.strands.some((strand) => levelsHaveSubjects(strand.levels))
  )
}

function readString(source: unknown, ...keys: string[]): string | null {
  const record = source as Record<string, unknown>
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === "string" && value.length > 0) return value
  }
  return null
}

export function useSeededPrograms(
  schoolYearId: string | null,
  profileDepartments: SchoolProfileDepartment[],
) {
  const enabled = !!schoolYearId

  const { data: programs = [], isLoading: programsLoading } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: schoolYearId! }),
    () => programApi.getAll(schoolYearId!),
    { enabled },
  )

  const { data: levels = [], isLoading: levelsLoading } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId: schoolYearId! }),
    () => levelApi.getBySchoolYear(schoolYearId!),
    { enabled },
  )

  const { data: subjects = [], isLoading: subjectsLoading } = useAsyncQuery(
    queryKeys.admin.subjects.list({ schoolYearId }),
    () => subjectApi.getAll({ schoolYearId: schoolYearId ?? undefined }),
    { enabled },
  )

  const isReady = enabled && !programsLoading && !levelsLoading && !subjectsLoading

  return useMemo(() => {
    const existingTypes = new Set<string>(programs.map((p) => p.type))
    const topUp = new Set<string>()

    if (isReady) {
      const typeByProgramId = new Map<string, string>()
      programs.forEach((p) => typeByProgramId.set(p.id, p.type))

      const programIdByLevelId = new Map<string, string>()
      levels.forEach((level) => {
        if (level.program_id) programIdByLevelId.set(level.id, level.program_id)
      })

      const typesWithSubjects = new Set<string>()
      subjects.forEach((subject) => {
        const programId =
          readString(subject, "programId", "program_id") ??
          (() => {
            const levelId = readString(subject, "levelId", "level_id")
            return levelId ? (programIdByLevelId.get(levelId) ?? null) : null
          })()
        const type = programId ? typeByProgramId.get(programId) : undefined
        if (type) typesWithSubjects.add(type)
      })

      const profileByType = new Map<string, SchoolProfileDepartment>()
      profileDepartments.forEach((dept) => profileByType.set(dept.type, dept))

      existingTypes.forEach((type) => {
        const profile = profileByType.get(type)
        if (profile && profileHasSubjects(profile) && !typesWithSubjects.has(type)) {
          topUp.add(type)
        }
      })
    }

    const locked = new Set<string>()
    existingTypes.forEach((type) => {
      if (!topUp.has(type)) locked.add(type)
    })

    return {
      lockedProgramTypes: locked,
      topUpProgramTypes: topUp,
    }
  }, [programs, levels, subjects, isReady, profileDepartments])
}