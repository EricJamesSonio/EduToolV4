import { AssessmentRepository } from '@/modules/assessment/core/assessment-core.repository';
import { AttendanceRepository } from '@/modules/attendance/attendance.repository';
import { SubmissionRepository } from '@/modules/submission/submission.repository';

// Phase 1: native-upsert + transaction correctness. The NATIVE_UPSERT_ENABLED
// flag is read per call, so tests toggle it without module reloads.
const FLAG = 'NATIVE_UPSERT_ENABLED';
let prevFlag: string | undefined;

beforeEach(() => {
  prevFlag = process.env[FLAG];
  jest.clearAllMocks();
});

afterEach(() => {
  if (prevFlag === undefined) delete process.env[FLAG];
  else process.env[FLAG] = prevFlag;
});

function submissionDbMock() {
  return {
    submission: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn().mockImplementation(async (args: unknown) => args),
    },
  };
}

function attendanceDbMock() {
  return {
    attendanceRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn().mockImplementation(async (args: unknown) => args),
    },
  };
}

describe('Phase 1: concurrent submits collapse into one upsert (no duplicate rows)', () => {
  it('upsertSubmission issues one native upsert per call, zero read-then-write', async () => {
    process.env[FLAG] = 'true';
    const db = submissionDbMock();
    const repo = new AssessmentRepository(db as never);
    const dto = {
      orgId: 'org-1',
      assessmentId: 'ass-1',
      studentId: 'stu-1',
      status: 'submitted',
    };

    // Two simultaneous submits for the same student/assessment (double-submit race).
    await Promise.all([repo.upsertSubmission(dto), repo.upsertSubmission(dto)]);

    expect(db.submission.upsert).toHaveBeenCalledTimes(2);
    expect(db.submission.findFirst).not.toHaveBeenCalled();
    expect(db.submission.create).not.toHaveBeenCalled();
    expect(db.submission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assessment_id_student_id: {
            assessment_id: 'ass-1',
            student_id: 'stu-1',
          },
        },
      }),
    );
  });

  it('upsertSubmission keeps legacy path when flag is off (pre-migration DBs)', async () => {
    delete process.env[FLAG];
    const db = submissionDbMock();
    db.submission.findFirst.mockResolvedValue(null);
    db.submission.create.mockResolvedValue({ id: 'sub-1' });
    const repo = new AssessmentRepository(db as never);

    await repo.upsertSubmission({
      orgId: 'org-1',
      assessmentId: 'ass-1',
      studentId: 'stu-1',
      status: 'draft',
    });

    expect(db.submission.upsert).not.toHaveBeenCalled();
    expect(db.submission.create).toHaveBeenCalledTimes(1);
  });

  it('attendance upsertRecord issues one native upsert per call, zero read-then-write', async () => {
    process.env[FLAG] = 'true';
    const db = attendanceDbMock();
    const repo = new AttendanceRepository(db as never);
    const dto = {
      org_id: 'org-1',
      session_id: 'sess-1',
      student_id: 'stu-1',
      status: 'present',
    };

    await Promise.all([repo.upsertRecord(dto), repo.upsertRecord(dto)]);

    expect(db.attendanceRecord.upsert).toHaveBeenCalledTimes(2);
    expect(db.attendanceRecord.findFirst).not.toHaveBeenCalled();
    expect(db.attendanceRecord.create).not.toHaveBeenCalled();
    expect(db.attendanceRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          session_id_student_id: {
            session_id: 'sess-1',
            student_id: 'stu-1',
          },
        },
      }),
    );
  });
});

describe('Phase 1: answer writes are transactional and batched', () => {
  function answersDbMock() {
    const tx = {
      submissionAnswer: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const db = {
      submissionAnswer: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (fn: unknown) => {
        if (typeof fn === 'function') {
          return (fn as (tx: unknown) => Promise<unknown>)(tx);
        }
        return fn;
      }),
    };
    return { db, tx };
  }

  it('gradeAnswers uses 2 grouped updateMany in one tx, never per-answer update', async () => {
    const { db, tx } = answersDbMock();
    const repo = new SubmissionRepository(db as never);

    await repo.gradeAnswers('sub-1', [
      { id: 'a-1', isCorrect: true },
      { id: 'a-2', isCorrect: true },
      { id: 'a-3', isCorrect: false },
    ]);

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.submissionAnswer.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.submissionAnswer.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_correct: true } }),
    );
    expect(tx.submissionAnswer.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_correct: false } }),
    );
    expect(db.submissionAnswer.update).not.toHaveBeenCalled();
  });

  it('upsertAnswers runs deleteMany+createMany inside one tx', async () => {
    const { db, tx } = answersDbMock();
    const repo = new SubmissionRepository(db as never);

    await repo.upsertAnswers('sub-1', 'org-1', [
      { questionId: 'q-1', answer: 'A' },
      { questionId: 'q-2', answer: 'B' },
    ]);

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.submissionAnswer.deleteMany).toHaveBeenCalledTimes(1);
    expect(tx.submissionAnswer.createMany).toHaveBeenCalledTimes(1);
    // Read-after-commit stays outside the tx.
    expect(db.submissionAnswer.findMany).toHaveBeenCalledTimes(1);
  });
});
