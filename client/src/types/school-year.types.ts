// School Year Types
// Type definitions for school year related components and APIs

export interface SchoolYear {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
