import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { api } from '../services/api';
import { StudyAnalytics, StudySession } from '../types';
import {
  Play,
  Square,
  Clock,
  TrendingUp,
  History,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  Award,
  Sparkles
} from 'lucide-react';

export const TimerPage: React.FC = () => {
  const { user } = useAuth();
  const {
    isActive,
    activeSession,
    elapsedSeconds,
    todayTotalSeconds,
    todayTotalFormatted,
    dailyGoalMinutes,
    goalProgressPercentage,
    startTimer,
    stopTimer,
    refreshStatus,
  } = useTimer();

  const [subject, setSubject] = useState<string>('Operating Systems');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    try {
      const data = await api.getStudyAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.log('[TimerPage] Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [isActive]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!subject.trim()) return;
    await startTimer(subject.trim());
    fetchAnalytics();
  };

  const handleStop = async () => {
    await stopTimer('MANUAL_STOP', sessionNotes.trim() || undefined);
    setSessionNotes('');
    fetchAnalytics();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
          Study Tracker & Automated Stopwatch
        </h2>
        <p className="text-xs text-slate-400">
          Focus tracker with real-time browser lifecycle detection, background auto-pause, and multi-session accumulation.
        </p>
      </div>

      {/* Main Stopwatch Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stopwatch Main Hero */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl lg:col-span-2">
          {/* Status Badge */}
          <div className="mb-6">
            {isActive ? (
              <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-4 py-1.5 text-xs font-bold text-emerald-400 shadow-lg shadow-emerald-500/10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                ACTIVE STUDY SESSION IN PROGRESS
              </span>
            ) : (
              <span className="rounded-full border border-slate-800 bg-slate-950 px-4 py-1.5 text-xs font-semibold text-slate-400">
                READY TO BEGIN STUDYING
              </span>
            )}
          </div>

          {/* Time Display with Circular Glow Ring */}
          <div className="relative my-4 flex h-64 w-64 items-center justify-center rounded-full border-4 border-slate-800/80 bg-slate-950/60 shadow-inner sm:h-72 sm:w-72">
            <div className="flex flex-col items-center">
              <span className="font-mono text-5xl font-black tracking-tight text-white sm:text-6xl">
                {formatTimer(isActive ? elapsedSeconds : 0)}
              </span>
              <span className="mt-2 text-xs font-medium text-slate-400">
                {isActive ? activeSession?.subject : 'Elapsed Time'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 w-full max-w-md space-y-4">
            {!isActive ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    What topic or subject are you studying?
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Operating Systems, Calculus III, Computer Networks"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStart}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>Start Focused Study</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Optional session notes / topics covered..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleStop}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-rose-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Square className="h-5 w-5 fill-current" />
                  <span>Stop & Save Session</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Today's Accumulated Study & Daily Goal Gauge */}
        <div className="flex flex-col justify-between space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl lg:col-span-1">
          <div>
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white">Daily Target Progress</h3>
              <p className="text-xs text-slate-400">Multiple sessions accumulate towards today's goal.</p>
            </div>

            <div className="my-6 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
                <div className="text-xs text-slate-400">Today's Accumulated Study Time</div>
                <div className="mt-1 text-3xl font-black text-indigo-400">{todayTotalFormatted}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Target: {dailyGoalMinutes} mins ({(dailyGoalMinutes / 60).toFixed(1)} hrs)
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Goal Completion</span>
                  <span className="font-bold text-indigo-400">{goalProgressPercentage}%</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-950">
                  <div
                    style={{ width: `${Math.min(100, goalProgressPercentage)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle & Limitations Information Card */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-4 text-xs text-indigo-200">
            <div className="flex items-center gap-2 font-bold text-indigo-300">
              <Info className="h-4 w-4 shrink-0" />
              <span>Smart Study Tracking Rules:</span>
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] text-indigo-200/90 leading-relaxed">
              <li>
                <strong>Background Auto-Stop:</strong> If you switch tabs, minimize the window, or lock your phone, the session automatically stops to preserve data integrity.
              </li>
              <li>
                <strong>Page Navigation:</strong> Moving between the AI Assistant, To-Do list, and Calendar does <em>not</em> stop the timer.
              </li>
              <li>
                <strong>Crash Reconciliation:</strong> If the browser crashes, the backend reconciles the session to the last verified heartbeat without guessing.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Weekly History Chart & Session Log Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weekly Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl lg:col-span-1">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-bold text-white">7-Day Study Summary</h3>
            <p className="text-xs text-slate-400">Total: {analytics?.weekly_total_formatted || '0m'}</p>
          </div>

          <div className="mt-6 flex h-48 items-end justify-between gap-2 px-1">
            {analytics?.weekly_history.map((day, idx) => {
              const maxMinutes = Math.max(120, ...analytics.weekly_history.map(d => d.duration_minutes));
              const heightPct = Math.min(100, (day.duration_minutes / maxMinutes) * 100);
              const isToday = idx === analytics.weekly_history.length - 1;

              return (
                <div key={day.date_str} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-[10px] font-mono text-slate-400">{day.duration_minutes}m</div>
                  <div className="flex h-32 w-full max-w-[28px] items-end justify-center rounded-lg bg-slate-950 p-1">
                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={`w-full rounded-md ${
                        isToday ? 'bg-indigo-500 font-bold' : 'bg-slate-700'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
                    {day.day_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session History Table */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white">Recent Study Sessions</h3>
            </div>
            <span className="text-xs text-slate-400">
              {analytics?.total_sessions_count || 0} Total Sessions Recorded
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            {!analytics?.recent_sessions || analytics.recent_sessions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No recorded study sessions yet. Click "Start Focused Study" to record your first session!
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Date & Time</th>
                    <th className="pb-3 font-semibold">Duration</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analytics.recent_sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-800/20">
                      <td className="py-3 font-medium text-white">{sess.subject}</td>
                      <td className="py-3 text-slate-400">
                        {new Date(sess.start_time).toLocaleDateString()} {new Date(sess.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-mono font-bold text-indigo-300">
                        {Math.floor(sess.duration_seconds / 60)}m {sess.duration_seconds % 60}s
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            sess.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : sess.status === 'ACTIVE'
                              ? 'bg-indigo-500/15 text-indigo-400 animate-pulse'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {sess.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
