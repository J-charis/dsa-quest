import type { Session } from './types.ts';
import { isDateKey } from './dates.ts';

type Reason = 'duplicate-id' | 'already-solved' | 'not-solved-yet' | 'invalid';
export type RecordResult = { ok: true; sessions: Session[] } | { ok: false; reason: Reason; sessions: Session[] };

export const isSolved = (sessions: Session[], problemId: string) =>
  sessions.some((s) => s.problemId === problemId && s.kind === 'new');

/** Only entry point for adding sessions. Idempotent by id; a problem can be "newly solved" once. */
export function recordSession(existing: Session[], s: Session): RecordResult {
  const fail = (reason: Reason): RecordResult => ({ ok: false, reason, sessions: existing });
  if (!s.id || !s.problemId || !isDateKey(s.date)) return fail('invalid');
  if (!Number.isFinite(s.durationSec) || s.durationSec < 0 || s.durationSec > 24 * 3600) return fail('invalid');
  if (existing.some((e) => e.id === s.id)) return fail('duplicate-id');
  if (s.kind === 'new' && isSolved(existing, s.problemId)) return fail('already-solved');
  if (s.kind === 'revision' && !isSolved(existing, s.problemId)) return fail('not-solved-yet');
  return { ok: true, sessions: [...existing, s] };
}

export type EditableFields = Pick<Session, 'date' | 'durationSec' | 'independent' | 'hints' | 'confidence' | 'notes'>;
/** Corrects date/duration/etc. `createdAt`, `kind` and `problemId` are immutable. */
export function editSession(existing: Session[], id: string, patch: Partial<EditableFields>): RecordResult {
  const cur = existing.find((s) => s.id === id);
  if (!cur) return { ok: false, reason: 'invalid', sessions: existing };
  const next: Session = { ...cur, ...patch };
  if (!isDateKey(next.date) || !Number.isFinite(next.durationSec) || next.durationSec < 0 || next.durationSec > 24 * 3600) return { ok: false, reason: 'invalid', sessions: existing };
  return { ok: true, sessions: existing.map((s) => (s.id === id ? next : s)) };
}
/** A problem's first solve can't be deleted while revisions depend on it. */
export function deleteSession(existing: Session[], id: string): RecordResult {
  const cur = existing.find((s) => s.id === id);
  if (!cur) return { ok: false, reason: 'invalid', sessions: existing };
  if (cur.kind === 'new' && existing.some((s) => s.problemId === cur.problemId && s.kind === 'revision')) return { ok: false, reason: 'already-solved', sessions: existing };
  return { ok: true, sessions: existing.filter((s) => s.id !== id) };
}
