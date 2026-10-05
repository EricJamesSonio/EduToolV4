import { act, renderHook } from "@testing-library/react";
import { useTeachableSeed } from "@/hooks/admin/useTeachableSeed";

const link = (
  id: string,
  sectionIds: string[] = ["sec-1"],
  sectionSlots: Array<{ sectionId: string; slots: number[] }> = [],
) => ({ id, sectionIds, sectionSlots });

describe("useTeachableSeed", () => {
  test("seeds selection and legacy picks on open", () => {
    const { result } = renderHook(
      ({ assigned, info }) =>
        useTeachableSeed({
          open: true,
          educatorId: "ed-1",
          schoolYearId: "sy-1",
          assigned,
          subjectInfoById: info,
          infoLoading: false,
        }),
      {
        initialProps: {
          assigned: [link("s1")],
          info: new Map([["s1", { positions: 2 }]]),
        },
      },
    );
    expect(result.current.selected).toEqual(["s1"]);
    expect(result.current.picksBySubject).toEqual({ s1: { "sec-1": [1, 2] } });
    expect(result.current.seedPicks).toEqual({ s1: { "sec-1": [1, 2] } });
  });

  test("late requirement data never wipes in-progress picks", () => {
    const { result, rerender } = renderHook(
      ({ assigned, info, loading }) =>
        useTeachableSeed({
          open: true,
          educatorId: "ed-1",
          schoolYearId: "sy-1",
          assigned,
          subjectInfoById: info,
          infoLoading: loading,
        }),
      {
        initialProps: {
          assigned: [link("s1")],
          info: new Map<string, { positions: number }>(),
          loading: true,
        },
      },
    );
    // Still loading: nothing seeded yet.
    expect(result.current.selected).toEqual([]);

    // User ticks + picks while info is still missing.
    act(() => {
      result.current.setSelected(["s1"]);
      result.current.setPicksBySubject({ s1: { "sec-1": [2] } });
    });

    // Requirements arrive late: the seed fires once, but the user's newer
    // picks must survive — seed only fills what is still untouched.
    rerender({
      assigned: [link("s1")],
      info: new Map([["s1", { positions: 2 }]]),
      loading: false,
    });
    expect(result.current.picksBySubject).toEqual({ s1: { "sec-1": [2] } });
    // The dirty baseline is the pure server seed, so the pre-seed edit
    // still reads as a change.
    expect(result.current.seedPicks).toEqual({ s1: { "sec-1": [1, 2] } });
  });

  test("close then reopen shows fresh server state", () => {
    const { result, rerender } = renderHook(
      ({ open, assigned }) =>
        useTeachableSeed({
          open,
          educatorId: "ed-1",
          schoolYearId: "sy-1",
          assigned,
          subjectInfoById: new Map([["s1", { positions: 2 }]]),
          infoLoading: false,
        }),
      { initialProps: { open: true, assigned: [link("s1")] } },
    );
    expect(result.current.selected).toEqual(["s1"]);

    act(() => {
      result.current.setSelected(["s1", "s2"]);
    });
    expect(result.current.selected).toEqual(["s1", "s2"]);

    rerender({ open: false, assigned: [link("s1")] });
    expect(result.current.selected).toEqual([]);
    expect(result.current.picksBySubject).toEqual({});

    // Server state changed while closed: reopen reflects it, not the
    // pre-close edits.
    rerender({ open: true, assigned: [link("s2", ["sec-9"])] });
    expect(result.current.selected).toEqual(["s2"]);
    expect(result.current.picksBySubject).toEqual({ s2: { "sec-9": [1, 2] } });
  });

  test("switching educator re-seeds", () => {
    const { result, rerender } = renderHook(
      ({ educatorId }) =>
        useTeachableSeed({
          open: true,
          educatorId,
          schoolYearId: "sy-1",
          assigned: [link("s1")],
          subjectInfoById: new Map([["s1", { positions: 2 }]]),
          infoLoading: false,
        }),
      { initialProps: { educatorId: "ed-1" } },
    );
    act(() => {
      result.current.setSelected([]);
    });
    rerender({ educatorId: "ed-2" });
    expect(result.current.selected).toEqual(["s1"]);
  });
});
