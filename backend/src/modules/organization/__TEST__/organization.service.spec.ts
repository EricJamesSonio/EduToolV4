import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationService } from '../organization.service';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let orgRepository: any;
  let orgSeeder: any;
  let auditLogService: any;
  let db: any;

  const adminId = 'admin-1';
  const orgId = 'org-1';

  beforeEach(() => {
    orgRepository = {
      existsForAdmin: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      linkToAdmin: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
    };
    orgSeeder = { seedOrg: jest.fn() };
    auditLogService = { logAdminAction: jest.fn().mockResolvedValue(undefined) };
    db = {
      organization: { findFirst: jest.fn() },
      account: { count: jest.fn() },
      orgHolidayConfig: { upsert: jest.fn().mockResolvedValue({}) },
    };
    service = new OrganizationService(orgRepository, orgSeeder, auditLogService, db);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws Conflict if admin already has org', async () => {
      orgRepository.existsForAdmin.mockResolvedValue(true);
      await expect(service.create(adminId, { name: 'Test' } as any)).rejects.toBeInstanceOf(ConflictException);
      expect(orgRepository.create).not.toHaveBeenCalled();
    });

    it('creates org and links to admin, logs audit', async () => {
      orgRepository.existsForAdmin.mockResolvedValue(false);
      orgRepository.create.mockResolvedValue({ id: orgId, name: 'Test Org' });
      orgRepository.linkToAdmin.mockResolvedValue({});
      const result = await service.create(adminId, { name: 'Test Org', description: 'Desc' } as any);
      expect(orgRepository.create).toHaveBeenCalledWith({ name: 'Test Org', description: 'Desc', address: undefined });
      expect(orgRepository.linkToAdmin).toHaveBeenCalledWith(adminId, orgId);
      expect(auditLogService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'org_created', orgId }));
      expect(result.id).toBe(orgId);
    });

    it('maps P2002 email_extension conflict to ConflictException', async () => {
      orgRepository.existsForAdmin.mockResolvedValue(false);
      const err: any = new Error('unique');
      err.code = 'P2002';
      err.meta = { target: ['email_extension'] };
      orgRepository.create.mockRejectedValue(err);
      await expect(service.create(adminId, { name: 'X' } as any)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows non-P2002 errors', async () => {
      orgRepository.existsForAdmin.mockResolvedValue(false);
      orgRepository.create.mockRejectedValue(new Error('db down'));
      await expect(service.create(adminId, { name: 'X' } as any)).rejects.toThrow('db down');
    });
  });

  describe('getOwn', () => {
    it('returns null when orgId is null', async () => {
      expect(await service.getOwn(null)).toBeNull();
    });
    it('returns null when org not found', async () => {
      orgRepository.findById.mockResolvedValue(null);
      expect(await service.getOwn(orgId)).toBeNull();
    });
    it('maps org to response', async () => {
      orgRepository.findById.mockResolvedValue({ id: orgId, name: 'A', description: 'D', address: 'Addr', logo_url: 'logo.png', email_extension: '@school.edu' });
      const res = await service.getOwn(orgId);
      expect(res).toEqual({ id: orgId, name: 'A', description: 'D', address: 'Addr', logoUrl: 'logo.png', emailExtension: '@school.edu' });
    });
    it('handles missing optional fields', async () => {
      orgRepository.findById.mockResolvedValue({ id: orgId, name: 'A', description: null, address: null, logo_url: null, email_extension: null });
      const res = await service.getOwn(orgId);
      expect(res?.logoUrl).toBeNull();
      expect(res?.emailExtension).toBeNull();
    });
  });

  describe('update', () => {
    it('throws NotFound when org missing', async () => {
      orgRepository.findById.mockResolvedValue(null);
      await expect(service.update(orgId, { name: 'X' } as any, adminId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('updates org and logs audit', async () => {
      orgRepository.findById.mockResolvedValue({ id: orgId });
      orgRepository.update.mockResolvedValue({ id: orgId, name: 'New' });
      const res = await service.update(orgId, { name: 'New', emailExtension: '@new.edu' } as any, adminId);
      expect(orgRepository.update).toHaveBeenCalledWith(orgId, expect.objectContaining({ name: 'New', email_extension: '@new.edu' }));
      expect(auditLogService.logAdminAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'org_updated' }));
      expect(res.name).toBe('New');
    });
    it('handles emailExtension undefined correctly (should not pass email_extension)', async () => {
      orgRepository.findById.mockResolvedValue({ id: orgId });
      orgRepository.update.mockResolvedValue({ id: orgId });
      await service.update(orgId, { name: 'X' } as any, adminId);
      const call = orgRepository.update.mock.calls[0][1];
      expect(call).not.toHaveProperty('email_extension');
    });
    it('maps P2002 to ConflictException', async () => {
      orgRepository.findById.mockResolvedValue({ id: orgId });
      const err: any = new Error('unique');
      err.code = 'P2002';
      err.meta = { target: ['email_extension'] };
      orgRepository.update.mockRejectedValue(err);
      await expect(service.update(orgId, { name: 'X', emailExtension: '@dup' } as any, adminId)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('seed', () => {
    it('throws BadRequest when orgId falsy', async () => {
      await expect(service.seed('', { schoolYearId: 'sy1', programs: ['elem'] } as any, adminId)).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.seed(null as any, { schoolYearId: 'sy1', programs: ['elem'] } as any, adminId)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('throws NotFound when org missing', async () => {
      orgRepository.findById.mockResolvedValue(null);
      await expect(service.seed(orgId, { schoolYearId: 'sy1', programs: [] } as any, adminId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('calls orgSeeder and upserts holiday config', async () => {
      orgRepository.findById.mockResolvedValue({ id: orgId });
      orgSeeder.seedOrg.mockResolvedValue({ programs: { seeded: 1 } });
      const dto: any = { schoolYearId: 'sy1', programs: ['elem'], courses: [], strands: [] };
      const res = await service.seed(orgId, dto, adminId);
      expect(orgSeeder.seedOrg).toHaveBeenCalledWith(expect.objectContaining({ orgId, schoolYearId: 'sy1', programs: ['elem'] }));
      expect(db.orgHolidayConfig.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { org_id: orgId } }));
      expect(res.success).toBe(true);
    });
  });

  describe('isEmailExtensionUnique', () => {
    it('returns true when no existing', async () => {
      db.organization.findFirst.mockResolvedValue(null);
      expect(await service.isEmailExtensionUnique('school.edu')).toBe(true);
      expect(db.organization.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ email_extension: '@school.edu' }) }));
    });
    it('handles leading @ and trim', async () => {
      db.organization.findFirst.mockResolvedValue(null);
      await service.isEmailExtensionUnique('  @school.edu  ');
      expect(db.organization.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ email_extension: '@school.edu' }) }));
    });
    it('returns false when exists', async () => {
      db.organization.findFirst.mockResolvedValue({ id: 'other' });
      expect(await service.isEmailExtensionUnique('dup.edu')).toBe(false);
    });
    it('excludes org when excludeOrgId provided', async () => {
      db.organization.findFirst.mockResolvedValue(null);
      await service.isEmailExtensionUnique('school.edu', orgId);
      expect(db.organization.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ NOT: { id: orgId } }) }));
    });
  });

  describe('countAccounts', () => {
    it('counts educator+student', async () => {
      db.account.count.mockResolvedValue(5);
      expect(await service.countAccounts(orgId)).toBe(5);
      expect(db.account.count).toHaveBeenCalledWith({ where: { org_id: orgId, role: { in: ['educator', 'student'] } } });
    });
  });

  describe('countAccountsByRole', () => {
    it('returns breakdown', async () => {
      db.account.count
        .mockResolvedValueOnce(2) // educators
        .mockResolvedValueOnce(10) // students
        .mockResolvedValueOnce(1); // admins
      const res = await service.countAccountsByRole(orgId);
      expect(res).toEqual({ educators: 2, students: 10, admins: 1, total: 13 });
    });
    it('handles zero counts', async () => {
      db.account.count.mockResolvedValue(0);
      const res = await service.countAccountsByRole(orgId);
      expect(res.total).toBe(0);
    });
  });

  describe('getAllOrganizations', () => {
    it('delegates to repository', async () => {
      orgRepository.findAll.mockResolvedValue([{ id: '1' }]);
      expect(await service.getAllOrganizations()).toEqual([{ id: '1' }]);
    });
  });
});
