// src/modules/concern/category/concern-category.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConcernCoreService } from '../core/concern-core.service';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/concern.dto';

@Injectable()
export class ConcernCategoryService {
  constructor(
    private readonly core: ConcernCoreService,
    private readonly db: DatabaseService,
  ) {}

  list(orgId: string) {
    return this.core.findAllCategories(orgId);
  }

  async create(orgId: string, dto: CreateCategoryDto) {
    const label = dto.label.trim();

    const existing = await this.db.concernCategory.findUnique({
      where: { org_id_label: { org_id: orgId, label } },
    });
    if (existing) {
      // If it was deactivated, reactivate it instead of erroring / duplicating.
      if (!existing.is_active) {
        return this.db.concernCategory.update({
          where: { id: existing.id },
          data: { is_active: true },
        });
      }
      throw new ConflictException('A category with that label already exists.');
    }

    return this.db.concernCategory.create({
      data: { org_id: orgId, label, is_default: false },
    });
  }

  async update(orgId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.core.findCategoryById(orgId, categoryId);
    if (!category) throw new NotFoundException('Category not found.');

    const data: { label?: string; is_active?: boolean } = {};

    if (dto.label !== undefined) {
      const label = dto.label.trim();
      if (label.length === 0)
        throw new NotFoundException('Label cannot be empty.');

      const dup = await this.db.concernCategory.findFirst({
        where: { org_id: orgId, label, NOT: { id: categoryId } },
      });
      if (dup)
        throw new ConflictException(
          'A category with that label already exists.',
        );

      data.label = label;
    }

    if (dto.is_active !== undefined) {
      data.is_active = dto.is_active;
    }

    return this.db.concernCategory.update({
      where: { id: categoryId },
      data,
    });
  }
}
