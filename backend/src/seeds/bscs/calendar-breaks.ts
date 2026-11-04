import { db } from '../domain/db';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEM_1_LABEL = 'Sem 1';
const SEM_2_LABEL = 'Sem 2';

type CalendarBreakRow = {
  label: string;
  start_date: Date;
  end_date: Date;
};

type CalendarWithBreaks = {
  id: string;
  org_id: string;
  start_date: Date;
  end_date: Date;
  breaks: CalendarBreakRow[];
};

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export async function ensureSemesterBreakRows(
  calendar: CalendarWithBreaks,
  breakLabel: string,
  breakDays: number,
): Promise<{ start_date: Date; end_date: Date }> {
  const sem1 = calendar.breaks.find((b) => b.label === SEM_1_LABEL);
  const sem2 = calendar.breaks.find((b) => b.label === SEM_2_LABEL);
  const middle = calendar.breaks.find(
    (b) => b.label !== SEM_1_LABEL && b.label !== SEM_2_LABEL,
  );

  if (sem1 && sem2) {
    if (middle) {
      return { start_date: middle.start_date, end_date: middle.end_date };
    }
    return {
      start_date: addDays(sem1.end_date, 1),
      end_date: addDays(sem2.start_date, -1),
    };
  }

  let breakStart: Date;
  let breakEnd: Date;
  if (middle) {
    breakStart = middle.start_date;
    breakEnd = middle.end_date;
  } else {
    const span = calendar.end_date.getTime() - calendar.start_date.getTime();
    const mid = calendar.start_date.getTime() + span / 2;
    breakStart = new Date(Math.floor(mid / DAY_MS) * DAY_MS);
    breakEnd = addDays(breakStart, breakDays - 1);
  }

  await db.programCalendarBreak.deleteMany({
    where: { calendar_id: calendar.id },
  });
  await db.programCalendarBreak.createMany({
    data: [
      {
        org_id: calendar.org_id,
        calendar_id: calendar.id,
        label: SEM_1_LABEL,
        start_date: calendar.start_date,
        end_date: addDays(breakStart, -1),
        order_index: 1,
      },
      {
        org_id: calendar.org_id,
        calendar_id: calendar.id,
        label: breakLabel,
        start_date: breakStart,
        end_date: breakEnd,
        order_index: 2,
      },
      {
        org_id: calendar.org_id,
        calendar_id: calendar.id,
        label: SEM_2_LABEL,
        start_date: addDays(breakEnd, 1),
        end_date: calendar.end_date,
        order_index: 3,
      },
    ],
  });

  return { start_date: breakStart, end_date: breakEnd };
}