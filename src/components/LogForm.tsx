import { useRef, useState } from 'react';
import { useApp, newId } from '../store.tsx';
import { problemById } from '../data/catalog.ts';
import type { Confidence, Session, SessionKind } from '../domain/types.ts';
import { Btn, Field, Modal, inputCls, cx } from '../ui.tsx';

const CONF: { id: Confidence; label: string; hint: string }[] = [
  { id: 'again', label: 'Again', hint: 'Could not solve it / needed substantial help' },
  { id: 'hard', label: 'Hard', hint: 'Solved, but struggled' },
  { id: 'good', label: 'Good', hint: 'Solved with reasonable confidence' },
  { id: 'easy', label: 'Easy', hint: 'Can reproduce and explain it independently' },
];

export interface LogTarget { problemId: string; kind: SessionKind; durationSec?: number; edit?: Session }

export function LogForm({ target, onClose, onSaved }: { target: LogTarget | null; onClose: () => void; onSaved?: () => void }) {
  if (!target) return null;
  return <LogFormInner key={target.edit?.id ?? `${target.problemId}-${target.kind}-${target.durationSec ?? 0}`} target={target} onClose={onClose} onSaved={onSaved} />;
}

function LogFormInner({ target, onClose, onSaved }: { target: LogTarget; onClose: () => void; onSaved?: () => void }) {
  const { today, logSession, updateSession, say } = useApp();
  const p = problemById.get(target.problemId);
  const e = target.edit;
  const idRef = useRef(e?.id ?? newId()); // one id per form instance: a double submit hits the duplicate-id guard
  const [date, setDate] = useState(e?.date ?? today);
  const [mins, setMins] = useState(String(Math.round((e?.durationSec ?? target.durationSec ?? 0) / 60)));
  const [independent, setIndependent] = useState(e?.independent ?? true);
  const [hints, setHints] = useState(e?.hints ?? false);
  const [conf, setConf] = useState<Confidence | null>(e?.confidence ?? null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const kind = e?.kind ?? target.kind;
  const needsConf = kind !== 'attempt';
  const title = e ? 'Edit session' : kind === 'new' ? 'Mark solved' : kind === 'revision' ? 'Record revision' : 'Log unsolved attempt';

  const submit = async () => {
    if (saving) return;
    const m = Number(mins);
    if (!Number.isFinite(m) || m < 0 || m > 1440) return setErr('Time must be between 0 and 1440 minutes.');
    if (needsConf && !conf) return setErr('Pick how it went (Again / Hard / Good / Easy).');
    setSaving(true); setErr(null);
    const base = { date, durationSec: Math.round(m * 60), independent: independent && !hints, hints, confidence: needsConf ? conf : null };
    const r = e ? await updateSession(e.id, base) : await logSession({ id: idRef.current, problemId: target.problemId, kind, ...base });
    setSaving(false);
    if (!r.ok) return setErr(r.message);
    say(e ? 'Session updated.' : kind === 'new' ? 'Solved! Revisions scheduled.' : kind === 'revision' ? 'Revision recorded.' : 'Attempt logged.');
    onSaved?.();
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="mb-3 text-sm text-slate-300">{p?.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date practised"><input type="date" max={today} value={date} onChange={(ev) => setDate(ev.target.value)} className={inputCls} /></Field>
        <Field label="Time spent (minutes)"><input type="number" min={0} max={1440} step={1} value={mins} onChange={(ev) => setMins(ev.target.value)} className={inputCls} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={hints} onChange={(ev) => setHints(ev.target.checked)} /> I used hints / looked at a solution</label>
        <label className={cx('flex items-center gap-2', hints && 'opacity-50')}><input type="checkbox" disabled={hints} checked={independent && !hints} onChange={(ev) => setIndependent(ev.target.checked)} /> Solved independently</label>
      </div>
      {needsConf && (
        <fieldset className="mt-4">
          <legend className="mb-1 text-xs font-medium text-slate-400">How did it go?</legend>
          <div className="grid grid-cols-2 gap-2">
            {CONF.map((c) => (
              <button key={c.id} type="button" aria-pressed={conf === c.id} onClick={() => setConf(c.id)}
                className={cx('rounded-lg border p-2 text-left text-sm', conf === c.id ? 'border-brand-400 bg-brand-500/20 text-white' : 'border-ink-600 bg-ink-900 text-slate-300 hover:bg-ink-700')}>
                <span className="font-medium">{c.label}</span><span className="block text-xs text-slate-400">{c.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {kind === 'revision' && <p className="mt-3 text-xs text-slate-500">A revision should be a real attempt to recall or re-solve the problem, not just opening the page.</p>}
      {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
      <div className="mt-5 flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={saving} onClick={submit}>{saving ? 'Saving…' : 'Save'}</Btn></div>
    </Modal>
  );
}
