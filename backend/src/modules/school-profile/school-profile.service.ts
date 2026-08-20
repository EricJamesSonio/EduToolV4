import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import { SchoolProfileRepository } from './school-profile.repository';
import { PROGRAMS } from '../org-seeder/data/programs.data';
import { COLLEGE_COURSES, BSED_MAJORS } from '../org-seeder/data/courses.data';
import { SHS_STRAND_DEFS } from '../org-seeder/data/strands.data';
import { buildLevelDefs } from '../org-seeder/data/levels.data';
import {
  allMajorSubjects,
  allMinorSubjects,
  deriveProgramKey,
} from '../org-seeder/data/subjects/index';
import type {
  CreateProfileCourseDto,
  UpdateProfileCourseDto,
  CreateProfileStrandDto,
  UpdateProfileStrandDto,
  CreateProfileLevelDto,
  UpdateProfileLevelDto,
  CreateProfileSectionDto,
  UpdateProfileSectionDto,
  CreateProfileSubjectDto,
  UpdateProfileSubjectDto,
} from './dto/school-profile.dto';

const VALID_DEPARTMENT_TYPES = new Set(PROGRAMS.map((p) => p.type));

@Injectable()
export class SchoolProfileService {
  constructor(
    private readonly repo: SchoolProfileRepository,
    private readonly db: DatabaseService,
  ) {}

  async getProfile(orgId: string) {
    return this.repo.findAllDepartments(orgId);
  }

  // ── Department select/deselect ─────────────────────────────────────────

  async selectDepartment(orgId: string, type: string) {
    if (!VALID_DEPARTMENT_TYPES.has(type)) {
      throw new BadRequestException(`Unknown department type "${type}".`);
    }

    const existing = await this.repo.findDepartmentByType(orgId, type);
    if (existing) return existing;

    return this.db.$transaction(async (tx) => {
      const department = await tx.schoolProfileDepartment.create({
        data: { org_id: orgId, type },
      });

      const courseIdByCode = new Map<string, string>();
      if (type === 'college') {
        for (const course of [...COLLEGE_COURSES, ...BSED_MAJORS]) {
          const created = await tx.schoolProfileCourse.create({
            data: {
              org_id: orgId,
              department_id: department.id,
              name: course.name,
              code: course.code,
            },
          });
          courseIdByCode.set(course.code, created.id);
        }
      }

      const strandIdByName = new Map<string, string>();
      if (type === 'shs') {
        for (const strand of SHS_STRAND_DEFS) {
          const created = await tx.schoolProfileStrand.create({
            data: {
              org_id: orgId,
              department_id: department.id,
              name: strand.name,
            },
          });
          strandIdByName.set(strand.name, created.id);
        }
      }

      // Levels + sections. Composite key distinguishes course-scoped,
      // strand-scoped, and department-level (neither) rows — prefixed so a
      // course code and a strand name can never collide in the map.
      const levelDefs = buildLevelDefs().filter((d) => d.programKey === type);
      const levelIdByCompositeKey = new Map<string, string>();

      let orderIndex = 0;
      for (const def of levelDefs) {
        const courseId = def.courseCode
          ? courseIdByCode.get(def.courseCode)
          : undefined;
        const strandId = def.strandCode
          ? strandIdByName.get(def.strandCode)
          : undefined;

        const level = await tx.schoolProfileLevel.create({
          data: {
            org_id: orgId,
            department_id: department.id,
            course_id: courseId ?? null,
            strand_id: strandId ?? null,
            name: def.name,
            order_index: orderIndex++,
          },
        });

        const compositeKey = def.courseCode
          ? `course:${def.courseCode}|${def.name}`
          : def.strandCode
            ? `strand:${def.strandCode}|${def.name}`
            : `dept|${def.name}`;
        levelIdByCompositeKey.set(compositeKey, level.id);

        for (const section of def.sections) {
          await tx.schoolProfileSection.create({
            data: {
              org_id: orgId,
              level_id: level.id,
              name: section.name,
              capacity: section.capacity,
            },
          });
        }
      }

      // Major subjects — SHS subjects need strand context too now, since
      // levels are strand-scoped. deriveProgramKey only gives us the program,
      // not the strand/course, so major subjects for shs/college must be
      // matched via SubjectDef's own courseCode/strandName field, not just levelName.
      const majorSubjects = allMajorSubjects().filter(
        (s) => deriveProgramKey(s.levelName) === type,
      );
      for (const subj of majorSubjects) {
        const key = subj.courseCode
          ? `course:${subj.courseCode}|${subj.levelName}`
          : subj.strandName
            ? `strand:${subj.strandName}|${subj.levelName}`
            : `dept|${subj.levelName}`;
        const levelId = levelIdByCompositeKey.get(key);
        if (!levelId) continue;
        await tx.schoolProfileSubject.create({
          data: {
            org_id: orgId,
            level_id: levelId,
            name: subj.name,
            subject_type: 'major',
          },
        });
      }

      // Minor/shared subjects — created once, shared via SchoolProfileSubjectSharing.
      const minorSubjects = allMinorSubjects().filter(
        (s) => deriveProgramKey(s.levelName) === type,
      );
      for (const subj of minorSubjects) {
        const created = await tx.schoolProfileSubject.create({
          data: {
            org_id: orgId,
            department_id: department.id,
            name: subj.name,
            subject_type: 'minor',
          },
        });

        if (type === 'college') {
          for (const courseId of courseIdByCode.values()) {
            await tx.schoolProfileSubjectSharing.create({
              data: {
                org_id: orgId,
                subject_id: created.id,
                course_id: courseId,
              },
            });
          }
        } else if (type === 'shs') {
          for (const strandId of strandIdByName.values()) {
            await tx.schoolProfileSubjectSharing.create({
              data: {
                org_id: orgId,
                subject_id: created.id,
                strand_id: strandId,
              },
            });
          }
        }
      }

      return tx.schoolProfileDepartment.findFirst({
        where: { id: department.id },
      });
    });
  }

