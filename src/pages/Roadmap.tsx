import { Link, useParams } from 'react-router-dom';
import { Lock, Unlock } from 'lucide-react';
import { useApp } from '../store.tsx';
import { Badge, Bar, Btn, Card, Empty, H, PageTitle } from '../ui.tsx';
import { BATCHES, PROBLEMS, problemById } from '../data/catalog.ts';
import { PHASES, TOPICS, topicById } from '../data/roadmap.ts';
import { batchProgress, isBatchUnlocked, phaseProgress, topicProgress } from '../domain/progress.ts';
import { topicMastery } from '../domain/analytics.ts';
import { ProblemLine } from '../components/Rows.tsx';

const tierLabel = (t: number) => (t === 1 ? 'Tier 1 · essential' : t === 2 ? 'Tier 2 · important' : 'Tier 3 · advanced / role-dependent');

export function Roadmap() {
  const { solved, settings, putSettings } = useApp();
  return (
    <>
      <PageTitle title="Roadmap" sub="Ordered curriculum. Tiers describe general interview frequency, not what any employer will ask."
        right={<Btn onClick={() => putSettings({ ...settings, freeMode: !settings.freeMode })} aria-pressed={settings.freeMode}>{settings.freeMode ? <Unlock size={14} /> : <Lock size={14} />}{settings.freeMode ? 'Flexible practice: all batches open' : 'Unlock all batches'}</Btn>} />
      <div className="space-y-4">
        {PHASES.map((ph) => {
          const pp = phaseProgress(ph.id, solved);
          const topics = TOPICS.filter((t) => t.phase === ph.id);
          return (
            <Card key={ph.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold text-white">Phase {ph.id} · {ph.name}</h2><span className="text-xs text-slate-400">{pp.total ? `${pp.solved}/${pp.total} problems` : 'concept phase'}</span></div>
              <p className="mb-2 text-sm text-slate-400">{ph.summary}</p>
              {pp.total > 0 && <Bar pct={pp.pct} label={`Phase ${ph.id} progress`} />}
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {topics.map((t) => {
                  const tp = topicProgress(t.id, solved);
                  const myBatches = BATCHES.filter((b) => b.topicId === t.id);
                  const open = myBatches.some((b) => isBatchUnlocked(b, solved, settings.freeMode));
                  return (
                    <Link key={t.id} to={`/topic/${t.id}`} className="rounded-lg border border-ink-600 p-3 hover:bg-ink-700/60">
                      <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-slate-100">{t.name}</span>{myBatches.length > 0 && (open ? <Unlock size={13} className="text-emerald-400" aria-label="Unlocked" /> : <Lock size={13} className="text-slate-500" aria-label="Locked" />)}</div>
                      <div className="mt-1 flex items-center gap-2"><Badge tone={t.tier === 1 ? 'brand' : 'slate'}>Tier {t.tier}</Badge><span className="text-xs text-slate-500">{tp.total ? `${tp.solved}/${tp.total}` : 'no problems'}</span></div>
                      {tp.total > 0 && <div className="mt-2"><Bar pct={tp.pct} label={`${t.name} progress`} /></div>}
                    </Link>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function TopicPage() {
  const { id } = useParams();
  const { solved, sessions, settings } = useApp();
  const t = topicById.get(id ?? '');
  if (!t) return <Empty title="Topic not found." />;
  const batches = BATCHES.filter((b) => b.topicId === t.id);
  const tm = topicMastery(PROBLEMS.filter((p) => p.topicId === t.id), sessions);
  const tp = topicProgress(t.id, solved);
  return (
    <>
      <PageTitle title={t.name} sub={`Phase ${t.phase} · ${tierLabel(t.tier)}`} />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2"><H>About</H><p className="text-sm text-slate-300">{t.description}</p>
          <h3 className="mb-1 mt-3 text-xs font-semibold uppercase text-slate-400">Learning objectives</h3><ul className="list-disc pl-5 text-sm text-slate-300">{t.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
          <h3 className="mb-1 mt-3 text-xs font-semibold uppercase text-slate-400">Prerequisites</h3>
          {t.prerequisites.length === 0 ? <p className="text-sm text-slate-500">None</p> : <div className="flex flex-wrap gap-2">{t.prerequisites.map((p) => <Link key={p} to={`/topic/${p}`}><Badge tone={topicProgress(p, solved).pct === 100 || topicProgress(p, solved).total === 0 ? 'green' : 'amber'}>{topicById.get(p)?.name}</Badge></Link>)}</div>}
        </Card>
        <Card><H>Progress</H><div className="text-2xl font-semibold text-white">{tp.solved}/{tp.total}</div><Bar pct={tp.pct} label="Topic progress" />
          <p className="mt-3 text-sm text-slate-300">Mastery estimate: <b>{tm.score}%</b></p>
          <p className="text-xs text-slate-500">{tm.reliable ? 'Based on independence, confidence and passed revisions.' : 'Early estimate. Needs at least 3 solves and 1 successful revision to be considered reliable.'}</p></Card>
      </div>
      <Card className="mt-4"><H>Five-question batches</H>
        {batches.length === 0 ? <Empty title="This topic has no problem batches." hint={t.phase === 0 ? 'Study the concepts, then move on to Phase 1.' : 'Phase 10 simulations use problems you have already solved.'} /> : (
          <div className="space-y-2">{batches.map((b, i) => { const bp = batchProgress(b, solved); const unlocked = isBatchUnlocked(b, solved, settings.freeMode); return (
            <Link key={b.id} to={`/batch/${b.id}`} className="flex items-center gap-3 rounded-lg border border-ink-600 p-3 hover:bg-ink-700/60">
              {unlocked ? <Unlock size={14} className="text-emerald-400" /> : <Lock size={14} className="text-slate-500" />}
              <div className="min-w-0 flex-1"><div className="text-sm font-medium text-slate-100">Batch {i + 1}: {b.title}</div><div className="text-xs text-slate-500">{b.subtopic}{b.kind === 'mixed-challenge' ? ' · mixed-topic challenge' : ''}</div></div>
              <span className="text-xs text-slate-400">{bp.solved}/5</span></Link>); })}</div>)}
      </Card>
    </>
  );
}

export function BatchPage() {
  const { id } = useParams();
  const { solved, sessions, reviews, settings } = useApp();
  const b = BATCHES.find((x) => x.id === id);
  if (!b) return <Empty title="Batch not found." />;
  const probs = b.rows.map((r) => problemById.get(r[0])!);
  const bp = batchProgress(b, solved);
  const unlocked = isBatchUnlocked(b, solved, settings.freeMode);
  const idx = BATCHES.indexOf(b);
  const nextB = BATCHES.slice(idx + 1).find((x) => isBatchUnlocked(x, solved, settings.freeMode) && batchProgress(x, solved).pct < 100);
  const latest = (pid: string) => [...sessions].filter((s) => s.problemId === pid && s.confidence).sort((a, c) => c.date.localeCompare(a.date) || c.createdAt - a.createdAt)[0];
  const struggled = probs.filter((p) => { const f = sessions.find((s) => s.problemId === p.id && s.kind === 'new'); return f && (f.hints || !f.independent || f.confidence === 'again' || f.confidence === 'hard'); });
  return (
    <>
      <PageTitle title={b.title} sub={`${topicById.get(b.topicId)?.name} · ${b.subtopic}`} right={<Badge tone={unlocked ? 'green' : 'amber'}>{unlocked ? 'Unlocked' : 'Locked (prior batch or prerequisite pending)'}</Badge>} />
      {b.kind === 'mixed-challenge' && <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">Mixed-topic challenge: the Hard problem here reinforces patterns from earlier topics rather than forcing a same-topic Hard.</p>}
      {!unlocked && <p className="mb-3 text-sm text-slate-400">You can still practise these problems, or enable flexible practice on the Roadmap page to open every batch.</p>}
      <Card><div className="mb-2 flex items-center justify-between text-sm"><span>{bp.solved} of 5 solved</span></div><Bar pct={bp.pct} label="Batch progress" />
        <div className="mt-3 divide-y divide-ink-600/50">{probs.map((p, i) => (
          <div key={p.id} className="py-2"><div className="flex items-start gap-2"><span className="mt-2 w-5 text-xs text-slate-500">{i + 1}</span><div className="flex-1"><ProblemLine p={p} />
            <p className="px-2 text-xs text-slate-400">Pattern: {p.patterns.join(', ')} · ~{p.estMinutes} min · {p.subtopic}</p>
            <p className="px-2 text-xs text-slate-500">{reviews.find((r) => r.problemId === p.id) ? `Revision due ${reviews.find((r) => r.problemId === p.id)!.nextDue}` : 'No revision scheduled yet'}</p></div></div></div>))}</div></Card>
      {bp.pct === 100 && (
        <Card className="mt-4 border-emerald-500/40"><H>Batch complete 🎉</H>
          <div className="space-y-1 text-sm">{probs.map((p) => { const l = latest(p.id); return <div key={p.id} className="flex justify-between"><Link className="hover:underline" to={`/problem/${p.id}`}>{p.title}</Link><span className="text-slate-400">{l?.confidence ?? 'unrated'}</span></div>; })}</div>
          <p className="mt-3 text-sm text-slate-300">{struggled.length === 0 ? 'No clear struggles recorded. Keep your revision dates.' : `Patterns to revisit: ${struggled.map((p) => p.patterns[0]).join('; ')}.`}</p>
          <p className="mt-1 text-xs text-slate-500">Revisions for all five were scheduled automatically when you saved each solve. Adjust a rating by editing the session on its problem page.</p>
          {nextB && <Link to={`/batch/${nextB.id}`}><Btn variant="primary" className="mt-3">Next: {nextB.title}</Btn></Link>}</Card>)}
    </>
  );
}
