import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PlatformService } from './platform.service';
import { DatabaseService } from 'src/core/database/database.provider';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDb = {
  account: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('PlatformService', () => {
  let service: PlatformService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformService,
        { provide: DatabaseService, useValue: mockDb },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<PlatformService>(PlatformService);

    jest.clearAllMocks();
    mockDb.auditLog.create.mockResolvedValue({});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── login ──────────────────────────────────────────────────────────────

  describe('login()', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      process.env = { ...OLD_ENV, PLATFORM_SECRET_PASSWORD: 'secret123' };
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    it('returns access_token on correct password', () => {
      const result = service.login('secret123');
      expect(result).toHaveProperty('access_token', 'mock.jwt.token');
    });

    it('throws UnauthorizedException on wrong password', () => {
      expect(() => service.login('wrong')).toThrow(UnauthorizedException);
    });

    it('throws Error when PLATFORM_SECRET_PASSWORD is not set', () => {
      delete process.env.PLATFORM_SECRET_PASSWORD;
      expect(() => service.login('anything')).toThrow('PLATFORM_SECRET_PASSWORD not set');
    });
  });

  // ─── createAdmin ────────────────────────────────────────────────────────

  describe('createAdmin()', () => {
    const dto = { email: 'admin@school.com' };
    const createdAdmin = {
      id: 'uuid-1',
      email: dto.email,
      role: 'admin',
      status: 'active',
      created_at: new Date(),
    };

    it('creates admin and returns one-time password', async () => {
      mockDb.account.findFirst.mockResolvedValue(null);
      mockDb.account.create.mockResolvedValue(createdAdmin);

      const result = await service.createAdmin(dto);

      expect(result.email).toBe(dto.email);
      expect(result.password).toBeDefined();          // raw password returned once
      expect(typeof result.password).toBe('string');
      expect(result.password.length).toBeGreaterThan(0);
    });

    it('throws ConflictException if email already exists', async () => {
      mockDb.account.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.createAdmin(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── getAdmins ──────────────────────────────────────────────────────────

  describe('getAdmins()', () => {
    it('returns paginated list', async () => {
      const admins = [{ id: '1', email: 'a@b.com', role: 'admin', status: 'active', created_at: new Date() }];
      mockDb.account.findMany.mockResolvedValue(admins);
      mockDb.account.count.mockResolvedValue(1);

      const result = await service.getAdmins({ page: 1, limit: 20 });

      expect(result.data).toEqual(admins);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  // ─── getAdmin ───────────────────────────────────────────────────────────

  describe('getAdmin()', () => {
    it('returns admin when found', async () => {
      const admin = { id: '1', email: 'a@b.com', role: 'admin', status: 'active', created_at: new Date() };
      mockDb.account.findUnique.mockResolvedValue(admin);

      const result = await service.getAdmin('1');
      expect(result).toEqual(admin);
    });

    it('throws NotFoundException when not found', async () => {
      mockDb.account.findUnique.mockResolvedValue(null);
      await expect(service.getAdmin('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when role is not admin', async () => {
      mockDb.account.findUnique.mockResolvedValue({ id: '1', role: 'educator' });
      await expect(service.getAdmin('1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── blockAdmin ─────────────────────────────────────────────────────────

  describe('blockAdmin()', () => {
    const admin = { id: '1', email: 'a@b.com', role: 'admin', status: 'suspended', created_at: new Date() };

    it('blocks admin and returns updated record', async () => {
      mockDb.account.findUnique.mockResolvedValue({ id: '1', role: 'admin' });
      mockDb.account.update.mockResolvedValue(admin);

      const result = await service.blockAdmin('1');
      expect(result.status).toBe('suspended');
    });

    it('throws NotFoundException for unknown id', async () => {
      mockDb.account.findUnique.mockResolvedValue(null);
      await expect(service.blockAdmin('bad')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── unblockAdmin ───────────────────────────────────────────────────────

  describe('unblockAdmin()', () => {
    it('unblocks admin and returns updated record', async () => {
      const admin = { id: '1', email: 'a@b.com', role: 'admin', status: 'active', created_at: new Date() };
      mockDb.account.findUnique.mockResolvedValue({ id: '1', role: 'admin' });
      mockDb.account.update.mockResolvedValue(admin);

      const result = await service.unblockAdmin('1');
      expect(result.status).toBe('active');
    });
  });

  // ─── resetPassword ──────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    it('resets password and returns new one-time password', async () => {
      const admin = { id: '1', email: 'a@b.com', role: 'admin', status: 'active', created_at: new Date() };
      mockDb.account.findUnique.mockResolvedValue({ id: '1', role: 'admin' });
      mockDb.account.update.mockResolvedValue(admin);

      const result = await service.resetPassword('1');

      expect(result.password).toBeDefined();
      expect(typeof result.password).toBe('string');
    });

    it('throws NotFoundException for unknown id', async () => {
      mockDb.account.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('bad')).rejects.toThrow(NotFoundException);
    });
  });
});