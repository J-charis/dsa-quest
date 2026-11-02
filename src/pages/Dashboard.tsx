import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Play, Plus, CheckCircle2 } from 'lucide-react';
import { useApp } from '../store.tsx';
import { Badge, Bar, Btn, Card, Empty, H, PageTitle, Stat, diffTone, fmtMin } from '../ui.tsx';
import { problemById, PROBLEMS } from '../data/catalog.ts';
import { TOPICS, PHASES } from '../data/roadmap.ts';
import { currentBatch, currentPhase, nextProblem, overallProgress } from '../domain/progress.ts';
import { weekSummary } from '../domain/planner.ts';
import { bucketRevisions } from '../domain/scheduler.ts';
import { currentStreak, longestStreak } from '../domain/activity.ts';
import { topicMastery } from '../domain/analytics.ts';
import { addDays, startOfWeek, parseDateKey } from '../domain/dates.ts';
import { Heatmap } from '../components/Heatmap.tsx';
import { ProblemLine } from '../components/Rows.tsx';
import { LogForm, type LogTarget } from '../components/LogForm.tsx';
import { QuickAdd } from '../components/QuickAdd.tsx';

export function Dashboard() {
  const { today, sessions, solved, dayMap, reviews, settings, timerStart, timer, say } = useApp();
  const nav = useNavigate();
  const [log, setLog] = useState<LogTarget | null>(null);
  const [quick, setQuick] = useState(false);
  const week = weekSummary(sessions, today, settings.weeklyTarget, settings.weekStartsOn);
  const buckets = bucketRevisions(reviews, today, settings.intervals);
  const due = [...buckets.overdue, ...buckets.dueToday];
  const next = nextProblem(solved, settings.freeMode);
  const batch = currentBatch(solved, settings.freeMode);
  const overall = overallProgress(solved);
  const totalSec = sessions.reduce((a, s) => a + s.durationSec, 0);
  const recent = sessions.filter((s) => s.kind === 'new').sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5);
  const weakest = TOPICS.map((t) => ({ t, m: topicMastery(PROBLEMS.filter((p) => p.topicId === t.id), sessions) })).filter((x) => x.m.solved > 0).sort((a, b) => a.m.score - b.m.score).slice(0, 4);
  const ws = startOfWeek(today, settings.weekStartsOn);
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const maxDay = Math.max(1, ...days.map((d) => dayMap.get(d)?.sessions ?? 0));
  const solvedCount = solved.size, streak = currentStreak(dayMap, today);
  const passedRevs = sessions.filter((s) => s.kind === 'revision' && (s.confidence === 'good' || s.confidence === 'easy')).length;
  const milestones = [
    solvedCount >= 1 && 'Solved your first problem', solvedCount >= 10 && '10 problems solved', solvedCount >= 50 && '50 problems solved', solvedCount >= 100 && '100 problems solved',
    longestStreak(dayMap) >= 7 && 'A 7-day practice streak', passedRevs >= 5 && '5 successful revisions (retention!)',
  ].filter(Boolean) as string[];
  const isNew = sessions.length === 0;

  return (
    <>
      <PageTitle title="Dashboard" sub="Everything here is calculated from your saved sessions." right={<Btn variant="primary" onClick={() => setQuick(true)}><Plus size={14} />Log session</Btn>} />
      {isNew && (
        <Card className="mb-4 border-brand-500/40">
          <H>Welcome to DSA Quest</H>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-300">
            <li>Open today's focus below and try the problem on LeetCode in C++ <em>before</em> looking at any solution.</li>
            <li>Use the timer on the problem page, or log time manually after solving on LeetCode.</li>
            <li>Rate how it went. Revisions are scheduled automatically (Day 1, 3, 7, 14, 30 by default).</li>
          </ol>
          <p className="mt-2 text-xs text-slate-500">Your data stays in this browser. Use Settings → Export for backups.</p>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
        <Stat label="Unique solved" value={solvedCount} hint={`${overall.pct}% of roadmap`} />
        <Stat label="New this week" value={week.newSessions} />
        <Stat label="Revisions this week" value={week.revisionSessions} />
        <Stat label="Sessions this week" value={`${week.total} / ${week.target}`} />
        <Stat label="Current streak" value={`${streak}d`} hint={`Longest ${longestStreak(dayMap)}d`} />
        <Stat label="Active time" value={fmtMin(totalSec)} />
        <Stat label="Roadmap" value={`${overall.solved}/${overall.total}`} />
        <Stat label="Due for revision" value={due.length} />
        <Stat label="Phase" value={`${currentPhase(solved)}`} hint={PHASES[currentPhase(solved)].name} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <H>Today's focus</H>
          {!next ? <Empty title="Roadmap complete (or fully unlocked batches done)." hint="Spend time on revisions and Phase 10 mixed practice." /> : (
            <div>
              <div className="flex flex-wrap items-center gap-2"><Link to={`/problem/${next.id}`} className="text-lg font-semibold text-white hover:underline">{next.title}</Link>
                <Badge tone={diffTone(next.difficulty)}>{next.difficulty}</Badge><Badge tone="brand">Tier {next.priority}</Badge><Badge>{TOPICS.find((t) => t.id === next.topicId)?.name}</Badge></div>
              <p className="mt-2 text-sm text-slate-300">Pattern: {next.patterns.join(', ')} · about {next.estMinutes} min</p>
              <p className="mt-1 text-sm text-slate-400">Why it matters: {next.objective} Interview-relevant for {next.subtopic.toLowerCase()}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={next.url} target="_blank" rel="noopener noreferrer"><Btn><ExternalLink size={14} />Open on LeetCode</Btn></a>
                <Btn variant="primary" onClick={() => { if (timer.status !== 'idle' && timer.problemId !== next.id) return say('Another timer is active. Save or discard it first.'); if (timer.status === 'idle') timerStart(next.id); nav(`/problem/${next.id}`); }}><Play size={14} />Start timer</Btn>
                <Btn onClick={() => setLog({ problemId: next.id, kind: 'new' })}><CheckCircle2 size={14} />Record completion</Btn>
              </div>
            </div>
          )}
        </Card>
        <Card>
          <H>Weekly target</H>
          <div className="space-y-3 text-sm">
            <div><div className="mb-1 flex justify-between"><span>Total</span><span>{week.total} / {week.target}</span></div><Bar pct={(week.total / week.target) * 100} label="Total sessions" /></div>
            <div className="flex justify-between text-slate-400"><span>New problem sessions</span><span>{week.newSessions}</span></div>
            <div className="flex justify-between text-slate-400"><span>Revision sessions</span><span>{week.revisionSessions}</span></div>
            <p className="text-xs text-slate-500">{week.met ? 'Target reached. Rest is part of the plan.' : `${week.remaining} to go. Revisions count toward the target but never as new problems.`}</p>
          </div>
        </Card>
      </div>

      <Card className="mt-4"><H right={<Link className="text-xs text-brand-400" to="/activity">Open</Link>}>Activity (last 12 months)</H>
        <Heatmap today={today} dayMap={dayMap} weekStartsOn={settings.weekStartsOn} onSelect={(d) => nav(`/activity?date=${d}`)} /></Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card><H right={<Link className="text-xs text-brand-400" to="/revisions">All</Link>}>Due revisions</H>
          {due.length === 0 ? <Empty title="Nothing due." hint="Solved problems appear here when their review date arrives." /> :
            due.slice(0, 5).map((r) => { const p = problemById.get(r.problemId); return p ? <ProblemLine key={r.problemId} p={p} right={<span className="text-xs text-slate-500">{r.nextDue < today ? 'overdue' : 'today'}</span>} /> : null; })}</Card>
        <Card><H>Upcoming revisions</H>
          {buckets.upcoming.length === 0 ? <Empty title="No upcoming revisions yet." /> :
            buckets.upcoming.slice(0, 5).map((r) => { const p = problemById.get(r.problemId); return p ? <ProblemLine key={r.problemId} p={p} right={<span className="text-xs text-slate-500">{r.nextDue}</span>} /> : null; })}</Card>
        <Card><H>This week</H>
          <div className="flex h-24 items-end gap-2" role="img" aria-label="Sessions per day this week">
            {days.map((d) => { const n = dayMap.get(d)?.sessions ?? 0; return (
              <div key={d} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t bg-emerald-500/80" style={{ height: `${(n / maxDay) * 100}%`, minHeight: n ? 4 : 1 }} title={`${d}: ${n}`} /><span className="text-[10px] text-slate-500">{parseDateKey(d).toLocaleDateString(undefined, { weekday: 'narrow' })}</span></div>); })}
          </div></Card>
        <Card><H>Weakest topics</H>
          {weakest.length === 0 ? <Empty title="Not enough data yet." hint="Mastery needs solves, confidence and revisions." /> :
            weakest.map(({ t, m }) => <div key={t.id} className="flex items-center justify-between py-1 text-sm"><Link className="hover:underline" to={`/topic/${t.id}`}>{t.name}</Link><span className="text-xs text-slate-500">{m.reliable ? `${m.score}%` : `${m.score}% (early estimate)`}</span></div>)}</Card>
        <Card><H>Current batch</H>
          {!batch ? <Empty title="No unlocked batch." /> : <div><Link className="font-medium hover:underline" to={`/batch/${batch.id}`}>{batch.title}</Link><p className="text-xs text-slate-400">{TOPICS.find((t) => t.id === batch.topicId)?.name}{batch.kind === 'mixed-challenge' ? ' · includes a mixed-topic challenge' : ''}</p>
            <div className="mt-2">{batch.rows.map((r) => problemById.get(r[0])).map((p) => p && <ProblemLine key={p.id} p={p} />)}</div></div>}</Card>
        <Card><H>Recently solved</H>
          {recent.length === 0 ? <Empty title="Nothing solved yet." /> : recent.map((s) => { const p = problemById.get(s.problemId); return p ? <ProblemLine key={s.id} p={p} right={<span className="text-xs text-slate-500">{s.date}</span>} /> : null; })}</Card>
      </div>
      <Card className="mt-4"><H>Milestones</H>{milestones.length === 0 ? <p className="text-sm text-slate-500">Milestones appear as you practise: solves, streaks and successful revisions.</p> : <ul className="space-y-1 text-sm text-slate-300">{milestones.map((m) => <li key={m}>✓ {m}</li>)}</ul>}</Card>
      <LogForm target={log} onClose={() => setLog(null)} />
      <QuickAdd open={quick} onClose={() => setQuick(false)} />
    </>
  );
}
