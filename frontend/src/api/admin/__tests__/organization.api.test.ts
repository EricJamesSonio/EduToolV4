import { organizationApi } from '../organization.api';
import client from '@/api/client';
import type { AxiosError } from 'axios';

jest.mock('@/api/client', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockedClient = client as jest.Mocked<typeof client>;

describe('organizationApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('uploadOrgLogo', () => {
    it('posts FormData and returns logoUrl', async () => {
      const mockFile = new File(['content'], 'logo.png', { type: 'image/png' });
      mockedClient.post.mockResolvedValue({ data: { success: true, data: { logoUrl: 'orgs/logo.png' } } } as any);
      const res = await organizationApi.uploadOrgLogo(mockFile);
      expect(mockedClient.post).toHaveBeenCalledWith('/uploads/organization-logo', expect.any(FormData), expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' }) }));
      expect(res).toEqual({ logoUrl: 'orgs/logo.png' });
    });
  });

  describe('getOrg', () => {
    it('returns organization on success', async () => {
      mockedClient.get.mockResolvedValue({ data: { success: true, data: { id: 'org-1', name: 'Test' } } } as any);
      const res = await organizationApi.getOrg();
      expect(res).toEqual({ id: 'org-1', name: 'Test' });
      expect(mockedClient.get).toHaveBeenCalledWith('/organization');
    });

    it('returns null on 404', async () => {
      const err = { response: { status: 404 } } as AxiosError;
      mockedClient.get.mockRejectedValue(err);
      expect(await organizationApi.getOrg()).toBeNull();
    });

    it('re-throws non-404 errors', async () => {
      const err = { response: { status: 500 } } as AxiosError;
      mockedClient.get.mockRejectedValue(err);
      await expect(organizationApi.getOrg()).rejects.toEqual(err);
    });
  });

  describe('createOrg', () => {
    it('posts and returns data', async () => {
      mockedClient.post.mockResolvedValue({ data: { success: true, data: { id: 'org-1', name: 'New Org' } } } as any);
      const res = await organizationApi.createOrg({ name: 'New Org' });
      expect(mockedClient.post).toHaveBeenCalledWith('/organization', { name: 'New Org' });
      expect(res.name).toBe('New Org');
    });
  });

  describe('updateOrg', () => {
    it('patches and returns data', async () => {
      mockedClient.patch.mockResolvedValue({ data: { success: true, data: { id: 'org-1', name: 'Updated' } } } as any);
      const res = await organizationApi.updateOrg({ name: 'Updated' });
      expect(mockedClient.patch).toHaveBeenCalledWith('/organization', { name: 'Updated' });
      expect(res.name).toBe('Updated');
    });
  });

  describe('seedOrg', () => {
    it('posts seed data', async () => {
      mockedClient.post.mockResolvedValue({ data: { success: true, data: { success: true, message: 'Seeded', result: {} } } } as any);
      const payload: any = { schoolYearId: 'sy-1', programs: ['elem'] };
      const res = await organizationApi.seedOrg(payload);
      expect(mockedClient.post).toHaveBeenCalledWith('/organization/seed', payload);
      expect(res.success).toBe(true);
    });
  });

  describe('validateEmailExtension', () => {
    it('posts and returns isUnique', async () => {
      mockedClient.post.mockResolvedValue({ data: { success: true, data: { isUnique: true } } } as any);
      const res = await organizationApi.validateEmailExtension('@school.edu');
      expect(mockedClient.post).toHaveBeenCalledWith('/organization/validate-email-extension', { emailExtension: '@school.edu' });
      expect(res.isUnique).toBe(true);
    });
  });

  describe('checkHasAccounts', () => {
    it('gets and returns hasAccounts', async () => {
      mockedClient.get.mockResolvedValue({ data: { success: true, data: { hasAccounts: true, count: 5 } } } as any);
      const res = await organizationApi.checkHasAccounts();
      expect(mockedClient.get).toHaveBeenCalledWith('/organization/check-accounts');
      expect(res.count).toBe(5);
    });
  });
});
