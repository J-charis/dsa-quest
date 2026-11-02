import { heatmapGrid, intensity, type DayActivity } from '../domain/activity.ts';
import { parseDateKey, type DateKey } from '../domain/dates.ts';
import { fmtMin, cx } from '../ui.tsx';

// Emerald = a day with at least one new problem; sky = revision-only day. Same data feeds the calendar.
const NEW = ['bg-ink-700', 'bg-emerald-900', 'bg-emerald-700', 'bg-emerald-500', 'bg-emerald-300'];
const REV = ['bg-ink-700', 'bg-sky-900', 'bg-sky-700', 'bg-sky-500', 'bg-sky-300'];

export function Heatmap({ today, dayMap, selected, onSelect, weekStartsOn = 1 }: { today: DateKey; dayMap: Map<DateKey, DayActivity>; selected?: DateKey | null; onSelect?: (d: DateKey) => void; weekStartsOn?: 0 | 1 }) {
  const weeks = heatmapGrid(today, 365, weekStartsOn);
  return (
    <div>
      <div className="overflow-x-auto pb-2" role="grid" aria-label="Practice activity, last 12 months">
        <div className="flex gap-[3px]">
          {weeks.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]" role="row">
              {col.map(({ date, future }) => {
                const a = dayMap.get(date);
                const lvl = intensity(a?.sessions ?? 0);
                const label = `${parseDateKey(date).toDateString()}: ${a?.sessions ?? 0} sessions, ${a?.newSolved ?? 0} new, ${a?.revisions ?? 0} revisions, ${fmtMin(a?.activeSec ?? 0)} active`;
                if (future) return <div key={date} className="h-3 w-3" />;
                return <button key={date} role="gridcell" title={label} aria-label={label} onClick={() => onSelect?.(date)}
                  className={cx('h-3 w-3 rounded-[3px] transition-transform hover:scale-125', (a?.newSolved ?? 0) > 0 ? NEW[lvl] : REV[lvl], selected === date && 'ring-2 ring-white', date === today && 'outline outline-1 outline-slate-400')} />;
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>Less</span>{NEW.map((c, i) => <span key={i} className={cx('h-3 w-3 rounded-[3px]', c)} />)}<span>More</span>
        <span className="ml-2 inline-flex items-center gap-1"><span className="h-3 w-3 rounded-[3px] bg-emerald-500" /> day with a new problem</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-[3px] bg-sky-500" /> revision-only day</span>
        <span>0 · 1 · 2 · 3–4 · 5+ sessions</span>
      </div>
    </div>
  );
}
