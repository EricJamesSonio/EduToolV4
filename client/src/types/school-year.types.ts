// School Year Types
// Type definitions for school year related components and APIs

export interface SchoolYear {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  start_date?: string;
  end_date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchoolYearDto {
  name: string;
  start_date?: string;
  end_date?: string;
  confirm_short_duration?: boolean;
}
