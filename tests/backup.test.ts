import test from 'node:test';
import assert from 'node:assert/strict';
import { exportData, validateBackup, previewMerge, applyMerge, sessionsToCsv, sanitizeSettings } from '../src/domain/backup.ts';
import { batchProgress, currentBatch, isBatchUnlocked, nextProblem, overallProgress, phaseProgress } from '../src/domain/progress.ts';
import { BATCHES, PROBLEMS } from '../src/data/catalog.ts';
import { DEFAULT_SETTINGS, type Session } from '../src/domain/types.ts';

const S = (id: string, problemId: string, kind: Session['kind'] = 'new', date = '2026-10-01'): Session =>
  ({ id, problemId, kind, date, durationSec: 60, independent: true, hints: false, confidence: 'good', createdAt: 1 });
const base = (sessions: Session[]) => exportData({ sessions, reviews: [], notes: [], settings: DEFAULT_SETTINGS }, 5);

test('backup: round trip and validation', () => {
  const json = JSON.parse(JSON.stringify(base([S('a', 'two-sum')])));
  const v = validateBackup(json); assert.ok(v.ok);
  assert.ok(!validateBackup({ app: 'other' }).ok);
  assert.ok(!validateBackup({ ...json, version: 9 }).ok);
  assert.ok(!validateBackup({ ...json, sessions: [{ ...S('b', 'x'), date: '2026-13-40' }] }).ok);
  assert.ok(!validateBackup({ ...json, sessions: [S('a', 'p'), S('b', 'p')] }).ok); // two "new" solves of one problem
  assert.ok(!validateBackup({ ...json, sessions: [S('a', 'p'), S('a', 'q')] }).ok); // duplicate ids
});

test('backup: merge never silently overwrites', () => {
  const mine = [S('a', 'two-sum'), S('b', 'lru-cache')];
  const changed = { ...S('a', 'two-sum'), durationSec: 999 };
  const p = previewMerge(mine, [S('a', 'two-sum'), changed, S('c', 'two-sum', 'new'), S('d', 'two-sum', 'revision', '2026-10-05'), S('e', 'subsets')]);
  assert.equal(p.identical, 1); assert.equal(p.conflicts.length, 1);
  assert.equal(p.rejected.length, 1); // second "new" of two-sum
  assert.deepEqual(p.newSessions.map((s) => s.id), ['d', 'e']);
  const keep = applyMerge(mine, p, 'keep-existing');
  assert.equal(keep.find((s) => s.id === 'a')!.durationSec, 60); assert.equal(keep.length, 4);
  assert.equal(applyMerge(mine, p, 'use-incoming').find((s) => s.id === 'a')!.durationSec, 999);
});

test('backup: csv escaping and formula guard; settings sanitising', () => {
  const csv = sessionsToCsv([S('a', '=cmd')], () => 'Say "hi", ok');
  assert.ok(csv.includes('"Say ""hi"", ok"')); assert.ok(csv.includes(",'=cmd,"));
  const s = sanitizeSettings({ weeklyTarget: 500, leetcodeUsername: '<script>', intervals: [7, 1, 3], studyDays: [1, 9] });
  assert.equal(s.weeklyTarget, 30); assert.equal(s.leetcodeUsername, ''); assert.deepEqual(s.intervals, [1, 3, 7]); assert.deepEqual(s.studyDays, [1]);
});

test('progress: unlocking and recommendations', () => {
  const none = new Set<string>();
  assert.equal(currentBatch(none)!.id, 'arrays-hashing-1');
  assert.equal(nextProblem(none)!.id, 'contains-duplicate');
  assert.equal(overallProgress(none).solved, 0);
  const b2 = BATCHES.find((b) => b.id === 'arrays-hashing-2')!;
  assert.equal(isBatchUnlocked(b2, none, false), false);
  assert.equal(isBatchUnlocked(b2, none, true), true); // free mode
  const done1 = new Set(BATCHES[0].rows.map((r) => r[0]));
  assert.equal(isBatchUnlocked(b2, done1, false), true);
  assert.equal(batchProgress(BATCHES[0], done1).pct, 100);
  assert.equal(currentBatch(done1)!.id, 'arrays-hashing-2');
  const sw = BATCHES.find((b) => b.id === 'sliding-window-1')!; // needs arrays + two-pointers first batches
  assert.equal(isBatchUnlocked(sw, done1, false), false);
  assert.equal(phaseProgress(1, done1).solved, 5);
  assert.ok(PROBLEMS.length >= 150);
});
