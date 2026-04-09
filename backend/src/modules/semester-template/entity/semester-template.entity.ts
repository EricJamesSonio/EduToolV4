// filepath: backend/src/modules/semester-template/entity/semester-template.entity.ts

export class SemesterTemplateTermEntity {
  id!: string
  semesterId!: string
  name!: string
  orderIndex!: number
}

export class SemesterTemplateItemEntity {
  id!: string
  templateId!: string
  name!: string
  orderIndex!: number
  terms!: SemesterTemplateTermEntity[]
}

export class SemesterTemplateEntity {
  id!: string
  orgId!: string
  programType!: string
  name!: string
  semesters!: SemesterTemplateItemEntity[]
}

export class ProgramSemesterAssignmentEntity {
  id!: string
  orgId!: string
  programId!: string
  templateId!: string
  template!: SemesterTemplateEntity
}