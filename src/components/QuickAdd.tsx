import { useState } from 'react';
import { PROBLEMS } from '../data/catalog.ts';
import type { SessionKind } from '../domain/types.ts';
import { Btn, Field, Modal, inputCls } from '../ui.tsx';
import { useApp } from '../store.tsx';
import { LogForm, type LogTarget } from './LogForm.tsx';

/** Manual logging for work done directly on LeetCode without the built-in timer. */
export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { solved } = useApp();
  const [pid, setPid] = useState(PROBLEMS[0].id);
  const [kind, setKind] = useState<SessionKind>('new');
  const [target, setTarget] = useState<LogTarget | null>(null);
  const pick = kind === 'revision' ? PROBLEMS.filter((p) => solved.has(p.id)) : kind === 'new' ? PROBLEMS.filter((p) => !solved.has(p.id)) : PROBLEMS;
  const effective = pick.some((p) => p.id === pid) ? pid : pick[0]?.id ?? '';
  return (
    <>
      <Modal open={open && !target} onClose={onClose} title="Log a practice session">
        <div className="space-y-3">
          <Field label="Type">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as SessionKind)}>
              <option value="new">New problem solved</option><option value="revision">Revision of a solved problem</option><option value="attempt">Unsolved attempt</option>
            </select>
          </Field>
          <Field label="Problem">
            {pick.length === 0 ? <p className="text-sm text-slate-400">No eligible problems yet. Solve one first to log revisions.</p> :
              <select className={inputCls} value={effective} onChange={(e) => setPid(e.target.value)}>{pick.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>)}</select>}
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={!effective} onClick={() => setTarget({ problemId: effective, kind })}>Continue</Btn></div>
      </Modal>
      <LogForm target={target} onClose={() => { setTarget(null); onClose(); }} />
    </>
  );
}
