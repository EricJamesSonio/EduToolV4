import { ClassGeneratorService } from '../class-generator.service';
import type { DatabaseService } from '@/core/database/database.provider';
import type { ClassOccupancyService } from '../../class/class-occupancy.service';
import type { ClassService } from '../../class/class.service';
import type { EducatorSubjectRepository } from '../../educator/educator-subject.repository';

const MIN = (h: number, m = 0) => h * 60 + m;

const claim = (
  subjectId: string,
  sectionId: string,
  educatorId: string,
  order = 0,
  educatorName: string | null = null,
  slots: number[] | null = null,
) => ({
  subjectId,
  sectionId,
  educatorId,
  educatorName,
  // null = legacy whole-pair hold (covers every weekly position).
  slots: slots ?? [],
  wholePair: slots === null,
  createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, order)),
});

const makeHarness = (opts: {
  activeWeekdays?: number[];
  breaks?: { label: string; start: string; end: string }[];
  sections?: any[];
  subjects?: any[];
  educators?: any[];
  eligible?: Map<string, string[]>;
  /** Strict-demand claims: (subject, section) pairs with an educator. */
  claims?: Array<ReturnType<typeof claim>>;
  profiles?: any[];
  occupied?: any[];
} = {}) => {
  const db = {
    section: { findMany: jest.fn().mockResolvedValue(opts.sections ?? []) },
    subject: { findMany: jest.fn().mockResolvedValue(opts.subjects ?? []) },
    account: { findMany: jest.fn().mockResolvedValue(opts.educators ?? []) },
    educatorScheduleProfile: {
      findMany: jest.fn().mockResolvedValue(opts.profiles ?? []),
    },
  };
  const occupancy = {
    load: jest.fn().mockResolvedValue(opts.occupied ?? []),
  };
  const cfg = {
    getByOrg: jest.fn().mockResolvedValue({
      startTime: '07:00',
      endTime: '17:00',
      slotDuration: 30,
      activeWeekdays: opts.activeWeekdays ?? [1, 2, 3, 4, 5],
      breaks: opts.breaks ?? [],
    }),
  };
  const claimsBySubject = new Map<string, ReturnType<typeof claim>[]>();
  for (const c of opts.claims ?? []) {
    const list = claimsBySubject.get(c.subjectId) ?? [];
    list.push(c);
    claimsBySubject.set(c.subjectId, list);
  }
  const sessionFields = new Map(
    (opts.subjects ?? []).map((s: any) => [
      s.id,
      {
        levelId: s.level_id,
        name: s.name,
        programType: s.program?.type ?? null,
        sessionsPerWeek: s.sessions_per_week,
        sessionMinutes: s.session_minutes,
      },
    ]),
  );
  const educatorSubjects = {
    getEligibleEducatorsBySubject: jest
      .fn()
      .mockResolvedValue(opts.eligible ?? new Map()),
    getAssignmentsBySubject: jest.fn().mockResolvedValue(claimsBySubject),
    subjectLevels: jest.fn().mockResolvedValue(sessionFields),
  };
  const classService = { create: jest.fn().mockResolvedValue({ id: 'c1' }) };

  const service = new ClassGeneratorService(
    db as unknown as DatabaseService,
    occupancy as unknown as ClassOccupancyService,
    cfg,
    classService as unknown as ClassService,
    educatorSubjects as unknown as EducatorSubjectRepository,
  );
  return { service, db, occupancy, cfg, classService, educatorSubjects };
};

const req = {
  orgId: 'org-1',
  schoolYearId: 'sy-1',
  semesterId: 'sem-1',
  programIds: ['prog-1'],
};

const section = (id: string, levelId = 'lvl-1') => ({
  id,
  name: `Section ${id}`,
  level_id: levelId,
  capacity: 30,
  level: { id: levelId, name: 'Grade 7' },
});

const subject = (
  id: string,
  levelId = 'lvl-1',
  sessionsPerWeek: number | null = null,
  sessionMinutes: number | null = null,
) => ({
  id,
  name: `Subject ${id}`,
  level_id: levelId,
  sessions_per_week: sessionsPerWeek,
  session_minutes: sessionMinutes,
  program: { type: 'jhs' },
});

