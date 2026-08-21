import { renderHook, act } from '@testing-library/react';
import { useSchoolProfileDraft } from '../useSchoolProfileDraft';
import type { SchoolProfileDepartment } from '@/types/admin/school-profile.types';

function makeSavedDept(type: string, overrides: any = {}): SchoolProfileDepartment {
  return {
    id: `dept-${type}`,
    type,
    courses: [],
    strands: [],
    levels: [],
    subjects: [],
    ...overrides,
  } as any;
}

describe('useSchoolProfileDraft', () => {
  it('starts empty and not dirty', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    expect(result.current.departments).toEqual({});
    expect(result.current.selectedTypes.size).toBe(0);
    expect(result.current.dirty).toBe(false);
  });

  it('hydrates from savedDepartments when not dirty', () => {
    const saved = [makeSavedDept('elementary', {
      levels: [{ id: 'lvl-1', name: 'Grade 1', orderIndex: 0, sections: [{ id: 'sec-1', name: 'A', capacity: 30 }], subjects: [] }],
    })];
    const { result } = renderHook(({ deps }) => useSchoolProfileDraft(deps), { initialProps: { deps: saved } });
    expect(result.current.departments['elementary']).toBeDefined();
    expect(result.current.departments['elementary'].levels[0].name).toBe('Grade 1');
    expect(result.current.departments['elementary'].levels[0].key).toBe('lvl-1');
  });

  it('selectDepartment creates predefined department (elementary)', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    expect(result.current.departments['elementary']).toBeDefined();
    expect(result.current.departments['elementary'].levels.length).toBeGreaterThan(0);
    expect(result.current.dirty).toBe(true);
    expect(result.current.selectedTypes.has('elementary' as any)).toBe(true);
  });

  it('selectDepartment for college creates courses', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('college' as any));
    expect(result.current.departments['college'].courses.length).toBeGreaterThan(0);
    expect(result.current.departments['college'].subjects.length).toBeGreaterThan(0);
  });

  it('selectDepartment for shs creates strands', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('shs' as any));
    expect(result.current.departments['shs'].strands.length).toBeGreaterThan(0);
  });

  it('selectDepartment is idempotent when already selected', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    const first = result.current.departments['elementary'];
    act(() => result.current.selectDepartment('elementary' as any));
    expect(result.current.departments['elementary']).toBe(first);
  });

  it('deselectDepartment removes', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    expect(result.current.selectedTypes.has('elementary' as any)).toBe(true);
    act(() => result.current.deselectDepartment('elementary' as any));
    expect(result.current.departments['elementary']).toBeUndefined();
    expect(result.current.selectedTypes.has('elementary' as any)).toBe(false);
  });

  it('addCourse / renameCourse / deleteCourse', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('college' as any));
    const initialCount = result.current.departments['college'].courses.length;
    act(() => result.current.addCourse('college' as any, 'New Course'));
    expect(result.current.departments['college'].courses).toHaveLength(initialCount + 1);
    const newCourse = result.current.departments['college'].courses[initialCount];
    expect(newCourse.name).toBe('New Course');
    act(() => result.current.renameCourse('college' as any, newCourse.key, 'Renamed'));
    expect(result.current.departments['college'].courses[initialCount].name).toBe('Renamed');
    act(() => result.current.deleteCourse('college' as any, newCourse.key));
    expect(result.current.departments['college'].courses).toHaveLength(initialCount);
  });

  it('addStrand / rename / delete', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('shs' as any));
    const initial = result.current.departments['shs'].strands.length;
    act(() => result.current.addStrand('shs' as any, 'New Strand'));
    expect(result.current.departments['shs'].strands).toHaveLength(initial + 1);
    const key = result.current.departments['shs'].strands[initial].key;
    act(() => result.current.renameStrand('shs' as any, key, 'Renamed'));
    expect(result.current.departments['shs'].strands[initial].name).toBe('Renamed');
    act(() => result.current.deleteStrand('shs' as any, key));
    expect(result.current.departments['shs'].strands).toHaveLength(initial);
  });

  it('addLevel for department, course, strand', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    const deptType = 'elementary' as any;
    const initialDeptLevels = result.current.departments[deptType].levels.length;
    act(() => result.current.addLevel(deptType, deptType, 'New Level'));
    expect(result.current.departments[deptType].levels).toHaveLength(initialDeptLevels + 1);

    act(() => result.current.selectDepartment('college' as any));
    const courseKey = result.current.departments['college'].courses[0].key;
    const initialCourseLevels = result.current.departments['college'].courses[0].levels.length;
    act(() => result.current.addLevel('college' as any, courseKey, 'Extra Year'));
    expect(result.current.departments['college'].courses[0].levels).toHaveLength(initialCourseLevels + 1);

    act(() => result.current.selectDepartment('shs' as any));
    const strandKey = result.current.departments['shs'].strands[0].key;
    const initialStrandLevels = result.current.departments['shs'].strands[0].levels.length;
    act(() => result.current.addLevel('shs' as any, strandKey, 'Extra Grade'));
    expect(result.current.departments['shs'].strands[0].levels).toHaveLength(initialStrandLevels + 1);
  });

  it('renameLevel and deleteLevel', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    const lvlKey = result.current.departments['elementary'].levels[0].key;
    act(() => result.current.renameLevel('elementary' as any, lvlKey, 'Renamed Grade'));
    expect(result.current.departments['elementary'].levels[0].name).toBe('Renamed Grade');
    act(() => result.current.deleteLevel('elementary' as any, lvlKey));
    expect(result.current.departments['elementary'].levels.find(l => l.key === lvlKey)).toBeUndefined();
  });

  it('addSection / updateSection / deleteSection', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    const lvlKey = result.current.departments['elementary'].levels[0].key;
    const initialSecs = result.current.departments['elementary'].levels[0].sections.length;
    act(() => result.current.addSection('elementary' as any, lvlKey, 'New Sec', 25));
    expect(result.current.departments['elementary'].levels[0].sections).toHaveLength(initialSecs + 1);
    const secKey = result.current.departments['elementary'].levels[0].sections[initialSecs].key;
    act(() => result.current.updateSection('elementary' as any, lvlKey, secKey, 'Renamed Sec', 30));
    expect(result.current.departments['elementary'].levels[0].sections[initialSecs].name).toBe('Renamed Sec');
    expect(result.current.departments['elementary'].levels[0].sections[initialSecs].capacity).toBe(30);
    act(() => result.current.deleteSection('elementary' as any, lvlKey, secKey));
    expect(result.current.departments['elementary'].levels[0].sections).toHaveLength(initialSecs);
  });

  it('addSubject / rename / delete', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    const lvlKey = result.current.departments['elementary'].levels[0].key;
    const initialSubs = result.current.departments['elementary'].levels[0].subjects.length;
    act(() => result.current.addSubject('elementary' as any, lvlKey, 'New Subject'));
    expect(result.current.departments['elementary'].levels[0].subjects).toHaveLength(initialSubs + 1);
    const subKey = result.current.departments['elementary'].levels[0].subjects[initialSubs].key;
    act(() => result.current.renameSubject('elementary' as any, lvlKey, subKey, 'Renamed Sub'));
    expect(result.current.departments['elementary'].levels[0].subjects[initialSubs].name).toBe('Renamed Sub');
    act(() => result.current.deleteSubject('elementary' as any, lvlKey, subKey));
    expect(result.current.departments['elementary'].levels[0].subjects).toHaveLength(initialSubs);
  });

  it('markSaved clears dirty', () => {
    const { result } = renderHook(() => useSchoolProfileDraft([]));
    act(() => result.current.selectDepartment('elementary' as any));
    expect(result.current.dirty).toBe(true);
    act(() => result.current.markSaved());
    expect(result.current.dirty).toBe(false);
  });

  it('does not overwrite when dirty (hydration guard)', () => {
    const saved1 = [makeSavedDept('elementary', { levels: [{ id: 'lvl-1', name: 'Grade 1', orderIndex: 0, sections: [], subjects: [] }] })];
    const saved2 = [makeSavedDept('elementary', { levels: [{ id: 'lvl-1', name: 'Grade 1 Updated', orderIndex: 0, sections: [], subjects: [] }] })];
    const { result, rerender } = renderHook(({ deps }) => useSchoolProfileDraft(deps), { initialProps: { deps: saved1 } });
    // Make dirty by selecting another dept
    act(() => result.current.selectDepartment('college' as any));
    expect(result.current.dirty).toBe(true);
    // Try to rerender with new saved data — should NOT overwrite because dirty
    rerender({ deps: saved2 });
    // Should still have college and original elementary Name, not updated
    expect(result.current.departments['elementary'].levels[0].name).toBe('Grade 1');
    expect(result.current.departments['college']).toBeDefined();
  });

  it('hydrates correctly when not dirty and saved changes', () => {
    const saved1: SchoolProfileDepartment[] = [];
    const saved2 = [makeSavedDept('elementary', { levels: [{ id: 'lvl-1', name: 'Grade 1', orderIndex: 0, sections: [], subjects: [] }] })];
    const { result, rerender } = renderHook(({ deps }) => useSchoolProfileDraft(deps), { initialProps: { deps: saved1 } });
    expect(result.current.selectedTypes.size).toBe(0);
    rerender({ deps: saved2 });
    expect(result.current.departments['elementary']).toBeDefined();
    expect(result.current.dirty).toBe(false);
  });
});
