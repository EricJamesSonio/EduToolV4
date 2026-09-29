import { EducatorService } from '../educator.service';

jest.mock('@/commons/utils/hash.util', () => ({
  hashPassword: jest.fn((plain: string) =>
    Promise.resolve(`hashed:${plain}`),
  ),
}));

// Perf Phase 3: bulkCreate fetches the org email domain ONCE and hashes
// passwords in parallel; created/skipped output shape is unchanged.

describe('EducatorService.bulkCreate — batched org lookup', () => {
  const makeService = () => {
    const repo = {
      findEmailsInBatch: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
    };
    const classService = {};
    const orgService = {
      getOwn: jest.fn().mockResolvedValue({ emailExtension: '@school.edu' }),
    };
    const service = new EducatorService(
      repo as any,
      classService as any,
      orgService as any,
    );
    return { service, repo, orgService };
  };

  it('fetches org once for N entries and keeps created/skipped output', async () => {
    const { service, repo, orgService } = makeService();
    const res = (await service.bulkCreate('org-1', [
      { fullName: 'John Doe', id: 'EDU-1' },
      { fullName: 'Jane Roe', id: 'EDU-2' },
      { fullName: 'John Doe', id: 'EDU-3' },
    ])) as any;

    expect(orgService.getOwn).toHaveBeenCalledTimes(1);
    expect(orgService.getOwn).toHaveBeenCalledWith('org-1');
    expect(repo.create).toHaveBeenCalledTimes(3);
    expect(res.created).toHaveLength(3);
    expect(res.skipped).toHaveLength(0);
    expect(res.created[0].email).toBe('johndoe@educator.school.edu');
    // Third entry duplicates the first email name → suffixed, still created.
    expect(res.created[2].email).toContain('johndoe1@educator.school.edu');
  });

  it('still skips database and in-file duplicates', async () => {
    const { service, repo } = makeService();
    repo.findEmailsInBatch.mockResolvedValue(['johndoe@educator.school.edu']);
    const res = (await service.bulkCreate('org-1', [
      { fullName: 'John Doe', id: 'EDU-1' },
      { fullName: 'John Doe', id: 'EDU-2' },
    ])) as any;

    // First is a DB duplicate → skipped; second gets suffixed name → created.
    expect(res.created).toHaveLength(1);
    expect(res.skipped).toEqual([
      expect.objectContaining({ email: 'johndoe@educator.school.edu', reason: 'duplicate_in_database' }),
    ]);
    expect(res.created[0].email).toContain('johndoe1@educator.school.edu');
  });
});
