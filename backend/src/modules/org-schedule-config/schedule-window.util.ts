export interface ScheduleWindow {
  startTime: string;
  endTime: string;
  slotDuration: number;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function getScheduleViolation(
  w: ScheduleWindow,
  startMin: number,
  endMin: number,
): string | null {
  const winStart = toMinutes(w.startTime);
  const winEnd = toMinutes(w.endTime);
  const len = endMin - startMin;

  if (startMin < winStart || endMin > winEnd) {
    return `time ${formatMinutes(startMin)}–${formatMinutes(endMin)} is outside allowed range ${w.startTime}–${w.endTime}.`;
  }
  if (len <= 0 || len % w.slotDuration !== 0) {
    return `duration ${len}m must be a multiple of ${w.slotDuration}m.`;
  }
  if ((startMin - winStart) % w.slotDuration !== 0) {
    return `start time must align to ${w.slotDuration}m slots from ${w.startTime}.`;
  }
  return null;
}