import { NotFoundException } from '@nestjs/common';
import { StrandService } from '../strand.service';

describe('StrandService', () => {
  let service: StrandService;
  let repo: any;
  const orgId = 'org-1';

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      existsInOrg: jest.fn(),
      findByIdIncludingArchived: jest.fn(),
      programExistsInOrg: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    service = new StrandService(repo);
    jest.clearAllMocks();
  });

  it('create maps', async () => {
    repo.programExistsInOrg.mockResolvedValue(true);
    repo.create.mockResolvedValue({ id: 's-1', org_id: orgId, program_id: 'prog-1', name: 'STEM' });
    const res = await service.create(orgId, { programId: 'prog-1', name: 'STEM', schoolYearId: 'sy-1' } as any);
    expect(repo.create).toHaveBeenCalled();
    expect(res.name).toBe('STEM');
  });

  it('create throws NotFound when the program is not in the org', async () => {
    repo.programExistsInOrg.mockResolvedValue(false);
    await expect(
      service.create(orgId, { programId: 'nope', name: 'STEM', schoolYearId: 'sy-1' } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('findAll returns [] when no schoolYearId', async () => {
    expect(await service.findAll(orgId, {} as any)).toEqual([]);
    expect(repo.findAll).not.toHaveBeenCalled();
  });

  it('findAll maps with subjects', async () => {
    repo.findAll.mockResolvedValue([{ id: 's-1', org_id: orgId, program_id: 'prog-1', name: 'STEM', subjects: [{ id: 'subj-1', name: 'Math', year_level: 11, term_label: '1st', prerequisites: [] }] }]);
    const res = await service.findAll(orgId, { schoolYearId: 'sy-1', program_id: 'prog-1' } as any);
    expect(res[0].subjects?.[0].name).toBe('Math');
  });

  it('findOne throws NotFound', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne returns entity', async () => {
    repo.findOne.mockResolvedValue({ id: 's-1', org_id: orgId, program_id: 'prog-1', name: 'ABM' });
    expect((await service.findOne('s-1', orgId)).name).toBe('ABM');
  });

  it('update throws NotFound when not exists', async () => {
    repo.existsInOrg.mockResolvedValue(false);
    await expect(service.update('nope', orgId, { name: 'X' } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update succeeds', async () => {
    repo.existsInOrg.mockResolvedValue(true);
    repo.update.mockResolvedValue({ id: 's-1', org_id: orgId, program_id: 'prog-1', name: 'Updated' });
    const res = await service.update('s-1', orgId, { name: 'Updated' } as any);
    expect(res.name).toBe('Updated');
  });

  it('remove throws NotFound', async () => {
    repo.findByIdIncludingArchived.mockResolvedValue(null);
    await expect(service.remove('nope', orgId)).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('remove hard-deletes an empty strand and reports deleted', async () => {
    repo.findByIdIncludingArchived.mockResolvedValue({ id: 's-1', deleted_at: null });
    repo.remove.mockResolvedValue('deleted');
    expect(await service.remove('s-1', orgId)).toBe('deleted');
    expect(repo.remove).toHaveBeenCalledWith('s-1', orgId);
  });

  it('remove archives a strand that has data and reports archived', async () => {
    repo.findByIdIncludingArchived.mockResolvedValue({ id: 's-1', deleted_at: null });
    repo.remove.mockResolvedValue('archived');
    expect(await service.remove('s-1', orgId)).toBe('archived');
    expect(repo.remove).toHaveBeenCalledWith('s-1', orgId);
  });

  it('remove is idempotent on an already-archived strand', async () => {
    repo.findByIdIncludingArchived.mockResolvedValue({ id: 's-1', deleted_at: new Date() });
    expect(await service.remove('s-1', orgId)).toBe('archived');
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('maps subjects undefined when not array', async () => {
    repo.findOne.mockResolvedValue({ id: 's-1', org_id: orgId, program_id: 'prog-1', name: 'STEM', subjects: null });
    const res = await service.findOne('s-1', orgId);
    expect(res.subjects).toBeUndefined();
  });
});
