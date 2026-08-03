import { NotFoundException } from '@nestjs/common';
import { ProfileService } from '../profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const profileRepository = {
    findByAccountId: jest.fn(),
    updatePersonalEmail: jest.fn(),
    updateProfile: jest.fn(),
    findAccountWithProfile: jest.fn(),
  };

  const accountWithProfile = {
    id: 'acc-1',
    org_id: 'org-1',
    role: 'student',
    email: 'student@school.edu',
    status: 'active',
    created_at: new Date('2024-01-01'),
    profile: {
      full_name: 'Jane Doe',
      metadata: { studentId: 'S-100' },
      personal_email: 'jane@home.com',
      profile_image: 'profiles/uuid.png',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(new ProfileService(profileRepository as never)).toBeDefined();
  });

  describe('getProfile', () => {
    it('returns the mapped profile for the account', async () => {
      profileRepository.findAccountWithProfile.mockResolvedValue(accountWithProfile);
      service = new ProfileService(profileRepository as never);

      const result = await service.getProfile('acc-1');

      expect(profileRepository.findAccountWithProfile).toHaveBeenCalledWith('acc-1');
      expect(result).toEqual({
        id: 'acc-1',
        orgId: 'org-1',
        role: 'student',
        email: 'student@school.edu',
        status: 'active',
        createdAt: accountWithProfile.created_at,
        fullName: 'Jane Doe',
        metadata: { studentId: 'S-100' },
        personalEmail: 'jane@home.com',
        profileImage: 'profiles/uuid.png',
      });
    });

    it('throws NotFoundException when account is missing', async () => {
      profileRepository.findAccountWithProfile.mockResolvedValue(null);
      service = new ProfileService(profileRepository as never);

      await expect(service.getProfile('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates allowed fields and returns the refreshed profile', async () => {
      profileRepository.findByAccountId.mockResolvedValue({ id: 'p-1' });
      profileRepository.updateProfile.mockResolvedValue({ id: 'p-1' });
      profileRepository.findAccountWithProfile.mockResolvedValue(accountWithProfile);
      service = new ProfileService(profileRepository as never);

      const result = await service.updateProfile('acc-1', {
        fullName: 'Jane Doe',
        personalEmail: 'jane@home.com',
        profileImage: 'profiles/new.png',
      });

      expect(profileRepository.updateProfile).toHaveBeenCalledWith('acc-1', {
        fullName: 'Jane Doe',
        personalEmail: 'jane@home.com',
        profileImage: 'profiles/new.png',
      });
      expect(result?.fullName).toBe('Jane Doe');
    });

    it('throws NotFoundException when profile is missing', async () => {
      profileRepository.findByAccountId.mockResolvedValue(null);
      service = new ProfileService(profileRepository as never);

      await expect(service.updateProfile('nope', { fullName: 'X' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});