  async deselectDepartment(orgId: string, type: string) {
    const existing = await this.repo.findDepartmentByType(orgId, type);
    if (!existing) return; // idempotent — already deselected
    await this.repo.deleteDepartment(existing.id); // cascades everything under it
  }

  // ── Course CRUD ─────────────────────────────────────────────────────────

  async createCourse(
    orgId: string,
    departmentId: string,
    dto: CreateProfileCourseDto,
  ) {
    return this.repo.createCourse(orgId, departmentId, dto.name, dto.code);
  }

  async updateCourse(id: string, orgId: string, dto: UpdateProfileCourseDto) {
    const existing = await this.repo.findCourseById(id, orgId);
    if (!existing) throw new NotFoundException('Course not found.');
    return this.repo.updateCourse(id, dto);
  }

  async deleteCourse(id: string, orgId: string) {
    const existing = await this.repo.findCourseById(id, orgId);
    if (!existing) throw new NotFoundException('Course not found.');
    await this.repo.deleteCourse(id);
  }

  // ── Strand CRUD ─────────────────────────────────────────────────────────

  async createStrand(
    orgId: string,
    departmentId: string,
    dto: CreateProfileStrandDto,
  ) {
    return this.repo.createStrand(orgId, departmentId, dto.name);
  }

  async updateStrand(id: string, orgId: string, dto: UpdateProfileStrandDto) {
    const existing = await this.repo.findStrandById(id, orgId);
    if (!existing) throw new NotFoundException('Strand not found.');
    return this.repo.updateStrand(id, dto);
  }

  async deleteStrand(id: string, orgId: string) {
    const existing = await this.repo.findStrandById(id, orgId);
    if (!existing) throw new NotFoundException('Strand not found.');
    await this.repo.deleteStrand(id);
  }

  // ── Level CRUD ──────────────────────────────────────────────────────────

  async createLevel(
    orgId: string,
    departmentId: string,
    dto: CreateProfileLevelDto,
  ) {
    return this.repo.createLevel(orgId, {
      departmentId,
      courseId: dto.courseId,
      strandId: dto.strandId,
      name: dto.name,
      orderIndex: dto.orderIndex,
    });
  }

  async updateLevel(id: string, orgId: string, dto: UpdateProfileLevelDto) {
    const existing = await this.repo.findLevelById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');
    return this.repo.updateLevel(id, {
      name: dto.name,
      orderIndex: dto.orderIndex,
    });
  }

  async deleteLevel(id: string, orgId: string) {
    const existing = await this.repo.findLevelById(id, orgId);
    if (!existing) throw new NotFoundException('Level not found.');
    await this.repo.deleteLevel(id);
  }

  // ── Section CRUD ────────────────────────────────────────────────────────

  async createSection(
    orgId: string,
    levelId: string,
    dto: CreateProfileSectionDto,
  ) {
    return this.repo.createSection(orgId, levelId, dto.name, dto.capacity);
  }

  async updateSection(id: string, orgId: string, dto: UpdateProfileSectionDto) {
    const existing = await this.repo.findSectionById(id, orgId);
    if (!existing) throw new NotFoundException('Section not found.');
    return this.repo.updateSection(id, dto);
  }

  async deleteSection(id: string, orgId: string) {
    const existing = await this.repo.findSectionById(id, orgId);
    if (!existing) throw new NotFoundException('Section not found.');
    await this.repo.deleteSection(id);
  }

  // ── Subject CRUD ────────────────────────────────────────────────────────

  async createSubject(
    orgId: string,
    levelId: string,
    dto: CreateProfileSubjectDto,
  ) {
    return this.repo.createMajorSubject(orgId, levelId, dto.name);
  }

  async updateSubject(id: string, orgId: string, dto: UpdateProfileSubjectDto) {
    const existing = await this.repo.findSubjectById(id, orgId);
    if (!existing) throw new NotFoundException('Subject not found.');
    return this.repo.updateSubject(id, dto);
  }

  async deleteSubject(id: string, orgId: string) {
    const existing = await this.repo.findSubjectById(id, orgId);
    if (!existing) throw new NotFoundException('Subject not found.');
    await this.repo.deleteSubject(id);
  }
}
