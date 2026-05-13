import apiClient from './apiClient';
import type {
  CreateOrganizationDto,
  Organization,
  SeedOrganizationDto,
  SeedOrganizationResponse,
  UpdateOrganizationDto,
} from '../types/organization.types';

interface RawOrganization {
  id: string;
  name: string;
  description: string | null;
  emailExtension?: string | null;
  email_extension?: string | null;
}

const normalizeOrganization = (org: RawOrganization): Organization => ({
  id: org.id,
  name: org.name,
  description: org.description,
  emailExtension: org.emailExtension ?? org.email_extension ?? null,
});

export const organizationApi = {
  getOwn: async (): Promise<Organization | null> => {
    try {
      const response = await apiClient.get('/organization', {
        suppressErrorToast: true,
      } as any);
      return normalizeOrganization(response.data as RawOrganization);
    } catch (error) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  create: async (data: CreateOrganizationDto): Promise<Organization> => {
    const response = await apiClient.post('/organization', data);
    return normalizeOrganization(response.data as RawOrganization);
  },

  update: async (data: UpdateOrganizationDto): Promise<Organization> => {
    const response = await apiClient.patch('/organization', data);
    return normalizeOrganization(response.data as RawOrganization);
  },

  seed: async (data: SeedOrganizationDto): Promise<SeedOrganizationResponse> => {
    const response = await apiClient.post<SeedOrganizationResponse>('/organization/seed', data);
    return response.data;
  },
};
