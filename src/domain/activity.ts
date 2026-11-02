import type { Session } from './types.ts';
import { addDays, diffDays, startOfWeek, type DateKey } from './dates.ts';

export interface DayActivity {
  date: DateKey;
  sessions: number; // completed practice sessions = new + revision (attempts excluded)
  newSolved: number;
  revisions: number;
  attempts: number;
  activeSec: number; // includes attempts: time spent is time spent
  problemIds: string[];
}

/** Single source of truth for heatmap, calendar, streaks and weekly counts. */
export function buildDayMap(sessions: Session[]): Map<DateKey, DayActivity> {
  const map = new Map<DateKey, DayActivity>();
  for (const s of sessions) {
    let d = map.get(s.date);
    if (!d) { d = { date: s.date, sessions: 0, newSolved: 0, revisions: 0, attempts: 0, activeSec: 0, problemIds: [] }; map.set(s.date, d); }
    if (s.kind === 'new') { d.sessions++; d.newSolved++; }
    else if (s.kind === 'revision') { d.sessions++; d.revisions++; }
    else d.attempts++;
    d.activeSec += s.durationSec;
    if (!d.problemIds.includes(s.problemId)) d.problemIds.push(s.problemId);
  }
  return map;
}

export function intensity(sessions: number): 0 | 1 | 2 | 3 | 4 {
  if (sessions <= 0) return 0;
  if (sessions === 1) return 1;
  if (sessions === 2) return 2;
  return sessions <= 4 ? 3 : 4;
}

const active = (m: Map<DateKey, DayActivity>, k: DateKey) => (m.get(k)?.sessions ?? 0) > 0;

/** A streak is not broken until a full day passes with no session: if today is empty, count from yesterday. */
export function currentStreak(map: Map<DateKey, DayActivity>, today: DateKey): number {
  let day = active(map, today) ? today : addDays(today, -1);
  let n = 0;
  while (active(map, day)) { n++; day = addDays(day, -1); }
  return n;
}
export function longestStreak(map: Map<DateKey, DayActivity>): number {
  const days = [...map.values()].filter((d) => d.sessions > 0).map((d) => d.date).sort();
  let best = 0, run = 0, prev: DateKey | null = null;
  for (const d of days) {
    run = prev !== null && diffDays(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Week-aligned grid columns (Mon-first) covering at least `days` days ending today. */
export function heatmapGrid(today: DateKey, days = 365, weekStartsOn: 0 | 1 = 1): { date: DateKey; future: boolean }[][] {
  let d = startOfWeek(addDays(today, -(days - 1)), weekStartsOn);
  const last = addDays(startOfWeek(today, weekStartsOn), 6);
  const weeks: { date: DateKey; future: boolean }[][] = [];
  while (diffDays(d, last) >= 0) {
    const col: { date: DateKey; future: boolean }[] = [];
    for (let i = 0; i < 7; i++) { col.push({ date: d, future: diffDays(today, d) > 0 }); d = addDays(d, 1); }
    weeks.push(col);
  }
  return weeks;
}
