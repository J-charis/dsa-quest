import type { Problem } from './types.ts';
import { BATCHES, PROBLEMS, type Batch } from '../data/catalog.ts';
import { TOPICS, PHASES } from '../data/roadmap.ts';

export interface Prog { solved: number; total: number; pct: number }
const prog = (ids: string[], solved: Set<string>): Prog => {
  const s = ids.filter((i) => solved.has(i)).length;
  return { solved: s, total: ids.length, pct: ids.length ? Math.round((s / ids.length) * 100) : 0 };
};
export const batchProgress = (b: Batch, solved: Set<string>) => prog(b.rows.map((r) => r[0]), solved);
export const topicProgress = (topicId: string, solved: Set<string>) => prog(PROBLEMS.filter((p) => p.topicId === topicId).map((p) => p.id), solved);
export const phaseProgress = (phase: number, solved: Set<string>) => {
  const topics = new Set(TOPICS.filter((t) => t.phase === phase).map((t) => t.id));
  return prog(PROBLEMS.filter((p) => topics.has(p.topicId)).map((p) => p.id), solved);
};
export const overallProgress = (solved: Set<string>) => prog(PROBLEMS.map((p) => p.id), solved);

const batchDone = (b: Batch, solved: Set<string>) => batchProgress(b, solved).pct === 100;

/** Locked unless: previous batch of the same topic is done AND each prerequisite topic's first batch is done. */
export function isBatchUnlocked(b: Batch, solved: Set<string>, freeMode: boolean): boolean {
  if (freeMode) return true;
  const sameTopic = BATCHES.filter((x) => x.topicId === b.topicId);
  const idx = sameTopic.indexOf(b);
  if (idx > 0 && !batchDone(sameTopic[idx - 1], solved)) return false;
  const topic = TOPICS.find((t) => t.id === b.topicId)!;
  return topic.prerequisites.every((pre) => {
    const first = BATCHES.find((x) => x.topicId === pre);
    return !first || batchDone(first, solved);
  });
}
/** The batch to work on now: first unlocked, incomplete batch in roadmap order. */
export function currentBatch(solved: Set<string>, freeMode = false): Batch | null {
  return BATCHES.find((b) => !batchDone(b, solved) && isBatchUnlocked(b, solved, freeMode)) ?? null;
}
export function nextProblem(solved: Set<string>, freeMode = false): Problem | null {
  const b = currentBatch(solved, freeMode);
  if (!b) return null;
  return PROBLEMS.find((p) => p.batchId === b.id && !solved.has(p.id)) ?? null;
}
export function currentPhase(solved: Set<string>): number {
  const b = currentBatch(solved, false);
  return b ? TOPICS.find((t) => t.id === b.topicId)!.phase : PHASES[PHASES.length - 1].id;
}
