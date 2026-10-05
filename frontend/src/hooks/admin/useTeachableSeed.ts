import { useEffect, useRef, useState } from "react";
import {
  buildSeedPicks,
  type Picks,
} from "@/utils/educatorSlotPicks";

export interface TeachableSeedInput {
  open: boolean;
  educatorId: string;
  schoolYearId?: string;
  assigned: Array<{
    id: string;
    sectionIds: string[];
    sectionSlots?: Array<{ sectionId: string; slots: number[] }>;
  }>;
  subjectInfoById: Map<string, { positions: number }>;
  infoLoading: boolean;
}

/**
 * Seed-once form state for the teachable modal (extracted for testing).
 * Seeds exactly once per open session (educator + school year): late query
 * arrivals and background refetches never wipe in-progress picks. Resets on
 * close so a reopen always starts from fresh server state.
 *
 * Merge, don't overwrite: a fast clicker may have ticked/picked while
 * requirements were still loading. Untouched subjects take the server seed;
 * subjects the user already picked keep the user's picks. The dirty
 * baseline is always the pure server seed. (One accepted edge: an untick
 * made before the first seed is indistinguishable from pristine and gets
 * re-ticked by the seed.)
 */
export function useTeachableSeed({
  open,
  educatorId,
  schoolYearId,
  assigned,
  subjectInfoById,
  infoLoading,
}: TeachableSeedInput): {
  seedKey: string | null;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  picksBySubject: Picks;
  setPicksBySubject: React.Dispatch<React.SetStateAction<Picks>>;
  seedPicks: Picks;
} {
  const [selected, setSelected] = useState<string[]>([]);
  const [picksBySubject, setPicksBySubject] = useState<Picks>({});
  const [seedPicks, setSeedPicks] = useState<Picks>({});
  const seededForRef = useRef<string | null>(null);
  const seedKey = open ? `${educatorId}::${schoolYearId ?? ""}` : null;

  useEffect(() => {
    if (!open || seedKey === null) {
      seededForRef.current = null;
      if (!open) {
        setSelected([]);
        setPicksBySubject({});
        setSeedPicks({});
      }
      return;
    }
    if (seededForRef.current === seedKey) return;
    if (infoLoading) return;
    const serverSeed = buildSeedPicks(assigned, subjectInfoById);
    setSeedPicks(JSON.parse(JSON.stringify(serverSeed)) as Picks);
    setSelected((prev) =>
      prev.length > 0 ? prev : assigned.map((s) => s.id),
    );
    setPicksBySubject((prev) => {
      if (Object.keys(prev).length === 0) return serverSeed;
      const next: Picks = { ...serverSeed };
      for (const [id, secs] of Object.entries(prev)) next[id] = secs;
      return next;
    });
    seededForRef.current = seedKey;
  }, [open, seedKey, educatorId, schoolYearId, assigned, subjectInfoById, infoLoading]);

  return {
    seedKey,
    selected,
    setSelected,
    picksBySubject,
    setPicksBySubject,
    seedPicks,
  };
}
