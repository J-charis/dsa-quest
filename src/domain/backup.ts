import { DEFAULT_SETTINGS, type AppData, type Note, type ReviewState, type Session, type Settings } from './types.ts';
import { isDateKey } from './dates.ts';

const KINDS = ['new', 'revision', 'attempt'];
const CONFS = ['again', 'hard', 'good', 'easy'];
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function sessionIssue(s: any): string | null {
  if (!s || typeof s !== 'object') return 'not an object';
  if (!isStr(s.id) || !s.id) return 'missing id';
  if (!isStr(s.problemId) || !s.problemId) return 'missing problemId';
  if (!KINDS.includes(s.kind)) return 'bad kind';
  if (!isStr(s.date) || !isDateKey(s.date)) return 'bad date';
  if (!isNum(s.durationSec) || s.durationSec < 0 || s.durationSec > 86400) return 'bad duration';
  if (s.confidence !== null && !CONFS.includes(s.confidence)) return 'bad confidence';
  if (typeof s.independent !== 'boolean' || typeof s.hints !== 'boolean' || !isNum(s.createdAt)) return 'bad fields';
  return null;
}
const reviewOk = (r: any) => r && isStr(r.problemId) && isNum(r.stage) && isStr(r.nextDue) && isDateKey(r.nextDue) && isStr(r.lastReviewed) && isNum(r.lapses) && CONFS.includes(r.lastConfidence);
const noteOk = (n: any) => n && isStr(n.problemId) && isStr(n.approach) && typeof n.flagged === 'boolean';

export function sanitizeSettings(x: any): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (!x || typeof x !== 'object') return s;
  if (isNum(x.weeklyTarget)) s.weeklyTarget = Math.min(30, Math.max(1, Math.round(x.weeklyTarget)));
  if (Array.isArray(x.studyDays)) s.studyDays = x.studyDays.filter((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6) as number[];
  if (Array.isArray(x.intervals) && x.intervals.length > 0 && x.intervals.every((n: unknown) => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 365)) s.intervals = [...x.intervals].sort((a: number, b: number) => a - b);
  if (isStr(x.leetcodeUsername) && /^[A-Za-z0-9_-]{0,40}$/.test(x.leetcodeUsername)) s.leetcodeUsername = x.leetcodeUsername;
  if (typeof x.freeMode === 'boolean') s.freeMode = x.freeMode;
  if (x.weekStartsOn === 0 || x.weekStartsOn === 1) s.weekStartsOn = x.weekStartsOn;
  return s;
}

export function exportData(d: Omit<AppData, 'app' | 'version' | 'exportedAt'>, now = Date.now()): AppData {
  return { app: 'dsa-quest', version: 1, exportedAt: now, ...d };
}

export type Validation = { ok: true; data: AppData } | { ok: false; errors: string[] };
/** Validates everything before anything touches stored data. Also enforces the one-solve-per-problem invariant. */
export function validateBackup(raw: unknown): Validation {
  const errors: string[] = [];
  const x = raw as any;
  if (!x || typeof x !== 'object' || x.app !== 'dsa-quest') return { ok: false, errors: ['Not a DSA Quest backup file.'] };
  if (x.version !== 1) return { ok: false, errors: [`Unsupported backup version: ${String(x.version)}.`] };
  if (!Array.isArray(x.sessions) || !Array.isArray(x.reviews) || !Array.isArray(x.notes)) return { ok: false, errors: ['Backup is missing sessions, reviews or notes.'] };
  x.sessions.forEach((s: unknown, i: number) => { const e = sessionIssue(s); if (e) errors.push(`session #${i + 1}: ${e}`); });
  x.reviews.forEach((r: unknown, i: number) => { if (!reviewOk(r)) errors.push(`review #${i + 1}: invalid`); });
  x.notes.forEach((n: unknown, i: number) => { if (!noteOk(n)) errors.push(`note #${i + 1}: invalid`); });
  if (new Set(x.sessions.map((s: Session) => s.id)).size !== x.sessions.length) errors.push('duplicate session ids inside the file');
  const solves = x.sessions.filter((s: Session) => s.kind === 'new').map((s: Session) => s.problemId);
  if (new Set(solves).size !== solves.length) errors.push('a problem is marked newly solved more than once');
  if (errors.length) return { ok: false, errors: errors.slice(0, 20) };
  return { ok: true, data: { app: 'dsa-quest', version: 1, exportedAt: isNum(x.exportedAt) ? x.exportedAt : 0, sessions: x.sessions, reviews: x.reviews as ReviewState[], notes: x.notes as Note[], settings: sanitizeSettings(x.settings) } };
}

export interface MergePreview { newSessions: Session[]; identical: number; conflicts: { existing: Session; incoming: Session }[]; rejected: { session: Session; reason: string }[] }
const same = (a: Session, b: Session) => JSON.stringify(a) === JSON.stringify(b);

export function previewMerge(existing: Session[], incoming: Session[]): MergePreview {
  const byId = new Map(existing.map((s) => [s.id, s]));
  const solved = new Set(existing.filter((s) => s.kind === 'new').map((s) => s.problemId));
  const out: MergePreview = { newSessions: [], identical: 0, conflicts: [], rejected: [] };
  for (const s of incoming) {
    const e = byId.get(s.id);
    if (e) { if (same(e, s)) out.identical++; else out.conflicts.push({ existing: e, incoming: s }); continue; }
    if (s.kind === 'new' && solved.has(s.problemId)) { out.rejected.push({ session: s, reason: 'problem already solved here' }); continue; }
    if (s.kind === 'new') solved.add(s.problemId);
    out.newSessions.push(s);
  }
  return out;
}
/** Merge never deletes. Conflicts keep the existing record unless the caller explicitly chooses the incoming one. */
export function applyMerge(existing: Session[], p: MergePreview, resolution: 'keep-existing' | 'use-incoming'): Session[] {
  const out = existing.map((e) => (resolution === 'use-incoming' ? p.conflicts.find((c) => c.existing.id === e.id)?.incoming ?? e : e));
  return [...out, ...p.newSessions];
}

const csvCell = (v: string | number | boolean) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula-injection guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function sessionsToCsv(sessions: Session[], titleOf: (id: string) => string): string {
  const head = ['date', 'problem_id', 'title', 'kind', 'duration_min', 'independent', 'hints', 'confidence', 'created_at'];
  const rows = [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt).map((s) =>
    [s.date, s.problemId, titleOf(s.problemId), s.kind, (s.durationSec / 60).toFixed(1), s.independent, s.hints, s.confidence ?? '', new Date(s.createdAt).toISOString()].map(csvCell).join(','));
  return [head.join(','), ...rows].join('\n');
}
