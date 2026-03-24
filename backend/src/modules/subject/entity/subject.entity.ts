// src/modules/subject/entity/subject.entity.ts

export class SubjectEntity {
  id: string;
  orgId: string;
  name: string;
  levelId: string;
  educatorId: string | null;
  isLocked: boolean;
}