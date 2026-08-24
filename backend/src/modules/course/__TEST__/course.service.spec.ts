import { NotFoundException } from '@nestjs/common';
import { CourseService } from '../course.service';

describe('CourseService', () => {
  let service: CourseService;
  let repo: any;
  const orgId = 'org-1';

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      existsInOrg: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new CourseService(repo);
    jest.clearAllMocks();
  });

  it('create maps to entity', async () => {
    repo.create.mockResolvedValue({ id: 'c-1', org_id: orgId, program_id: 'prog-1', name: 'BSIT', code: 'BSIT' });
    const res = await service.create(orgId, { programId: 'prog-1', name: 'BSIT', code: 'BSIT', schoolYearId: 'sy-1' } as any);
    expect(repo.create).toHaveBeenCalledWith(orgId, expect.objectContaining({ name: 'BSIT' }));
    expect(res.name).toBe('BSIT');
    expect(res.code).toBe('BSIT');
    expect(res.org_id).toBe(orgId);
  });

  it('findAll returns [] when no schoolYearId', async () => {
    expect(await service.findAll(orgId, {} as any)).toEqual([]);
    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it('findAll returns mapped entities', async () => {
    repo.findAll.mockResolvedValue([{ id: 'c-1', org_id: orgId, program_id: 'prog-1', name: 'BSIT', code: 'BSIT' }]);
    const res = await service.findAll(orgId, { schoolYearId: 'sy-1', programId: 'prog-1' } as any);
    expect(repo.findAll).toHaveBeenCalledWith(orgId, 'sy-1', 'prog-1');
    expect(res[0].name).toBe('BSIT');
  });

  it('findOne throws NotFound when missing', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne returns entity', async () => {
    repo.findOne.mockResolvedValue({ id: 'c-1', org_id: orgId, program_id: 'prog-1', name: 'BSIT', code: null });
    const res = await service.findOne('c-1', orgId);
    expect(res.id).toBe('c-1');
    expect(res.code).toBeNull();
  });

  it('update throws NotFound when not in org', async () => {
    repo.existsInOrg.mockResolvedValue(false);
    await expect(service.update('c-1', orgId, { name: 'New' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update succeeds and maps', async () => {
    repo.existsInOrg.mockResolvedValue(true);
    repo.update.mockResolvedValue({ id: 'c-1', org_id: orgId, program_id: 'prog-1', name: 'Updated', code: 'UPD' });
    const res = await service.update('c-1', orgId, { name: 'Updated' } as any);
    expect(repo.update).toHaveBeenCalledWith('c-1', orgId, expect.objectContaining({ name: 'Updated' }));
    expect(res.name).toBe('Updated');
  });

  it('remove throws NotFound when not in org', async () => {
    repo.existsInOrg.mockResolvedValue(false);
    await expect(service.remove('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove succeeds', async () => {
    repo.existsInOrg.mockResolvedValue(true);
    repo.delete.mockResolvedValue({});
    const res = await service.remove('c-1', orgId);
    expect(repo.delete).toHaveBeenCalledWith('c-1', orgId);
    expect(res.deleted).toBe(true);
  });

  it('maps code null correctly', async () => {
    repo.findOne.mockResolvedValue({ id: 'c-1', org_id: orgId, program_id: 'prog-1', name: 'NoCode', code: null });
    const res = await service.findOne('c-1', orgId);
    expect(res.code).toBeNull();
  });
});
