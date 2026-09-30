import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';
import type { OccupiedSlot } from './class-conflict.util';

/**
 * How far conflicts reach.
 *
 * 'school-year' is the default and matches what manual class creation has
 * always done, so existing behaviour is unchanged. It is a parameter rather
 * than a hardcoded assumption so the generator can reason about semesters
 * without a rewrite if the owner later decides to switch.
 *
 * Note the practical consequence of school-year scope: a class placed in
 * Semester 1 will block the same educator/section/time in Semester 2. That is
 * a real limitation of the current model, not a bug introduced here — it is
 * called out in the generator's readiness report rather than silently ignored.
 */
export type ConflictScope = 'school-year' | 'semester';

export interface OccupancyQuery {
  orgId: string;
  schoolYearId: string;
  scope?: ConflictScope;
  /** Required for 'semester' scope. */
  semesterId?: string;
  /**
   * Narrowing hints. Omitting them returns the whole year (what the generator
   * wants, since it considers every candidate at once). Supplying them is what a
   * single manual create/update needs: only the slots of THIS educator, THIS
   * section, and THESE rooms can possibly conflict.
   */
  educatorId?: string;
  sectionId?: string;
  roomIds?: string[];
}

@Injectable()
export class ClassOccupancyService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Builds the occupancy index for a scope in ONE query.
   *
   * Every slot in the scope is returned, not just those matching a specific
   * educator or section, because the generator proposes candidates across many
   * educators and sections at once and filtering afterwards in memory is far
   * cheaper than a query per candidate.
   */
  async load(query: OccupancyQuery): Promise<OccupiedSlot[]> {
    const scope = query.scope ?? 'school-year';
    if (scope === 'semester' && !query.semesterId) {
      throw new Error(
        'semester conflict scope requires a semesterId',
      );
    }

    const narrowed = query.educatorId || query.sectionId || query.roomIds?.length;
    const rooms = query.roomIds ?? [];

    const rows = await this.db.classSchedule.findMany({
      where: {
        org_id: query.orgId,
        class: {
          school_year_id: query.schoolYearId,
          deleted_at: null,
          ...(scope === 'semester' && { semester_id: query.semesterId }),
          // With no narrowing hints this stays a plain whole-year read. With
          // hints, only classes that could actually collide are loaded: the
          // target educator's, the target section's, or the chosen rooms'.
          ...(narrowed && {
            OR: [
              ...(query.educatorId ? [{ educator_id: query.educatorId }] : []),
              ...(query.sectionId ? [{ section_id: query.sectionId }] : []),
              ...(rooms.length ? [{ schedules: { some: { room_id: { in: rooms } } } }] : []),
            ],
          }),
        },
      },
      select: {
        weekday: true,
        start_time: true,
        end_time: true,
        room_id: true,
        class: {
          select: { id: true, educator_id: true, section_id: true },
        },
      },
    });

    return rows.map((r) => ({
      classId: r.class.id,
      weekday: r.weekday,
      // Wall-clock only. The date component of these columns is meaningless.
      startMin: r.start_time.getHours() * 60 + r.start_time.getMinutes(),
      endMin: r.end_time.getHours() * 60 + r.end_time.getMinutes(),
      educatorId: r.class.educator_id,
      sectionId: r.class.section_id,
      roomId: r.room_id,
    }));
  }

  /**
   * Confirms every requested room exists in this org before it is trusted.
   * Without this a crafted payload could probe another org's room ids.
   */
  async assertRoomsOwned(orgId: string, roomIds: string[]): Promise<void> {
    const unique = [...new Set(roomIds.filter(Boolean))];
    if (unique.length === 0) return;
    const owned = await this.db.room.findMany({
      where: { id: { in: unique }, org_id: orgId },
      select: { id: true },
    });
    if (owned.length !== unique.length) {
      throw new Error('One or more selected rooms do not exist.');
    }
  }
}
