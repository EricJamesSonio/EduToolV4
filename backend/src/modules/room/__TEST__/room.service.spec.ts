import { NotFoundException, ConflictException } from '@nestjs/common';
import { RoomService } from '../room.service';

describe('RoomService', () => {
  let service: RoomService;
  let db: any;

  const orgId = 'org-1';
  const schoolYearId = 'sy-1';

  beforeEach(() => {
    db = {
      room: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      classSchedule: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      section: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new RoomService(db);
  });

  describe('create', () => {
    it('normalizes whitespace before storing', async () => {
      db.room.create.mockResolvedValue({ id: 'r1' });
      await service.create(orgId, '  Room   201  ');
      expect(db.room.create).toHaveBeenCalledWith({
        data: { org_id: orgId, name: 'Room 201' },
      });
    });

    it('rejects a duplicate name in the same org', async () => {
      db.room.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, 'Room 201')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects a name that differs only by case', async () => {
      // The service must catch "room 201" vs "Room 201"; the DB's
      // @@unique([org_id, name]) is case-sensitive and would not.
      db.room.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.create(orgId, 'room 201')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(db.room.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            org_id: orgId,
            name: expect.objectContaining({
              equals: 'room 201',
              mode: 'insensitive',
            }),
          }),
        }),
      );
    });

    it('rejects a whitespace-only name', async () => {
      await expect(service.create(orgId, '   ')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(db.room.create).not.toHaveBeenCalled();
    });
  });

  describe('rename', () => {
    it('404s for a room owned by another org', async () => {
      db.room.findFirst.mockResolvedValue(null);
      await expect(
        service.rename('room-x', orgId, 'Room 999'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.room.update).not.toHaveBeenCalled();
    });

    it('allows saving the same name back onto itself', async () => {
      db.room.findFirst.mockResolvedValue({ id: 'r1', name: 'Room 201' });
      db.room.update.mockResolvedValue({ id: 'r1' });
      await service.rename('r1', orgId, 'Room 201');
      // No duplicate lookup needed when nothing changed.
      expect(db.room.findFirst).toHaveBeenCalledTimes(1);
      expect(db.room.update).toHaveBeenCalled();
    });

    it('rejects renaming onto another room in a different case', async () => {
      db.room.findFirst
        .mockResolvedValueOnce({ id: 'r1', name: 'Room 201' })   // ownership
        .mockResolvedValueOnce({ id: 'r2' });                    // duplicate
      await expect(
        service.rename('r1', orgId, 'ROOM 201'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
  describe('remove', () => {
    it('404s for a room owned by another org', async () => {
      db.room.findFirst.mockResolvedValue(null);
      await expect(service.remove('room-x', orgId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.room.delete).not.toHaveBeenCalled();
    });

    it('refuses to delete a room in use and reports the count', async () => {
      db.room.findFirst.mockResolvedValue({ id: 'r1', name: 'Room 201' });
      db.classSchedule.count.mockResolvedValue(3);
      await expect(service.remove('r1', orgId)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(db.room.delete).not.toHaveBeenCalled();
    });

    it('counts only LIVE classes, detaching archived ones first', async () => {
      db.room.findFirst.mockResolvedValue({ id: 'r1', name: 'Room 201' });
      db.classSchedule.count.mockResolvedValue(0);
      await service.remove('r1', orgId);
      // Archived slots are cleared so they never block a delete.
      expect(db.classSchedule.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            class: { deleted_at: { not: null } },
          }),
          data: { room_id: null },
        }),
      );
      expect(db.classSchedule.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            class: { deleted_at: null },
          }),
        }),
      );
      expect(db.room.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });
  });

  describe('list', () => {
    it('scopes to the org and omits counts when no year is given', async () => {
      await service.list(orgId);
      expect(db.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { org_id: orgId } }),
      );
      expect(db.classSchedule.groupBy).not.toHaveBeenCalled();
    });

    it('attaches a slotCount per room for the school year', async () => {
      db.room.findMany.mockResolvedValue([{ id: 'r1' }, { id: 'r2' }]);
      db.classSchedule.groupBy.mockResolvedValue([
        { room_id: 'r1', _count: { _all: 5 } },
      ]);
      const res = await service.list(orgId, schoolYearId);
      expect(res).toEqual([
        { id: 'r1', slotCount: 5 },
        { id: 'r2', slotCount: 0 },
      ]);
    });
  });

  describe('getUsage', () => {
    it('returns an empty array without hitting the section table', async () => {
      db.classSchedule.findMany.mockResolvedValue([]);
      await expect(service.getUsage(orgId, schoolYearId)).resolves.toEqual([]);
      expect(db.section.findMany).not.toHaveBeenCalled();
    });

    it('scopes every query by org AND school year', async () => {
      await service.getUsage(orgId, schoolYearId, 'room-1');
      expect(db.classSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            org_id: orgId,
            room_id: 'room-1',
            class: { school_year_id: schoolYearId, deleted_at: null },
          }),
        }),
      );
    });

    it('resolves section names in one batched query', async () => {
      const row = (over: Record<string, unknown>) => ({
        id: 's1', room_id: 'r1', class_id: 'c1', weekday: 1,
        start_time: new Date(), end_time: new Date(),
        room: { name: 'Room 201' },
        class: {
          id: 'c1', section_id: 'sec-1',
          subject: { name: 'Math' },
          educator: { profile: { full_name: 'Jane Doe' } },
        },
        ...over,
      });
      db.classSchedule.findMany.mockResolvedValue([
        row({}),
        row({ id: 's2', class_id: 'c2', weekday: 2 }),
      ]);
      db.section.findMany.mockResolvedValue([{ id: 'sec-1', name: 'BSCS 1-A' }]);

      const res = await service.getUsage(orgId, schoolYearId);

      // Two rows share one section -> still a single deduped query.
      expect(db.section.findMany).toHaveBeenCalledTimes(1);
      expect(res.map((r) => r.section_name)).toEqual(['BSCS 1-A', 'BSCS 1-A']);
      expect(res[0]).toMatchObject({
        room_name: 'Room 201',
        subject_name: 'Math',
        educator_name: 'Jane Doe',
      });
    });

    it('handles rows whose class has no section', async () => {
      db.classSchedule.findMany.mockResolvedValue([
        {
          id: 's1', room_id: 'r1', class_id: 'c1', weekday: 1,
          start_time: new Date(), end_time: new Date(),
          room: { name: 'Room 201' },
          class: {
            id: 'c1', section_id: null,
            subject: { name: 'Math' },
            educator: { profile: { full_name: 'Jane Doe' } },
          },
        },
      ]);
      db.section.findMany.mockResolvedValue([]);

      const res = await service.getUsage(orgId, schoolYearId);
      expect(res[0].section_name).toBeNull();
    });
  });
});