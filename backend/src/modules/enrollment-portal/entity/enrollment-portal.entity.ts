// src/modules/enrollment-portal/entity/enrollment-portal.entity.ts

export interface PublicLevelOption {
  id: string;
  name: string;
}

export interface PublicCourseOption {
  id: string;
  name: string;
  code: string | null;
  levels: PublicLevelOption[];
}

export interface PublicStrandOption {
  id: string;
  name: string;
  levels: PublicLevelOption[];
}

export interface PublicProgramOption {
  id: string;
  name: string;
  type: string;
  courses: PublicCourseOption[];
  strands: PublicStrandOption[];
  levels: PublicLevelOption[];
}
export interface PublicPortalInfo {
  org: { id: string; name: string; slug: string };
  period: {
    id: string;
    name: string;
    start_date: Date;
    end_date: Date;
    lock_date: Date;
    is_open: boolean;
  };
  schoolYear: { id: string; name: string };
  programs: PublicProgramOption[];
}

export interface EnrollmentSessionClaims {
  type: 'enrollment';
  orgId: string;
  schoolYearId: string;
  periodId: string;
  personalEmail: string;
  applicationId: string | null;
}

export interface ApplicationListItem {
  id: string;
  application_code: string;
  personal_email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  status: string;
}
