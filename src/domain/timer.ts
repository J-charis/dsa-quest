/** Timestamp-based stopwatch. Elapsed time is derived from clock readings, never from tick counts. */
export interface TimerState {
  status: 'idle' | 'running' | 'paused';
  problemId: string | null;
  accumulatedMs: number; // active time banked from finished running segments
  segmentStart: number | null; // ms epoch of the current running segment
}
export const idleTimer = (): TimerState => ({ status: 'idle', problemId: null, accumulatedMs: 0, segmentStart: null });

export function startTimer(problemId: string, now: number): TimerState {
  return { status: 'running', problemId, accumulatedMs: 0, segmentStart: now };
}
export function pauseTimer(s: TimerState, now: number): TimerState {
  if (s.status !== 'running' || s.segmentStart === null) return s;
  return { ...s, status: 'paused', accumulatedMs: s.accumulatedMs + Math.max(0, now - s.segmentStart), segmentStart: null };
}
export function resumeTimer(s: TimerState, now: number): TimerState {
  if (s.status !== 'paused') return s;
  return { ...s, status: 'running', segmentStart: now };
}
export function elapsedMs(s: TimerState, now: number): number {
  if (s.status === 'running' && s.segmentStart !== null) return s.accumulatedMs + Math.max(0, now - s.segmentStart);
  return s.accumulatedMs;
}
/** Stop = freeze active time. Returns whole seconds to prefill the (editable) save form. */
export function stopTimer(s: TimerState, now: number): { state: TimerState; durationSec: number } {
  const ms = elapsedMs(s, now);
  return { state: { ...s, status: 'paused', accumulatedMs: ms, segmentStart: null }, durationSec: Math.round(ms / 1000) };
}
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}
