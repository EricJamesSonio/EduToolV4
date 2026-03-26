export interface Educator {
  id: string;
  orgId: string;
  fullName: string;
  email: string;
  educatorCode: string;
  classCount: number;
  createdAt: string;
  updatedAt: string;
  /** Only present immediately after creation or password reset */
  password?: string;
}

export interface EducatorCredentials {
  fullName: string;
  email: string;
  educatorCode: string;
  password: string;
}