import Dexie, { type Table } from 'dexie';
import type { AppData, Note, Session, Settings } from '../domain/types.ts';
import { DEFAULT_SETTINGS } from '../domain/types.ts';
import { sanitizeSettings } from '../domain/backup.ts';
import type { TimerState } from '../domain/timer.ts';
import { idleTimer } from '../domain/timer.ts';

interface KV { key: string; value: unknown }
class QuestDB extends Dexie {
  sessions!: Table<Session, string>;
  notes!: Table<Note, string>;
  kv!: Table<KV, string>;
  constructor() {
    super('dsa-quest');
    this.version(1).stores({ sessions: 'id, problemId, date', notes: 'problemId', kv: 'key' });
  }
}
export const db = new QuestDB();

export interface Loaded { sessions: Session[]; notes: Note[]; settings: Settings; timer: TimerState }
export async function loadAll(): Promise<Loaded> {
  const [sessions, notes, s, t] = await Promise.all([db.sessions.toArray(), db.notes.toArray(), db.kv.get('settings'), db.kv.get('timer')]);
  return { sessions, notes, settings: s ? sanitizeSettings(s.value) : { ...DEFAULT_SETTINGS }, timer: (t?.value as TimerState | undefined) ?? idleTimer() };
}
export const saveSessions = async (put: Session[], removeIds: string[] = []) => { await db.transaction('rw', db.sessions, async () => { await db.sessions.bulkPut(put); await db.sessions.bulkDelete(removeIds); }); };
export const saveNote = (n: Note) => db.notes.put(n);
export const saveSettings = (s: Settings) => db.kv.put({ key: 'settings', value: s });
export const saveTimer = (t: TimerState) => db.kv.put({ key: 'timer', value: t });
/** Atomic replace used by restore/reset: either everything is written or nothing is. */
export async function replaceAll(d: Pick<AppData, 'sessions' | 'notes' | 'settings'>) {
  await db.transaction('rw', db.sessions, db.notes, db.kv, async () => {
    await db.sessions.clear(); await db.notes.clear(); await db.kv.clear();
    await db.sessions.bulkPut(d.sessions); await db.notes.bulkPut(d.notes); await db.kv.put({ key: 'settings', value: d.settings });
  });
}
