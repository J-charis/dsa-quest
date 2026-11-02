import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { BarChart3, CalendarDays, Flame, LayoutDashboard, Map, RotateCcw, Search, Settings as Cog, Timer, CalendarCheck } from 'lucide-react';
import { useApp } from './store.tsx';
import { cx } from './ui.tsx';
import { problemById } from './data/catalog.ts';
import { Dashboard } from './pages/Dashboard.tsx';
import { Roadmap, TopicPage, BatchPage } from './pages/Roadmap.tsx';
import { ProblemPage } from './pages/ProblemPage.tsx';
import { ProblemsPage } from './pages/Problems.tsx';
import { CalendarPage, ActivityPage } from './pages/Activity.tsx';
import { RevisionsPage } from './pages/Revisions.tsx';
import { PlannerPage } from './pages/Planner.tsx';
import { AnalyticsPage } from './pages/Analytics.tsx';
import { SettingsPage } from './pages/Settings.tsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard }, { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/problems', label: 'Problems', icon: Search }, { to: '/revisions', label: 'Revisions', icon: RotateCcw },
  { to: '/planner', label: 'Weekly plan', icon: CalendarCheck }, { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/activity', label: 'Heatmap', icon: Flame }, { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Cog },
];

function Logo() {
  return <Link to="/" className="flex items-center gap-2 font-semibold text-white"><svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#6270f5" /><path d="M10 9l-5 7 5 7M22 9l5 7-5 7M18 8l-4 16" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>DSA Quest</Link>;
}

export function App() {
  const { ready, error, toast, timer } = useApp();
  if (!ready) return <div className="grid min-h-screen place-items-center text-slate-400" role="status">Loading your progress…</div>;
  const link = ({ isActive }: { isActive: boolean }) => cx('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm', isActive ? 'bg-ink-700 text-white' : 'text-slate-400 hover:bg-ink-800 hover:text-slate-100');
  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-brand-500 focus:p-2">Skip to content</a>
      <aside className="hidden w-56 shrink-0 border-r border-ink-700 bg-ink-900 p-4 lg:block">
        <div className="mb-6"><Logo /></div>
        <nav aria-label="Main" className="flex flex-col gap-1">{NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={link}><n.icon size={16} />{n.label}</NavLink>)}</nav>
        {timer.status !== 'idle' && timer.problemId && (
          <Link to={`/problem/${timer.problemId}`} className="mt-6 flex items-start gap-2 rounded-lg border border-brand-500/40 bg-brand-500/10 p-2 text-xs text-slate-200"><Timer size={14} className="mt-0.5 shrink-0" /><span>Timer {timer.status} on <b>{problemById.get(timer.problemId)?.title}</b>. Open to save or discard.</span></Link>
        )}
        <p className="mt-6 text-[11px] leading-relaxed text-slate-500">Local-first: your data lives in this browser only. Export a backup in Settings to keep or move it.</p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-4 py-3 lg:hidden"><Logo />{timer.status !== 'idle' && timer.problemId && <Link to={`/problem/${timer.problemId}`} className="text-xs text-brand-400">⏱ timer {timer.status}</Link>}</header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 sm:p-6 lg:pb-8">
          {error && <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <Routes>
            <Route path="/" element={<Dashboard />} /><Route path="/roadmap" element={<Roadmap />} />
            <Route path="/topic/:id" element={<TopicPage />} /><Route path="/batch/:id" element={<BatchPage />} />
            <Route path="/problem/:id" element={<ProblemPage />} /><Route path="/problems" element={<ProblemsPage />} />
            <Route path="/calendar" element={<CalendarPage />} /><Route path="/activity" element={<ActivityPage />} />
            <Route path="/revisions" element={<RevisionsPage />} /><Route path="/planner" element={<PlannerPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} /><Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<p className="text-slate-400">Page not found. <Link className="underline" to="/">Go to dashboard</Link></p>} />
          </Routes>
        </main>
        <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-ink-700 bg-ink-900/95 py-1.5 backdrop-blur lg:hidden">
          {[NAV[0], NAV[1], NAV[3], NAV[4], NAV[8]].map((n) => <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 px-2 py-1 text-[10px]', isActive ? 'text-white' : 'text-slate-500')}><n.icon size={18} />{n.label}</NavLink>)}
        </nav>
      </div>
      {toast && <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-ink-600 px-4 py-2 text-sm text-white shadow-lg lg:bottom-6">{toast}</div>}
    </div>
  );
}
