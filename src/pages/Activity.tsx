import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../store.tsx';
import { Btn, Card, PageTitle, cx, fmtMin } from '../ui.tsx';
import { addDays, parseDateKey, startOfWeek, toDateKey, type DateKey } from '../domain/dates.ts';
import { Heatmap } from '../components/Heatmap.tsx';
import { DayPanel } from '../components/DayPanel.tsx';

export function CalendarPage() {
  const { today, dayMap, settings } = useApp();
  const [month, setMonth] = useState(() => today.slice(0, 7)); // YYYY-MM
  const [sel, setSel] = useState<DateKey>(today);
  const [y, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const gridStart = startOfWeek(first, settings.weekStartsOn);
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const shift = (n: number) => { const d = new Date(y, m - 1 + n, 1, 12); setMonth(toDateKey(d).slice(0, 7)); };
  const names = Array.from({ length: 7 }, (_, i) => parseDateKey(addDays(startOfWeek(today, settings.weekStartsOn), i)).toLocaleDateString(undefined, { weekday: 'short' }));
  return (
    <>
      <PageTitle title="Calendar" sub="Same data as the heatmap. Select a day to view, edit or delete its sessions." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <Btn variant="ghost" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={16} /></Btn>
            <h2 className="font-semibold text-white">{new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
            <div className="flex gap-1"><Btn variant="ghost" onClick={() => { setMonth(today.slice(0, 7)); setSel(today); }}>Today</Btn><Btn variant="ghost" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={16} /></Btn></div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">{names.map((n) => <div key={n}>{n}</div>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((d) => {
              const a = dayMap.get(d); const inMonth = d.startsWith(month);
              return (
                <button key={d} onClick={() => setSel(d)} aria-label={`${d}: ${a?.sessions ?? 0} sessions`} aria-pressed={sel === d}
                  className={cx('min-h-[3.5rem] rounded-lg border p-1 text-left text-xs transition-colors sm:min-h-[4.5rem]', inMonth ? 'border-ink-600 bg-ink-900' : 'border-transparent bg-ink-900/40 text-slate-600', sel === d && 'ring-2 ring-brand-400', d === today && 'border-brand-400')}>
                  <div className={cx('font-medium', d === today && 'text-brand-400')}>{Number(d.slice(8))}</div>
                  {a && <div className="mt-0.5 space-y-0.5 leading-tight">
                    {a.newSolved > 0 && <div className="text-emerald-300">● {a.newSolved} new</div>}
                    {a.revisions > 0 && <div className="text-sky-300">↻ {a.revisions} rev</div>}
                    <div className="hidden text-slate-500 sm:block">{a.sessions} sess · {fmtMin(a.activeSec)}</div></div>}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">● new problems · ↻ revisions · outlined = today</p>
        </Card>
        <DayPanel date={sel} />
      </div>
    </>
  );
}

export function ActivityPage() {
  const { today, dayMap, settings } = useApp();
  const [params, setParams] = useSearchParams();
  const raw = params.get('date');
  const sel = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
  return (
    <>
      <PageTitle title="Activity heatmap" sub="Last 12 months, in your local timezone. Click a day for details." />
      <Card><Heatmap today={today} dayMap={dayMap} selected={sel} weekStartsOn={settings.weekStartsOn} onSelect={(d) => setParams({ date: d })} /></Card>
      <div className="mt-4"><DayPanel date={sel} /></div>
    </>
  );
}
