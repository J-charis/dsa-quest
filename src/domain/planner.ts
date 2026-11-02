import type { Session } from './types.ts';
import { buildDayMap } from './activity.ts';
import { addDays, startOfWeek, type DateKey } from './dates.ts';

export const clampTarget = (n: number) => Math.min(30, Math.max(1, Math.round(Number.isFinite(n) ? n : 12)));

export interface WeekSummary {
  weekStart: DateKey; weekEnd: DateKey; target: number;
  total: number; newSessions: number; revisionSessions: number; uniqueNew: number;
  attempts: number; activeSec: number; remaining: number; met: boolean;
}
export function weekSummary(sessions: Session[], anyDayInWeek: DateKey, target: number, weekStartsOn: 0 | 1 = 1): WeekSummary {
  const weekStart = startOfWeek(anyDayInWeek, weekStartsOn);
  const weekEnd = addDays(weekStart, 6);
  const map = buildDayMap(sessions.filter((s) => s.date >= weekStart && s.date <= weekEnd));
  let newSessions = 0, revisionSessions = 0, attempts = 0, activeSec = 0;
  for (const d of map.values()) { newSessions += d.newSolved; revisionSessions += d.revisions; attempts += d.attempts; activeSec += d.activeSec; }
  const total = newSessions + revisionSessions;
  const t = clampTarget(target);
  // a new solve counts once per problem (enforced by recordSession), so uniqueNew === newSessions
  return { weekStart, weekEnd, target: t, total, newSessions, revisionSessions, uniqueNew: newSessions, attempts, activeSec, remaining: Math.max(0, t - total), met: total >= t };
}

export interface WeekPlan { revisionSlots: number; newSlots: number; mixedReviewSlots: number; suggestedBatches: number; revisionHeavy: boolean }
/**
 * Revisions come first. If many revisions are overdue, new work is cut so the backlog can clear.
 * Slots are what the plan *suggests*, not caps: rest days are never penalised.
 */
export function planWeek(target: number, dueRevisions: number, overdueRevisions: number): WeekPlan {
  const t = clampTarget(target);
  const revisionSlots = Math.min(dueRevisions, Math.ceil(t * 0.6));
  const mixedReviewSlots = t >= 8 ? 1 : 0;
  let newSlots = Math.max(0, t - revisionSlots - mixedReviewSlots);
  const revisionHeavy = overdueRevisions > t * 0.5;
  if (revisionHeavy) newSlots = Math.floor(newSlots / 2);
  return { revisionSlots, newSlots, mixedReviewSlots, suggestedBatches: newSlots >= 10 ? 2 : newSlots >= 5 ? 1 : 0, revisionHeavy };
}
