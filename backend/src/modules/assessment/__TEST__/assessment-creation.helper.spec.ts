import { BadRequestException } from '@nestjs/common';
import { AssessmentCreationHelper } from '../educator/helpers/assessment-creation.helper';

// TICK-ASSESS-001: `assignment` / `participation` / `behavior` must pass the
// scheme check whenever the class scheme actually contains them.
describe('AssessmentCreationHelper.assertTypeMatchesScheme (TICK-ASSESS-001)', () => {
  const classId = 'class-1';
  const orgId = 'org-1';
  let db: { gradingScheme: { findFirst: jest.Mock } };
  let helper: AssessmentCreationHelper;

  beforeEach(() => {
    db = { gradingScheme: { findFirst: jest.fn() } };
    helper = new AssessmentCreationHelper({} as any, {} as any, db as any);
    jest.clearAllMocks();
  });

  it.each([['assignment'], ['participation'], ['behavior']])(
    'allows "%s" when the scheme contains it',
    async (type) => {
      db.gradingScheme.findFirst.mockResolvedValue({
        components: [{ type: 'quiz' }, { type }],
      });
      await expect(
        helper.assertTypeMatchesScheme(classId, orgId, type),
      ).resolves.toBeUndefined();
    },
  );

  it('rejects "assignment" when the scheme does not contain it', async () => {
    db.gradingScheme.findFirst.mockResolvedValue({
      components: [{ type: 'quiz' }, { type: 'exam' }],
    });
    await expect(
      helper.assertTypeMatchesScheme(classId, orgId, 'assignment'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows any type when the class has no scheme', async () => {
    db.gradingScheme.findFirst.mockResolvedValue(null);
    await expect(
      helper.assertTypeMatchesScheme(classId, orgId, 'assignment'),
    ).resolves.toBeUndefined();
  });
});
