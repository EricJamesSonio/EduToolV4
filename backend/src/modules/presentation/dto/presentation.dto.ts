import { z } from 'zod';

export const CreatePresentationDto = z.object({
  lessonId: z.string().uuid(),
  title: z.string().min(1).max(255),
  template: z.string().min(1).max(50).default('modern'),
  settings: z.record(z.string(), z.any()).optional(),
});

export const UpdatePresentationDto = z.object({
  title: z.string().min(1).max(255).optional(),
  template: z.string().min(1).max(50).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

export const SlideAssignmentDto = z.object({
  slideNumber: z.number().int().min(1),
  title: z.string().optional(),
  content: z.string(),
  lessonSection: z.string().optional(),
});

export const GenerateSlidesDto = z.object({
  slides: z.array(SlideAssignmentDto).min(1),
});