const educator = (id: string, name: string) => ({
  id,
  profile: { full_name: name },
});

describe('ClassGeneratorService', () => {
  describe('input validation', () => {
    it('rejects an empty department list', async () => {
      const { service } = makeHarness();
      await expect(service.preview({ ...req, programIds: [] })).rejects.toThrow(
        /at least one department/,
      );
    });
  });

  describe('readiness', () => {
    it('blocks when there are no sections', async () => {
      const { service } = makeHarness({
        subjects: [subject('s1')],
        educators: [educator('e1', 'A')],
      });
      const r = await service.readiness(req);
      expect(r.ok).toBe(false);
      expect(r.blockers.join(' ')).toMatch(/No sections/);
    });

    it('blocks when there are no active educators', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1')],
      });
      const r = await service.readiness(req);
      expect(r.blockers.join(' ')).toMatch(/No active educators/);
    });

    it('blocks when the school has no active weekdays', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1')],
        educators: [educator('e1', 'A')],
        activeWeekdays: [],
      });
      const r = await service.readiness(req);
      expect(r.blockers.join(' ')).toMatch(/no active weekdays/);
    });

    it('warns but does NOT block when no teachable subjects are set', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1')],
        educators: [educator('e1', 'A')],
      });
      const r = await service.readiness(req);
      expect(r.ok).toBe(true);
      expect(r.warnings.join(' ')).toMatch(/teachable subjects/i);
    });

    it('always surfaces the school-year conflict-scope caveat', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1')],
        educators: [educator('e1', 'A')],
      });
      const r = await service.readiness(req);
      expect(r.warnings.join(' ')).toMatch(/whole school year/);
    });

    it('links unassigned educators to their pages via structured issues', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1')],
        educators: [educator('e1', 'Alice'), educator('e2', 'Bob')],
        eligible: new Map([['s1', ['e1']]]),
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const r = await service.readiness(req);
      expect(r.ok).toBe(true);
      const issue = r.issues.find((i) => i.code === 'educator_no_subjects');
      expect(issue?.severity).toBe('warning');
      expect(issue?.count).toBe(1);
      expect(issue?.entities).toEqual([
        { id: 'e2', name: 'Bob', type: 'educator' },
      ]);
    });

    it('flags subjects that have educators but no slots assigned', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1'), subject('s2')],
        educators: [educator('e1', 'Alice')],
        eligible: new Map([
          ['s1', ['e1']],
          ['s2', ['e1']],
        ]),
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const r = await service.readiness(req);
      const issue = r.issues.find((i) => i.code === 'subject_no_slots');
      expect(issue?.entities).toEqual([
        { id: 's2', name: 'Subject s2', type: 'subject' },
      ]);
      // The section IS claimed (by s1), so no section_no_assignment fires.
      expect(r.issues.some((i) => i.code === 'section_no_assignment')).toBe(
        false,
      );
    });

    it('flags sections with no assigned pair at all', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1'), section('sec-2')],
        subjects: [subject('s1')],
        educators: [educator('e1', 'Alice')],
        eligible: new Map([['s1', ['e1']]]),
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const r = await service.readiness(req);
      const issue = r.issues.find((i) => i.code === 'section_no_assignment');
      expect(issue?.count).toBe(1);
      expect(issue?.entities).toEqual([
        { id: 'sec-2', name: 'Section sec-2', type: 'section' },
      ]);
    });

    it('counts partially picked slots as still unassigned', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 2, 60)],
        educators: [educator('e1', 'Alice')],
        eligible: new Map([['s1', ['e1']]]),
        claims: [claim('s1', 'sec-1', 'e1', 0, 'Alice', [1])],
      });
      const r = await service.readiness(req);
      expect(r.ok).toBe(true);
      const issue = r.issues.find((i) => i.code === 'slots_unassigned');
      expect(issue?.count).toBe(1);
      expect(issue?.entities).toEqual([
        { id: 's1', name: 'Subject s1', type: 'subject' },
      ]);
    });

    it('flags educators over weekly capacity', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 2, 60)],
        educators: [educator('e1', 'Alice')],
        eligible: new Map([['s1', ['e1']]]),
        claims: [claim('s1', 'sec-1', 'e1', 0, 'Alice', [1, 2])],
        occupied: [
          {
            classId: 'existing',
            weekday: 1,
            startMin: 0,
            endMin: 2940,
            educatorId: 'e1',
            sectionId: 'sec-1',
            roomId: null,
          },
        ],
      });
      const r = await service.readiness(req);
      const issue = r.issues.find((i) => i.code === 'educator_over_capacity');
      expect(issue?.count).toBe(1);
      expect(issue?.entities).toEqual([
        { id: 'e1', name: 'Alice', type: 'educator' },
      ]);
    });

    it('blocks with a code the UI can link to the schedule page', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1')],
        educators: [educator('e1', 'A')],
        activeWeekdays: [],
      });
      const r = await service.readiness(req);
      expect(r.ok).toBe(false);
      expect(r.issues.some((i) => i.code === 'no_active_weekdays')).toBe(true);
    });
  });

  describe('preview', () => {
    it('places the required number of slots on distinct days', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 3, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const out = await service.preview(req);
      expect(out.placedCount).toBe(1);
      const item = out.items[0];
      expect(item.slots).toHaveLength(3);
      expect(new Set(item.slots.map((s) => s.weekday)).size).toBe(3);
      expect(item.educatorId).toBe('e1');
    });

    it('never places a slot on a non-school day', async () => {
      const { service } = makeHarness({
        activeWeekdays: [1, 3],
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 2, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const out = await service.preview(req);
      for (const s of out.items[0].slots) expect([1, 3]).toContain(s.weekday);
    });

    it('never places a slot across a break', async () => {
      const { service } = makeHarness({
        breaks: [{ label: 'Lunch', start: '12:00', end: '13:00' }],
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 4, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const out = await service.preview(req);
      for (const s of out.items[0].slots) {
        expect(s.startMin < MIN(13) && s.endMin > MIN(12)).toBe(false);
      }
    });

    it('respects an educator restricted to two days', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 2, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
        profiles: [
          { educator_id: 'e1', use_custom_availability: true, available_weekdays: [2, 4] },
        ],
      });
      const days = (await service.preview(req)).items[0].slots.map((s) => s.weekday);
      expect(days.every((d) => [2, 4].includes(d))).toBe(true);
    });

    it('takes the fullest hold when legacy data overlaps on one pair', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 2, 60)],
        educators: [educator('e1', 'Alice'), educator('e2', 'Bob')],
        eligible: new Map([['s1', ['e1', 'e2']]]),
        claims: [
          claim('s1', 'sec-1', 'e2', 1, 'Bob', [1]),
          claim('s1', 'sec-1', 'e1', 0, 'Alice', [1, 2]),
        ],
      });
      const out = await service.preview(req);
      expect(out.placedCount).toBe(1);
      expect(out.items[0].educatorId).toBe('e1');
      expect(out.items[0].warnings.join(' ')).toMatch(/Bob also hold/);
    });

    it('leaves the pair unplaced when slots are only partially picked', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 2, 60)],
        educators: [educator('e1', 'Alice')],
        eligible: new Map([['s1', ['e1']]]),
        claims: [claim('s1', 'sec-1', 'e1', 0, 'Alice', [1])],
      });
      const out = await service.preview(req);
      expect(out.placedCount).toBe(0);
      expect(out.unplacedCount).toBe(1);
      expect(out.items[0].educatorId).toBe('e1');
      expect(out.items[0].unplacedReason).toMatch(/Only 1 of 2 weekly slots/);
    });

    it('reports unplaced (not fallback) when nothing is assigned', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [educator('e1', 'Alice')],
      });
      const out = await service.preview(req);
      expect(out.placedCount).toBe(0);
      expect(out.unplacedCount).toBe(1);
      expect(out.items[0].unplacedReason).toMatch(/No educator is assigned/);
    });

    it('reports unplaced when the assigned educator has no available days', async () => {
      const { service } = makeHarness({
        activeWeekdays: [1, 2, 3],
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
        profiles: [
          { educator_id: 'e1', use_custom_availability: true, available_weekdays: [6] },
        ],
      });
      const out = await service.preview(req);
      expect(out.unplacedCount).toBe(1);
      expect(out.items[0].unplacedReason).toMatch(/no available school days/);
      expect(out.items[0].educatorId).toBe('e1');
    });

    it('does not collide with an existing booking', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
        occupied: [
          {
            classId: 'existing', weekday: 1, startMin: MIN(8), endMin: MIN(16),
            educatorId: 'e1', sectionId: 'sec-1', roomId: null,
          },
        ],
      });
      // Monday 08:00-16:00 is taken, but 07:00-08:00 is not (end is exclusive), so
    // the only guarantee is that no placed slot OVERLAPS the booking.
    const slots = (await service.preview(req)).items[0].slots;
    for (const s of slots) {
      const overlaps = s.startMin < MIN(16) && s.endMin > MIN(8);
      expect(overlaps).toBe(false);
    }
    });

    it('does not let two generated items collide with each other', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [
          subject('s1', 'lvl-1', 5, 120),
          subject('s2', 'lvl-1', 5, 120),
        ],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1'), claim('s2', 'sec-1', 'e1')],
      });
      const seen = new Set<string>();
      for (const item of (await service.preview(req)).items) {
        for (const s of item.slots) {
          const key = `${s.weekday}:${s.startMin}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }
    });

    it('reports an unplaced reason instead of dropping the item', async () => {
      const { service } = makeHarness({
        activeWeekdays: [1],
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [],
      });
      const out = await service.preview(req);
      expect(out.unplacedCount).toBe(1);
      expect(out.items[0].unplacedReason).toMatch(/No educator is assigned/);
    });

    it('warns when a subject needs more meetings than school days', async () => {
      const { service } = makeHarness({
        activeWeekdays: [1, 2],
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 5, 30)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      expect((await service.preview(req)).items[0].warnings.join(' ')).toMatch(
        /only 2 school day/,
      );
    });

    it('caps the plan and says so', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [
          subject('s1', 'lvl-1', 1, 30),
          subject('s2', 'lvl-1', 1, 30),
          subject('s3', 'lvl-1', 1, 30),
        ],
        educators: [educator('e1', 'Alice')],
        claims: [
          claim('s1', 'sec-1', 'e1'),
          claim('s2', 'sec-1', 'e1'),
          claim('s3', 'sec-1', 'e1'),
        ],
      });
      const out = await service.preview({ ...req, maxItems: 2 });
      expect(out.items).toHaveLength(2);
      expect(out.readiness.warnings.join(' ')).toMatch(/truncated/);
    });

    it('reports (not drops) a subject whose session exceeds the placement limit', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 600)],
        educators: [educator('e1', 'Alice')],
      });
      const out = await service.preview(req);
      expect(out.items).toHaveLength(1);
      expect(out.unplacedCount).toBe(1);
      expect(out.items[0].unplacedReason).toMatch(/placement limit/);
    });

    it('limits generation to the selected sections', async () => {
      const { service, db } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const out = await service.preview({ ...req, sectionIds: ['sec-1'] });
      expect(db.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: ['sec-1'] } }),
        }),
      );
      expect(out.items.every((i) => i.sectionId === 'sec-1')).toBe(true);
      expect(out.readiness.warnings.join(' ')).toMatch(/Limited to 1 selected section/);
    });

    it('blocks when none of the selected sections are in scope', async () => {
      const { service } = makeHarness({
        sections: [],
        subjects: [subject('s1')],
        educators: [educator('e1', 'Alice')],
      });
      const r = await service.readiness({ ...req, sectionIds: ['sec-x'] });
      expect(r.ok).toBe(false);
      expect(r.blockers.join(' ')).toMatch(/None of the selected sections/);
    });

    it('only matches sections to subjects on the same level', async () => {
      const { service } = makeHarness({
        sections: [section('sec-1', 'lvl-1')],
        subjects: [subject('s1', 'lvl-OTHER', 1, 60)],
        educators: [educator('e1', 'Alice')],
      });
      expect((await service.preview(req)).items).toHaveLength(0);
    });

    it('writes nothing during a preview', async () => {
      const { service, classService } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      await service.preview(req);
      expect(classService.create).not.toHaveBeenCalled();
    });
  });

  describe('commit', () => {
    it('creates a class per placed item through ClassService', async () => {
      const { service, classService } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 2, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      const out = await service.commit(req, 'actor-1');
      expect(out.created).toBe(1);
      expect(classService.create).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          subjectId: 's1', educatorId: 'e1', sectionId: 'sec-1',
          schoolYearId: 'sy-1', semesterId: 'sem-1',
        }),
        'actor-1',
      );
    });

    it('passes schedules as HH:mm wall-clock strings', async () => {
      const { service, classService } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1')],
      });
      await service.commit(req, 'actor-1');
      expect(classService.create.mock.calls[0][1].schedules[0]).toEqual({
        weekday: expect.any(Number),
        startTime: expect.stringMatching(/^\d{2}:\d{2}$/),
        endTime: expect.stringMatching(/^\d{2}:\d{2}$/),
      });
    });

    it('skips unplaced items and reports why', async () => {
      const { service, classService } = makeHarness({
        sections: [section('sec-1')],
        subjects: [subject('s1', 'lvl-1', 1, 60)],
        educators: [],
      });
      const out = await service.commit(req, 'actor-1');
      expect(out.created).toBe(0);
      expect(out.skipped[0].reason).toBe('unplaced');
      expect(classService.create).not.toHaveBeenCalled();
    });

    it('keeps going when one item fails, and reports the failure', async () => {
      const { service, classService } = makeHarness({
        sections: [section('sec-1')],
        subjects: [
          subject('s1', 'lvl-1', 1, 60),
          subject('s2', 'lvl-1', 1, 60),
        ],
        educators: [educator('e1', 'Alice')],
        claims: [claim('s1', 'sec-1', 'e1'), claim('s2', 'sec-1', 'e1')],
      });
      classService.create
        .mockRejectedValueOnce(new Error('educator already has a class'))
        .mockResolvedValueOnce({ id: 'c2' });

      const out = await service.commit(req, 'actor-1');
      expect(out.created).toBe(1);
      expect(out.skipped[0].reason).toBe('error');
      expect(out.skipped[0].detail).toMatch(/educator already has a class/);
    });
  });

  describe('roster', () => {
    it('returns each educator with year-scoped teachable subjects and effective days', async () => {
      const { service } = makeHarness({
        subjects: [subject('s1'), subject('s2')],
        educators: [educator('e1', 'Alice'), educator('e2', 'Bob')],
        eligible: new Map([
          ['s1', ['e1']],
          ['s2', ['e1', 'e2']],
        ]),
        claims: [claim('s1', 'sec-1', 'e1')],
        profiles: [
          { educator_id: 'e1', use_custom_availability: true, available_weekdays: [2, 4, 0] },
        ],
      });
      const out = await service.roster('org-1', 'sy-1');
      expect(out.activeWeekdays).toEqual([1, 2, 3, 4, 5]);
      const alice = out.educators.find((e) => e.educatorId === 'e1')!;
      // Sunday (0) is not a school day, so it drops out with no data migration.
      expect(alice.effectiveWeekdays).toEqual([2, 4]);
      expect(alice.useCustomAvailability).toBe(true);
      expect(alice.teachableSubjectIds.sort()).toEqual(['s1', 's2']);
      expect(alice.sectionsBySubject).toEqual({ s1: ['sec-1'] });
      // Legacy whole-pair hold expands to the subject's full weekly count
      // (jhs default 5x here).
      expect(alice.slotsBySubject).toEqual({
        s1: { 'sec-1': [1, 2, 3, 4, 5] },
      });
      const bob = out.educators.find((e) => e.educatorId === 'e2')!;
      expect(bob.useCustomAvailability).toBe(false);
      expect(bob.effectiveWeekdays).toEqual([1, 2, 3, 4, 5]);
      expect(bob.teachableSubjectIds).toEqual(['s2']);
    });

    it('returns an empty roster when the year has no subjects', async () => {
      const { service, educatorSubjects } = makeHarness({
        subjects: [],
        educators: [educator('e1', 'Alice')],
      });
      const out = await service.roster('org-1', 'sy-1');
      expect(educatorSubjects.getEligibleEducatorsBySubject).not.toHaveBeenCalled();
      expect(out.educators[0].teachableSubjectIds).toEqual([]);
    });
  });
});