// src/modules/student/entity/student.entity.ts

export type StudentStatus =
  | 'active'
  | 'pending'
  | 'dropped'
  | 'transferred'
  | 'suspended'
  | 'graduated';

export class StudentEntity {
  id: string;
  orgId: string;
  email: string;
  status: StudentStatus;
  createdAt: Date;

  // from Profile
  fullName: string;
  studentId: string;    // Admin-assigned, stored in profile.metadata
  levelId: string;      // stored in profile.metadata
  sectionId: string;    // stored in profile.metadata
  metadata: Record<string, any>;
}

export class StudentCredentialsEntity {
  fullName: string;
  studentId: string;
  email: string;
  plainPassword: string;
  levelSection: string;
  section: string;
  accountStatus: string;
}