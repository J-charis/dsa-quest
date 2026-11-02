import type { Difficulty, Problem, Session } from './types.ts';

export const uniqueSolvedIds = (sessions: Session[]) => new Set(sessions.filter((s) => s.kind === 'new').map((s) => s.problemId));

export function avgSolveSecByDifficulty(sessions: Session[], byId: Map<string, Problem>): Record<Difficulty, number | null> {
  const acc: Record<Difficulty, number[]> = { Easy: [], Medium: [], Hard: [] };
  for (const s of sessions) {
    const p = byId.get(s.problemId);
    if (s.kind === 'new' && p && s.durationSec > 0) acc[p.difficulty].push(s.durationSec);
  }
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
  return { Easy: avg(acc.Easy), Medium: avg(acc.Medium), Hard: avg(acc.Hard) };
}

export function independence(sessions: Session[]): { independent: number; assisted: number } {
  const solves = sessions.filter((s) => s.kind === 'new');
  const independent = solves.filter((s) => s.independent && !s.hints).length;
  return { independent, assisted: solves.length - independent };
}

/** Share of attempted problems whose very first session was a successful solve. null if too little data. */
export function firstAttemptSuccess(sessions: Session[], minProblems = 5): number | null {
  const first = new Map<string, Session>();
  for (const s of [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)) if (!first.has(s.problemId)) first.set(s.problemId, s);
  if (first.size < minProblems) return null;
  return [...first.values()].filter((s) => s.kind === 'new').length / first.size;
}

/** Revision retention: share of revision sessions rated good/easy. null if no revisions yet. */
export function revisionRetention(sessions: Session[]): number | null {
  const r = sessions.filter((s) => s.kind === 'revision');
  if (r.length === 0) return null;
  return r.filter((s) => s.confidence === 'good' || s.confidence === 'easy').length / r.length;
}

const CONF_POINTS = { again: 0, hard: 10, good: 25, easy: 35 } as const;
/** 0-100. Solving alone is worth only 30; independence, confidence and passed revisions earn the rest. */
export function problemMastery(problemId: string, sessions: Session[]): number {
  const mine = sessions.filter((s) => s.problemId === problemId).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const solve = mine.find((s) => s.kind === 'new');
  if (!solve) return 0;
  const latest = [...mine].reverse().find((s) => s.confidence);
  const passedRevision = mine.some((s) => s.kind === 'revision' && (s.confidence === 'good' || s.confidence === 'easy'));
  return 30 + (solve.independent && !solve.hints ? 20 : 0) + (latest?.confidence ? CONF_POINTS[latest.confidence] : 0) + (passedRevision ? 15 : 0);
}

export interface TopicMastery { score: number; solved: number; total: number; reliable: boolean }
/** Coverage-weighted: unsolved problems count as 0. `reliable` needs >=3 solves and >=1 passed revision. */
export function topicMastery(topicProblems: Problem[], sessions: Session[]): TopicMastery {
  const ids = topicProblems.map((p) => p.id);
  const solvedSet = uniqueSolvedIds(sessions);
  const solved = ids.filter((i) => solvedSet.has(i)).length;
  const sum = ids.reduce((a, i) => a + problemMastery(i, sessions), 0);
  const revised = sessions.some((s) => ids.includes(s.problemId) && s.kind === 'revision' && (s.confidence === 'good' || s.confidence === 'easy'));
  return { score: ids.length ? Math.round(sum / ids.length) : 0, solved, total: ids.length, reliable: solved >= 3 && revised };
}
