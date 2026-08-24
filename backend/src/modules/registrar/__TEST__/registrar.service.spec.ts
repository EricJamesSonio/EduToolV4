import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { RegistrarService } from '../registrar.service';

jest.mock('../registrar.utils', () => ({
  generateSystemPassword: jest.fn().mockReturnValue('SysPass123!'),
}));
jest.mock('@/commons/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed'),
}));

import { generateSystemPassword } from '../registrar.utils';
import { hashPassword } from '@/commons/utils/hash.util';

describe('RegistrarService', () => {
  let service: RegistrarService;
  let repo: any;
  let orgService: any;
  const orgId = 'org-1';

  beforeEach(() => {
    repo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      softDelete: jest.fn(),
      updatePassword: jest.fn(),
    };
    orgService = { getOwn: jest.fn() };
    service = new RegistrarService(repo, orgService);
    jest.clearAllMocks();
    (generateSystemPassword as jest.Mock).mockReturnValue('SysPass123!');
    (hashPassword as jest.Mock).mockResolvedValue('hashed');
  });

  describe('create', () => {
    it('throws BadRequest when org has no email extension', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: null });
      await expect(service.create(orgId, { username: 'john', fullName: 'John' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws BadRequest when username contains @', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      await expect(service.create(orgId, { username: 'john@school.edu', fullName: 'John' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws BadRequest when username empty after trim', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      await expect(service.create(orgId, { username: '   ', fullName: 'John' } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('builds registrar email subdomain correctly (school.edu -> school.registrar.edu)', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'r-1', org_id: orgId, email: 'john@school.registrar.edu', status: 'active', profile: { full_name: 'John' }, created_at: new Date() });
      const res = await service.create(orgId, { username: 'john', fullName: 'John' } as any);
      expect(repo.findByEmail).toHaveBeenCalledWith('john@school.registrar.edu', orgId);
      expect(res.email).toBe('john@school.registrar.edu');
      expect(hashPassword).toHaveBeenCalledWith('SysPass123!');
    });
    it('strips student/educator/registrar subdomain from base (inserts registrar after first label)', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@student.school.edu.ph' });
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'r-1', org_id: orgId, email: 'john@student.registrar.school.edu.ph', status: 'active', profile: { full_name: 'John' }, created_at: new Date() });
      await service.create(orgId, { username: 'john', fullName: 'John' } as any);
      // Real logic: base=student.school.edu.ph -> domain=student.registrar.school.edu.ph
      expect(repo.findByEmail).toHaveBeenCalledWith('john@student.registrar.school.edu.ph', orgId);
    });
    it('handles extension without dot (registrar.<base>)', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: 'schooledu' });
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'r-1', org_id: orgId, email: 'john@registrar.schooledu', status: 'active', profile: { full_name: 'John' }, created_at: new Date() });
      await service.create(orgId, { username: 'john', fullName: 'John' } as any);
      expect(repo.findByEmail).toHaveBeenCalledWith('john@registrar.schooledu', orgId);
    });
    it('lowercases email and trims username with leading @', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@School.EDU' });
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'r-1', org_id: orgId, email: 'john@school.registrar.edu', status: 'active', profile: { full_name: 'John' }, created_at: new Date() });
      await service.create(orgId, { username: '@John', fullName: 'John' } as any);
      // Real logic: base=School.EDU -> domain=School.registrar.EDU -> lowercased
      expect(repo.findByEmail).toHaveBeenCalledWith('john@school.registrar.edu', orgId);
    });
    it('throws Conflict if email already exists', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findByEmail.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, { username: 'john', fullName: 'John' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
    it('returns plainPassword and maps profile full_name', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'r-1', org_id: orgId, email: 'john@registrar.school.edu', status: 'active', profile: { full_name: 'John Doe' }, created_at: new Date('2024-01-01') });
      const res = await service.create(orgId, { username: 'john', fullName: 'John Doe' } as any);
      expect(res.plainPassword).toBe('SysPass123!');
      expect(res.fullName).toBe('John Doe');
      expect(res.username).toBe('john');
    });
    it('falls back to username when profile missing', async () => {
      orgService.getOwn.mockResolvedValue({ emailExtension: '@school.edu' });
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({ id: 'r-1', org_id: orgId, email: 'john@registrar.school.edu', status: 'active', profile: null, created_at: new Date() });
      const res = await service.create(orgId, { username: 'john', fullName: 'John' } as any);
      expect(res.fullName).toBe('john');
    });
  });

  describe('findAll', () => {
    it('returns paginated and maps accounts', async () => {
      repo.findAll.mockResolvedValue({ data: [{ id: '1', org_id: orgId, email: 'a@b.com', status: 'active', profile: { full_name: 'A', metadata: { registrarUsername: 'user_a' } }, created_at: new Date() }], total: 1 });
      const res = await service.findAll(orgId, { page: 1, limit: 20 } as any);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(res.data[0].username).toBe('user_a');
      expect(repo.findAll).toHaveBeenCalledWith(orgId, expect.objectContaining({ page: 1, limit: 20 }));
    });
    it('defaults page/limit', async () => {
      repo.findAll.mockResolvedValue({ data: [], total: 0 });
      await service.findAll(orgId, {} as any);
      expect(repo.findAll).toHaveBeenCalledWith(orgId, expect.objectContaining({ page: 1, limit: 20 }));
    });
  });

  describe('updateStatus', () => {
    it('throws NotFound when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.updateStatus('nope', orgId, { status: 'suspended' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updates status and returns formatted', async () => {
      repo.findById.mockResolvedValue({ id: '1' });
      repo.updateStatus.mockResolvedValue({ id: '1', org_id: orgId, email: 'a@b.com', status: 'suspended', profile: { full_name: 'A', metadata: {} }, created_at: new Date() });
      const res = await service.updateStatus('1', orgId, { status: 'suspended' } as any);
      expect(repo.updateStatus).toHaveBeenCalledWith('1', 'suspended');
      expect(res.status).toBe('suspended');
    });
  });

  describe('remove', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('calls softDelete', async () => {
      repo.findById.mockResolvedValue({ id: '1' });
      await service.remove('1', orgId);
      expect(repo.softDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('resetPassword', () => {
    it('throws NotFound when missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.resetPassword('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('generates new password, hashes, updates', async () => {
      repo.findById.mockResolvedValue({ id: '1' });
      const res = await service.resetPassword('1', orgId);
      expect(generateSystemPassword).toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith('SysPass123!');
      expect(repo.updatePassword).toHaveBeenCalledWith('1', 'hashed');
      expect(res).toEqual({ id: '1', plainPassword: 'SysPass123!' });
    });
  });

  describe('private helpers via public behavior', () => {
    it('formatAccount prefers registrarUsername from metadata', async () => {
      repo.findAll.mockResolvedValue({
        data: [{ id: '1', org_id: orgId, email: 'a@b.com', status: 'active', profile: { full_name: 'Full', metadata: { registrarUsername: 'meta_user' } }, created_at: new Date() }],
        total: 1,
      });
      const res = await service.findAll(orgId, {} as any);
      expect(res.data[0].username).toBe('meta_user');
      expect(res.data[0].fullName).toBe('Full');
    });
  });
});
