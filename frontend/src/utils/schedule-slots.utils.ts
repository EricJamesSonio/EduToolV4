export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
): string[] {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const result: string[] = [];
  for (let cur = start; cur < end; cur += slotDuration) {
    result.push(toHHMM(cur));
  }
  return result;
}

export function formatHourLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  if (m === 0) return `${hour} ${ampm}`;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}
