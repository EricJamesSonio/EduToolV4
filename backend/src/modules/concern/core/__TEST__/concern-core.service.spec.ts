import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConcernCoreService } from '../concern-core.service';

describe('ConcernCoreService', () => {
  let service: ConcernCoreService;
  let repo: any;

  beforeEach(() => {
    repo = {
      findActiveAdmins: jest.fn(),
      listMine: jest.fn(),
      ensureDefaultCategories: jest.fn(),
      findActiveCategories: jest.fn(),
      findAllCategories: jest.fn(),
      findCategoryByIdInOrg: jest.fn(),
      createConcernWithFirstMessage: jest.fn(),
      findById: jest.fn(),
      addMessageAndMaybeReopen: jest.fn(),
      listStaff: jest.fn(),
      setStatus: jest.fn(),
    };
    service = new ConcernCoreService(repo);
    jest.clearAllMocks();
  });

  it('findOrgAdmins delegates', async () => {
    repo.findActiveAdmins.mockResolvedValue([{ id: 'admin-1' }]);
    expect(await service.findOrgAdmins('org-1')).toEqual([{ id: 'admin-1' }]);
  });

  it('listMine delegates', async () => {
    repo.listMine.mockResolvedValue([{ id: 'c-1' }]);
    expect(await service.listMine('org-1', 'acc-1', { page: 1, limit: 10 })).toEqual([{ id: 'c-1' }]);
  });

  it('findActiveCategories ensures defaults then finds', async () => {
    repo.findActiveCategories.mockResolvedValue([{ id: 'cat-1' }]);
    const res = await service.findActiveCategories('org-1');
    expect(repo.ensureDefaultCategories).toHaveBeenCalledWith('org-1');
    expect(res).toEqual([{ id: 'cat-1' }]);
  });

  it('findAllCategories ensures defaults', async () => {
    repo.findAllCategories.mockResolvedValue([{ id: 'cat-1' }]);
    await service.findAllCategories('org-1');
    expect(repo.ensureDefaultCategories).toHaveBeenCalledWith('org-1');
  });

  it('createConcern delegates with sender', async () => {
    repo.createConcernWithFirstMessage.mockResolvedValue({ id: 'c-1' });
    const res = await service.createConcern('org-1', 'cat-1', { accountId: 'acc-1', role: 'student' as any, name: 'John' }, 'Subject', 'Body');
    expect(repo.createConcernWithFirstMessage).toHaveBeenCalledWith('org-1', expect.objectContaining({ categoryId: 'cat-1', senderAccountId: 'acc-1' }));
    expect(res.id).toBe('c-1');
  });

  it('getOwnedById throws NotFound when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getOwnedById('org-1', 'c-1', 'acc-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getOwnedById throws Forbidden when not owner', async () => {
    repo.findById.mockResolvedValue({ id: 'c-1', sender_account_id: 'other' });
    await expect(service.getOwnedById('org-1', 'c-1', 'acc-1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getOwnedById returns when owner', async () => {
    repo.findById.mockResolvedValue({ id: 'c-1', sender_account_id: 'acc-1' });
    expect(await service.getOwnedById('org-1', 'c-1', 'acc-1')).toEqual({ id: 'c-1', sender_account_id: 'acc-1' });
  });

  it('addMessage delegates', async () => {
    repo.addMessageAndMaybeReopen.mockResolvedValue({ id: 'msg-1' });
    const res = await service.addMessage('org-1', 'c-1', { accountId: 'acc-1', role: 'student' as any, name: 'John' }, 'Hello');
    expect(repo.addMessageAndMaybeReopen).toHaveBeenCalled();
    expect(res.id).toBe('msg-1');
  });

  it('getById throws NotFound', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.getById('org-1', 'c-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getById returns', async () => {
    repo.findById.mockResolvedValue({ id: 'c-1' });
    expect(await service.getById('org-1', 'c-1')).toEqual({ id: 'c-1' });
  });

  it('listStaff delegates with status mapping', async () => {
    repo.listStaff.mockResolvedValue([{ id: 'c-1' }]);
    expect(await service.listStaff('org-1', { page: 1, limit: 10, status: 'open' })).toEqual([{ id: 'c-1' }]);
    expect(repo.listStaff).toHaveBeenCalledWith('org-1', expect.objectContaining({ status: 'open' }));
  });

  it('resolve and reopen delegates', async () => {
    repo.setStatus.mockResolvedValue({ id: 'c-1', status: 'resolved' });
    expect(await service.resolve('org-1', 'c-1', 'actor-1')).toEqual({ id: 'c-1', status: 'resolved' });
    expect(repo.setStatus).toHaveBeenCalledWith('org-1', 'c-1', 'resolved', 'actor-1');
    await service.reopen('org-1', 'c-1');
    expect(repo.setStatus).toHaveBeenCalledWith('org-1', 'c-1', 'open', null);
  });
});
