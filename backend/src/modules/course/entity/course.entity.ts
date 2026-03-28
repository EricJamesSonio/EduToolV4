export class CourseEntity {
  id: string
  org_id: string
  program_id: string
  name: string
  code: string | null
  created_at?: Date
}