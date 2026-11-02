import { useState } from 'react';
import { useApp } from '../store.tsx';
import { Badge, Btn, Card, Empty, H, PageTitle, diffTone, fmtMin } from '../ui.tsx';
import { bucketRevisions } from '../domain/scheduler.ts';
import { problemById } from '../data/catalog.ts';
import { topicById } from '../data/roadmap.ts';
import type { ReviewState } from '../domain/types.ts';
import { Link } from 'react-router-dom';
import { LogForm, type LogTarget } from '../components/LogForm.tsx';

export function RevisionsPage() {
  const { reviews, sessions, today, settings } = useApp();
  const [log, setLog] = useState<LogTarget | null>(null);
  const b = bucketRevisions(reviews, today, settings.intervals);
  const row = (r: ReviewState, action: boolean) => {
    const p = problemById.get(r.problemId); if (!p) return null;
    const first = sessions.find((s) => s.problemId === p.id && s.kind === 'new');
    return (
      <div key={r.problemId} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2 hover:bg-ink-700/60">
        <div className="min-w-0 flex-1"><Link to={`/problem/${p.id}`} className="text-sm text-slate-100 hover:underline">{p.title}</Link>
          <div className="text-xs text-slate-500">{topicById.get(p.topicId)?.name} · first solve {first ? fmtMin(first.durationSec) : '—'} · last rating {r.lastConfidence} · reviewed {r.lastReviewed} · next {r.nextDue}</div></div>
        <Badge tone={diffTone(p.difficulty)}>{p.difficulty}</Badge>
        {action && <Btn variant="primary" onClick={() => setLog({ problemId: p.id, kind: 'revision' })}>Record attempt</Btn>}
      </div>
    );
  };
  const section = (title: string, list: ReviewState[], action: boolean, empty: string) => (
    <Card><H right={<Badge>{list.length}</Badge>}>{title}</H>{list.length === 0 ? <Empty title={empty} /> : list.map((r) => row(r, action))}</Card>
  );
  return (
    <>
      <PageTitle title="Revision queue" sub="Open the problem, try to recall or re-solve it, then record how it went. Opening LeetCode alone does not count." />
      {reviews.length === 0 && <Card className="mb-4"><Empty title="No revisions scheduled yet." hint="Solve a problem and it will appear here on its review date." /></Card>}
      <div className="space-y-4">
        {section('Overdue', b.overdue, true, 'Nothing overdue.')}
        {section('Due today', b.dueToday, true, 'Nothing due today.')}
        {section('Upcoming', b.upcoming, false, 'No upcoming revisions.')}
        {section('Recently mastered', b.mastered, false, 'Problems that completed the full interval ladder appear here.')}
      </div>
      <LogForm target={log} onClose={() => setLog(null)} />
    </>
  );
}
