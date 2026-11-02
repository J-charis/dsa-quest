export type DateKey = string;
const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Parses at local noon so DST shifts at midnight can never change the calendar day. */
export function parseDateKey(k: DateKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}
export function isDateKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && toDateKey(parseDateKey(s)) === s;
}
export function addDays(k: DateKey, n: number): DateKey {
  const d = parseDateKey(k);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}
/** Whole calendar days from a to b (b - a), DST-safe. */
export function diffDays(a: DateKey, b: DateKey): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}
/** weekStartsOn: 0=Sunday, 1=Monday */
export function startOfWeek(k: DateKey, weekStartsOn: 0 | 1 = 1): DateKey {
  const dow = parseDateKey(k).getDay();
  return addDays(k, -((dow - weekStartsOn + 7) % 7));
}
export const todayKey = (now: number = Date.now()): DateKey => toDateKey(new Date(now));
