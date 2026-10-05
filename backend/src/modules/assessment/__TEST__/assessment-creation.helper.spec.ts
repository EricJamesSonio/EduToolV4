import { BadRequestException } from '@nestjs/common';
import { AssessmentCreationHelper } from '../educator/helpers/assessment-creation.helper';
import { GradingMode } from '../dto/assessment.dto';

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

// TICK-ASSESS-005: scheme membership is not the same as gradability. These
// tests pin the authoritative server-side guard that keeps educator-scored
// categories out of the auto-graded path.
describe('AssessmentCreationHelper.assertTypeMatchesGradingMode (TICK-ASSESS-005)', () => {
  let helper: AssessmentCreationHelper;

  beforeEach(() => {
    helper = new AssessmentCreationHelper({} as any, {} as any, {
      gradingScheme: { findFirst: jest.fn() },
    } as any);
  });

  it.each([['behavior'], ['participation'], ['attendance'], ['performance_task']])(
    'rejects manual-only type "%s" under SYSTEM',
    (type) => {
      expect(() =>
        helper.assertTypeMatchesGradingMode(type, GradingMode.SYSTEM),
      ).toThrow(BadRequestException);
    },
  );

  it('rejects a manual-only type under HYBRID too', () => {
    // Hybrid still auto-grades its AI sections, so the type restriction holds.
    expect(() =>
      helper.assertTypeMatchesGradingMode('behavior', GradingMode.HYBRID),
    ).toThrow(BadRequestException);
  });

  it('allows a manual-only type under MANUAL', () => {
    expect(() =>
      helper.assertTypeMatchesGradingMode('behavior', GradingMode.MANUAL),
    ).not.toThrow();
  });

  it.each([['quiz'], ['exam'], ['assignment'], ['written_work'], ['activity']])(
    'allows system-gradable type "%s" under SYSTEM',
    (type) => {
      expect(() =>
        helper.assertTypeMatchesGradingMode(type, GradingMode.SYSTEM),
      ).not.toThrow();
    },
  );

  it('names the offending type and the manual-only list in the error', () => {
    // A vague 400 leaves the educator guessing; this is their only signal.
    expect(() =>
      helper.assertTypeMatchesGradingMode('behavior', GradingMode.SYSTEM),
    ).toThrow(/behavior.*cannot be system-graded/s);
    expect(() =>
      helper.assertTypeMatchesGradingMode('behavior', GradingMode.SYSTEM),
    ).toThrow(/participation/);
  });

  it('rejects an unknown type under SYSTEM (fails closed)', () => {
    expect(() =>
      helper.assertTypeMatchesGradingMode('nonsense', GradingMode.SYSTEM),
    ).toThrow(BadRequestException);
  });
});

