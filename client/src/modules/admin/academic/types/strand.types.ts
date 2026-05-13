export interface Strand {
  id: string;
  orgId?: string;
  programId: string;
  name: string;
}

export interface CreateStrandDto {
  schoolYearId: string;
  program_id: string;
  name: string;
}

export interface UpdateStrandDto {
  name?: string;
}
