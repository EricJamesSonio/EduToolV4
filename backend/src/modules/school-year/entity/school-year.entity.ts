export class SchoolYearEntity {
  id!: string;
  org_id!: string;
  name!: string;
  status!: 'pending' | 'active' | 'ended';
  start_date!: Date | null;
  end_date!: Date | null;
}
