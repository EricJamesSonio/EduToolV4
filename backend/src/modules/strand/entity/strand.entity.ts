// backend/src/modules/strand/entity/strand.entity.ts

export class StrandSubjectPrerequisiteEntity {
  prerequisite: {
    id: string;
    name: string;
  };
}

export class StrandSubjectEntity {
  id: string;
  name: string;
  yearLevel: number;
  termLabel: string;
  prerequisites?: StrandSubjectPrerequisiteEntity[];
}

export class StrandEntity {
  id: string;
  orgId: string;
  programId: string;
  name: string;
  createdAt?: Date;
  subjects?: StrandSubjectEntity[];
}
