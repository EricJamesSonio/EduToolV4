import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProgramShiftRepository {
  constructor(private readonly db: DatabaseService) {}

  findStudentSchoolYearById(id: string, orgId: string) {
    return this.db.studentSchoolYear.findFirst({
      where: { id, org_id: orgId },
      include: { programEnrollments: { where: { status: 'active' } } },
    });
  }

  findActiveProgramEnrollment(studentSchoolYearId: string, orgId: string) {
    return this.db.studentProgramEnrollment.findFirst({
      where: {
        student_school_year_id: studentSchoolYearId,
        org_id: orgId,
        status: 'active',
      },
      include: {
        studentSchoolYear: true,
      },
    });
  }

  async findEnrollmentsForOldProgramTx(
    tx: Prisma.TransactionClient,
    studentId: string,
    orgId: string,
    oldProgramId: string,
  ) {
    // Use resolveSubjectAcademicStructure logic via TX: get all subjects for old program
    const subjects = await tx.subject.findMany({
      where: {
        org_id: orgId,
        OR: [
          { program_id: oldProgramId },
          { sharings: { some: { course: { program_id: oldProgramId } } } },
          { sharings: { some: { strand: { program_id: oldProgramId } } } },
          { level: { program_id: oldProgramId } },
          { course: { program_id: oldProgramId } },
          { strand: { program_id: oldProgramId } },
        ],
      },
      select: { id: true },
    });
    const subjectIds = subjects.map((s) => s.id);
    if (subjectIds.length === 0) return [];

    return tx.enrollment.findMany({
      where: {
        student_id: studentId,
        org_id: orgId,
        status: 'active',
        class: {
          subject_id: { in: subjectIds },
          deleted_at: null,
        },
      },
    });
  }
}
