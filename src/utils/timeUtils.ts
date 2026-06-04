import { addMinutes, areIntervalsOverlapping, format } from 'date-fns';

export function generateTimeSlots(
  start: Date,
  end: Date,
  slotMinutes = 30
): Array<{ start: Date; end: Date }> {
  const slots: Array<{ start: Date; end: Date }> = [];
  let current = new Date(start);
  while (current < end) {
    const slotEnd = addMinutes(current, slotMinutes);
    if (slotEnd <= end) {
      slots.push({ start: new Date(current), end: slotEnd });
    }
    current = slotEnd;
  }
  return slots;
}

export function isSlotFree(
  slot: { start: Date; end: Date },
  busyPeriods: Array<{ start: string; end: string }>
): boolean {
  return !busyPeriods.some((busy) =>
    areIntervalsOverlapping(slot, {
      start: new Date(busy.start),
      end: new Date(busy.end),
    })
  );
}

export function formatSlotTime(date: Date): string {
  return format(date, 'HH:mm');
}

export function formatSlotDate(date: Date): string {
  return format(date, 'M月d日(E)', { locale: undefined });
}
