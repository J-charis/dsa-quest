import { useApp } from '../store.tsx';
import { Bar, Card, Empty, H, PageTitle, Stat, fmtMin } from '../ui.tsx';
import { avgSolveSecByDifficulty, firstAttemptSuccess, independence, revisionRetention, topicMastery } from '../domain/analytics.ts';
import { PROBLEMS, problemById } from '../data/catalog.ts';
import { PHASES, TOPICS } from '../data/roadmap.ts';
import { currentStreak, longestStreak } from '../domain/activity.ts';
import { phaseProgress } from '../domain/progress.ts';
import { weekSummary } from '../domain/planner.ts';
import { addDays } from '../domain/dates.ts';
import { Link } from 'react-router-dom';

const pct = (v: number | null) => (v === null ? 'not enough data' : `${Math.round(v * 100)}%`);

export function AnalyticsPage() {
  const { sessions, solved, dayMap, today, settings } = useApp();
  const avg = avgSolveSecByDifficulty(sessions, problemById);
  const ind = independence(sessions);
  const weeks = Array.from({ length: 8 }, (_, i) => weekSummary(sessions, addDays(today, -7 * (7 - i)), settings.weeklyTarget, settings.weekStartsOn));
  const hit = weeks.filter((w) => w.met).length;
  return (
    <>
      <PageTitle title="Analytics" sub="Mastery needs independent solves, confidence and successful revisions. Solving alone is not mastery." />
      {sessions.length === 0 && <Card className="mb-4"><Empty title="No data yet." hint="Log a few sessions and charts will appear." /></Card>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Unique solved" value={solved.size} /><Stat label="Total sessions" value={sessions.filter((s) => s.kind !== 'attempt').length} />
        <Stat label="Total attempts logged" value={sessions.length} hint="incl. revisions & unsolved" /><Stat label="Active time" value={fmtMin(sessions.reduce((a, s) => a + s.durationSec, 0))} />
        <Stat label="Independent / assisted" value={`${ind.independent} / ${ind.assisted}`} /><Stat label="First-attempt success" value={pct(firstAttemptSuccess(sessions))} hint="needs 5+ problems" />
        <Stat label="Revision retention" value={pct(revisionRetention(sessions))} hint="good/easy ratings" /><Stat label="Streak" value={`${currentStreak(dayMap, today)}d`} hint={`longest ${longestStreak(dayMap)}d`} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card><H>Average solve time</H>{(['Easy', 'Medium', 'Hard'] as const).map((d) => <div key={d} className="flex justify-between py-1 text-sm"><span>{d}</span><span className="text-slate-400">{avg[d] === null ? '—' : fmtMin(avg[d]!)}</span></div>)}</Card>
        <Card><H>Weekly consistency (last 8 weeks)</H>
          <div className="flex h-20 items-end gap-2" role="img" aria-label="Sessions per week">{weeks.map((w) => <div key={w.weekStart} className="flex flex-1 flex-col items-center gap-1"><div className={`w-full rounded-t ${w.met ? 'bg-emerald-500' : 'bg-slate-500'}`} style={{ height: `${Math.min(100, (w.total / w.target) * 100)}%`, minHeight: w.total ? 4 : 1 }} title={`${w.weekStart}: ${w.total}/${w.target}`} /><span className="text-[10px] text-slate-500">{w.total}</span></div>)}</div>
          <p className="mt-2 text-xs text-slate-500">Target met in {hit} of the last 8 weeks.</p></Card>
        <Card><H>Progress by phase</H>{PHASES.filter((p) => phaseProgress(p.id, solved).total > 0).map((p) => { const pp = phaseProgress(p.id, solved); return <div key={p.id} className="py-1"><div className="flex justify-between text-sm"><span>Phase {p.id} · {p.name}</span><span className="text-slate-500">{pp.solved}/{pp.total}</span></div><Bar pct={pp.pct} label={p.name} /></div>; })}</Card>
        <Card><H>Topic mastery (estimate)</H>
          {TOPICS.filter((t) => PROBLEMS.some((p) => p.topicId === t.id)).map((t) => { const m = topicMastery(PROBLEMS.filter((p) => p.topicId === t.id), sessions); return (
            <div key={t.id} className="py-1"><div className="flex justify-between text-sm"><Link className="hover:underline" to={`/topic/${t.id}`}>{t.name}</Link><span className="text-xs text-slate-500">{m.solved}/{m.total} · {m.score}%{m.solved > 0 && !m.reliable ? ' · early' : ''}</span></div><Bar pct={m.score} label={`${t.name} mastery`} /></div>); })}</Card>
      </div>
    </>
  );
}
