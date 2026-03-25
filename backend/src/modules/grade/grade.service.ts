// @/modules/grade/grade.service.ts
import { Injectable } from '@nestjs/common';
import { GradeRepository } from './grade.repository';

@Injectable()
export class GradeService {
  constructor(private readonly repo: GradeRepository) {}

  async publishAllByClass(classId: string, orgId: string) {
    return this.repo.publishByClass(classId, orgId);
  }

  async unlockAllByClass(classId: string, orgId: string) {
    return this.repo.unlockByClass(classId, orgId);
  }

  async computeAndSaveGrade(data: {
    orgId: string;
    studentId: string;
    classId: string;
    termId: string;
    finalScore: number;
    finalGrade: string;
  }) {
    return this.repo.upsert(data); // ✅ was repo.upsertGrade
  }

  async getClassGrades(classId: string, orgId: string) {
    return this.repo.findByClass(classId, orgId);
  }
}