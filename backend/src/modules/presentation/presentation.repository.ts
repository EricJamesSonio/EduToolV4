import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class PresentationRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(data: {
    orgId: string;
    classId: string;
    lessonId: string;
    title: string;
    template: string;
    settings: Record<string, any>;
  }) {
    return this.db.presentation.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        lesson_id: data.lessonId,
        title: data.title,
        template: data.template,
        settings: data.settings ?? {},
      },
    });
  }

  async findAll(orgId: string, classId: string) {
    return this.db.presentation.findMany({
      where: { org_id: orgId, class_id: classId },
      orderBy: { created_at: 'desc' },
      include: { slides: { orderBy: { slide_number: 'asc' } } },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.presentation.findFirst({
      where: { id, org_id: orgId },
      include: { slides: { orderBy: { slide_number: 'asc' } } },
    });
  }

  async findByLesson(orgId: string, classId: string, lessonId: string) {
    return this.db.presentation.findFirst({
      where: { org_id: orgId, class_id: classId, lesson_id: lessonId },
      include: { slides: { orderBy: { slide_number: 'asc' } } },
    });
  }

  async update(
    id: string,
    data: { title?: string; template?: string; settings?: Record<string, any> },
  ) {
    return this.db.presentation.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.template !== undefined ? { template: data.template } : {}),
        ...(data.settings !== undefined ? { settings: data.settings } : {}),
      },
    });
  }

  async delete(id: string) {
    await this.db.presentation.delete({ where: { id } });
  }

  async replaceSlides(
    presentationId: string,
    slides: { slideNumber: number; title?: string; content: string; lessonSection?: string }[],
  ) {
    await this.db.slide.deleteMany({ where: { presentation_id: presentationId } });
    if (slides.length === 0) return [];
    const created = await this.db.slide.createManyAndReturn({
      data: slides.map((s) => ({
        presentation_id: presentationId,
        slide_number: s.slideNumber,
        title: s.title ?? null,
        content: s.content,
        lesson_section: s.lessonSection ?? null,
      })),
    });
    return created.sort((a, b) => a.slide_number - b.slide_number);
  }
}
