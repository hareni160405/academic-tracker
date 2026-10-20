import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { api } from '../services/api';
import { Task, CalendarEvent, StudySuggestion, StudyAnalytics } from '../types';
import {
  Play,
  Square,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  ListTodo
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { isActive, activeSession, elapsedSeconds, todayTotalFormatted, startTimer, stopTimer } = useTimer();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [suggestions, setSuggestions] = useState<StudySuggestion[]>([]);
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [timerSubject, setTimerSubject] = useState<string>('General Study');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksData, eventsData, suggestionsData, analyticsData] = await Promise.all([
          api.getTasks('all'),
          api.getCalendarEvents(),
          api.getStudySuggestions(),
          api.getStudyAnalytics(),
        ]);
        setTasks(tasksData);
        setEvents(eventsData);
        setSuggestions(suggestionsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.log('[Dashboard] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                {user?.student_id || 'STU-ACTIVE'}
              </span>
              <span className="text-xs text-slate-400">{user?.department}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Welcome back, {user?.full_name}! 👋
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Track your daily study routine, prepare for exams, and build learning consistency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('assessments')}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Practice Quizzes</span>
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Today's Study Time */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Today's Study</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{todayTotalFormatted}</div>
          <div className="mt-1 text-xs text-slate-400">Goal: {user?.daily_goal_minutes || 120} mins</div>
        </div>

        {/* Study Consistency */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Study Consistency</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {analytics?.consistency_percentage || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-400">Past 7 days active</div>
        </div>

        {/* Tasks Progress */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tasks To-Do</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {completedTasks}/{tasks.length}
          </div>
          <div className="mt-1 text-xs text-slate-400">{pendingTasks} tasks pending</div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Academic Events</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">{events.length}</div>
          <div className="mt-1 text-xs text-slate-400">Scheduled on calendar</div>
        </div>
      </div>

      {/* Interactive Study Timer Card & Weekly Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Study Timer Widget */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white">Active Study Timer</h3>
            </div>
            {isActive && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                RECORDING
              </span>
            )}
          </div>

          <div className="my-6 text-center">
            <div className="font-mono text-5xl font-black tracking-tight text-white">
              {formatTimer(isActive ? elapsedSeconds : 0)}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {isActive
                ? `Subject: ${activeSession?.subject || 'General Study'}`
                : "Timer auto-stops if you switch apps or leave the screen"}
            </p>
          </div>

          {!isActive ? (
            <div className="space-y-3">
              <input
                type="text"
                value={timerSubject}
                onChange={(e) => setTimerSubject(e.target.value)}
                placeholder="Subject / Topic (e.g. Data Structures)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => startTimer(timerSubject)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition-transform hover:scale-[1.02]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Study Session</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => stopTimer('MANUAL_STOP')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-transform hover:scale-[1.02]"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Stop & Save Session</span>
            </button>
          )}

          <div className="mt-4 border-t border-slate-800 pt-3 text-center">
            <button
              onClick={() => setActiveTab('timer')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              View Detailed Study History →
            </button>
          </div>
        </div>

        {/* 7-Day Study Distribution Graph */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white">Weekly Study Distribution</h3>
              <p className="text-xs text-slate-400">Total duration across the past 7 days</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-indigo-400">{analytics?.weekly_total_formatted || '0m'}</div>
              <div className="text-[10px] text-slate-500">Weekly Total</div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="mt-6 flex h-48 items-end justify-between gap-2 px-2">
            {analytics?.weekly_history.map((day, idx) => {
              const maxMinutes = Math.max(120, ...analytics.weekly_history.map(d => d.duration_minutes));
              const heightPct = Math.min(100, (day.duration_minutes / maxMinutes) * 100);
              const isToday = idx === analytics.weekly_history.length - 1;

              return (
                <div key={day.date_str} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-[10px] font-mono text-slate-400">{day.duration_minutes}m</div>
                  <div className="relative flex h-32 w-full max-w-[36px] items-end justify-center rounded-lg bg-slate-950 p-1">
                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={`w-full rounded-md transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-md shadow-indigo-500/30'
                          : 'bg-indigo-600/50 hover:bg-indigo-500'
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
                    {day.day_name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Study Recommendations & Weak-Topic Quick Access */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Recommendations */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white">AI Study Suggestions</h3>
          </div>

          <div className="mt-4 space-y-3">
            {suggestions.map((sug, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-slate-700"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{sug.title}</span>
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                      {sug.subject}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{sug.suggested_action}</p>
                </div>
                <button
                  onClick={() => {
                    if (sug.action_type === 'REVISE_TOPIC' || sug.action_type === 'TAKE_QUIZ') {
                      setActiveTab('assessments');
                    } else if (sug.action_type === 'COMPLETE_TASK') {
                      setActiveTab('tasks');
                    } else {
                      setActiveTab('timer');
                    }
                  }}
                  className="rounded-lg bg-indigo-600/20 p-2 text-indigo-400 hover:bg-indigo-600 hover:text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events & Tasks Brief */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              <h3 className="font-bold text-white">Upcoming Events</h3>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Open Calendar →
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingEvents.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No upcoming events. Click "Open Calendar" to schedule exams and study deadlines!
              </p>
            ) : (
              upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{evt.title}</div>
                    <div className="text-[11px] text-slate-400">
                      {evt.event_date} {evt.event_time ? `at ${evt.event_time}` : ''}
                    </div>
                  </div>
                  <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                    {evt.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
