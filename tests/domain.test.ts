process.env.TZ = 'America/New_York'; // set before any Date use: exercises DST handling
import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, diffDays, isDateKey, startOfWeek, toDateKey } from '../src/domain/dates.ts';
import { idleTimer, startTimer, pauseTimer, resumeTimer, elapsedMs, stopTimer } from '../src/domain/timer.ts';
import { recordSession } from '../src/domain/sessions.ts';
import { nextReview, bucketRevisions, DEFAULT_INTERVALS } from '../src/domain/scheduler.ts';
import { buildDayMap, currentStreak, longestStreak, heatmapGrid, intensity } from '../src/domain/activity.ts';
import { weekSummary, planWeek, clampTarget } from '../src/domain/planner.ts';
import { uniqueSolvedIds, problemMastery, topicMastery } from '../src/domain/analytics.ts';
import { BATCHES, PROBLEMS } from '../src/data/catalog.ts';
import { TOPICS, PHASES } from '../src/data/roadmap.ts';
import type { Session } from '../src/domain/types.ts';

let n = 0;
const S = (o: Partial<Session> & Pick<Session, 'problemId' | 'kind' | 'date'>): Session =>
  ({ id: `s${++n}`, durationSec: 600, independent: true, hints: false, confidence: 'good', createdAt: n, ...o });

test('dates: DST-safe arithmetic', () => {
  assert.equal(addDays('2026-03-07', 1), '2026-03-08'); // spring forward day
  assert.equal(addDays('2026-03-07', 2), '2026-03-09');
  assert.equal(addDays('2026-11-01', 1), '2026-11-02'); // fall back
  assert.equal(diffDays('2026-03-01', '2026-03-31'), 30);
  assert.equal(diffDays('2026-10-31', '2026-11-02'), 2);
  assert.equal(startOfWeek('2026-10-11'), '2026-10-05'); // Sunday -> Monday-start week
  assert.ok(isDateKey('2026-02-28') && !isDateKey('2026-02-30') && !isDateKey('x'));
  assert.equal(toDateKey(new Date(2026, 0, 1, 23, 59)), '2026-01-01');
});

test('timer: paused time is not counted; derived from timestamps', () => {
  let t = startTimer('two-sum', 0);
  assert.equal(elapsedMs(t, 60_000), 60_000);
  t = pauseTimer(t, 60_000);
  assert.equal(elapsedMs(t, 600_000), 60_000); // 9 paused minutes ignored
  t = resumeTimer(t, 600_000);
  assert.equal(elapsedMs(t, 630_000), 90_000);
  assert.equal(pauseTimer(pauseTimer(t, 630_000), 999_999).accumulatedMs, 90_000); // double pause is a no-op
  const r = stopTimer(t, 660_000);
  assert.equal(r.durationSec, 120);
  assert.equal(elapsedMs(r.state, 9_999_999), 120_000); // frozen after stop
  assert.equal(elapsedMs(idleTimer(), 5), 0);
  // survives a refresh: state is plain JSON
  assert.equal(elapsedMs(JSON.parse(JSON.stringify(t)), 630_000), 90_000);
});

test('sessions: revisions never inflate unique solved; duplicates rejected', () => {
  let ss: Session[] = [];
  const first = S({ problemId: 'two-sum', kind: 'new', date: '2026-10-05' });
  let r = recordSession(ss, first); assert.ok(r.ok); ss = r.sessions;
  r = recordSession(ss, first); assert.ok(!r.ok && r.reason === 'duplicate-id'); // double click
  r = recordSession(ss, S({ problemId: 'two-sum', kind: 'new', date: '2026-10-05' })); assert.ok(!r.ok && r.reason === 'already-solved');
  r = recordSession(ss, S({ problemId: 'two-sum', kind: 'revision', date: '2026-10-06' })); assert.ok(r.ok); ss = r.sessions;
  r = recordSession(ss, S({ problemId: 'lru-cache', kind: 'revision', date: '2026-10-06' })); assert.ok(!r.ok && r.reason === 'not-solved-yet');
  r = recordSession(ss, S({ problemId: 'x', kind: 'attempt', date: '2026-02-30' })); assert.ok(!r.ok && r.reason === 'invalid');
  assert.equal(ss.length, 2);
  assert.equal(uniqueSolvedIds(ss).size, 1);
});

