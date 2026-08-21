import { UnauthorizedException, NotFoundException, ConflictException } from '@nestjs/common';
import { PlatformService } from '../platform.service';

jest.mock('@/commons/utils/hash.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_pw'),
}));
jest.mock('@/commons/utils/password.util', () => ({
  generatePassword: jest.fn().mockReturnValue('GenPass123!'),
}));

import { hashPassword } from '@/commons/utils/hash.util';
import { generatePassword } from '@/commons/utils/password.util';

describe('PlatformService', () => {
  let service: PlatformService;
  let db: any;
  let jwtService: any;
  const originalEnv = process.env.PLATFORM_SECRET_PASSWORD;

  beforeEach(() => {
    db = {
      account: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    };
    jwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
    service = new PlatformService(db, jwtService);
    jest.clearAllMocks();
    (hashPassword as jest.Mock).mockResolvedValue('hashed_pw');
    (generatePassword as jest.Mock).mockReturnValue('GenPass123!');
  });

  afterEach(() => {
    process.env.PLATFORM_SECRET_PASSWORD = originalEnv;
  });

  describe('login', () => {
    it('throws if env not set', () => {
      delete process.env.PLATFORM_SECRET_PASSWORD;
      expect(() => service.login('anything')).toThrow('PLATFORM_SECRET_PASSWORD not set');
    });
    it('throws Unauthorized for wrong password', () => {
      process.env.PLATFORM_SECRET_PASSWORD = 'secret123';
      expect(() => service.login('wrong')).toThrow(UnauthorizedException);
    });
    it('returns jwt for correct password', () => {
      process.env.PLATFORM_SECRET_PASSWORD = 'secret123';
      const res = service.login('secret123');
      expect(jwtService.sign).toHaveBeenCalledWith({ role: 'platform_owner' });
      expect(res).toEqual({ access_token: 'jwt-token' });
    });
  });

  describe('createAdmin', () => {
    it('throws Conflict if email exists', async () => {
      db.account.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.createAdmin({ email: 'a@b.com' } as any)).rejects.toBeInstanceOf(ConflictException);
      expect(db.account.create).not.toHaveBeenCalled();
    });
    it('creates admin with generated password and logs', async () => {
      db.account.findFirst.mockResolvedValue(null);
      db.account.create.mockResolvedValue({
        id: 'admin-1',
        email: 'a@b.com',
        role: 'admin',
        status: 'active',
        created_at: new Date(),
        profile: { full_name: 'Test' },
      });
      const res = await service.createAdmin({ email: 'a@b.com', fullName: 'Test' } as any);
      expect(generatePassword).toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith('GenPass123!');
      expect(db.account.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: 'a@b.com', role: 'admin', org_id: null }) }));
      expect(db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'CREATE_ADMIN' }) }));
      expect(res.password).toBe('GenPass123!');
      expect(res.fullName).toBe('Test');
    });
    it('uses email as fullName fallback', async () => {
      db.account.findFirst.mockResolvedValue(null);
      db.account.create.mockResolvedValue({ id: '1', email: 'x@y.com', role: 'admin', status: 'active', created_at: new Date(), profile: null });
      const res = await service.createAdmin({ email: 'x@y.com' } as any);
      expect(res.fullName).toBeNull(); // because profile null -> fallback null
    });
  });

  describe('getAdmins', () => {
    it('returns paginated admins without search', async () => {
      db.account.findMany.mockResolvedValue([{ id: '1', email: 'a@b.com', role: 'admin', status: 'active', created_at: new Date(), profile: { full_name: 'A' } }]);
      db.account.count.mockResolvedValue(1);
      const res = await service.getAdmins({ page: 1, limit: 10 } as any);
      expect(res.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
      expect(res.data[0].fullName).toBe('A');
      expect(db.account.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { role: 'admin' }, skip: 0, take: 10 }));
    });
    it('applies search filter', async () => {
      db.account.findMany.mockResolvedValue([]);
      db.account.count.mockResolvedValue(0);
      await service.getAdmins({ search: 'john', page: 2, limit: 5 } as any);
      expect(db.account.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }), skip: 5, take: 5 }));
    });
    it('defaults page/limit', async () => {
      db.account.findMany.mockResolvedValue([]);
      db.account.count.mockResolvedValue(0);
      await service.getAdmins({} as any);
      expect(db.account.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 20 }));
    });
  });

  describe('getAdmin', () => {
    it('throws NotFound when not admin', async () => {
      db.account.findUnique.mockResolvedValue(null);
      await expect(service.getAdmin('nope')).rejects.toBeInstanceOf(NotFoundException);
      db.account.findUnique.mockResolvedValue({ id: '1', role: 'student' });
      await expect(service.getAdmin('1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('returns admin', async () => {
      db.account.findUnique.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'admin', status: 'active', created_at: new Date('2024-01-01'), profile: { full_name: 'Name' } });
      const res = await service.getAdmin('1');
      expect(res.id).toBe('1');
      expect(res.fullName).toBe('Name');
    });
  });

  describe('blockAdmin / unblockAdmin', () => {
    it('block throws NotFound when not admin', async () => {
      db.account.findUnique.mockResolvedValue(null);
      await expect(service.blockAdmin('1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('block updates status to suspended and logs', async () => {
      db.account.findUnique.mockResolvedValue({ id: '1', role: 'admin' });
      db.account.update.mockResolvedValue({ id: '1', status: 'suspended' });
      const res = await service.blockAdmin('1');
      expect(db.account.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { status: 'suspended' }, select: expect.any(Object) });
      expect(db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'BLOCK_ADMIN' }) }));
      expect(res.status).toBe('suspended');
    });
    it('unblock updates to active', async () => {
      db.account.findUnique.mockResolvedValue({ id: '1', role: 'admin' });
      db.account.update.mockResolvedValue({ id: '1', status: 'active' });
      const res = await service.unblockAdmin('1');
      expect(res.status).toBe('active');
      expect(db.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'UNBLOCK_ADMIN' }) }));
    });
  });

  describe('resetPassword', () => {
    it('throws NotFound when not admin', async () => {
      db.account.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('resets password, hashes, logs and returns raw', async () => {
      db.account.findUnique.mockResolvedValue({ id: '1', role: 'admin' });
      db.account.update.mockResolvedValue({ id: '1', status: 'active' });
      const res: any = await service.resetPassword('1');
      expect(generatePassword).toHaveBeenCalled();
      expect(hashPassword).toHaveBeenCalledWith('GenPass123!');
      expect(db.account.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { password: 'hashed_pw' }, select: expect.any(Object) });
      expect(res.password).toBe('GenPass123!');
    });
  });

  describe('getSchools', () => {
    it('returns paginated schools without search', async () => {
      db.organization.findMany.mockResolvedValue([{ id: 'org-1', name: 'A', description: null, logo_url: null, email_extension: '@a.edu', accounts: [{ id: 'adm-1', email: 'adm@a.edu', status: 'active', profile: { full_name: 'Adm' } }] }]);
      db.organization.count.mockResolvedValue(1);
      const res = await service.getSchools({ page: 1, limit: 10 });
      expect(res.meta.total).toBe(1);
      expect(res.data[0].admin?.fullName).toBe('Adm');
      expect(db.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {}, skip: 0, take: 10 }));
    });
    it('applies search filter', async () => {
      db.organization.findMany.mockResolvedValue([]);
      db.organization.count.mockResolvedValue(0);
      await service.getSchools({ search: 'school', page: 2, limit: 5 });
      expect(db.organization.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }), skip: 5, take: 5 }));
    });
    it('handles null admin and defaults', async () => {
      db.organization.findMany.mockResolvedValue([{ id: 'org-1', name: 'A', description: null, logo_url: null, email_extension: null, accounts: [] }]);
      db.organization.count.mockResolvedValue(1);
      const res = await service.getSchools({});
      expect(res.data[0].admin).toBeNull();
      expect(res.meta.page).toBe(1);
      expect(res.meta.limit).toBe(20);
    });
  });
});
