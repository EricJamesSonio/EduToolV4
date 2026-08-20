import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

const PROFILE_TREE_INCLUDE = {
  courses: {
    include: {
      levels: {
        orderBy: { order_index: 'asc' as const },
        include: { sections: true, subjects: true },
      },
    },
  },
  strands: {
    include: {
      levels: {
        orderBy: { order_index: 'asc' as const },
        include: { sections: true, subjects: true },
      },
    },
  },
  levels: {
    where: { course_id: null, strand_id: null },
    orderBy: { order_index: 'asc' as const },
    include: { sections: true, subjects: true },
  },
  subjects: {
    where: { level_id: null }, // department-level minor/shared subjects
    include: { sharings: true },
  },
};

@Injectable()
export class SchoolProfileRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllDepartments(orgId: string) {
    return this.db.schoolProfileDepartment.findMany({
      where: { org_id: orgId },
      include: PROFILE_TREE_INCLUDE,
      orderBy: { created_at: 'asc' },
    });
  }

  async findDepartmentByType(orgId: string, type: string) {
    return this.db.schoolProfileDepartment.findFirst({
      where: { org_id: orgId, type },
      include: PROFILE_TREE_INCLUDE,
    });
  }

  async createDepartment(orgId: string, type: string) {
    return this.db.schoolProfileDepartment.create({
      data: { org_id: orgId, type },
    });
  }

  async deleteDepartment(id: string) {
    // Children cascade via onDelete: Cascade in the schema.
    return this.db.schoolProfileDepartment.delete({ where: { id } });
  }

  // ── Course ──────────────────────────────────────────────────────────────
  async createCourse(
    orgId: string,
    departmentId: string,
    name: string,
    code?: string,
  ) {
    return this.db.schoolProfileCourse.create({
      data: {
        org_id: orgId,
        department_id: departmentId,
        name,
        code: code ?? null,
      },
    });
  }

  async findCourseById(id: string, orgId: string) {
    return this.db.schoolProfileCourse.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async updateCourse(id: string, data: { name?: string; code?: string }) {
    return this.db.schoolProfileCourse.update({ where: { id }, data });
  }

  async deleteCourse(id: string) {
    return this.db.schoolProfileCourse.delete({ where: { id } });
  }

  // ── Strand ──────────────────────────────────────────────────────────────
  async createStrand(orgId: string, departmentId: string, name: string) {
    return this.db.schoolProfileStrand.create({
      data: { org_id: orgId, department_id: departmentId, name },
    });
  }

  async findStrandById(id: string, orgId: string) {
    return this.db.schoolProfileStrand.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async updateStrand(id: string, data: { name?: string }) {
    return this.db.schoolProfileStrand.update({ where: { id }, data });
  }

  async deleteStrand(id: string) {
    return this.db.schoolProfileStrand.delete({ where: { id } });
  }

  // ── Level ───────────────────────────────────────────────────────────────
  async createLevel(
    orgId: string,
    data: {
      departmentId: string;
      courseId?: string;
      strandId?: string;
      name: string;
      orderIndex: number;
    },
  ) {
    return this.db.schoolProfileLevel.create({
      data: {
        org_id: orgId,
        department_id: data.departmentId,
        course_id: data.courseId ?? null,
        strand_id: data.strandId ?? null,
        name: data.name,
        order_index: data.orderIndex,
      },
    });
  }

  async findLevelById(id: string, orgId: string) {
    return this.db.schoolProfileLevel.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async updateLevel(id: string, data: { name?: string; orderIndex?: number }) {
    return this.db.schoolProfileLevel.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.orderIndex !== undefined
          ? { order_index: data.orderIndex }
          : {}),
      },
    });
  }

  async deleteLevel(id: string) {
    return this.db.schoolProfileLevel.delete({ where: { id } });
  }

  // ── Section ─────────────────────────────────────────────────────────────
  async createSection(
    orgId: string,
    levelId: string,
    name: string,
    capacity: number,
  ) {
    return this.db.schoolProfileSection.create({
      data: { org_id: orgId, level_id: levelId, name, capacity },
    });
  }

  async findSectionById(id: string, orgId: string) {
    return this.db.schoolProfileSection.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async updateSection(id: string, data: { name?: string; capacity?: number }) {
    return this.db.schoolProfileSection.update({ where: { id }, data });
  }

  async deleteSection(id: string) {
    return this.db.schoolProfileSection.delete({ where: { id } });
  }

  // ── Subject ─────────────────────────────────────────────────────────────
  async createMajorSubject(orgId: string, levelId: string, name: string) {
    return this.db.schoolProfileSubject.create({
      data: { org_id: orgId, level_id: levelId, name, subject_type: 'major' },
    });
  }

  async createMinorSubject(orgId: string, departmentId: string, name: string) {
    return this.db.schoolProfileSubject.create({
      data: {
        org_id: orgId,
        department_id: departmentId,
        name,
        subject_type: 'minor',
      },
    });
  }

  async findSubjectById(id: string, orgId: string) {
    return this.db.schoolProfileSubject.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async updateSubject(id: string, data: { name?: string }) {
    return this.db.schoolProfileSubject.update({ where: { id }, data });
  }

  async deleteSubject(id: string) {
    return this.db.schoolProfileSubject.delete({ where: { id } });
  }

  async createSubjectSharing(
    orgId: string,
    subjectId: string,
    courseId?: string,
    strandId?: string,
  ) {
    return this.db.schoolProfileSubjectSharing.create({
      data: {
        org_id: orgId,
        subject_id: subjectId,
        course_id: courseId ?? null,
        strand_id: strandId ?? null,
      },
    });
  }
}
