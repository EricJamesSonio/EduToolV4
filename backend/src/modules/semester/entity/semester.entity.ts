// @/modules/semester/entity/semester.entity.ts

export class TermEntity {
  id: string;
  semesterId: string;
  name: string;
  orderIndex: number;
  startDate: Date;
  endDate: Date;
}

export class SemesterEntity {
  id: string;
  orgId: string;
  schoolYearId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  terms: TermEntity[];
}