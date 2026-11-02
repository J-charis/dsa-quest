import { useState } from 'react';
import { useApp } from '../store.tsx';
import { parseDateKey, type DateKey } from '../domain/dates.ts';
import { Card, Empty, H, fmtMin } from '../ui.tsx';
import { SessionLine } from './Rows.tsx';
import { LogForm, type LogTarget } from './LogForm.tsx';

/** Shared by the calendar and heatmap pages: both read the same sessions. */
export function DayPanel({ date }: { date: DateKey }) {
  const { sessions, dayMap, removeSession, say } = useApp();
  const [edit, setEdit] = useState<LogTarget | null>(null);
  const a = dayMap.get(date);
  const list = sessions.filter((s) => s.date === date).sort((x, y) => x.createdAt - y.createdAt);
  return (
    <Card>
      <H>{parseDateKey(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</H>
      {a ? <p className="mb-2 text-xs text-slate-400">{a.sessions} session{a.sessions === 1 ? '' : 's'} · {a.newSolved} new · {a.revisions} revision{a.revisions === 1 ? '' : 's'}{a.attempts ? ` · ${a.attempts} attempt${a.attempts === 1 ? '' : 's'}` : ''} · {fmtMin(a.activeSec)} active</p> : null}
      {list.length === 0 ? <Empty title="No activity on this day." hint="Rest days are fine." /> : (
        <div className="divide-y divide-ink-600/60">
          {list.map((s) => (
            <SessionLine key={s.id} s={s} onEdit={() => setEdit({ problemId: s.problemId, kind: s.kind, edit: s })}
              onDelete={async () => { if (!window.confirm('Delete this session? This cannot be undone.')) return; const r = await removeSession(s.id); say(r.ok ? 'Session deleted.' : r.message); }} />
          ))}
        </div>
      )}
      <LogForm target={edit} onClose={() => setEdit(null)} />
    </Card>
  );
}
