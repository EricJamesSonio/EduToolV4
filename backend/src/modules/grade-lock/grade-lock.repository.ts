// src/modules/grade-lock/grade-lock.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';

@Injectable()
export class GradeLockRepository {
  constructor(private db: DatabaseService) {}

  // SETTINGS

  async upsertSetting(data: {
    orgId: string;
    schoolYearId: string;
    lockDeadline: Date;
  }) {
    return this.db.gradeLockSetting.upsert({
      where: {
        org_id_school_year_id: {
          org_id: data.orgId,
          school_year_id: data.schoolYearId,
        },
      },
      update: {
        lock_deadline: data.lockDeadline,
      },
      create: {
        org_id: data.orgId,
        school_year_id: data.schoolYearId,
        lock_deadline: data.lockDeadline,
      },
    });
  }

  async getSetting(orgId: string, schoolYearId: string) {
    return this.db.gradeLockSetting.findFirst({
      where: { org_id: orgId, school_year_id: schoolYearId },
    });
  }

  // CLASS LOCK

  async findByClassId(classId: string) {
    return this.db.gradeLock.findUnique({
      where: { class_id: classId },
    });
  }

  async updateLock(classId: string, data: any) {
    return this.db.gradeLock.update({
      where: { class_id: classId },
      data: {
        is_locked: data.is_locked,
        locked_by: data.locked_by,
        locked_at: data.locked_at,
      },
    });
  }

  async getClassLocks(orgId: string, query: any) {
    return this.db.gradeLock.findMany({
      where: {
        org_id: orgId,
      },
      include: {
        class: true,
      },
    });
  }
}