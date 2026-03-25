// @/modules/educator/entity/educator.entity.ts

export class EducatorEntity {
  id: string;
  orgId: string;
  email: string;
  status: string;
  createdAt: Date;

  // from Profile
  fullName: string;
  educatorId: string; // system-generated, stored in profile.metadata
}

export class EducatorCredentialsEntity {
  id: string;
  email: string;
  fullName: string;
  educatorId: string;
  plainPassword: string; // only returned on create or reset — never stored plain
}