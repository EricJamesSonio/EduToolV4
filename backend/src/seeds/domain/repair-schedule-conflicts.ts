/**
 * repair-schedule-conflicts.ts
 *
 * Scans every non-deleted class and moves any schedule that overlaps
 * another class of the SAME educator (and section) within the same school
 * year to a free slot. Runs after the domain seeder so data created by
 * older/other seeders gets reconciled. Idempotent — reports how many
 * classes were touched.
 */

import { db } from './db';
import {
  UsedMap,
  findFreeSlot,
  isUsed,
  scheduleDate,
  scheduleKey,
  timeOnly,
  usedAdd,
} from './utils/schedule.util';

export async function repairScheduleConflicts(): Promise<number> {
  let fixed = 0;

  const classes = await db.class.findMany({
    where: { deleted_at: null },
    include: { schedules: true },
    orderBy: { created_at: 'asc' },
  });

  const byGroup = new Map<string, typeof classes>();
  for (const cls of classes) {
    if (cls.schedules.length === 0) continue;
    const key = `${cls.org_id}::${cls.school_year_id}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(cls);
  }

  for (const group of byGroup.values()) {
    const educatorUsed: UsedMap = new Map();
    const sectionUsed: UsedMap = new Map();

    for (const cls of group) {
      const resolved: Array<{
        id: string;
        weekday: number;
        start_time: Date;
        end_time: Date;
      }> = [];
      const resolvedKeys: string[] = [];
      let changed = false;

      for (const s of cls.schedules) {
        const key = scheduleKey(
          s.weekday,
          timeOnly(s.start_time),
          timeOnly(s.end_time),
        );
        const conflicts =
          isUsed(educatorUsed, cls.educator_id, key) ||
          (!!cls.section_id && isUsed(sectionUsed, cls.section_id, key)) ||
          resolvedKeys.includes(key);

        if (!conflicts) {
          resolved.push({
            id: s.id,
            weekday: s.weekday,
            start_time: s.start_time,
            end_time: s.end_time,
          });
          resolvedKeys.push(key);
          continue;
        }

        const freeSlot = findFreeSlot(
          cls.educator_id,
          cls.section_id,
          educatorUsed,
          sectionUsed,
          resolvedKeys,
        );
        if (!freeSlot) {
          // No free slot available — keep the original rather than lose data.
          resolved.push({
            id: s.id,
            weekday: s.weekday,
            start_time: s.start_time,
            end_time: s.end_time,
          });
          resolvedKeys.push(key);
          continue;
        }

        resolved.push({
          id: s.id,
          weekday: freeSlot.weekday,
          start_time: scheduleDate(freeSlot.start),
          end_time: scheduleDate(freeSlot.end),
        });
        resolvedKeys.push(freeSlot.key);
        changed = true;
      }

      for (const r of resolved) {
        usedAdd(
          educatorUsed,
          cls.educator_id,
          scheduleKey(r.weekday, timeOnly(r.start_time), timeOnly(r.end_time)),
        );
        if (cls.section_id)
          usedAdd(
            sectionUsed,
            cls.section_id,
            scheduleKey(
              r.weekday,
              timeOnly(r.start_time),
              timeOnly(r.end_time),
            ),
          );
      }

      if (changed) {
        await Promise.all(
          resolved.map((r) =>
            db.classSchedule.update({
              where: { id: r.id },
              data: {
                weekday: r.weekday,
                start_time: r.start_time,
                end_time: r.end_time,
              },
            }),
          ),
        );
        fixed++;
      }
    }
  }

  return fixed;
}
