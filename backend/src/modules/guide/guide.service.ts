import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { CreateGuideStepDto } from './dto/create-guide-step.dto';
import { UpdateGuideStepDto } from './dto/update-guide-step.dto';

const GUIDE_WITH_STEPS_SELECT = {
  id: true,
  slug: true,
  portal: true,
  title: true,
  description: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  steps: {
    orderBy: { order_index: 'asc' },
    select: {
      id: true,
      order_index: true,
      title: true,
      content: true,
      image_url: true,
      created_at: true,
      updated_at: true,
    },
  },
} as const;

@Injectable()
export class GuideService {
  constructor(private db: DatabaseService) {}

  // ─── GUIDES ────────────────────────────────────────────────────────────────

  async getGuides(portal?: string) {
    const where: Prisma.GuideWhereInput = portal ? { portal: portal as any } : {};
    const guides = await this.db.guide.findMany({
      where,
      orderBy: [{ portal: 'asc' }, { slug: 'asc' }],
      select: {
        id: true,
        slug: true,
        portal: true,
        title: true,
        description: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: { steps: true },
        },
      },
    });

    return guides.map((g) => ({
      id: g.id,
      slug: g.slug,
      portal: g.portal,
      title: g.title,
      description: g.description,
      isActive: g.is_active,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      stepCount: g._count.steps,
    }));
  }

  async getGuidesWithSteps(portal: string) {
    return this.db.guide.findMany({
      where: { portal: portal as any, is_active: true },
      orderBy: { slug: 'asc' },
      select: GUIDE_WITH_STEPS_SELECT,
    });
  }

  async getGuideById(id: string) {
    const guide = await this.db.guide.findUnique({
      where: { id },
      select: GUIDE_WITH_STEPS_SELECT,
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    return this.mapGuide(guide);
  }

  async findBySlug(slug: string) {
    const guide = await this.db.guide.findUnique({
      where: { slug },
      select: GUIDE_WITH_STEPS_SELECT,
    });

    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    return this.mapGuide(guide);
  }

  async createGuide(dto: CreateGuideDto) {
    const existing = await this.db.guide.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('A guide with this slug already exists');
    }

    const guide = await this.db.guide.create({
      data: {
        slug: dto.slug,
        portal: dto.portal,
        title: dto.title,
        description: dto.description,
        is_active: dto.isActive ?? true,
      },
      select: GUIDE_WITH_STEPS_SELECT,
    });

    return this.mapGuide(guide);
  }

  async updateGuide(id: string, dto: UpdateGuideDto) {
    const existing = await this.db.guide.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Guide not found');
    }

    const guide = await this.db.guide.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
      select: GUIDE_WITH_STEPS_SELECT,
    });

    return this.mapGuide(guide);
  }

  async deleteGuide(id: string) {
    const existing = await this.db.guide.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Guide not found');
    }

    await this.db.guide.delete({ where: { id } });
    return { success: true };
  }

  // ─── GUIDE STEPS ──────────────────────────────────────────────────────────

  async createStep(guideId: string, dto: CreateGuideStepDto) {
    const guide = await this.db.guide.findUnique({ where: { id: guideId } });
    if (!guide) {
      throw new NotFoundException('Guide not found');
    }

    const step = await this.db.guideStep.create({
      data: {
        guide_id: guideId,
        order_index: dto.orderIndex,
        title: dto.title,
        content: dto.content,
        image_url: dto.imageUrl,
      },
      select: {
        id: true,
        order_index: true,
        title: true,
        content: true,
        image_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapStep(step);
  }

  async updateStep(stepId: string, dto: UpdateGuideStepDto) {
    const step = await this.db.guideStep.findUnique({ where: { id: stepId } });
    if (!step) {
      throw new NotFoundException('Guide step not found');
    }

    const updated = await this.db.guideStep.update({
      where: { id: stepId },
      data: {
        ...(dto.orderIndex !== undefined && { order_index: dto.orderIndex }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.imageUrl !== undefined && { image_url: dto.imageUrl }),
      },
      select: {
        id: true,
        order_index: true,
        title: true,
        content: true,
        image_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapStep(updated);
  }

  async deleteStep(stepId: string) {
    const step = await this.db.guideStep.findUnique({ where: { id: stepId } });
    if (!step) {
      throw new NotFoundException('Guide step not found');
    }

    await this.db.guideStep.delete({ where: { id: stepId } });
    return { success: true };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private mapGuide(guide: Prisma.GuideGetPayload<{ select: typeof GUIDE_WITH_STEPS_SELECT }>) {
    return {
      id: guide.id,
      slug: guide.slug,
      portal: guide.portal,
      title: guide.title,
      description: guide.description,
      isActive: guide.is_active,
      createdAt: guide.created_at,
      updatedAt: guide.updated_at,
      steps: guide.steps.map((s) => this.mapStep(s)),
    };
  }

  private mapStep(step: {
    id: string;
    order_index: number;
    title: string | null;
    content: string;
    image_url: string | null;
    created_at: Date;
    updated_at: Date;
  }) {
    return {
      id: step.id,
      orderIndex: step.order_index,
      title: step.title,
      content: step.content,
      imageUrl: step.image_url,
      createdAt: step.created_at,
      updatedAt: step.updated_at,
    };
  }
}
