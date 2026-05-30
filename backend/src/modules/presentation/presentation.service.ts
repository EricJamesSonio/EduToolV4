import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PresentationRepository } from './presentation.repository';
import { LessonRepository } from '../lesson/lesson.repository';

interface SlideInput {
  slideNumber: number;
  title?: string;
  content: string;
  lessonSection?: string;
}

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

    // Validate and re-number
    const sorted = [...slides].sort((a, b) => a.slideNumber - b.slideNumber);
    const renumbered = sorted.map((s, i) => ({ ...s, slideNumber: i + 1 }));

    return this.repo.replaceSlides(presentationId, renumbered);
  }

  /**
   * Auto-generate slides from lesson detail content.
   * Splits content by sections (## headers) or paragraphs into individual slides.
   */
  async autoGenerate(orgId: string, presentationId: string) {
    const presentation = await this.repo.findById(presentationId, orgId);
    if (!presentation) throw new NotFoundException('Presentation not found');

    const lesson = await this.lessonRepo.findById(presentation.lesson_id, orgId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const slides = this.splitContentIntoSlides(lesson);
    return this.repo.replaceSlides(presentationId, slides);
  }

  private splitContentIntoSlides(lesson: { title: string; detail?: string | null; description?: string | null }): SlideInput[] {
    const slides: SlideInput[] = [];
    let slideNum = 1;

    slides.push({
      slideNumber: slideNum++,
      title: lesson.title,
      content: lesson.description ?? lesson.title,
      lessonSection: 'title',
    });

    const detail = lesson.detail ?? '';
    if (!detail) return slides;

    const sections = this.parseSections(detail);

    if (sections.length === 0) {
      const paragraphs = detail.split(/\n\n+/).filter(Boolean);
      for (const para of paragraphs) {
        slides.push({
          slideNumber: slideNum++,
          content: para,
          lessonSection: 'content',
        });
      }
    } else {
      for (const section of sections) {
        const content = section.heading
          ? `# ${section.heading}\n\n${section.body}`
          : section.body;
        slides.push({
          slideNumber: slideNum++,
          title: section.heading ?? undefined,
          content,
          lessonSection: section.heading?.toLowerCase().replace(/\s+/g, '_') ?? 'content',
        });
      }
    }

    return slides;
  }

  private parseSections(detail: string): { heading?: string; body: string }[] {
    const lines = detail.split('\n');
    const sections: { heading?: string; body: string }[] = [];
    let currentHeading: string | undefined;
    let currentBody: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^#{2,4}\s+(.+)$/);
      if (headingMatch) {
        if (currentBody.length > 0 || currentHeading) {
          sections.push({
            heading: currentHeading,
            body: currentBody.join('\n').trim(),
          });
        }
        currentHeading = headingMatch[1];
        currentBody = [];
      } else {
        currentBody.push(line);
      }
    }

    if (currentBody.length > 0 || currentHeading) {
      sections.push({
        heading: currentHeading,
        body: currentBody.join('\n').trim(),
      });
    }

    return sections;
  }
}
