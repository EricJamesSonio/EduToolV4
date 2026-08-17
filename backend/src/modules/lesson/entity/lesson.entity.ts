// @/modules/lesson/entity/lesson.entity.ts

export class LessonConceptEntity {
  id: string;
  orgId: string;
  lessonId: string;
  content: Record<string, any>; // { sections: [{ name, items: [] }] }
  createdAt: Date;
}

export class LessonEntity {
  id: string;
  orgId: string;
  classId: string;
  title: string;
  description: string | null;
  weekNumber: number;
  subIndex: number;
  detail: string | null;
  createdAt: Date;
  concept?: LessonConceptEntity | null;
}
