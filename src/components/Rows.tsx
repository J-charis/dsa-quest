import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Problem, Session } from '../domain/types.ts';
import { problemById } from '../data/catalog.ts';
import { Badge, diffTone, fmtMin } from '../ui.tsx';
import { useApp } from '../store.tsx';

export function ProblemLine({ p, right }: { p: Problem; right?: ReactNode }) {
  const { solved } = useApp();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 hover:bg-ink-700/60">
      <span className={solved.has(p.id) ? 'text-emerald-400' : 'text-slate-600'} aria-label={solved.has(p.id) ? 'Solved' : 'Not solved'}>{solved.has(p.id) ? '●' : '○'}</span>
      <Link to={`/problem/${p.id}`} className="min-w-0 flex-1 truncate text-sm text-slate-100 hover:underline">{p.title}</Link>
      <Badge tone={diffTone(p.difficulty)}>{p.difficulty}</Badge>
      <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${p.title} on LeetCode`} className="text-slate-400 hover:text-white"><ExternalLink size={14} /></a>
      {right}
    </div>
  );
}
export function SessionLine({ s, onEdit, onDelete }: { s: Session; onEdit?: () => void; onDelete?: () => void }) {
  const p = problemById.get(s.problemId);
  const tone = s.kind === 'new' ? 'green' : s.kind === 'revision' ? 'blue' : 'amber';
  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
      <Badge tone={tone}>{s.kind === 'new' ? 'new' : s.kind === 'revision' ? 'revision' : 'attempt'}</Badge>
      <Link to={`/problem/${s.problemId}`} className="min-w-0 flex-1 truncate hover:underline">{p?.title ?? s.problemId}</Link>
      <span className="text-xs text-slate-500">{s.date} · {fmtMin(s.durationSec)}{s.confidence ? ` · ${s.confidence}` : ''}</span>
      {onEdit && <button className="text-xs text-slate-400 hover:text-white" onClick={onEdit}>Edit</button>}
      {onDelete && <button className="text-xs text-red-400 hover:text-red-300" onClick={onDelete}>Delete</button>}
    </div>
  );
}
