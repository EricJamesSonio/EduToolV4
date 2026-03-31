// frontend/src/types/admin/strand.types.ts

export interface StrandSubjectPrerequisite {
  prerequisite: {
    id: string;
    name: string;
  };
}

export interface StrandSubject {
  id: string;
  name: string;
  yearLevel: number;
  termLabel: string;
  prerequisites?: StrandSubjectPrerequisite[];
}

export interface Strand {
  id: string;
  orgId: string;       // maps from backend org_id
  programId: string;   // maps from backend program_id
  name: string;
  createdAt?: string;  // maps from backend created_at
  subjects?: StrandSubject[];
}