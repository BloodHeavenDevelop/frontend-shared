// Calendar days of an IANA time zone, without a tz library: the platform stores and
// serves UTC, and a "day" the user picks is a day in the account's zone, which is not
// necessarily the browser's. `timeZone` undefined means the browser's own zone.

export interface WallDate {
  year: number;
  /** 0-based, like `Date#getMonth`. */
  month: number;
  day: number;
}

const MS_PER_DAY = 86_400_000;

const partsFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

const zoneParts = (instant: Date, timeZone: string) => {
  const out: Record<string, number> = {};
  for (const part of partsFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') out[part.type] = Number(part.value);
  }
  return out as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>;
};

/** How far the zone's wall clock is ahead of UTC at that instant, in ms. */
const offsetAt = (instant: Date, timeZone: string): number => {
  const p = zoneParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (instant.getTime() - instant.getMilliseconds());
};

/** The calendar day an instant falls on in the zone. */
export const wallDateOf = (instant: Date, timeZone?: string): WallDate => {
  if (!timeZone) {
    return { year: instant.getFullYear(), month: instant.getMonth(), day: instant.getDate() };
  }
  const p = zoneParts(instant, timeZone);
  return { year: p.year, month: p.month - 1, day: p.day };
};

/** The first instant of a calendar day in the zone (DST-safe). */
export const startOfZonedDay = ({ year, month, day }: WallDate, timeZone?: string): Date => {
  if (!timeZone) return new Date(year, month, day);
  const wallMidnight = Date.UTC(year, month, day);
  let instant = wallMidnight - offsetAt(new Date(wallMidnight), timeZone);
  // A DST change between the guess and the real instant moves the offset once more.
  instant = wallMidnight - offsetAt(new Date(instant), timeZone);
  return new Date(instant);
};

/** The last millisecond of a calendar day in the zone. */
export const endOfZonedDay = (date: WallDate, timeZone?: string): Date => {
  const next = new Date(Date.UTC(date.year, date.month, date.day) + MS_PER_DAY);
  const nextDay = {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth(),
    day: next.getUTCDate(),
  };
  return new Date(startOfZonedDay(nextDay, timeZone).getTime() - 1);
};

/** A calendar day `n` days away (negative for earlier). */
export const addWallDays = (date: WallDate, n: number): WallDate => {
  const moved = new Date(Date.UTC(date.year, date.month, date.day) + n * MS_PER_DAY);
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth(), day: moved.getUTCDate() };
};

/** The picker's calendar works on browser-local dates; this is the local date showing that day. */
export const toLocalCalendarDate = ({ year, month, day }: WallDate): Date =>
  new Date(year, month, day);

/** The day a browser-local calendar date stands for. */
export const fromLocalCalendarDate = (date: Date): WallDate => ({
  year: date.getFullYear(),
  month: date.getMonth(),
  day: date.getDate(),
});
