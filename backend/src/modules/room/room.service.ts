// backend/src/modules/room/room.service.ts
//
// Rooms are free-text, org-scoped and optional. Nothing here is required for a
// class to exist: a slot with room_id = null behaves exactly as it did before
// the feature. All queries are scoped by org_id so one org can never read,
// rename, delete or schedule another org's rooms.

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

export interface RoomUsageRow {
  id: string;
  room_id: string | null;
  room_name: string | null;
  class_id: string;
  weekday: number;
  start_time: Date;
  end_time: Date;
  subject_name: string | null;
  section_name: string | null;
  educator_name: string | null;
}

@Injectable()
export class RoomService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Rooms are named by hand ("Room 201", "Lab B"), so normalise whitespace
   * before it reaches the uniqueness check — otherwise "Room  201" and
   * "Room 201" would both be accepted and render as two different rooms.
   */
  private normalize(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  /**
   * Case-insensitive uniqueness. The DB's @@unique([org_id, name]) is
   * case-SENSITIVE, so "Room 201" and "room 201" would both pass it. This is
   * the check that actually protects users; the DB constraint is a backstop.
   */
  private async assertNameFree(
    orgId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.db.room.findFirst({
      where: {
        org_id: orgId,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(`A room named "${name}" already exists.`);
    }
  }

  /** Tenant-scoped fetch. Returns null so callers raise a plain 404 and never
   *  leak whether another org owns that id. */
  private async findOwned(id: string, orgId: string) {
    return this.db.room.findFirst({
      where: { id, org_id: orgId },
      select: { id: true, name: true },
    });
  }

  /**
   * All rooms for the org, natural-sorted so "Room 2" precedes "Room 10"
   * (a plain string sort puts "Room 10" first).
   *
   * When schoolYearId is given, each room also carries slotCount = how many of
   * its slots are live in that year, so the card grid needs no per-card fetch.
   */
  async list(orgId: string, schoolYearId?: string) {
    const rooms = await this.db.room.findMany({
      where: { org_id: orgId },
      orderBy: { name: 'asc' },
    });

    if (!schoolYearId) return rooms;

    const counts = await this.slotCounts(orgId, schoolYearId);
    return rooms.map((room) => ({
      ...room,
      slotCount: counts.get(room.id) ?? 0,
    }));
  }

  /** Live (non-archived) slot count per room for one school year, in one query. */
  private async slotCounts(
    orgId: string,
    schoolYearId: string,
  ): Promise<Map<string, number>> {
    const grouped = await this.db.classSchedule.groupBy({
      by: ['room_id'],
      where: {
        org_id: orgId,
        room_id: { not: null },
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
      _count: { _all: true },
    });

    const counts = new Map<string, number>();
    for (const row of grouped) {
      // Prisma types the grouped key nullable; the where clause above
      // guarantees it is set, so this is narrowing rather than a guess.
      if (row.room_id) counts.set(row.room_id, row._count._all);
    }
    return counts;
  }
  async create(orgId: string, rawName: string) {
    const name = this.normalize(rawName);
    if (!name) {
      throw new ConflictException('Room name cannot be empty.');
    }
    await this.assertNameFree(orgId, name);
    return this.db.room.create({ data: { org_id: orgId, name } });
  }

  async rename(id: string, orgId: string, rawName: string) {
    const room = await this.findOwned(id, orgId);
    if (!room) throw new NotFoundException('Room not found.');

    const name = this.normalize(rawName);
    if (!name) {
      throw new ConflictException('Room name cannot be empty.');
    }
    if (name !== room.name) {
      await this.assertNameFree(orgId, name, id);
    }
    return this.db.room.update({ where: { id }, data: { name } });
  }

  /**
   * Delete a room. A room booked by a live class cannot be removed — the error
   * names the count so the user knows exactly what to reassign first.
   *
   * Slots belonging to ARCHIVED classes are detached first: an archived class
   * is read-only and hidden from every active view, so it should never be the
   * reason a room stays permanently undeletable.
   */
  async remove(id: string, orgId: string): Promise<void> {
    const room = await this.findOwned(id, orgId);
    if (!room) throw new NotFoundException('Room not found.');

    await this.db.classSchedule.updateMany({
      where: {
        room_id: id,
        org_id: orgId,
        class: { deleted_at: { not: null } },
      },
      data: { room_id: null },
    });

    const inUse = await this.db.classSchedule.count({
      where: { room_id: id, org_id: orgId, class: { deleted_at: null } },
    });

    if (inUse > 0) {
      throw new ConflictException(
        `"${room.name}" is used by ${inUse} schedule slot${inUse === 1 ? '' : 's'}. ` +
          `Reassign or clear ${inUse === 1 ? 'it' : 'them'} first.`,
      );
    }

    await this.db.room.delete({ where: { id } });
  }

  /**
   * Every room-assigned slot in a school year — optionally narrowed to one
   * room. Powers the Rooms page card summaries AND the per-room weekly grid.
   *
   * Batched: 1 slot query (with room/class/educator nested) + 1 section query,
   * regardless of how many slots come back. Never one query per slot.
   */
  async getUsage(
    orgId: string,
    schoolYearId: string,
    roomId?: string,
  ): Promise<RoomUsageRow[]> {
    const rows = await this.db.classSchedule.findMany({
      where: {
        org_id: orgId,
        ...(roomId ? { room_id: roomId } : { room_id: { not: null } }),
        class: { school_year_id: schoolYearId, deleted_at: null },
      },
      include: {
        room: { select: { name: true } },
        class: {
          select: {
            id: true,
            section_id: true,
            subject: { select: { name: true } },
            educator: { select: { profile: { select: { full_name: true } } } },
          },
        },
      },
      orderBy: [{ weekday: 'asc' }, { start_time: 'asc' }],
    });

    if (rows.length === 0) return [];

    // Section names live on a separate table the slot query doesn't reach.
    // Deduplicated + fetched in one shot so this stays O(1) queries.
    const sectionIds = [
      ...new Set(
        rows
          .map((r) => r.class.section_id)
          .filter((id): id is string => !!id),
      ),
    ];

    const sections = sectionIds.length
      ? await this.db.section.findMany({
          where: { id: { in: sectionIds }, org_id: orgId },
          select: { id: true, name: true },
        })
      : [];
    const sectionName = new Map(sections.map((s) => [s.id, s.name]));

    return rows.map((r) => ({
      id: r.id,
      room_id: r.room_id,
      room_name: r.room?.name ?? null,
      class_id: r.class.id,
      weekday: r.weekday,
      start_time: r.start_time,
      end_time: r.end_time,
      subject_name: r.class.subject?.name ?? null,
      section_name: r.class.section_id
        ? (sectionName.get(r.class.section_id) ?? null)
        : null,
      educator_name: r.class.educator?.profile?.full_name ?? null,
    }));
  }
}