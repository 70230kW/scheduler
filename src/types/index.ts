export interface UserEntry {
  id: string;
  email: string;
  label?: string;
}

export interface BusyPeriod {
  start: string;
  end: string;
}

export interface FreeBusyResult {
  email: string;
  busy: BusyPeriod[];
  error?: string;
}

export interface FreeSlot {
  start: Date;
  end: Date;
  availableUsers: string[]; // emails of users free in this slot (excluding self)
  durationMinutes: number;
}
