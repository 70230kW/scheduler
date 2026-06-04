import { FreeBusyResult, FreeSlot } from '../types';
import { generateTimeSlots, isSlotFree } from './timeUtils';

export async function fetchFreeBusy(
  accessToken: string,
  emails: string[],
  timeMin: Date,
  timeMax: Date
): Promise<FreeBusyResult[]> {
  const body = {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    items: emails.map((email) => ({ id: email })),
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`FreeBusy API error: ${response.status}`);
  }

  const data = await response.json();
  const calendars = data.calendars as Record<
    string,
    { busy: Array<{ start: string; end: string }>; errors?: unknown[] }
  >;

  return emails.map((email) => ({
    email,
    busy: calendars[email]?.busy ?? [],
    error: calendars[email]?.errors ? 'カレンダーを取得できませんでした' : undefined,
  }));
}

export function computeFreeSlots(
  selfEmail: string,
  results: FreeBusyResult[],
  timeMin: Date,
  timeMax: Date,
  slotMinutes = 30,
  workHourStart = 9,
  workHourEnd = 18
): FreeSlot[] {
  const selfResult = results.find((r) => r.email === selfEmail);
  if (!selfResult) return [];
  const otherResults = results.filter((r) => r.email !== selfEmail);

  const allSlots = generateTimeSlots(timeMin, timeMax, slotMinutes);

  const freeSlots: FreeSlot[] = [];

  for (const slot of allSlots) {
    const hour = slot.start.getHours();
    if (hour < workHourStart || hour >= workHourEnd) continue;

    // Self must be free
    if (!isSlotFree(slot, selfResult.busy)) continue;

    // At least one other must be free
    const freeOthers = otherResults.filter((r) =>
      isSlotFree(slot, r.busy)
    );

    if (freeOthers.length === 0) continue;

    freeSlots.push({
      start: slot.start,
      end: slot.end,
      availableUsers: freeOthers.map((r) => r.email),
      durationMinutes: slotMinutes,
    });
  }

  return mergeAdjacentSlots(freeSlots);
}

function mergeAdjacentSlots(slots: FreeSlot[]): FreeSlot[] {
  if (slots.length === 0) return [];
  const merged: FreeSlot[] = [];
  let current = { ...slots[0] };

  for (let i = 1; i < slots.length; i++) {
    const next = slots[i];
    const sameUsers =
      current.availableUsers.length === next.availableUsers.length &&
      current.availableUsers.every((u) => next.availableUsers.includes(u));

    if (
      sameUsers &&
      current.end.getTime() === next.start.getTime()
    ) {
      current = {
        ...current,
        end: next.end,
        durationMinutes: current.durationMinutes + next.durationMinutes,
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}
