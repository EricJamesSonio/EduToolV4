export interface Organization {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  emailExtension: string | null; // e.g. "@edutool.ph"
  /** Backend always sends this (defaults false). Drives the Automation toggle. */
  autoSeedNewSchoolYears: boolean;
  createdAt: string;
  updatedAt: string;
}