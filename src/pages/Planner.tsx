import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store.tsx';
import { Bar, Btn, Card, Empty, H, PageTitle, Stat, fmtMin } from '../ui.tsx';
import { planWeek, weekSummary } from '../domain/planner.ts';
import { bucketRevisions } from '../domain/scheduler.ts';
import { addDays, parseDateKey } from '../domain/dates.ts';
import { currentBatch } from '../domain/progress.ts';
import { PROBLEMS, problemById } from '../data/catalog.ts';
import { TOPICS } from '../data/roadmap.ts';
import { topicMastery } from '../domain/analytics.ts';
import { ProblemLine } from '../components/Rows.tsx';

export function PlannerPage() {
  const { today, sessions, reviews, settings, solved } = useApp();
  const [offset, setOffset] = useState(0); // 0 = this week, -1 = last week
  const day = addDays(today, offset * 7);
  const w = weekSummary(sessions, day, settings.weeklyTarget, settings.weekStartsOn);
  const b = bucketRevisions(reviews, today, settings.intervals);
  const due = b.overdue.length + b.dueToday.length;
  const plan = planWeek(settings.weeklyTarget, due, b.overdue.length);
  const batch = currentBatch(solved, settings.freeMode);
  const weekSess = sessions.filter((s) => s.date >= w.weekStart && s.date <= w.weekEnd);
  const topicIds = new Set(weekSess.map((s) => problemById.get(s.problemId)?.topicId).filter(Boolean) as string[]);
  const ranked = TOPICS.filter((t) => topicIds.has(t.id)).map((t) => ({ t, m: topicMastery(PROBLEMS.filter((p) => p.topicId === t.id), sessions) })).sort((a, c) => c.m.score - a.m.score);
  const needWork = [...new Set(weekSess.filter((s) => s.confidence === 'again' || s.confidence === 'hard').map((s) => s.problemId))];
  const studyDays = Array.from({ length: 7 }, (_, i) => addDays(w.weekStart, i));
  const dayName = (d: string) => parseDateKey(d).toLocaleDateString(undefined, { weekday: 'short' });
  const catchUp = studyDays.find((d) => !settings.studyDays.includes(parseDateKey(d).getDay())) ?? null;

  return (
    <>
      <PageTitle title="Weekly plan & review" sub={`${w.weekStart} → ${w.weekEnd}`} right={<div className="flex gap-2"><Btn onClick={() => setOffset(offset - 1)}>Previous week</Btn><Btn disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>Next week</Btn></div>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Target" value={w.target} /><Stat label="Sessions" value={w.total} hint={`${w.remaining} remaining`} />
        <Stat label="New / revisions" value={`${w.newSessions} / ${w.revisionSessions}`} hint={`${w.uniqueNew} unique new`} /><Stat label="Active time" value={fmtMin(w.activeSec)} />
      </div>
      <Card className="mt-4"><div className="mb-1 flex justify-between text-sm"><span>Target vs actual</span><span>{w.total} / {w.target}</span></div><Bar pct={(w.total / w.target) * 100} label="Target progress" />
        <p className="mt-2 text-xs text-slate-500">Rest days are never penalised, and retention matters more than hitting the number.</p></Card>

      {offset === 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card><H>Suggested mix</H>
            <ul className="space-y-1 text-sm text-slate-300">
              <li><b>{plan.revisionSlots}</b> revision sessions (due or overdue first)</li>
              <li><b>{plan.newSlots}</b> new problems{plan.suggestedBatches ? ` (about ${plan.suggestedBatches} batch${plan.suggestedBatches > 1 ? 'es' : ''} of five)` : ''}</li>
              <li><b>{plan.mixedReviewSlots}</b> mixed-topic review session</li>
              <li>Catch-up: {catchUp ? `${dayName(catchUp)} (not a study day)` : 'any day you miss'}</li>
            </ul>
            {plan.revisionHeavy && <p className="mt-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-200">Revision-heavy week: many reviews are overdue, so new problems are cut roughly in half to protect retention.</p>}
            <p className="mt-3 text-xs text-slate-500">Study days: {settings.studyDays.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'none selected'}. Change them in Settings.</p></Card>
          <Card><H>Revisions first</H>{due === 0 ? <Empty title="No revisions due." /> : [...b.overdue, ...b.dueToday].slice(0, plan.revisionSlots || 5).map((r) => { const p = problemById.get(r.problemId); return p ? <ProblemLine key={p.id} p={p} right={<span className="text-xs text-slate-500">{r.nextDue < today ? 'overdue' : 'today'}</span>} /> : null; })}</Card>
          <Card className="md:col-span-2"><H right={<Link className="text-xs text-brand-400" to="/roadmap">Roadmap</Link>}>New work</H>
            {plan.newSlots === 0 ? <p className="text-sm text-slate-400">No new problems suggested this week; clear the revision backlog first.</p> : !batch ? <Empty title="No unlocked batch." /> :
              <><p className="mb-1 text-sm text-slate-300">Current batch: <Link className="underline" to={`/batch/${batch.id}`}>{batch.title}</Link></p>{batch.rows.map((r) => problemById.get(r[0])).map((p) => p && <ProblemLine key={p.id} p={p} />)}</>}</Card>
        </div>
      ) : null}

      <Card className="mt-4"><H>Review of this week</H>
        {weekSess.length === 0 ? <Empty title="No sessions this week." hint="Nothing to review yet." /> : (
          <div className="space-y-1 text-sm text-slate-300">
            <p>Target {w.target} vs actual {w.total} · new {w.newSessions} · revisions {w.revisionSessions} · time {fmtMin(w.activeSec)}</p>
            <p>Strongest topic: {ranked.length ? `${ranked[0].t.name} (${ranked[0].m.score}%${ranked[0].m.reliable ? '' : ', early estimate'})` : '—'}</p>
            <p>Weakest topic: {ranked.length > 1 ? `${ranked[ranked.length - 1].t.name} (${ranked[ranked.length - 1].m.score}%)` : 'not enough data'}</p>
            <p>Needs more work: {needWork.length ? needWork.map((id) => problemById.get(id)?.title).join(', ') : 'nothing flagged this week'}</p>
            <p>Suggested focus: {needWork.length ? 'redo the problems above before adding new ones.' : w.met ? 'continue with the next batch; keep revisions on schedule.' : 'close the gap with revisions first, then new problems.'}</p>
          </div>)}</Card>
    </>
  );
}
