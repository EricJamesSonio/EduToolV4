import { ProgramType } from '../dto/program.dto'

export class CourseSnapshot {
  id: string
  name: string
  code: string | null
}

export class StrandSnapshot {
  id: string
  name: string
}

export class ProgramEntity {
  id: string
  orgId: string
  name: string
  type: ProgramType
  courses: CourseSnapshot[]
  strands: StrandSnapshot[]
}