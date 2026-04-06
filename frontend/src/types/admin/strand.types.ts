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
  orgId: string;
  schoolYearId: string; // added — schema school_year_id is now required
  programId: string;
  name: string;
  createdAt?: string;
  subjects?: StrandSubject[];
}