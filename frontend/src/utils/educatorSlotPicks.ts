/**
 * Teachable slot-pick math shared by the assignment UI.
 *
 * Mirrors the server formula in
 * backend/src/modules/educator/educator-subject.service.ts (pickedMinutes /
 * loadCapacityParts) exactly:
 * - one (section, position) pair counts once, only when the position is
 *   within the subject's weekly count (1..S);
 * - each counted pair costs the subject's session minutes;
 * - weekly capacity = effective days x org-window minutes (breaks removed);
 * - used = proposed picks + other picks + existing classes.
 * The server stays the authority; this module only previews the same numbers
 * so the UI can block over-capacity clicks before they reach it.
 */

export type SlotPicks = Record<string, Record<string, number[]>>;

export interface SlotRequirement {
  positions: number;
  minutes: number;
}

/** Minutes for one set of slot picks (server pickedMinutes). */
export function pickedMinutes(
  picks: SlotPicks,
  requirements: Map<string, SlotRequirement> | Record<string, SlotRequirement>,
): number {
  const req =
    requirements instanceof Map
      ? requirements
      : new Map(Object.entries(requirements));
  let total = 0;
  for (const [subjectId, secs] of Object.entries(picks)) {
    const r = req.get(subjectId);
    if (!r) continue;
    const positions = new Set<string>();
    for (const [sectionId, slots] of Object.entries(secs)) {
      for (const n of slots) {
        if (n >= 1 && n <= r.positions) positions.add(`${sectionId}:${n}`);
      }
    }
    total += positions.size * r.minutes;
  }
  return total;
}

export interface CapacityUsage {
  capacityMin: number;
  existingMin: number;
  pickedMin: number;
  usedMin: number;
  remainingMin: number;
  percentUsed: number;
  overCapacity: boolean;
}

/** Weekly usage rollup (server: usedMin / capacityMin in setSlots). */
export function capacityUsage(args: {
  capacityMin: number;
  existingMin: number;
  pickedMin: number;
}): CapacityUsage {
  const usedMin = args.pickedMin + args.existingMin;
  const remainingMin = args.capacityMin - usedMin;
  return {
    capacityMin: args.capacityMin,
    existingMin: args.existingMin,
    pickedMin: args.pickedMin,
    usedMin,
    remainingMin,
    percentUsed:
      args.capacityMin > 0 ? Math.round((usedMin / args.capacityMin) * 100) : 0,
    overCapacity: usedMin > args.capacityMin,
  };
}

export interface SeedLink {
  id: string;
  sectionIds: string[];
  sectionSlots?: Array<{ sectionId: string; slots: number[] }>;
}

/**
 * Seed builder for the teachable modal (extracted for testing): links plus
 * weekly slot picks per section. Legacy rows (section ids with no slot
 * picks) expand to the full weekly count when the requirement is known;
 * unknown requirements (positions 0) contribute nothing rather than junk.
 */
export function buildSeedPicks(
  assigned: SeedLink[],
  subjectInfoById: Map<string, { positions: number }>,
): SlotPicks {
  const picks: SlotPicks = {};
  for (const s of assigned) {
    const perSection: Record<string, number[]> = {};
    const explicit = new Map(
      (s.sectionSlots ?? []).map((p) => [p.sectionId, [...p.slots]]),
    );
    const positions = subjectInfoById.get(s.id)?.positions ?? 0;
    for (const sectionId of s.sectionIds) {
      const slots = explicit.get(sectionId);
      if (slots && slots.length > 0) {
        perSection[sectionId] = [...slots].sort((a, b) => a - b);
      } else if (positions > 0) {
        perSection[sectionId] = Array.from(
          { length: positions },
          (_, i) => i + 1,
        );
      }
    }
    for (const p of s.sectionSlots ?? []) {
      if (!(p.sectionId in perSection) && p.slots.length > 0) {
        perSection[p.sectionId] = [...p.slots].sort((a, b) => a - b);
      }
    }
    if (Object.keys(perSection).length > 0) picks[s.id] = perSection;
  }
  return picks;
}
