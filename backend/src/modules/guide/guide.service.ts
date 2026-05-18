import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '@/core/database/database.provider';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { CreateGuideStepDto } from './dto/create-guide-step.dto';
import { UpdateGuideStepDto } from './dto/update-guide-step.dto';

const GUIDE_WITH_STEPS_SELECT = {
  id: true,
  portal: true,
  page_path: true,
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
      text: true,
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
      orderBy: [{ portal: 'asc' }, { page_path: 'asc' }],
      select: {
        id: true,
        portal: true,
        page_path: true,
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
      portal: g.portal,
      pagePath: g.page_path,
      title: g.title,
      description: g.description,
      isActive: g.is_active,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
      stepCount: g._count.steps,
    }));
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

  async getGuideByPortalAndPath(portal: string, pagePath: string) {
    const guide = await this.db.guide.findUnique({
      where: { portal_page_path: { portal: portal as any, page_path: pagePath } },
      select: GUIDE_WITH_STEPS_SELECT,
    });

    if (!guide) {
      throw new NotFoundException('Guide not found for this page');
    }

    return this.mapGuide(guide);
  }

  async createGuide(dto: CreateGuideDto) {
    const existing = await this.db.guide.findUnique({
      where: {
        portal_page_path: { portal: dto.portal, page_path: dto.page_path },
      },
    });

    if (existing) {
      throw new ConflictException('A guide for this page already exists');
    }

    const guide = await this.db.guide.create({
      data: {
        portal: dto.portal,
        page_path: dto.page_path,
        title: dto.title,
        description: dto.description,
        is_active: dto.is_active ?? false,
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
      data: dto,
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
        order_index: dto.order_index,
        title: dto.title,
        text: dto.text,
        image_url: dto.image_url,
      },
      select: {
        id: true,
        order_index: true,
        title: true,
        text: true,
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
      data: dto,
      select: {
        id: true,
        order_index: true,
        title: true,
        text: true,
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
      portal: guide.portal,
      pagePath: guide.page_path,
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
    text: string;
    image_url: string | null;
    created_at: Date;
    updated_at: Date;
  }) {
    return {
      id: step.id,
      orderIndex: step.order_index,
      title: step.title,
      text: step.text,
      imageUrl: step.image_url,
      createdAt: step.created_at,
      updatedAt: step.updated_at,
    };
  }
}
