import { NotFoundException } from '@nestjs/common';
import { UploadService } from '../upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let db: any;

  beforeEach(() => {
    db = {
      profile: { findUnique: jest.fn(), update: jest.fn() },
      organization: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new UploadService(db);
    jest.clearAllMocks();
  });

  describe('saveProfileImage', () => {
    it('throws NotFound when profile missing', async () => {
      db.profile.findUnique.mockResolvedValue(null);
      await expect(service.saveProfileImage('acc-1', 'path.png')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updates and returns path', async () => {
      db.profile.findUnique.mockResolvedValue({ account_id: 'acc-1' });
      db.profile.update.mockResolvedValue({});
      const res = await service.saveProfileImage('acc-1', 'profiles/acc-1.png');
      expect(db.profile.update).toHaveBeenCalledWith({ where: { account_id: 'acc-1' }, data: { profile_image: 'profiles/acc-1.png' } });
      expect(res).toBe('profiles/acc-1.png');
    });
  });

  describe('getProfileImage', () => {
    it('returns null when profile missing', async () => {
      db.profile.findUnique.mockResolvedValue(null);
      expect(await service.getProfileImage('nope')).toBeNull();
    });
    it('returns image when exists', async () => {
      db.profile.findUnique.mockResolvedValue({ profile_image: 'profiles/a.png' });
      expect(await service.getProfileImage('acc-1')).toBe('profiles/a.png');
    });
    it('returns null when profile_image null', async () => {
      db.profile.findUnique.mockResolvedValue({ profile_image: null });
      expect(await service.getProfileImage('acc-1')).toBeNull();
    });
  });

  describe('saveOrganizationLogo', () => {
    it('throws NotFound when org missing', async () => {
      db.organization.findUnique.mockResolvedValue(null);
      await expect(service.saveOrganizationLogo('org-1', 'logo.png')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updates and returns path', async () => {
      db.organization.findUnique.mockResolvedValue({ id: 'org-1' });
      const res = await service.saveOrganizationLogo('org-1', 'orgs/logo.png');
      expect(db.organization.update).toHaveBeenCalledWith({ where: { id: 'org-1' }, data: { logo_url: 'orgs/logo.png' } });
      expect(res).toBe('orgs/logo.png');
    });
  });
});
