import { Injectable, NotFoundException } from '@nestjs/common';
import { PresentationRepository } from './presentation.repository';
import { LessonRepository } from '../lesson/lesson.repository';
import { generateSlidesFromLesson, SlideInput } from './utils/slide-generator.utils';

@Injectable()
export class PresentationService {
  constructor(
    private readonly repo: PresentationRepository,
    private readonly lessonRepo: LessonRepository,
  ) {}

  async create(orgId: string, classId: string, educatorId: string, dto: {
    lessonId: string;
    title: string;
    template?: string;
    settings?: Record<string, any>;
  }) {
    const lesson = await this.lessonRepo.findById(dto.lessonId, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    return this.repo.create({
      orgId,
      classId,
      lessonId: dto.lessonId,
      title: dto.title,
      template: dto.template ?? 'modern',
      settings: dto.settings ?? {},
    });
  }

  async findAll(orgId: string, classId: string) {
    return this.repo.findAll(orgId, classId);
  }

  async findByLesson(orgId: string, classId: string, lessonId: string) {
    return this.repo.findByLesson(orgId, classId, lessonId);
  }

  async findOne(id: string, orgId: string) {
    const presentation = await this.repo.findById(id, orgId);
    if (!presentation) throw new NotFoundException('Presentation not found');
    return presentation;
  }

  async update(id: string, orgId: string, dto: { title?: string; template?: string; settings?: Record<string, any> }) {
    const existing = await this.repo.findById(id, orgId);
    if (!existing) throw new NotFoundException('Presentation not found');
    return this.repo.update(id, dto);
  }

  async delete(id: string, orgId: string) {
    const existing = await this.repo.findById(id, orgId);
    if (!existing) throw new NotFoundException('Presentation not found');
    await this.repo.delete(id);
  }

  async generateSlides(orgId: string, presentationId: string, slides: SlideInput[]) {
    const presentation = await this.repo.findById(presentationId, orgId);
    if (!presentation) throw new NotFoundException('Presentation not found');

    const sorted = [...slides].sort((a, b) => a.slideNumber - b.slideNumber);
    const renumbered = sorted.map((s, i) => ({ ...s, slideNumber: i + 1 }));

    return this.repo.replaceSlides(presentationId, renumbered);
  }

  async autoGenerate(orgId: string, presentationId: string) {
    const presentation = await this.repo.findById(presentationId, orgId);
    if (!presentation) throw new NotFoundException('Presentation not found');

    const lesson = await this.lessonRepo.findById(presentation.lesson_id, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const slides = generateSlidesFromLesson(lesson);
    return this.repo.replaceSlides(presentationId, slides);
  }
}
