import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Confidence, Note, ReviewState, Session, SessionKind, Settings } from './domain/types.ts';
import { DEFAULT_SETTINGS } from './domain/types.ts';
import { deleteSession, editSession, recordSession, type EditableFields } from './domain/sessions.ts';
import { deriveReviews } from './domain/scheduler.ts';
import { buildDayMap, type DayActivity } from './domain/activity.ts';
import { uniqueSolvedIds } from './domain/analytics.ts';
import { idleTimer, pauseTimer, resumeTimer, startTimer, stopTimer, type TimerState } from './domain/timer.ts';
import { toDateKey, type DateKey } from './domain/dates.ts';
import { exportData } from './domain/backup.ts';
import * as store from './data/db.ts';

export interface LogInput { id: string; problemId: string; kind: SessionKind; date: string; durationSec: number; independent: boolean; hints: boolean; confidence: Confidence | null; notes?: string }
export type ActionResult = { ok: true } | { ok: false; message: string };
const REASONS: Record<string, string> = {
  'duplicate-id': 'That session was already saved.',
  'already-solved': 'This problem is already marked solved. Log it as a revision instead.',
  'not-solved-yet': 'Solve the problem first; revisions are for problems you have already solved.',
  invalid: 'Please check the date and duration.',
};

interface Ctx {
  ready: boolean; error: string | null; today: DateKey;
  sessions: Session[]; notes: Map<string, Note>; settings: Settings; timer: TimerState;
  solved: Set<string>; dayMap: Map<DateKey, DayActivity>; reviews: ReviewState[];
  toast: string | null; say: (m: string) => void;
  logSession: (i: LogInput) => Promise<ActionResult>;
  updateSession: (id: string, patch: Partial<EditableFields>) => Promise<ActionResult>;
  removeSession: (id: string) => Promise<ActionResult>;
  putNote: (n: Note) => Promise<void>;
  putSettings: (s: Settings) => Promise<void>;
  timerStart: (problemId: string) => void; timerPause: () => void; timerResume: () => void;
  timerStop: () => number; timerDiscard: () => void;
  replaceEverything: (d: { sessions: Session[]; notes: Note[]; settings: Settings }) => Promise<ActionResult>;
  snapshot: () => ReturnType<typeof exportData>;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = (): Ctx => { const c = useContext(AppCtx); if (!c) throw new Error('useApp outside provider'); return c; };
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState<Map<string, Note>>(new Map());
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS });
  const [timer, setTimer] = useState<TimerState>(idleTimer());
  const [toast, setToast] = useState<string | null>(null);
  const [today, setToday] = useState<DateKey>(toDateKey(new Date()));
  const busy = useRef(false);
  const sessionsRef = useRef<Session[]>([]);
  sessionsRef.current = sessions;

  const say = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast((t) => (t === m ? null : t)), 3500); }, []);

  useEffect(() => {
    store.loadAll().then((l) => { setSessions(l.sessions); setNotes(new Map(l.notes.map((n) => [n.problemId, n]))); setSettings(l.settings); setTimer(l.timer); setReady(true); })
      .catch((e) => { setError(`Browser storage is unavailable (${e instanceof Error ? e.message : 'unknown error'}). Progress cannot be saved in this browser mode (private windows often block it).`); setReady(true); });
  }, []);
  useEffect(() => { const t = window.setInterval(() => setToday(toDateKey(new Date())), 30_000); return () => window.clearInterval(t); }, []);

  const persist = async (fn: () => Promise<unknown>): Promise<ActionResult> => {
    try { await fn(); return { ok: true }; } catch (e) { return { ok: false, message: `Could not save to browser storage: ${e instanceof Error ? e.message : 'unknown error'}` }; }
  };

  const logSession: Ctx['logSession'] = async (i) => {
    if (busy.current) return { ok: false, message: 'Already saving…' };
    busy.current = true;
    try {
      const s: Session = { ...i, createdAt: Date.now() };
      const r = recordSession(sessionsRef.current, s);
      if (!r.ok) return { ok: false, message: REASONS[r.reason] };
      const saved = await persist(() => store.saveSessions([s]));
      if (!saved.ok) return saved;
      sessionsRef.current = r.sessions; setSessions(r.sessions);
      return { ok: true };
    } finally { busy.current = false; }
  };
  const updateSession: Ctx['updateSession'] = async (id, patch) => {
    const r = editSession(sessionsRef.current, id, patch);
    if (!r.ok) return { ok: false, message: REASONS[r.reason] };
    const saved = await persist(() => store.saveSessions(r.sessions.filter((s) => s.id === id)));
    if (saved.ok) { sessionsRef.current = r.sessions; setSessions(r.sessions); }
    return saved;
  };
  const removeSession: Ctx['removeSession'] = async (id) => {
    const r = deleteSession(sessionsRef.current, id);
    if (!r.ok) return { ok: false, message: 'Delete this problem’s revision sessions first; they depend on its first solve.' };
    const saved = await persist(() => store.saveSessions([], [id]));
    if (saved.ok) { sessionsRef.current = r.sessions; setSessions(r.sessions); }
    return saved;
  };
  const putNote = async (n: Note) => { const r = await persist(() => store.saveNote(n)); if (r.ok) setNotes((m) => new Map(m).set(n.problemId, n)); else say(r.message); };
  const putSettings = async (s: Settings) => { const r = await persist(() => store.saveSettings(s)); if (r.ok) setSettings(s); else say(r.message); };

  const saveTimer = (t: TimerState) => { setTimer(t); store.saveTimer(t).catch(() => say('Timer state could not be saved; a refresh may lose it.')); };
  const timerStart = (id: string) => saveTimer(startTimer(id, Date.now()));
  const timerPause = () => saveTimer(pauseTimer(timer, Date.now()));
  const timerResume = () => saveTimer(resumeTimer(timer, Date.now()));
  const timerStop = () => { const r = stopTimer(timer, Date.now()); saveTimer(r.state); return r.durationSec; };
  const timerDiscard = () => saveTimer(idleTimer());

  const replaceEverything: Ctx['replaceEverything'] = async (d) => {
    const r = await persist(() => store.replaceAll(d));
    if (r.ok) { sessionsRef.current = d.sessions; setSessions(d.sessions); setNotes(new Map(d.notes.map((n) => [n.problemId, n]))); setSettings(d.settings); saveTimer(idleTimer()); }
    return r;
  };

  const solved = useMemo(() => uniqueSolvedIds(sessions), [sessions]);
  const dayMap = useMemo(() => buildDayMap(sessions), [sessions]);
  const reviews = useMemo(() => {
    return deriveReviews(sessions, settings.intervals).map((r) => (notes.get(r.problemId)?.flagged && r.nextDue > today ? { ...r, nextDue: today } : r));
  }, [sessions, settings.intervals, notes, today]);
  const snapshot = () => exportData({ sessions, reviews: deriveReviews(sessions, settings.intervals), notes: [...notes.values()], settings });

  const value: Ctx = { ready, error, today, sessions, notes, settings, timer, solved, dayMap, reviews, toast, say, logSession, updateSession, removeSession, putNote, putSettings, timerStart, timerPause, timerResume, timerStop, timerDiscard, replaceEverything, snapshot };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
