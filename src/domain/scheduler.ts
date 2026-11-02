import type { Confidence, ReviewState } from './types.ts';
import { addDays, type DateKey } from './dates.ts';

export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];
const MAX_INTERVAL = 180;

export function intervalAt(stage: number, intervals: number[]): number {
  if (stage < intervals.length) return intervals[stage];
  const last = intervals[intervals.length - 1];
  return Math.min(last * 2 ** (stage - intervals.length + 1), MAX_INTERVAL);
}

/**
 * Next review state after a new solve or a revision attempt.
 * again -> reset to stage 0, due tomorrow (lapse recorded)
 * hard  -> stay at stage, due in half the normal interval (min 2 days)
 * good  -> normal interval, advance one stage
 * easy  -> skip ahead one stage (longer interval), advance two stages
 */
export function nextReview(prev: ReviewState | undefined, problemId: string, c: Confidence, today: DateKey, intervals: number[] = DEFAULT_INTERVALS): ReviewState {
  const stage = prev?.stage ?? 0;
  let nextStage: number, days: number, lapses = prev?.lapses ?? 0;
  if (c === 'again') { nextStage = 0; days = 1; lapses += 1; }
  else if (c === 'hard') { nextStage = stage; days = Math.max(2, Math.ceil(intervalAt(stage, intervals) / 2)); }
  else if (c === 'good') { nextStage = stage + 1; days = intervalAt(stage, intervals); }
  else { nextStage = stage + 2; days = intervalAt(stage + 1, intervals); }
  return { problemId, stage: nextStage, nextDue: addDays(today, days), lastReviewed: today, lapses, lastConfidence: c };
}

export interface RevisionBuckets { overdue: ReviewState[]; dueToday: ReviewState[]; upcoming: ReviewState[]; mastered: ReviewState[] }
export function bucketRevisions(states: ReviewState[], today: DateKey, intervals: number[] = DEFAULT_INTERVALS): RevisionBuckets {
  const b: RevisionBuckets = { overdue: [], dueToday: [], upcoming: [], mastered: [] };
  for (const s of states) {
    if (s.nextDue < today) b.overdue.push(s);
    else if (s.nextDue === today) b.dueToday.push(s);
    else if (s.stage >= intervals.length && s.lastConfidence !== 'again') b.mastered.push(s);
    else b.upcoming.push(s);
  }
  const byDue = (a: ReviewState, c: ReviewState) => a.nextDue.localeCompare(c.nextDue);
  Object.values(b).forEach((arr) => arr.sort(byDue));
  return b;
}

/** The review schedule is a pure function of the session log, so edits/deletes/interval changes can never drift. */
export function deriveReviews(sessions: import('./types.ts').Session[], intervals: number[] = DEFAULT_INTERVALS): ReviewState[] {
  const map = new Map<string, ReviewState>();
  const ordered = [...sessions].filter((s) => s.kind !== 'attempt').sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  for (const s of ordered) map.set(s.problemId, nextReview(map.get(s.problemId), s.problemId, s.confidence ?? 'good', s.date, intervals));
  return [...map.values()];
}
