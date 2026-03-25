// src/modules/lesson/lesson.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';

@Injectable()
export class LessonRepository {
  constructor(private readonly db: DatabaseService) {}

    // ───────── CREATE ─────────
    // lesson.repository.ts — create()
    async create(data: {
    orgId: string;
    classId: string;
    title: string;
    description?: string;
    weekNumber: number;
    subIndex: number;
    detail: string; // ✅ add to signature
    }) {
    return this.db.lesson.create({
        data: {
        org_id: data.orgId,
        class_id: data.classId,
        title: data.title,
        description: data.description ?? null,
        detail: data.detail,        // ✅ persist it
        week_number: data.weekNumber,
        sub_index: data.subIndex,
        },
    });
    }

  // ───────── FIND ─────────

  async findAll(classId: string, orgId: string, weekNumber?: number) {
    return this.db.lesson.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
        ...(weekNumber ? { week_number: weekNumber } : {}),
      },
      orderBy: [{ week_number: 'asc' }, { sub_index: 'asc' }],
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.lesson.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async findByClassAndWeek(
    classId: string,
    orgId: string,
    weekNumber: number,
    subIndex: number,
  ) {
    return this.db.lesson.findFirst({
      where: {
        class_id: classId,
        org_id: orgId,
        week_number: weekNumber,
        sub_index: subIndex,
      },
    });
  }

  // ───────── UPDATE ─────────

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      weekNumber?: number;
      subIndex?: number;
    },
  ) {
    return this.db.lesson.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.weekNumber !== undefined ? { week_number: data.weekNumber } : {}),
        ...(data.subIndex !== undefined ? { sub_index: data.subIndex } : {}),
      },
    });
  }

  // ───────── DELETE ─────────

  async delete(id: string) {
    return this.db.lesson.delete({ where: { id } });
  }

  // ───────── CONCEPT ─────────

  async findConcept(lessonId: string) {
    return this.db.lessonConcept.findFirst({
      where: { lesson_id: lessonId },
      orderBy: { created_at: 'desc' },
    });
  }

  async upsertConcept(data: {
    orgId: string;
    lessonId: string;
    content: object;
  }) {
    // Delete old concept first (re-extraction replaces entirely)
    await this.db.lessonConcept.deleteMany({
      where: { lesson_id: data.lessonId },
    });

    return this.db.lessonConcept.create({
      data: {
        org_id: data.orgId,
        lesson_id: data.lessonId,
        content: data.content,
      },
    });
  }
}