// @/modules/school-year/entity/school-year.entity.ts

export type SchoolYearStatus = 'pending' | 'active' | 'ended';

export class SchoolYearEntity {
  id: string;
  orgId: string;
  name: string;
  status: SchoolYearStatus;
}