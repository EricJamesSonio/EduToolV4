export interface SubjectSharingEntity {
  id: string
  orgId: string
  subjectId: string
  courseId: string | null
  courseName: string | null
  strandId: string | null
  strandName: string | null
  levelId: string | null
  levelName: string | null
}

export class SubjectEntity {
  id!: string
  orgId!: string
  name!: string
  subjectType!: string        // 'major' | 'minor'
  programId!: string | null   // required for minor subjects
  levelId!: string | null     // optional — major always has it, minor may not
  courseId!: string | null
  strandId!: string | null
  educatorId!: string | null
  isLocked!: boolean
  yearLevel!: string | null
  termLabel!: string | null
  sharings!: SubjectSharingEntity[]
}