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
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(safeSec / 3600);
    const m = Math.floor((safeSec % 3600) / 60);
    const s = safeSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const completedTasks = tasks.filter(t => t.is_completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const upcomingEvents = events.slice(0, 3);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-100/90 via-sky-100/80 to-teal-50 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                {user?.student_id || 'STU-ACTIVE'}
              </span>
              <span className="text-xs font-semibold text-slate-700">{user?.department}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Welcome back, {user?.full_name}! 👋
            </h2>
            <p className="mt-1 text-sm text-slate-700">
              Track your daily study routine, prepare for exams, and build learning consistency.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('assessments')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Practice Quizzes</span>
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white/90 px-4 py-2.5 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-50 shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Today's Study Time */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Today's Study</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{todayTotalFormatted}</div>
          <div className="mt-1 text-xs text-slate-500">Goal: {user?.daily_goal_minutes || 120} mins</div>
        </div>

        {/* Study Consistency */}
        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Study Consistency</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {analytics?.consistency_percentage || 0}%
          </div>
          <div className="mt-1 text-xs text-slate-500">Past 7 days active</div>
        </div>

        {/* Tasks Progress */}
        <div className="rounded-2xl border border-teal-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tasks To-Do</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <ListTodo className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {completedTasks}/{tasks.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">{pendingTasks} tasks pending</div>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Academic Events</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">{events.length}</div>
          <div className="mt-1 text-xs text-slate-500">Scheduled on calendar</div>
        </div>
      </div>

      {/* Interactive Study Timer Card & Weekly Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Study Timer Widget */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Active Study Timer</h3>
            </div>
            {isActive && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                RECORDING
              </span>
            )}
          </div>

          <div className="my-6 text-center">
            <div className="font-mono text-5xl font-black tracking-tight text-slate-900">
              {formatTimer(isActive ? elapsedSeconds : 0)}
            </div>
            <p className="mt-2 text-xs text-slate-500">
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
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={() => startTimer(timerSubject)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-transform hover:scale-[1.02]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Study Session</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => stopTimer('MANUAL_STOP')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-transform hover:scale-[1.02]"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Stop & Save Session</span>
            </button>
          )}

          <div className="mt-4 border-t border-slate-100 pt-3 text-center">
            <button
              onClick={() => setActiveTab('timer')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View Detailed Study History →
            </button>
          </div>
        </div>

        {/* 7-Day Study Distribution Graph */}
        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900">Weekly Study Distribution</h3>
              <p className="text-xs text-slate-500">Total duration across the past 7 days</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-sky-700">{analytics?.weekly_total_formatted || '0m'}</div>
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
                  <div className="text-[10px] font-mono text-slate-500">{day.duration_minutes}m</div>
                  <div className="relative flex h-32 w-full max-w-[36px] items-end justify-center rounded-lg bg-slate-50 border border-slate-100 p-1">
                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={`w-full rounded-md transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-emerald-500 to-sky-400 shadow-xs'
                          : 'bg-sky-200 hover:bg-sky-300'
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
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
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900">AI Study Suggestions</h3>
          </div>

          <div className="mt-4 space-y-3">
            {suggestions.map((sug, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 rounded-xl border border-emerald-100/80 bg-[#f8fbf9] p-4 transition-colors hover:border-emerald-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{sug.title}</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {sug.subject}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{sug.suggested_action}</p>
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
                  className="rounded-lg bg-emerald-100 p-2 text-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events & Tasks Brief */}
        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              <h3 className="font-bold text-slate-900">Upcoming Events</h3>
            </div>
            <button
              onClick={() => setActiveTab('calendar')}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800"
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
                  className="flex items-center justify-between rounded-xl border border-sky-100/80 bg-[#f7faff] p-3.5"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{evt.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {evt.event_date} {evt.event_time ? `at ${evt.event_time}` : ''}
                    </div>
                  </div>
                  <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-[10px] font-bold text-sky-800">
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
