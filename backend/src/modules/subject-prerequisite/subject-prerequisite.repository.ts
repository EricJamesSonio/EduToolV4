import { Injectable } from '@nestjs/common'
import { DatabaseService } from '@/core/database/database.provider'
import { CreatePrerequisiteDto } from './dto/subject-prerequisite.dto'

@Injectable()
export class SubjectPrerequisiteRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(orgId: string, dto: CreatePrerequisiteDto) {
    return this.db.subjectPrerequisite.create({
      data: {
        org_id: orgId,
        subject_id: dto.subject_id,
        prerequisite_id: dto.prerequisite_id,
      },
    })
  }

  async bulkCreate(org_id: string, subject_id: string, prerequisite_ids: string[]) {
    return this.db.subjectPrerequisite.createMany({
      data: prerequisite_ids.map((prerequisite_id) => ({
        org_id,
        subject_id,
        prerequisite_id,
      })),
      skipDuplicates: true,
    })
  }

  async findBySubject(subject_id: string, org_id: string) {
    return this.db.subjectPrerequisite.findMany({
      where: { subject_id, org_id },
      include: {
        prerequisite: {
          select: { id: true, name: true, year_level: true, term_label: true },
        },
      },
    })
  }

  async findOne(subject_id: string, prerequisite_id: string, org_id: string) {
    return this.db.subjectPrerequisite.findFirst({
      where: { subject_id, prerequisite_id, org_id },
    })
  }

  async delete(id: string) {
    return this.db.subjectPrerequisite.delete({ where: { id } })
  }

  async deleteAllForSubject(subject_id: string, org_id: string) {
    return this.db.subjectPrerequisite.deleteMany({
      where: { subject_id, org_id },
    })
  }

  // Fetch all prerequisite subjects + the student's Grade records for them in one query
  async getPrerequisitesWithGrades(
    subject_id: string,
    student_id: string,
    org_id: string,
  ) {
    const prereqs = await this.db.subjectPrerequisite.findMany({
      where: { subject_id, org_id },
      include: {
        prerequisite: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (prereqs.length === 0) return []

    const prerequisiteSubjectIds = prereqs.map((p) => p.prerequisite_id)

    // Find classes the student was enrolled in that used those subjects
    const grades = await this.db.grade.findMany({
      where: {
        org_id,
        student_id,
        is_locked: true,
        class: {
          subject_id: { in: prerequisiteSubjectIds },
        },
      },
      include: {
        class: {
          select: { subject_id: true },
        },
      },
    })

    return prereqs.map((p) => ({
      subject_id: p.prerequisite_id,
      subject_name: p.prerequisite.name,
      grade: grades.find((g) => g.class.subject_id === p.prerequisite_id) ?? null,
    }))
  }
}