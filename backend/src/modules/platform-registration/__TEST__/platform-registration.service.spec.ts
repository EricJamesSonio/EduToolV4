import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlatformRegistrationService } from '../platform-registration.service';

jest.mock('@/commons/utils/hash.util', () => ({ hashPassword: jest.fn().mockResolvedValue('hashed') }));
jest.mock('@/commons/utils/password.util', () => ({ generatePassword: jest.fn().mockReturnValue('Pass123!') }));
jest.mock('@/commons/utils/admin-login-email.util', () => ({ generateAdminLoginEmail: jest.fn().mockReturnValue('login@school.edu') }));

import { hashPassword } from '@/commons/utils/hash.util';
import { generatePassword } from '@/commons/utils/password.util';
import { generateAdminLoginEmail } from '@/commons/utils/admin-login-email.util';

describe('PlatformRegistrationService', () => {
  let service: PlatformRegistrationService;
  let repo: any;
  let db: any;
  let mail: any;

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findById: jest.fn(),
      markReviewed: jest.fn(),
      markRequestRevision: jest.fn(),
    };
    db = { account: { findFirst: jest.fn(), create: jest.fn() } };
    mail = { sendCredentialsEmail: jest.fn().mockResolvedValue(undefined), sendRejectionEmail: jest.fn().mockResolvedValue(undefined), sendRevisionNeededEmail: jest.fn().mockResolvedValue(undefined) };
    service = new PlatformRegistrationService(repo, db, mail);
    jest.clearAllMocks();
    (hashPassword as jest.Mock).mockResolvedValue('hashed');
    (generatePassword as jest.Mock).mockReturnValue('Pass123!');
    (generateAdminLoginEmail as jest.Mock).mockReturnValue('login@school.edu');
  });

  it('list delegates', async () => {
    repo.findMany.mockResolvedValue({ data: [] });
    expect(await service.list({ page: 1, limit: 10 })).toEqual({ data: [] });
  });

  it('approve throws NotFound when missing', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.approve('nope', 'reviewer')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('approve throws when not pending', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'approved' });
    await expect(service.approve('1', 'reviewer')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approve throws when login email exists', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'pending', email: 'a@b.com', full_name: 'John' });
    db.account.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(service.approve('1', 'reviewer')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('approve creates account, marks reviewed, sends email', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'pending', email: 'a@b.com', full_name: 'John Doe' });
    db.account.findFirst.mockResolvedValue(null);
    db.account.create.mockResolvedValue({ email: 'login@school.edu', profile: { full_name: 'John Doe' } });
    const res = await service.approve('1', 'reviewer-1');
    expect(generateAdminLoginEmail).toHaveBeenCalledWith('a@b.com');
    expect(hashPassword).toHaveBeenCalledWith('Pass123!');
    expect(db.account.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: 'login@school.edu' }) }));
    expect(repo.markReviewed).toHaveBeenCalledWith('1', 'approved', 'reviewer-1');
    expect(mail.sendCredentialsEmail).toHaveBeenCalledWith('a@b.com', 'login@school.edu', 'Pass123!');
    expect(res).toEqual({ email: 'login@school.edu', fullName: 'John Doe', password: 'Pass123!' });
  });

  it('reject throws NotFound', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.reject('nope', 'rev', {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reject throws when not pending', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'rejected' });
    await expect(service.reject('1', 'rev', {} as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reject marks and sends email', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'pending', email: 'a@b.com' });
    const res = await service.reject('1', 'rev', { reason: 'bad' } as any);
    expect(repo.markReviewed).toHaveBeenCalledWith('1', 'rejected', 'rev');
    expect(mail.sendRejectionEmail).toHaveBeenCalledWith('a@b.com', 'bad');
    expect(res.message).toBe('Request rejected');
  });

  it('requestRevision throws for unknown field', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'pending', email: 'a@b.com' });
    await expect(service.requestRevision('1', 'rev', { fieldNotes: { unknown_field: 'note' } } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requestRevision succeeds', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'pending', email: 'a@b.com' });
    const res = await service.requestRevision('1', 'rev', { fieldNotes: { full_name: 'fix name' } } as any);
    expect(repo.markRequestRevision).toHaveBeenCalledWith('1', { full_name: 'fix name' }, 'rev');
    expect(mail.sendRevisionNeededEmail).toHaveBeenCalled();
    expect(res.message).toBe('Revision requested');
  });

  it('sendCredentials throws NotFound', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.sendCredentials('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('sendCredentials throws when not approved', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'pending' });
    await expect(service.sendCredentials('1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sendCredentials throws already sent message when approved', async () => {
    repo.findById.mockResolvedValue({ id: '1', status: 'approved' });
    await expect(service.sendCredentials('1')).rejects.toThrow('already sent');
  });
});
