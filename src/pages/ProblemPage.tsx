import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Pause, Play, Square, Trash2 } from 'lucide-react';
import { useApp } from '../store.tsx';
import { Badge, Btn, Card, Empty, Field, H, PageTitle, diffTone, inputCls } from '../ui.tsx';
import { problemById, BATCHES } from '../data/catalog.ts';
import { topicById } from '../data/roadmap.ts';
import { elapsedMs, formatDuration } from '../domain/timer.ts';
import type { Note } from '../domain/types.ts';
import { LogForm, type LogTarget } from '../components/LogForm.tsx';
import { SessionLine } from '../components/Rows.tsx';

const blankNote = (problemId: string): Note => ({ problemId, approach: '', insight: '', whyFailed: '', edgeCases: '', timeComplexity: '', spaceComplexity: '', remember: '', nextTime: '', solutionLink: '', flagged: false, updatedAt: 0 });

function useTick(active: boolean) {
  const [, set] = useState(0);
  useEffect(() => { if (!active) return; const t = window.setInterval(() => set((n) => n + 1), 500); return () => window.clearInterval(t); }, [active]);
}

export function ProblemPage() {
  const { id = '' } = useParams();
  const app = useApp();
  const { solved, sessions, notes, timer, say } = app;
  const p = problemById.get(id);
  const [log, setLog] = useState<LogTarget | null>(null);
  const [draft, setDraft] = useState<Note>(() => notes.get(id) ?? blankNote(id));
  const [linkErr, setLinkErr] = useState<string | null>(null);
  const [pendingSec, setPendingSec] = useState<number | null>(null);
  useEffect(() => { setDraft(notes.get(id) ?? blankNote(id)); }, [id, notes]);
  useTick(timer.status === 'running');
  if (!p) return <Empty title="Problem not found." hint="It may not be in the catalog." />;

  const mine = timer.problemId === id && timer.status !== 'idle';
  const other = timer.status !== 'idle' && timer.problemId !== id;
  const mySessions = sessions.filter((s) => s.problemId === id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const isSolved = solved.has(id);
  const batch = BATCHES.find((b) => b.id === p.batchId);
  const set = (k: keyof Note) => (e: { target: { value: string } }) => setDraft({ ...draft, [k]: e.target.value });

  const saveNote = async () => {
    if (draft.solutionLink && !/^https?:\/\/\S+$/i.test(draft.solutionLink)) return setLinkErr('Use a full http(s) link, or leave it empty.');
    setLinkErr(null);
    await app.putNote({ ...draft, updatedAt: Date.now() });
    say('Notes saved.');
  };
  const stop = () => setPendingSec(app.timerStop());
  const choose = (kind: 'new' | 'revision' | 'attempt') => { setLog({ problemId: id, kind, durationSec: pendingSec ?? 0 }); setPendingSec(null); };

  return (
    <>
      <PageTitle title={p.title} sub={`${topicById.get(p.topicId)?.name} · ${p.subtopic}${batch ? ` · batch “${batch.title}”, #${p.order}` : ''}`}
        right={<a href={p.url} target="_blank" rel="noopener noreferrer"><Btn variant="primary"><ExternalLink size={14} />Open on LeetCode</Btn></a>} />
      <div className="mb-4 flex flex-wrap gap-2"><Badge tone={diffTone(p.difficulty)}>{p.difficulty}</Badge><Badge tone="brand">Tier {p.priority}</Badge><Badge>~{p.estMinutes} min</Badge><Badge>{p.patterns.join(', ')}</Badge>{isSolved ? <Badge tone="green">Solved</Badge> : <Badge>Not solved</Badge>}{p.verification === 'unverified' && <Badge tone="amber">Catalog entry unverified</Badge>}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <H>Solving timer</H>
          <div className="text-center"><div className="font-mono text-5xl font-semibold tabular-nums text-white" role="timer" aria-live="off">{formatDuration(Math.round((mine ? elapsedMs(timer, Date.now()) : 0) / 1000))}</div>
            <p className="mt-1 text-xs text-slate-500">{mine ? (timer.status === 'running' ? 'Running. Paused time is not counted.' : 'Paused') : 'Not started'}</p></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {!mine && <Btn variant="primary" disabled={other} onClick={() => app.timerStart(id)}><Play size={14} />Start</Btn>}
            {mine && timer.status === 'running' && <Btn onClick={app.timerPause}><Pause size={14} />Pause</Btn>}
            {mine && timer.status === 'paused' && <Btn variant="primary" onClick={app.timerResume}><Play size={14} />Resume</Btn>}
            {mine && <Btn onClick={stop}><Square size={14} />Stop &amp; save…</Btn>}
            {mine && <Btn variant="ghost" onClick={() => { if (window.confirm('Discard this timer without saving a session?')) app.timerDiscard(); }}><Trash2 size={14} />Discard</Btn>}
          </div>
          {pendingSec !== null && mine && (
            <div className="mt-3 rounded-lg border border-brand-500/40 bg-brand-500/10 p-3 text-sm">
              <p className="mb-2">Timer stopped at {formatDuration(pendingSec)}. How did it go?</p>
              <div className="flex flex-wrap gap-2">
                {isSolved ? <Btn variant="primary" onClick={() => choose('revision')}>Save as revision</Btn> : <Btn variant="primary" onClick={() => choose('new')}>I solved it</Btn>}
                <Btn onClick={() => choose('attempt')}>Save as unsolved attempt</Btn>
                <Btn variant="ghost" onClick={() => { setPendingSec(null); app.timerResume(); }}>Keep timing</Btn>
              </div>
            </div>)}
          {other && <p className="mt-3 text-center text-xs text-amber-300">A timer is running on <Link className="underline" to={`/problem/${timer.problemId}`}>another problem</Link>. Save or discard it first.</p>}
          <p className="mt-4 border-t border-ink-600 pt-3 text-xs text-slate-500">Solved it directly on LeetCode? Log it manually, no timer needed. Try the problem and explain your approach before reading any solution.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!isSolved && <Btn onClick={() => setLog({ problemId: id, kind: 'new' })}>Mark solved</Btn>}
            {isSolved && <Btn onClick={() => setLog({ problemId: id, kind: 'revision' })}>Record revision</Btn>}
            <Btn onClick={() => setLog({ problemId: id, kind: 'attempt' })}>Log unsolved attempt</Btn>
          </div>
        </Card>
        <Card>
          <H>Sessions</H>
          {mySessions.length === 0 ? <Empty title="No sessions yet." /> : <div className="divide-y divide-ink-600/60">{mySessions.map((s) => (
            <SessionLine key={s.id} s={s} onEdit={() => setLog({ problemId: id, kind: s.kind, edit: s })}
              onDelete={async () => { if (!window.confirm('Delete this session?')) return; const r = await app.removeSession(s.id); say(r.ok ? 'Session deleted.' : r.message); }} />))}</div>}
        </Card>
      </div>
      <Card className="mt-4">
        <H right={<label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={draft.flagged} onChange={(e) => setDraft({ ...draft, flagged: e.target.checked })} />Flag for extra revision</label>}>My notes</H>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="My approach"><textarea rows={3} className={inputCls} value={draft.approach} onChange={set('approach')} /></Field>
          <Field label="Key insight"><textarea rows={3} className={inputCls} value={draft.insight} onChange={set('insight')} /></Field>
          <Field label="Why my initial attempt failed"><textarea rows={2} className={inputCls} value={draft.whyFailed} onChange={set('whyFailed')} /></Field>
          <Field label="Edge cases"><textarea rows={2} className={inputCls} value={draft.edgeCases} onChange={set('edgeCases')} /></Field>
          <Field label="Time complexity"><input className={inputCls} value={draft.timeComplexity} onChange={set('timeComplexity')} placeholder="e.g. O(n log n)" /></Field>
          <Field label="Space complexity"><input className={inputCls} value={draft.spaceComplexity} onChange={set('spaceComplexity')} placeholder="e.g. O(n)" /></Field>
          <Field label="What I should remember"><textarea rows={2} className={inputCls} value={draft.remember} onChange={set('remember')} /></Field>
          <Field label="What I would do differently"><textarea rows={2} className={inputCls} value={draft.nextTime} onChange={set('nextTime')} /></Field>
          <Field label="Link to my solution (optional)"><input className={inputCls} value={draft.solutionLink} onChange={set('solutionLink')} placeholder="https://github.com/…" /></Field>
        </div>
        {linkErr && <p role="alert" className="mt-2 text-sm text-red-400">{linkErr}</p>}
        <div className="mt-3 flex items-center gap-3"><Btn variant="primary" onClick={saveNote}>Save notes</Btn>
          {notes.get(id)?.solutionLink && /^https?:\/\//i.test(notes.get(id)!.solutionLink) && <a className="text-sm text-brand-400 underline" href={notes.get(id)!.solutionLink} target="_blank" rel="noopener noreferrer">Open my solution</a>}</div>
        <p className="mt-2 text-xs text-slate-500">Hints used are recorded on each session. Pasting code is never required.</p>
      </Card>
      <LogForm target={log} onClose={() => setLog(null)} onSaved={() => { if (log?.durationSec !== undefined && mine) app.timerDiscard(); }} />
    </>
  );
}
