import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { Difficulty } from './domain/types.ts';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx('rounded-xl border border-ink-600/70 bg-ink-800/80 p-4', className)}>{children}</section>;
}
export function H({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold tracking-wide text-slate-300">{children}</h2>{right}</div>;
}
export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-semibold text-white">{title}</h1>{sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}</div>{right}
    </header>
  );
}
type Variant = 'primary' | 'ghost' | 'danger' | 'default';
export function Btn({ variant = 'default', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const v: Record<Variant, string> = {
    primary: 'bg-brand-500 text-white hover:bg-brand-400', default: 'bg-ink-700 text-slate-100 hover:bg-ink-600 border border-ink-600',
    ghost: 'text-slate-300 hover:bg-ink-700', danger: 'bg-red-600/90 text-white hover:bg-red-500',
  };
  return <button type="button" {...p} className={cx('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', v[variant], className)} />;
}
const tones: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-300', amber: 'bg-amber-500/15 text-amber-300', red: 'bg-red-500/15 text-red-300',
  blue: 'bg-sky-500/15 text-sky-300', slate: 'bg-slate-500/15 text-slate-300', brand: 'bg-brand-500/20 text-brand-400',
};
export const Badge = ({ tone = 'slate', children }: { tone?: keyof typeof tones | string; children: ReactNode }) =>
  <span className={cx('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', tones[tone] ?? tones.slate)}>{children}</span>;
export const diffTone = (d: Difficulty) => (d === 'Easy' ? 'green' : d === 'Medium' ? 'amber' : 'red');

export function Bar({ pct, label }: { pct: number; label?: string }) {
  const v = Math.max(0, Math.min(100, pct));
  return <div role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-1.5 w-full overflow-hidden rounded-full bg-ink-600"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${v}%` }} /></div>;
}
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <Card><div className="text-xs uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 text-2xl font-semibold text-white">{value}</div>{hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}</Card>;
}
export function Empty({ title, hint }: { title: string; hint?: string }) {
  return <div className="rounded-lg border border-dashed border-ink-600 p-5 text-center"><p className="text-sm text-slate-300">{title}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>;
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('keydown', k); prev?.focus(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-ink-600 bg-ink-800 p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{title}</h2><button aria-label="Close" onClick={onClose} className="rounded p-1 text-slate-400 hover:text-white"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
export const inputCls = 'w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500';
export const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-sm"><span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>{children}</label>;
export const fmtMin = (sec: number) => (sec >= 3600 ? `${Math.floor(sec / 3600)}h ${Math.round((sec % 3600) / 60)}m` : `${Math.round(sec / 60)}m`);
