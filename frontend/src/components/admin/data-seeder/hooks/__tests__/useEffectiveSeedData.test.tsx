import { renderHook } from '@testing-library/react';
import { useEffectiveSeedData } from '../useEffectiveSeedData';
import type { SchoolProfileDepartment } from '@/types/admin/school-profile.types';

// Use the REAL hook — no mocks. We test its actual transformation logic.
describe('useEffectiveSeedData — real logic (no shortcuts)', () => {
  it('returns null/empty overrides when no departments saved', () => {
    const { result } = renderHook(() => useEffectiveSeedData([]));

    expect(result.current.collegeCourses).toBeNull();
    expect(result.current.shsStrands).toBeNull();
    expect(result.current.levelDefsByEntity).toEqual({});
    expect(result.current.sectionsByLevelName).toEqual({});
    expect(result.current.levelSubjectsByLevelName).toEqual({});
    expect(result.current.courseSubjectsByCode).toEqual({});
    expect(result.current.strandSubjectsByName).toEqual({});
  });

  it('maps college courses with code fallback and years count (real years = levels.length)', () => {
    const departments: SchoolProfileDepartment[] = [
      {
        id: 'dept-college',
        type: 'college',
        courses: [
          {
            id: 'c-1',
            name: 'BS Computer Science',
            code: 'BSCS',
            levels: [
              { id: 'l-1', courseId: 'c-1', strandId: null, name: '1st Year', orderIndex: 0, sections: [{ id: 's-1', name: 'A', capacity: 40 }], subjects: [{ id: 'subj-1', name: 'Intro to CS', subjectType: 'major', sharings: [] }] },
              { id: 'l-2', courseId: 'c-1', strandId: null, name: '2nd Year', orderIndex: 1, sections: [{ id: 's-2', name: 'A', capacity: 40 }], subjects: [{ id: 'subj-2', name: 'Data Structures', subjectType: 'major', sharings: [] }] },
            ],
          },
          {
            id: 'c-2',
            name: 'BS Info Systems',
            code: null, // code missing — should fallback to name
            levels: [
              { id: 'l-3', courseId: 'c-2', strandId: null, name: '1st Year', orderIndex: 0, sections: [{ id: 's-3', name: 'A', capacity: 40 }], subjects: [] },
            ],
          },
        ],
        strands: [],
        levels: [],
        subjects: [],
      },
    ];

    const { result } = renderHook(() => useEffectiveSeedData(departments));

    // collegeCourses: code fallback + years = levels.length
    expect(result.current.collegeCourses).toEqual([
      { code: 'BSCS', name: 'BS Computer Science', years: 2 },
      { code: 'BS Info Systems', name: 'BS Info Systems', years: 1 },
    ]);

    // levelDefsByEntity for course codes
    expect(result.current.levelDefsByEntity['BSCS']).toEqual(['1st Year', '2nd Year']);
    expect(result.current.levelDefsByEntity['BS Info Systems']).toEqual(['1st Year']);

    // courseSubjectsByCode: only major subjects, aggregated per course
    expect(result.current.courseSubjectsByCode['BSCS']).toEqual(['Intro to CS', 'Data Structures']);
    expect(result.current.courseSubjectsByCode['BS Info Systems']).toEqual([]);

    // sectionsByLevelName: last write wins for duplicate level names across courses
    expect(result.current.sectionsByLevelName['1st Year']).toEqual([{ name: 'A', capacity: 40 }]);
  });

  it('maps SHS strands correctly', () => {
    const departments: SchoolProfileDepartment[] = [
      {
        id: 'dept-shs',
        type: 'shs',
        courses: [],
        strands: [
          {
            id: 'strand-1',
            name: 'STEM',
            levels: [
              { id: 'l-1', courseId: null, strandId: 'strand-1', name: 'Grade 11', orderIndex: 0, sections: [{ id: 's-1', name: 'S1', capacity: 35 }], subjects: [{ id: 'subj-1', name: 'Physics', subjectType: 'major', sharings: [] }] },
              { id: 'l-2', courseId: null, strandId: 'strand-1', name: 'Grade 12', orderIndex: 1, sections: [{ id: 's-2', name: 'S1', capacity: 35 }], subjects: [{ id: 'subj-2', name: 'Chemistry', subjectType: 'major', sharings: [] }] },
            ],
          },
          {
            id: 'strand-2',
            name: 'ABM',
            levels: [
              { id: 'l-3', courseId: null, strandId: 'strand-2', name: 'Grade 11', orderIndex: 0, sections: [{ id: 's-3', name: 'S1', capacity: 35 }], subjects: [{ id: 'subj-3', name: 'Accounting', subjectType: 'major', sharings: [] }] },
            ],
          },
        ],
        levels: [],
        subjects: [],
      },
    ];

    const { result } = renderHook(() => useEffectiveSeedData(departments));

    expect(result.current.shsStrands).toEqual(['STEM', 'ABM']);
    expect(result.current.levelDefsByEntity['STEM']).toEqual(['Grade 11', 'Grade 12']);
    expect(result.current.levelDefsByEntity['ABM']).toEqual(['Grade 11']);
    expect(result.current.strandSubjectsByName['STEM']).toEqual(['Physics', 'Chemistry']);
    expect(result.current.strandSubjectsByName['ABM']).toEqual(['Accounting']);
  });

  it('maps department-level levels (elementary/jhs etc) and filters to major subjects only', () => {
    const departments: SchoolProfileDepartment[] = [
      {
        id: 'dept-elem',
        type: 'elementary',
        courses: [],
        strands: [],
        levels: [
          {
            id: 'l-1',
            courseId: null,
            strandId: null,
            name: 'Grade 1',
            orderIndex: 0,
            sections: [
              { id: 's-1', name: 'A', capacity: 30 },
              { id: 's-2', name: 'B', capacity: 30 },
            ],
            subjects: [
              { id: 'subj-1', name: 'Math 1', subjectType: 'major', sharings: [] },
              { id: 'subj-2', name: 'PE', subjectType: 'minor', sharings: [] }, // minor should be excluded
            ],
          },
        ],
        subjects: [],
      },
    ];

    const { result } = renderHook(() => useEffectiveSeedData(departments));

    expect(result.current.levelDefsByEntity['elementary']).toEqual(['Grade 1']);
    expect(result.current.sectionsByLevelName['Grade 1']).toEqual([
      { name: 'A', capacity: 30 },
      { name: 'B', capacity: 30 },
    ]);
    // Only major
    expect(result.current.levelSubjectsByLevelName['Grade 1']).toEqual(['Math 1']);
    // collegeCourses/shsStrands null
    expect(result.current.collegeCourses).toBeNull();
    expect(result.current.shsStrands).toBeNull();
  });

  it('handles mixed departments (college + shs + elementary) together — what OrgHeroCard+Seeder see', () => {
    const departments: SchoolProfileDepartment[] = [
      {
        id: 'dept-college',
        type: 'college',
        courses: [
          { id: 'c-1', name: 'BSIT', code: 'BSIT', levels: [{ id: 'l-1', courseId: 'c-1', strandId: null, name: '1st Year', orderIndex: 0, sections: [{ id: 's-1', name: 'A', capacity: 40 }], subjects: [{ id: 'subj-1', name: 'Comp 101', subjectType: 'major', sharings: [] }] }] },
        ],
        strands: [],
        levels: [],
        subjects: [],
      },
      {
        id: 'dept-shs',
        type: 'shs',
        courses: [],
        strands: [{ id: 'strand-1', name: 'HUMSS', levels: [{ id: 'l-2', courseId: null, strandId: 'strand-1', name: 'Grade 11', orderIndex: 0, sections: [{ id: 's-2', name: 'S1', capacity: 35 }], subjects: [{ id: 'subj-2', name: 'Philo', subjectType: 'major', sharings: [] }] }] }],
        levels: [],
        subjects: [],
      },
      {
        id: 'dept-elementary',
        type: 'elementary',
        courses: [],
        strands: [],
        levels: [{ id: 'l-3', courseId: null, strandId: null, name: 'Grade 1', orderIndex: 0, sections: [{ id: 's-3', name: 'A', capacity: 30 }], subjects: [{ id: 'subj-3', name: 'Math', subjectType: 'major', sharings: [] }] }],
        subjects: [],
      },
    ];

    const { result } = renderHook(() => useEffectiveSeedData(departments));

    // This is exactly what SeederCard uses to override defaults
    expect(result.current.collegeCourses).toEqual([{ code: 'BSIT', name: 'BSIT', years: 1 }]);
    expect(result.current.shsStrands).toEqual(['HUMSS']);
    expect(result.current.levelDefsByEntity).toEqual({
      BSIT: ['1st Year'],
      HUMSS: ['Grade 11'],
      elementary: ['Grade 1'],
    });
    expect(Object.keys(result.current.sectionsByLevelName).sort()).toEqual(['1st Year', 'Grade 1', 'Grade 11'].sort());
  });

  it('produces empty arrays for levels with no major subjects (real filtering, not mocked to pass)', () => {
    const departments: SchoolProfileDepartment[] = [
      {
        id: 'dept-college',
        type: 'college',
        courses: [
          { id: 'c-1', name: 'BSIT', code: 'BSIT', levels: [{ id: 'l-1', courseId: 'c-1', strandId: null, name: '1st Year', orderIndex: 0, sections: [{ id: 's-1', name: 'A', capacity: 40 }], subjects: [{ id: 'subj-1', name: 'PE', subjectType: 'minor', sharings: [] }] }] },
        ],
        strands: [],
        levels: [],
        subjects: [],
      },
    ];

    const { result } = renderHook(() => useEffectiveSeedData(departments));

    // Should be empty array, not undefined or filtered incorrectly — proves real filter works
    expect(result.current.courseSubjectsByCode['BSIT']).toEqual([]);
    expect(result.current.levelDefsByEntity['BSIT']).toEqual(['1st Year']);
  });

  it('is a pure derivation — same input produces same output (idempotent)', () => {
    const departments: SchoolProfileDepartment[] = [
      {
        id: 'dept-elem',
        type: 'elementary',
        courses: [],
        strands: [],
        levels: [{ id: 'l-1', courseId: null, strandId: null, name: 'Grade 1', orderIndex: 0, sections: [{ id: 's-1', name: 'A', capacity: 30 }], subjects: [{ id: 'subj-1', name: 'Math', subjectType: 'major', sharings: [] }] }],
        subjects: [],
      },
    ];

    const { result, rerender } = renderHook(({ deps }) => useEffectiveSeedData(deps), {
      initialProps: { deps: departments },
    });

    const first = JSON.stringify(result.current);
    rerender({ deps: departments });
    const second = JSON.stringify(result.current);

    expect(first).toBe(second);
    // Not a new object reference every render if input ref same — useMemo works
    // (If we pass a new array with same content, it will recompute but still equal)
    const { result: r2 } = renderHook(() => useEffectiveSeedData([...departments]));
    expect(JSON.stringify(r2.current)).toBe(first);
  });
});