test('scheduler: default progression and confidence handling', () => {
  const d = '2026-10-01';
  let s = nextReview(undefined, 'p', 'good', d); assert.equal(s.nextDue, '2026-10-02');
  s = nextReview(s, 'p', 'good', '2026-10-02'); assert.equal(s.nextDue, '2026-10-05'); // +3
  s = nextReview(s, 'p', 'good', '2026-10-05'); assert.equal(s.nextDue, '2026-10-12'); // +7
  s = nextReview(s, 'p', 'good', '2026-10-12'); assert.equal(s.nextDue, '2026-10-26'); // +14
  s = nextReview(s, 'p', 'good', '2026-10-26'); assert.equal(s.nextDue, '2026-11-25'); // +30
  assert.equal(s.stage, 5);
  const failed = nextReview(s, 'p', 'again', '2026-11-25');
  assert.equal(failed.nextDue, '2026-11-26'); assert.equal(failed.stage, 0); assert.equal(failed.lapses, 1);
  const hard = nextReview(nextReview(undefined, 'p', 'good', d), 'p', 'hard', '2026-10-02');
  assert.equal(hard.nextDue, '2026-10-04'); // stage 1 -> ceil(3/2)=2 days from Oct 2
  const easy = nextReview(undefined, 'p', 'easy', d); assert.equal(easy.nextDue, '2026-10-04'); // skips to 3-day interval
  assert.equal(nextReview(undefined, 'p', 'good', d, [2, 5]).nextDue, '2026-10-03'); // custom intervals
  const b = bucketRevisions([
    { ...s, problemId: 'a', nextDue: '2026-10-09', stage: 2 }, { ...s, problemId: 'b', nextDue: '2026-10-10', stage: 2 },
    { ...s, problemId: 'c', nextDue: '2026-10-20', stage: 2 }, { ...s, problemId: 'd', nextDue: '2026-12-20', stage: 6, lastConfidence: 'easy' },
  ], '2026-10-10');
  assert.deepEqual([b.overdue.length, b.dueToday.length, b.upcoming.length, b.mastered.length], [1, 1, 1, 1]);
  assert.deepEqual(DEFAULT_INTERVALS, [1, 3, 7, 14, 30]);
});

test('activity: day map, streaks, heatmap share one source', () => {
  const ss = [
    S({ problemId: 'a', kind: 'new', date: '2026-10-08' }), S({ problemId: 'b', kind: 'new', date: '2026-10-08' }),
    S({ problemId: 'a', kind: 'revision', date: '2026-10-09' }), S({ problemId: 'c', kind: 'attempt', date: '2026-10-10', durationSec: 300 }),
    S({ problemId: 'x', kind: 'new', date: '2026-10-01' }), S({ problemId: 'y', kind: 'new', date: '2026-10-02' }), S({ problemId: 'z', kind: 'new', date: '2026-10-03' }),
  ];
  const m = buildDayMap(ss);
  assert.deepEqual([m.get('2026-10-08')!.sessions, m.get('2026-10-08')!.newSolved], [2, 2]);
  assert.equal(m.get('2026-10-10')!.sessions, 0); // attempt is not a completed session
  assert.equal(m.get('2026-10-10')!.activeSec, 300); // but its time counts
  assert.equal(currentStreak(m, '2026-10-10'), 2); // today empty: count from yesterday (9th, 8th)
  assert.equal(currentStreak(m, '2026-10-12'), 0);
  assert.equal(longestStreak(m), 3);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map(intensity), [0, 1, 2, 3, 3, 4, 4]);
  const g = heatmapGrid('2026-10-11', 365);
  assert.ok(g.length >= 53 && g.every((c) => c.length === 7));
  assert.equal(g[0][0].date, startOfWeek(addDays('2026-10-11', -364)));
  assert.equal(g[g.length - 1][6].date, '2026-10-11'); // Sunday closes the Monday-first week
});

