import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { SemesterTemplateRepository } from './semester-template.repository'
import { ProgramRepository } from '@/modules/program/program.repository'
import {
  CreateSemesterTemplateDto,
  UpdateSemesterTemplateDto,
  AssignTemplateDto,
} from './dto/semester-template.dto'
import { DatabaseService } from '@/core/database/database.provider'

@Injectable()
export class SemesterTemplateService {
constructor(
  private readonly repo: SemesterTemplateRepository,
  private readonly programRepo: ProgramRepository,
  private readonly db: DatabaseService,
) {}

  async create(orgId: string, dto: CreateSemesterTemplateDto) {
    const duplicate = await this.repo.existsByName(orgId, dto.programType, dto.name)
    if (duplicate) {
      throw new ConflictException(
        `A template named "${dto.name}" already exists for this program type.`,
      )
    }

    return this.repo.create({
      orgId,
      programType: dto.programType,
      name: dto.name,
      semesters: dto.semesters.map((s) => ({
        name: s.name,
        orderIndex: s.orderIndex,
        terms: s.terms.map((t) => ({
          name: t.name,
          orderIndex: t.orderIndex,
        })),
      })),
    })
  }
  async saveTermDates(
    orgId: string,
    programId: string,
    termDates: Array<{ termId: string; startDate: string; endDate: string }>,
  ) {
    const assignment = await this.repo.findAssignmentByProgram(programId, orgId)
    if (!assignment) throw new NotFoundException('No template assigned to this program.')

    await this.repo.upsertTermDates(assignment.id, orgId, termDates)

    // Resolve the program's school_year_id
    const program = await this.programRepo.findById(programId, orgId)
    if (!program) throw new NotFoundException('Program not found.')

    // Build a map of termId → dates for quick lookup
    const dateMap = new Map(
      termDates.map((td) => [td.termId, { start: new Date(td.startDate), end: new Date(td.endDate) }])
    )

    // Walk template semesters → terms, upsert Semester + Term rows
    const template = assignment.template as any
    for (const semItem of template.semesters) {
      // Collect dates for all terms in this semester
      const termDateEntries = semItem.terms
        .map((t: any) => dateMap.get(t.id))
        .filter(Boolean) as Array<{ start: Date; end: Date }>

      if (termDateEntries.length === 0) continue

      const semStart = new Date(Math.min(...termDateEntries.map((d) => d.start.getTime())))
      const semEnd   = new Date(Math.max(...termDateEntries.map((d) => d.end.getTime())))

      // Upsert Semester row (match by org + school_year + name)
      const existingSemester = await this.db.semester.findFirst({
        where: {
          org_id: orgId,
          school_year_id: program.school_year_id,
          name: semItem.name,
        },
      })

      const semester = existingSemester
        ? await this.db.semester.update({
            where: { id: existingSemester.id },
            data: { start_date: semStart, end_date: semEnd },
          })
        : await this.db.semester.create({
            data: {
              org_id: orgId,
              school_year_id: program.school_year_id,
              name: semItem.name,
              start_date: semStart,
              end_date: semEnd,
            },
          })

      // Upsert Term rows under this Semester
      for (const termItem of semItem.terms) {
        const dates = dateMap.get(termItem.id)
        if (!dates) continue

        const existingTerm = await this.db.term.findFirst({
          where: {
            org_id: orgId,
            semester_id: semester.id,
            name: termItem.name,
          },
        })

        if (existingTerm) {
          await this.db.term.update({
            where: { id: existingTerm.id },
            data: { start_date: dates.start, end_date: dates.end },
          })
        } else {
          await this.db.term.create({
            data: {
              org_id: orgId,
              semester_id: semester.id,
              name: termItem.name,
              order_index: termItem.order_index,
              start_date: dates.start,
              end_date: dates.end,
            },
          })
        }
      }
    }
  }
  async findAllForOrg(orgId: string) {
    return this.repo.getAllForOrg(orgId)
  }

  async findAllBySchoolYear(orgId: string, schoolYearId: string) {
    return this.repo.findAllBySchoolYear(orgId, schoolYearId)
  }

  async findById(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId)
    if (!template) throw new NotFoundException('Semester template not found.')
    return template
  }

  async update(id: string, orgId: string, dto: UpdateSemesterTemplateDto) {
    const template = await this.repo.findById(id, orgId)
    if (!template) throw new NotFoundException('Semester template not found.')

    if (dto.name && dto.name !== template.name) {
      const duplicate = await this.repo.existsByName(
        orgId,
        template.program_type,
        dto.name,
        id,
      )
      if (duplicate) {
        throw new ConflictException(
          `A template named "${dto.name}" already exists for this program type.`,
        )
      }
      await this.repo.update(id, { name: dto.name })
    }

    if (dto.semesters) {
      await this.repo.replaceSemesters(
        id,
        orgId,
        dto.semesters.map((s) => ({
          name: s.name,
          orderIndex: s.orderIndex,
          terms: s.terms.map((t) => ({
            name: t.name,
            orderIndex: t.orderIndex,
          })),
        })),
      )
    }

    return this.repo.findById(id, orgId)
  }

  async remove(id: string, orgId: string) {
    const template = await this.repo.findById(id, orgId)
    if (!template) throw new NotFoundException('Semester template not found.')
    await this.repo.delete(id)
  }

async assignToProgram(orgId: string, dto: AssignTemplateDto) {
  const template = await this.repo.findById(dto.templateId, orgId)
  if (!template) throw new NotFoundException('Semester template not found.')

  const program = await this.programRepo.findById(dto.programId, orgId)
  if (!program) throw new NotFoundException('Program not found.')

  if (template.program_type !== program.type) {
    throw new BadRequestException(
      `Template type "${template.program_type}" does not match program type "${program.type}".`,
    )
  }

  return this.repo.assignToProgram({
    orgId,
    programId: dto.programId,
    templateId: dto.templateId,
    termDates: dto.termDates,
  })
}

  async removeAssignment(programId: string, orgId: string) {
    await this.repo.removeAssignment(programId, orgId)
  }

  async findAssignmentsBySchoolYear(orgId: string, schoolYearId: string) {
    return this.repo.findAssignmentsBySchoolYear(orgId, schoolYearId)
  }

  async findAssignmentByProgram(programId: string, orgId: string) {
    return this.repo.findAssignmentByProgram(programId, orgId)
  }
}