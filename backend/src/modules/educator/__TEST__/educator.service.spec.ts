import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EducatorService } from '../educator.service';

jest.mock('../educator.utils', () => ({
  generateEducatorId: jest.fn().mockReturnValue('EDU-001'),
  generateSystemPassword: jest.fn().mockReturnValue('Pass123!'),
}));
jest.mock('@/commons/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed'),
}));

import { generateEducatorId, generateSystemPassword } from '../educator.utils';
import { hashPassword } from '@/commons/utils/hash.util';

describe('EducatorService', () => {
  let service: EducatorService;
  let repo: any;
  let classService: any;
  let orgService: any;
  const orgId = 'org-1';

  beforeEach(() => {
    repo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEducatorId: jest.fn(),
      updateProfile: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
      updatePassword: jest.fn(),
      findEmailsInBatch: jest.fn(),
    };
    classService = {
      hasActiveClasses: jest.fn(),
      getEducatorClassCounts: jest.fn().mockResolvedValue(new Map()),
    };
    orgService = { getOwn: jest.fn() };
    service = new EducatorService(repo, classService, orgService);
    jest.clearAllMocks();
    (generateEducatorId as jest.Mock).mockReturnValue('EDU-001');
    (generateSystemPassword as jest.Mock).mockReturnValue('Pass123!');
    (hashPassword as jest.Mock).mockResolvedValue('hashed');
  });

  describe('create', () => {
    it('throws BadRequest when fullName missing', async () => {
      await expect(service.create(orgId, { fullName: '', emailName: 'john' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws BadRequest when emailName missing', async () => {
      await expect(service.create(orgId, { fullName: 'John Doe', emailName: '' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws BadRequest when org has no emailExtension', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: null });
      await expect(service.create(orgId, { fullName: 'John Doe', emailName: 'john' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws when emailName contains @', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      await expect(service.create(orgId, { fullName: 'John Doe', emailName: 'john@school.edu' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('builds educator email correctly (school.edu -> school.educator.edu)', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: '1', org_id: orgId, email: 'john@school.educator.edu', status: 'active', profile: { full_name: 'John Doe' }, created_at: new Date() });
      const res = await service.create(orgId, { fullName: 'John Doe', emailName: 'john' } as any);
      expect(repo.findByEmail).toHaveBeenCalledWith('john@school.educator.edu', orgId);
      expect(res.email).toBe('john@school.educator.edu');
      expect(res.plainPassword).toBe('Pass123!');
      expect(hashPassword).toHaveBeenCalledWith('Pass123!');
    });
    it('throws Conflict when email exists', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findByEmail.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, { fullName: 'John Doe', emailName: 'john' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll / findById', () => {
    it('findAll paginates and adds classCounts', async () => {
      repo.findAll.mockResolvedValue({ data: [{ id: '1', org_id: orgId, email: 'a@b.com', status: 'active', profile: { full_name: 'A', metadata: {} }, created_at: new Date() }], total: 1 });
      classService.getEducatorClassCounts.mockResolvedValue(new Map([['1', 3]]));
      const res = await service.findAll(orgId, { page: 1, limit: 10 } as any);
      expect(res.meta.total).toBe(1);
      expect(res.data[0].classCount).toBe(3);
    });
    it('findById throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('findById returns with count', async () => {
      repo.findById.mockResolvedValue({ id: '1', org_id: orgId, email: 'a@b.com', status: 'active', profile: { full_name: 'A', metadata: {} }, created_at: new Date() });
      classService.getEducatorClassCounts.mockResolvedValue(new Map([['1', 0]]));
      const res = await service.findById('1', orgId);
      expect(res.fullName).toBe('A');
    });
  });

  describe('update', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.update('nope', orgId, {} as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Conflict when email taken', async () => {
      repo.findById.mockResolvedValue({ id: '1', org_id: orgId, email: 'old@educator.school.edu', profile: { full_name: 'A', metadata: {} } });
      repo.findByEmail.mockResolvedValue({ id: 'other' });
      await expect(service.update('1', orgId, { email: 'taken@educator.school.edu' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('throws Conflict when educatorId taken', async () => {
      repo.findById.mockResolvedValue({ id: '1', org_id: orgId, email: 'a@b.com', profile: { full_name: 'A', metadata: { educatorId: 'OLD' } } });
      repo.findByEducatorId.mockResolvedValue({ account_id: 'other-id' });
      await expect(service.update('1', orgId, { educatorId: 'NEW' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('updates successfully', async () => {
      repo.findById.mockResolvedValue({ id: '1', org_id: orgId, email: 'old@b.com', profile: { full_name: 'A', metadata: { educatorId: 'OLD' } } });
      repo.findByEducatorId.mockResolvedValue(null);
      repo.updateProfile.mockResolvedValue({ id: '1', org_id: orgId, email: 'new@b.com', status: 'active', profile: { full_name: 'New', metadata: { educatorId: 'NEW' } }, created_at: new Date() });
      classService.getEducatorClassCounts.mockResolvedValue(new Map([['1', 0]]));
      const res = await service.update('1', orgId, { fullName: 'New', educatorId: 'NEW' } as any);
      expect(repo.updateProfile).toHaveBeenCalled();
      expect(res.fullName).toBe('New');
    });
  });

  describe('remove / resetPassword / bulkCreate', () => {
    it('remove throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('remove throws Conflict when has active classes', async () => {
      repo.findById.mockResolvedValue({ id: '1' });
      classService.hasActiveClasses.mockResolvedValue(true);
      await expect(service.remove('1', orgId)).rejects.toBeInstanceOf(ConflictException);
    });
    it('remove succeeds', async () => {
      repo.findById.mockResolvedValue({ id: '1' });
      classService.hasActiveClasses.mockResolvedValue(false);
      await service.remove('1', orgId);
      expect(repo.softDelete).toHaveBeenCalledWith('1');
    });
    it('resetPassword throws NotFound', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.resetPassword('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('resetPassword generates and hashes', async () => {
      repo.findById.mockResolvedValue({ id: '1' });
      const res = await service.resetPassword('1', orgId);
      expect(hashPassword).toHaveBeenCalledWith('Pass123!');
      expect(repo.updatePassword).toHaveBeenCalledWith('1', 'hashed');
      expect(res.plainPassword).toBe('Pass123!');
    });
    it('bulkCreate throws when no valid entries', async () => {
      await expect(service.bulkCreate(orgId, [{ fullName: '', id: '' }] as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('bulkCreate creates with deduplicated email names', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findEmailsInBatch.mockResolvedValue([]);
      repo.create.mockResolvedValue({});
      const res = await service.bulkCreate(orgId, [{ fullName: 'John Doe', id: 'EDU-1' }, { fullName: 'John Doe', id: 'EDU-2' }] as any);
      expect(res).toHaveLength(2);
      // Second John Doe should get johndoe1
      expect(repo.create).toHaveBeenCalledTimes(2);
      expect(res[1].email).toContain('johndoe1@school.educator.edu');
    });
    it('bulkCreate throws Conflict when batch email exists', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findEmailsInBatch.mockResolvedValue(['dup@educator.school.edu']);
      await expect(service.bulkCreate(orgId, [{ fullName: 'John Doe', id: 'EDU-1' }] as any)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
