import { StudentService } from '../student.service';

jest.mock('@/commons/utils/hash.util', () => ({
  hashPassword: jest.fn((plain: string) =>
    Promise.resolve(`hashed:${plain}`),
  ),
}));

// Perf Phase 3: bulkCreate fetches the org email domain ONCE and hashes
// passwords in parallel; created/skipped output shape is unchanged.

describe('StudentService.bulkCreate — batched org lookup', () => {
  const makeService = () => {
    const repo = {
      findEmailsInBatch: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
    };
    const orgService = {
      getOwn: jest.fn().mockResolvedValue({ emailExtension: '@school.edu' }),
    };
    const service = new StudentService(
      repo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      orgService as any,
      {} as any,
    );
    return { service, repo, orgService };
  };

  it('fetches org once for N entries and keeps created/skipped output', async () => {
    const { service, repo, orgService } = makeService();
    const res = (await service.bulkCreate('org-1', [
      { fullName: 'John Doe', id: 'STU-1' },
      { fullName: 'Jane Roe', id: 'STU-2' },
    ])) as any;

    expect(orgService.getOwn).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledTimes(2);
    expect(res.created).toHaveLength(2);
    expect(res.skipped).toHaveLength(0);
    expect(res.created[0].email).toBe('johndoe@student.school.edu');
    expect(res.created[1].email).toBe('janeroe@student.school.edu');
  });
});
