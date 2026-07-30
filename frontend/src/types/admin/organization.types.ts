export interface Organization {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  logoUrl: string | null;
  emailExtension: string | null; // e.g. "@edutool.ph"
  createdAt: string;
  updatedAt: string;
}