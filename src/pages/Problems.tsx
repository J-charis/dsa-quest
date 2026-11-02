import { useMemo, useState } from 'react';
import { useApp } from '../store.tsx';
import { Card, Empty, PageTitle, inputCls } from '../ui.tsx';
import { PROBLEMS } from '../data/catalog.ts';
import { TOPICS } from '../data/roadmap.ts';
import { ProblemLine } from '../components/Rows.tsx';

export function ProblemsPage() {
  const { solved, reviews, today } = useApp();
  const [q, setQ] = useState(''); const [topic, setTopic] = useState(''); const [diff, setDiff] = useState('');
  const [status, setStatus] = useState(''); const [prio, setPrio] = useState(''); const [rev, setRev] = useState(''); const [sort, setSort] = useState('roadmap');
  const revBy = useMemo(() => new Map(reviews.map((r) => [r.problemId, r])), [reviews]);
  const list = useMemo(() => {
    let l = PROBLEMS.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (topic && p.topicId !== topic) return false;
      if (diff && p.difficulty !== diff) return false;
      if (status === 'solved' && !solved.has(p.id)) return false;
      if (status === 'unsolved' && solved.has(p.id)) return false;
      if (prio && String(p.priority) !== prio) return false;
      const r = revBy.get(p.id);
      if (rev === 'due' && !(r && r.nextDue <= today)) return false;
      if (rev === 'scheduled' && !(r && r.nextDue > today)) return false;
      if (rev === 'none' && r) return false;
      return true;
    });
    if (sort === 'time') l = [...l].sort((a, b) => a.estMinutes - b.estMinutes);
    return l;
  }, [q, topic, diff, status, prio, rev, sort, solved, revBy, today]);
  const sel = (v: string, set: (s: string) => void, label: string, opts: [string, string][]) => (
    <select aria-label={label} className={inputCls} value={v} onChange={(e) => set(e.target.value)}><option value="">{label}</option>{opts.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
  );
  return (
    <>
      <PageTitle title="Problems" sub={`${list.length} of ${PROBLEMS.length} problems`} />
      <Card className="mb-4"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input aria-label="Search by title" className={inputCls} placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} />
        {sel(topic, setTopic, 'All topics', TOPICS.filter((t) => PROBLEMS.some((p) => p.topicId === t.id)).map((t) => [t.id, t.name]))}
        {sel(diff, setDiff, 'Any difficulty', [['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']])}
        {sel(status, setStatus, 'Any status', [['solved', 'Solved'], ['unsolved', 'Not solved']])}
        {sel(prio, setPrio, 'Any priority', [['1', 'Tier 1'], ['2', 'Tier 2'], ['3', 'Tier 3']])}
        {sel(rev, setRev, 'Any revision state', [['due', 'Due / overdue'], ['scheduled', 'Scheduled'], ['none', 'No revision']])}
        {sel(sort, setSort, 'Sort', [['roadmap', 'Roadmap order'], ['time', 'Estimated time']])}
      </div></Card>
      <Card>{list.length === 0 ? <Empty title="No problems match these filters." /> : list.map((p) => <ProblemLine key={p.id} p={p} right={<span className="text-xs text-slate-500">~{p.estMinutes}m</span>} />)}</Card>
    </>
  );
}
