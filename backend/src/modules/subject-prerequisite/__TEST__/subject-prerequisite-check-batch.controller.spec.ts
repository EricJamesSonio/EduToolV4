import { SubjectPrerequisiteController } from '../subject-prerequisite.controller';

// Regression guard for the wire contract of POST /subject-prerequisites/check-batch.
//
// The app installs a global ResponseInterceptor (main.ts) that wraps EVERY
// handler result as { success, data }. Returning { data: map } from the handler
// therefore produced { success, data: { data: map } }; the client unwraps once,
// reads a non-map object, and silently treats every student as eligible — the
// gray-out never rendered and the problem only surfaced as a failed enroll.
//
// So the handler must return the BARE map. The interceptor then yields exactly
// { success, data: map } and the client's `res.data.data` is the map itself.
//
// The service contract is Map<student_id, PrerequisiteCheckResultDto> — one
// verdict per student for the subject it was asked about (NOT a subject-keyed
// map). The controller places that verdict under each requested subject id.

describe('SubjectPrerequisiteController.checkEligibilityBatch (envelope)', () => {
  const eligible = { eligible: true, missing: [] };
  const blocked = {
    eligible: false,
    missing: [
      { subject_id: 'p-1', subject_name: 'Math', reason: 'not_taken' as const },
    ],
  };

  const makeController = (
    result: Map<string, unknown> | ((subjectId: string) => Map<string, unknown>),
  ) => {
    const service = {
      checkEligibilityForStudentsBatch: jest
        .fn()
        .mockImplementation((subjectId: string) =>
          Promise.resolve(
            typeof result === 'function' ? result(subjectId) : result,
          ),
        ),
    };
    return {
      controller: new SubjectPrerequisiteController(service as never),
      service,
    };
  };

  const call = (
    controller: SubjectPrerequisiteController,
    studentIds: string[] = ['stu-1', 'stu-2'],
    subjectIds: string[] = ['sub-1'],
  ) =>
    controller.checkEligibilityBatch('org-1', {
      subject_ids: subjectIds,
      student_ids: studentIds,
    }) as Promise<Record<string, unknown>>;

  it('returns the student map BARE — no extra data nesting', async () => {
    const { controller } = makeController(
      new Map([
        ['stu-1', eligible],
        ['stu-2', blocked],
      ]),
    );

    const body = await call(controller);

    // THE regression assertion: an extra `data` key means the envelope
    // double-wraps and every student reads as eligible.
    expect(body).not.toHaveProperty('data');
    expect(body).toEqual({
      'stu-1': { 'sub-1': eligible },
      'stu-2': { 'sub-1': blocked },
    });
  });

  it('is shaped for the client lookup body[studentId][subjectId].missing', async () => {
    const { controller } = makeController(
      new Map([
        ['stu-1', eligible],
        ['stu-2', blocked],
      ]),
    );

    const body = (await call(controller)) as Record<
      string,
      Record<string, { eligible: boolean; missing: unknown[] }>
    >;

    // Exactly the access pattern page.tsx / EnrollStudentDialog perform.
    expect(body['stu-2']['sub-1'].missing).toEqual([
      { subject_id: 'p-1', subject_name: 'Math', reason: 'not_taken' },
    ]);
    expect(body['stu-1']['sub-1'].eligible).toBe(true);
  });

  it('marks a student with no service result as eligible rather than omitting them', async () => {
    // Service returns no entry for stu-2 (filtered upstream).
    const { controller } = makeController(new Map([['stu-1', eligible]]));

    const body = (await call(controller)) as Record<
      string,
      Record<string, { eligible: boolean; missing: unknown[] }>
    >;

    expect(body['stu-2']['sub-1']).toEqual({ eligible: true, missing: [] });
  });

  it('keys every student when the subject has no prerequisite links', async () => {
    const { controller, service } = makeController(new Map());

    const body = (await call(controller)) as Record<string, unknown>;

    expect(service.checkEligibilityForStudentsBatch).toHaveBeenCalledWith(
      'sub-1',
      ['stu-1', 'stu-2'],
      'org-1',
    );
    expect(Object.keys(body).sort()).toEqual(['stu-1', 'stu-2']);
    expect(body['stu-1']).toEqual({ 'sub-1': { eligible: true, missing: [] } });
  });

  it('de-duplicates repeated subject and student ids', async () => {
    const { controller, service } = makeController(new Map([['stu-1', eligible]]));

    await controller.checkEligibilityBatch('org-1', {
      subject_ids: ['sub-1', 'sub-1'],
      student_ids: ['stu-1', 'stu-1'],
    });

    expect(service.checkEligibilityForStudentsBatch).toHaveBeenCalledTimes(1);
    expect(service.checkEligibilityForStudentsBatch).toHaveBeenCalledWith(
      'sub-1',
      ['stu-1'],
      'org-1',
    );
  });

  it('aggregates multiple subjects under each student', async () => {
    const { controller, service } = makeController((subjectId) =>
      new Map([['stu-1', subjectId === 'sub-2' ? blocked : eligible]]),
    );

    const body = (await call(controller, ['stu-1'], ['sub-1', 'sub-2'])) as Record<
      string,
      Record<string, unknown>
    >;

    expect(service.checkEligibilityForStudentsBatch).toHaveBeenCalledTimes(2);
    expect(body['stu-1']).toEqual({ 'sub-1': eligible, 'sub-2': blocked });
  });

  it('takes org_id from the token, never from the request body', async () => {
    const { controller, service } = makeController(new Map());

    await controller.checkEligibilityBatch('org-from-token', {
      subject_ids: ['sub-1'],
      student_ids: ['stu-1'],
      // A hostile client injecting org_id is stripped by the global
      // ValidationPipe (forbidNonWhitelisted); orgId below is the token value.
    } as never);

    expect(service.checkEligibilityForStudentsBatch).toHaveBeenCalledWith(
      'sub-1',
      ['stu-1'],
      'org-from-token',
    );
  });

  it('returns an empty map when the student list is empty', async () => {
    const { controller } = makeController(new Map());

    const body = await call(controller, []);

    expect(body).toEqual({});
  });
});