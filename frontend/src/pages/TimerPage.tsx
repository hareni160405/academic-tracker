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
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(safeSec / 3600);
    const m = Math.floor((safeSec % 3600) / 60);
    const s = safeSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
        <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          Study Tracker & Automated Stopwatch
        </h2>
        <p className="text-xs text-slate-500">
          Focus tracker with real-time browser lifecycle detection, background auto-pause, and multi-session accumulation.
        </p>
      </div>

      {/* Main Stopwatch Interface */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stopwatch Main Hero */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-emerald-100 bg-white p-8 shadow-xs lg:col-span-2">
          {/* Status Badge */}
          <div className="mb-6">
            {isActive ? (
              <span className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                ACTIVE STUDY SESSION IN PROGRESS
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-600">
                READY TO BEGIN STUDYING
              </span>
            )}
          </div>

          {/* Time Display with Circular Glow Ring */}
          <div className="relative my-4 flex h-64 w-64 items-center justify-center rounded-full border-4 border-emerald-100 bg-gradient-to-br from-[#f2faf5] to-[#f0f7fb] shadow-inner sm:h-72 sm:w-72">
            <div className="flex flex-col items-center">
              <span className="font-mono text-5xl font-black tracking-tight text-slate-900 sm:text-6xl">
                {formatTimer(isActive ? elapsedSeconds : 0)}
              </span>
              <span className="mt-2 text-xs font-semibold text-emerald-700">
                {isActive ? activeSession?.subject : 'Elapsed Time'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 w-full max-w-md space-y-4">
            {!isActive ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    What topic or subject are you studying?
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Operating Systems, Calculus III, Computer Networks"
                    className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStart}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
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
                  className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={handleStop}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-md shadow-rose-600/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Square className="h-5 w-5 fill-current" />
                  <span>Stop & Save Session</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Today's Accumulated Study & Daily Goal Gauge */}
        <div className="flex flex-col justify-between space-y-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-xs lg:col-span-1">
          <div>
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-900">Daily Target Progress</h3>
              <p className="text-xs text-slate-500">Multiple sessions accumulate towards today's goal.</p>
            </div>

            <div className="my-6 space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-[#f6faff] p-4 text-center">
                <div className="text-xs text-slate-500 font-medium">Today's Accumulated Study Time</div>
                <div className="mt-1 text-3xl font-black text-sky-800">{todayTotalFormatted}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Target: {dailyGoalMinutes} mins ({(dailyGoalMinutes / 60).toFixed(1)} hrs)
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Goal Completion</span>
                  <span className="font-bold text-sky-800">{goalProgressPercentage}%</span>
                </div>
                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{ width: `${Math.min(100, goalProgressPercentage)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle & Limitations Information Card */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900">
            <div className="flex items-center gap-2 font-bold text-sky-950">
              <Info className="h-4 w-4 shrink-0 text-sky-600" />
              <span>Smart Study Tracking Rules:</span>
            </div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] text-sky-800 leading-relaxed">
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
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xs lg:col-span-1">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900">7-Day Study Summary</h3>
            <p className="text-xs text-slate-500">Total: {analytics?.weekly_total_formatted || '0m'}</p>
          </div>

          <div className="mt-6 flex h-48 items-end justify-between gap-2 px-1">
            {analytics?.weekly_history.map((day, idx) => {
              const maxMinutes = Math.max(120, ...analytics.weekly_history.map(d => d.duration_minutes));
              const heightPct = Math.min(100, (day.duration_minutes / maxMinutes) * 100);
              const isToday = idx === analytics.weekly_history.length - 1;

              return (
                <div key={day.date_str} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-[10px] font-mono text-slate-500">{day.duration_minutes}m</div>
                  <div className="flex h-32 w-full max-w-[28px] items-end justify-center rounded-lg bg-slate-50 border border-slate-100 p-1">
                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={`w-full rounded-md ${
                        isToday ? 'bg-emerald-500 font-bold' : 'bg-sky-200 hover:bg-sky-300'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] ${isToday ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                    {day.day_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session History Table */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-sky-600" />
              <h3 className="font-bold text-slate-900">Recent Study Sessions</h3>
            </div>
            <span className="text-xs text-slate-500">
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
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Date & Time</th>
                    <th className="pb-3 font-semibold">Duration</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.recent_sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-semibold text-slate-900">{sess.subject}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(sess.start_time).toLocaleDateString()} {new Date(sess.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-mono font-bold text-emerald-800">
                        {Math.floor(sess.duration_seconds / 60)}m {sess.duration_seconds % 60}s
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            sess.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sess.status === 'ACTIVE'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
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
