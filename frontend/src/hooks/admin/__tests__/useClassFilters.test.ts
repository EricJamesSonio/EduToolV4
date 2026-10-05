import { renderHook, act } from "@testing-library/react";
import { useClassFilters } from "@/hooks/admin/useClassFilters";

describe("useClassFilters subject scoping", () => {
  it("is undefined by default, so the list is not narrowed", () => {
    const { result } = renderHook(() => useClassFilters());

    expect(result.current.query.subjectId).toBeUndefined();
  });

  it("carries the arrival subjectId into the query", () => {
    // The bug: `/admin/classes?subjectId=X` never reached this query, so the
    // list showed every class in the school year instead of X's classes.
    const { result } = renderHook(() => useClassFilters("subj-1"));

    expect(result.current.query.subjectId).toBe("subj-1");
  });

  it("keeps the subjectId in the cache key so scopes do not collide", () => {
    const { result } = renderHook(() => useClassFilters("subj-1"));
    const before = result.current.query.subjectId;

    // No subject filter control exists on the Classes page, so changing the
    // other filters must not drop the subject narrowing.
    act(() => result.current.setSearch("networking"));

    expect(result.current.query.subjectId).toBe(before);
    expect(result.current.query.search).toBe("networking");
  });
});