test('planner: weekly counting and plan sizing', () => {
  const ss = [
    S({ problemId: 'a', kind: 'new', date: '2026-10-05' }), S({ problemId: 'b', kind: 'new', date: '2026-10-07' }),
    S({ problemId: 'a', kind: 'revision', date: '2026-10-08' }), S({ problemId: 'q', kind: 'attempt', date: '2026-10-08' }),
    S({ problemId: 'old', kind: 'new', date: '2026-10-04' }), // previous week (Sunday)
  ];
  const w = weekSummary(ss, '2026-10-11', 10);
  assert.deepEqual([w.total, w.newSessions, w.revisionSessions, w.uniqueNew, w.attempts, w.remaining, w.met], [3, 2, 1, 2, 1, 7, false]);
  assert.equal(clampTarget(0), 1); assert.equal(clampTarget(99), 30);
  const normal = planWeek(12, 3, 0);
  assert.equal(normal.revisionSlots + normal.newSlots + normal.mixedReviewSlots, 12);
  const heavy = planWeek(12, 8, 9);
  assert.ok(heavy.revisionHeavy && heavy.newSlots < planWeek(12, 8, 0).newSlots);
});

test('analytics: mastery is not granted by merely solving', () => {
  const solvedOnly = [S({ problemId: 'a', kind: 'new', date: '2026-10-01', independent: false, hints: true, confidence: 'again' })];
  assert.equal(problemMastery('a', solvedOnly), 30);
  const strong = [...solvedOnly.slice(0, 0), S({ problemId: 'a', kind: 'new', date: '2026-10-01', confidence: 'easy' }), S({ problemId: 'a', kind: 'revision', date: '2026-10-08', confidence: 'easy' })];
  assert.equal(problemMastery('a', strong), 100);
  const tm = topicMastery(PROBLEMS.slice(0, 5).map((p) => ({ ...p, id: p.order === 1 ? 'a' : p.id })), strong);
  assert.equal(tm.reliable, false); assert.equal(tm.solved, 1);
});

test('catalog integrity', () => {
  assert.ok(PROBLEMS.length >= 150, `have ${PROBLEMS.length}`);
  assert.equal(new Set(PROBLEMS.map((p) => p.id)).size, PROBLEMS.length, 'duplicate slug');
  const topicIds = new Set(TOPICS.map((t) => t.id));
  for (const b of BATCHES) {
    assert.equal(b.rows.length, 5, b.id);
    assert.deepEqual(b.rows.map((r) => r[2]), ['E', 'E', 'M', 'M', 'H'], b.id);
    assert.ok(topicIds.has(b.topicId), b.id);
  }
  for (const p of PROBLEMS) {
    assert.match(p.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/); assert.equal(p.url, `https://leetcode.com/problems/${p.slug}/`);
    assert.equal(p.verification, 'unverified');
  }
  for (const t of TOPICS) {
    assert.ok(PHASES.some((p) => p.id === t.phase), t.id);
    for (const q of t.prerequisites) { assert.ok(topicIds.has(q), `${t.id}->${q}`); assert.ok(TOPICS.findIndex((x) => x.id === q) < TOPICS.findIndex((x) => x.id === t.id), `order ${t.id}->${q}`); }
  }
});

import { deriveReviews } from '../src/domain/scheduler.ts';
import { editSession, deleteSession } from '../src/domain/sessions.ts';
test('derived reviews replay the log; edits and deletes stay consistent', () => {
  const a = S({ problemId: 'p', kind: 'new', date: '2026-10-01' });
  const b = S({ problemId: 'p', kind: 'revision', date: '2026-10-02' });
  const att = S({ problemId: 'p', kind: 'attempt', date: '2026-10-03', confidence: 'again' });
  const r = deriveReviews([a, b, att]);
  assert.equal(r.length, 1); assert.equal(r[0].nextDue, '2026-10-05'); // attempts never schedule
  assert.equal(deriveReviews([a, b], [2, 4, 8])[0].nextDue, '2026-10-06');
  const e = editSession([a, b], b.id, { date: '2026-10-04' });
  assert.ok(e.ok); assert.equal(deriveReviews(e.sessions)[0].nextDue, '2026-10-07');
  assert.ok(!editSession([a], a.id, { date: 'nope' }).ok);
  assert.equal(editSession([a], a.id, { durationSec: 5 }).sessions[0].createdAt, a.createdAt);
  assert.ok(!deleteSession([a, b], a.id).ok); // revision depends on it
  assert.ok(deleteSession([a, b], b.id).ok);
});
