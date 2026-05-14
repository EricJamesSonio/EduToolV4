export type EducatorStatus = 'active' | 'suspended';

export interface Educator {
  id: string;
  orgId: string;
  email: string;
  status: EducatorStatus;
  fullName: string | null;
  educatorId: string | null;
  createdAt: string;
  personalEmail: string | null;
}

export interface EducatorQueryParams {
  search?: string;
  status?: EducatorStatus;
}

export interface CreateEducatorDto {
  fullName: string;
  emailName: string;
}

export interface UpdateEducatorDto {
  fullName?: string;
  emailName?: string;
}

export interface UpdateEducatorStatusDto {
  status: EducatorStatus;
}

export interface EducatorWithPassword extends Educator {
  plainPassword: string;
}

export interface ResetEducatorPasswordResponse {
  id: string;
  plainPassword: string;
}
