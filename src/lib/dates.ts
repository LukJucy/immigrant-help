/**
 * Pure, timezone-safe date helpers. All dates are ISO "YYYY-MM-DD" strings
 * and all maths is done in UTC so results are deterministic across machines
 * and easy to unit-test. No Date.now() here — callers pass `today` in.
 */

const MS_PER_DAY = 86_400_000;

/** Parse an ISO date (YYYY-MM-DD) to a UTC epoch-ms at midnight. */
function toUtc(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Add (or subtract) whole days to an ISO date, returning an ISO date. */
export function addDays(iso: string, days: number): string {
  return fromUtc(toUtc(iso) + days * MS_PER_DAY);
}

/** Whole days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / MS_PER_DAY);
}

/** Today's ISO date in the local timezone (the one place Date.now lives). */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-11-23" -> "23 Nov 2026". */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** "2026-11-23" -> "23 November 2026" (long form for trust lines). */
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}
