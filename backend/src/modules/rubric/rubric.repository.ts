// @/modules/rubric/rubric.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class RubricRepository {
  constructor(private readonly db: DatabaseService) {}

  // ── Org default ─────────────────────────────────────────────────────────────

  async findDefault(orgId: string) {
    return this.db.rubric.findFirst({
      where: { org_id: orgId, is_default: true },
    });
  }

  async createDefault(data: {
    orgId: string;
    name: string;
    categories: object;
  }) {
    return this.db.rubric.create({
      data: {
        org_id: data.orgId,
        name: data.name,
        is_default: true,
        educator_id: null,
        class_id: null,
        is_locked: false,
        locked_at: null,
        categories: data.categories,
      },
    });
  }

  async updateDefault(
    orgId: string,
    data: { name?: string; categories?: object },
  ) {
    return this.db.rubric.updateMany({
      where: { org_id: orgId, is_default: true },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.categories !== undefined ? { categories: data.categories } : {}),
      },
    });
  }

  // ── Educator personal library ───────────────────────────────────────────────

  async create(data: {
    orgId: string;
    educatorId: string;
    name: string;
    categories: object;
  }) {
    return this.db.rubric.create({
      data: {
        org_id: data.orgId,
        educator_id: data.educatorId,
        name: data.name,
        is_default: false,
        class_id: null,
        is_locked: false,
        locked_at: null,
        categories: data.categories,
      },
    });
  }

  async findByEducator(orgId: string, educatorId: string) {
    return this.db.rubric.findMany({
      where: { org_id: orgId, educator_id: educatorId, is_default: false },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.rubric.findFirst({
      where: { id, org_id: orgId },
    });
  }

  async update(id: string, data: { name?: string; categories?: object }) {
    return this.db.rubric.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.categories !== undefined ? { categories: data.categories } : {}),
      },
    });
  }

  // ── Lock / unlock ───────────────────────────────────────────────────────────

  async lock(id: string) {
    return this.db.rubric.update({
      where: { id },
      data: { is_locked: true, locked_at: new Date() },
    });
  }

  async lockByClassId(classId: string) {
    return this.db.rubric.updateMany({
      where: { class_id: classId },
      data: { is_locked: true, locked_at: new Date() },
    });
  }

  async assignToClass(id: string, classId: string) {
    return this.db.rubric.update({
      where: { id },
      data: { class_id: classId },
    });
  }
}