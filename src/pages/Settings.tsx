import { useRef, useState } from 'react';
import { Download, ExternalLink, Upload } from 'lucide-react';
import { useApp } from '../store.tsx';
import { Btn, Card, Field, H, PageTitle, inputCls } from '../ui.tsx';
import { applyMerge, previewMerge, sessionsToCsv, validateBackup, type MergePreview } from '../domain/backup.ts';
import { DEFAULT_SETTINGS, type AppData, type Note } from '../domain/types.ts';
import { problemById } from '../data/catalog.ts';
import { clampTarget } from '../domain/planner.ts';

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const stamp = () => new Date().toISOString().slice(0, 10);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SettingsPage() {
  const app = useApp();
  const { settings, putSettings, say, sessions, notes } = app;
  const [target, setTarget] = useState(String(settings.weeklyTarget));
  const [intervals, setIntervals] = useState(settings.intervals.join(', '));
  const [user, setUser] = useState(settings.leetcodeUsername);
  const [err, setErr] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<AppData | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [importErr, setImportErr] = useState<string[] | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const backupNow = (why: string) => { download(`dsa-quest-backup-${why}-${stamp()}.json`, JSON.stringify(app.snapshot(), null, 2), 'application/json'); };

  const save = async () => {
    const t = Number(target);
    if (!Number.isFinite(t) || t < 1 || t > 30) return setErr('Weekly target must be between 1 and 30.');
    const iv = intervals.split(',').map((x) => Number(x.trim()));
    if (iv.length === 0 || iv.some((n) => !Number.isInteger(n) || n < 1 || n > 365)) return setErr('Intervals must be whole days between 1 and 365, comma separated.');
    if (!/^[A-Za-z0-9_-]{0,40}$/.test(user)) return setErr('LeetCode usernames use letters, numbers, - and _ only.');
    setErr(null);
    await putSettings({ ...settings, weeklyTarget: clampTarget(t), intervals: [...iv].sort((a, b) => a - b), leetcodeUsername: user });
    say('Settings saved.');
  };
  const toggleDay = (d: number) => putSettings({ ...settings, studyDays: settings.studyDays.includes(d) ? settings.studyDays.filter((x) => x !== d) : [...settings.studyDays, d].sort() });

  const onFile = async (f: File | undefined) => {
    setIncoming(null); setPreview(null); setImportErr(null);
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return setImportErr(['File is larger than 20 MB.']);
    let raw: unknown;
    try { raw = JSON.parse(await f.text()); } catch { return setImportErr(['That file is not valid JSON.']); }
    const v = validateBackup(raw);
    if (!v.ok) return setImportErr(v.errors);
    setIncoming(v.data); setPreview(previewMerge(sessions, v.data.sessions));
  };
  const doMerge = async (res: 'keep-existing' | 'use-incoming') => {
    if (!incoming || !preview) return;
    backupNow('before-import');
    const merged = applyMerge(sessions, preview, res);
    const mergedNotes = new Map(notes);
    for (const n of incoming.notes) if (res === 'use-incoming' || !mergedNotes.has(n.problemId)) mergedNotes.set(n.problemId, n);
    const r = await app.replaceEverything({ sessions: merged, notes: [...mergedNotes.values()] as Note[], settings });
    say(r.ok ? `Imported ${preview.newSessions.length} new session(s). Nothing was deleted.` : r.message);
    if (r.ok) { setIncoming(null); setPreview(null); if (file.current) file.current.value = ''; }
  };
  const doReplace = async () => {
    if (!incoming) return;
    if (!window.confirm('Replace ALL current data with this backup? A backup of your current data downloads first.')) return;
    backupNow('before-replace');
    const r = await app.replaceEverything({ sessions: incoming.sessions, notes: incoming.notes, settings: incoming.settings });
    say(r.ok ? 'Backup restored.' : r.message);
    if (r.ok) { setIncoming(null); setPreview(null); }
  };
  const doReset = async () => {
    backupNow('before-reset');
    const r = await app.replaceEverything({ sessions: [], notes: [], settings: { ...DEFAULT_SETTINGS } });
    setConfirmText('');
    say(r.ok ? 'All data erased. A backup was downloaded first.' : r.message);
  };

  return (
    <>
      <PageTitle title="Settings & data" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><H>Practice</H>
          <div className="space-y-3">
            <Field label="Weekly target (1–30 sessions; new + revisions)"><input type="number" min={1} max={30} className={inputCls} value={target} onChange={(e) => setTarget(e.target.value)} /></Field>
            <fieldset><legend className="mb-1 text-xs font-medium text-slate-400">Preferred study days</legend><div className="flex flex-wrap gap-2">{DAYS.map((n, i) => <label key={n} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={settings.studyDays.includes(i)} onChange={() => toggleDay(i)} />{n}</label>)}</div></fieldset>
            <Field label="Revision intervals (days)"><input className={inputCls} value={intervals} onChange={(e) => setIntervals(e.target.value)} /></Field>
            <Field label="Week starts on"><select className={inputCls} value={settings.weekStartsOn} onChange={(e) => putSettings({ ...settings, weekStartsOn: Number(e.target.value) as 0 | 1 })}><option value={1}>Monday</option><option value={0}>Sunday</option></select></Field>
            <Field label="Language"><input className={inputCls} value="C++" disabled /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.freeMode} onChange={(e) => putSettings({ ...settings, freeMode: e.target.checked })} />Flexible practice: open all batches</label>
            <p className="text-xs text-slate-500">Changing intervals recomputes the whole revision schedule from your session history.</p>
          </div></Card>
        <Card><H>LeetCode profile link</H>
          <Field label="Username (optional)"><input className={inputCls} value={user} onChange={(e) => setUser(e.target.value)} placeholder="your-username" /></Field>
          <p className="mt-2 text-xs text-slate-500">Only used to build a link. DSA Quest never asks for your password and cannot read your LeetCode data; tracking is manual.</p>
          {settings.leetcodeUsername && <a className="mt-2 inline-flex items-center gap-1 text-sm text-brand-400 underline" target="_blank" rel="noopener noreferrer" href={`https://leetcode.com/u/${encodeURIComponent(settings.leetcodeUsername)}/`}>Open profile <ExternalLink size={12} /></a>}
          <div className="mt-4">{err && <p role="alert" className="mb-2 text-sm text-red-400">{err}</p>}<Btn variant="primary" onClick={save}>Save settings</Btn></div>
          <p className="mt-4 text-xs text-slate-500">Theme: dark only in this version.</p></Card>
        <Card className="lg:col-span-2"><H>Your data</H>
          <p className="mb-3 text-sm text-slate-300">Everything is stored in <b>this browser</b> (IndexedDB). Clearing site data, using another browser or device, or private windows will not carry it over. Export regularly. No sync exists, and nothing is sent anywhere.</p>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => { download(`dsa-quest-backup-${stamp()}.json`, JSON.stringify(app.snapshot(), null, 2), 'application/json'); say('Backup downloaded.'); }}><Download size={14} />Export JSON backup</Btn>
            <Btn onClick={() => { download(`dsa-quest-history-${stamp()}.csv`, sessionsToCsv(sessions, (id) => problemById.get(id)?.title ?? id), 'text/csv'); say('CSV downloaded.'); }}><Download size={14} />Export activity CSV</Btn>
            <Btn onClick={() => file.current?.click()}><Upload size={14} />Import backup…</Btn>
            <input ref={file} type="file" accept="application/json,.json" className="hidden" aria-label="Choose backup file" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
          {importErr && <div role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"><p className="font-medium">Import rejected. Nothing was changed.</p><ul className="list-disc pl-5">{importErr.map((e) => <li key={e}>{e}</li>)}</ul></div>}
          {incoming && preview && (
            <div className="mt-3 rounded-lg border border-ink-600 p-3 text-sm">
              <p className="font-medium text-white">Preview (file exported {incoming.exportedAt ? new Date(incoming.exportedAt).toLocaleString() : 'unknown'})</p>
              <ul className="mt-1 list-disc pl-5 text-slate-300"><li>{preview.newSessions.length} new session(s) would be added</li><li>{preview.identical} already here (skipped)</li><li>{preview.conflicts.length} conflict(s): same id, different content</li><li>{preview.rejected.length} rejected (would double-count a solved problem)</li><li>File has {incoming.sessions.length} sessions and {incoming.notes.length} notes in total</li></ul>
              <div className="mt-3 flex flex-wrap gap-2"><Btn variant="primary" onClick={() => doMerge('keep-existing')}>Merge, keep mine on conflict</Btn>{preview.conflicts.length > 0 && <Btn onClick={() => doMerge('use-incoming')}>Merge, use imported on conflict</Btn>}<Btn variant="danger" onClick={doReplace}>Replace everything</Btn><Btn variant="ghost" onClick={() => { setIncoming(null); setPreview(null); }}>Cancel</Btn></div>
              <p className="mt-2 text-xs text-slate-500">A backup of your current data downloads automatically before anything is changed.</p>
            </div>)}
        </Card>
        <Card className="lg:col-span-2 border-red-500/30"><H>Reset</H>
          <p className="text-sm text-slate-300">Erase all sessions, notes and settings from this browser. A backup downloads first. Type <b>RESET</b> to enable.</p>
          <div className="mt-2 flex gap-2"><input aria-label="Type RESET to confirm" className={`${inputCls} max-w-[10rem]`} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} /><Btn variant="danger" disabled={confirmText !== 'RESET'} onClick={doReset}>Erase everything</Btn></div></Card>
      </div>
    </>
  );
}
