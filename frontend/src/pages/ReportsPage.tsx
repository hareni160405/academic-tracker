import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PerformanceReport } from '../types';
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ListTodo,
  BookOpen,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ReportsPageProps {
  setActiveTab: (tab: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ setActiveTab }) => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await api.getPerformanceReport();
        setReport(data);
      } catch (err) {
        console.log('[Reports] Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
          Academic Performance Reports & Learning Analytics
        </h2>
        <p className="text-xs text-slate-400">
          Comprehensive synthesis of study durations, task completion consistency, quiz averages, and topic mastery.
        </p>
      </div>

      {/* AI Performance Insights Card */}
      {report?.ai_insights && (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-6 shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-sm font-bold">Intelligent Performance Diagnostics</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300 md:text-sm">
            {report.ai_insights}
          </p>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Study */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Study Time</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {report?.total_study_formatted || '0m'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Past 7 days: {report?.weekly_study_formatted || '0m'}
          </div>
        </div>

        {/* Study Consistency */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Study Consistency</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {report?.study_consistency_score || 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Days active per week</div>
        </div>

        {/* Average Quiz Score */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Average Quiz Score</span>
            <Award className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">
            {report?.average_assessment_percentage || 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Peak score: {report?.highest_assessment_percentage || 0}%
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Task Completion</span>
            <CheckCircle2 className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-400">
            {report?.task_completion_rate || 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {report?.tasks_completed || 0} of {report?.tasks_total || 0} tasks
          </div>
        </div>
      </div>

      {/* Weak Topics & Subject Performance Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weak Topics Requiring Revision */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              <h3 className="font-bold text-white">Weak Topics Requiring Revision</h3>
            </div>
            <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
              {report?.weak_topics.length || 0} Flagged
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {!report?.weak_topics || report.weak_topics.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 font-semibold text-emerald-400">No weak topics detected!</p>
                <p className="mt-0.5 text-slate-500">All recent assessment scores exceed the passing threshold.</p>
              </div>
            ) : (
              report.weak_topics.map((wt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{wt.topic}</div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Scored: <span className="font-bold text-rose-400">{wt.percentage}%</span> on{' '}
                      {new Date(wt.date_flagged).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('assessments')}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500"
                  >
                    <span>Practice</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subject-Wise Performance Breakdown */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-bold text-white">Subject Mastery Breakdown</h3>
            <p className="text-xs text-slate-400">Average assessment scores by academic course</p>
          </div>

          <div className="mt-4 space-y-4">
            {!report?.subject_performances || report.subject_performances.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                Attempt assessments to populate subject-wise analytics.
              </p>
            ) : (
              report.subject_performances.map((sp, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{sp.subject}</span>
                    <span className="font-mono font-bold text-indigo-400">{sp.average_score}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-950">
                    <div
                      style={{ width: `${Math.min(100, sp.average_score)}%` }}
                      className={`h-full rounded-full ${
                        sp.average_score >= 80
                          ? 'bg-emerald-500'
                          : sp.average_score >= 60
                          ? 'bg-indigo-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{sp.assessments_count} assessments taken</span>
                    <span className="uppercase font-bold text-slate-400">{sp.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assessment Attempt Progression History */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="font-bold text-white">Assessment Attempt History & Progression</h3>
          <p className="text-xs text-slate-400">Timeline of student test attempts</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          {!report?.recent_attempts || report.recent_attempts.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No attempts logged yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Assessment Title</th>
                  <th className="pb-3 font-semibold">Subject / Topic</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Percentage</th>
                  <th className="pb-3 font-semibold">Result</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {report.recent_attempts.map((att) => (
                  <tr key={att.attempt_id} className="hover:bg-slate-800/20">
                    <td className="py-3 font-medium text-white">{att.title}</td>
                    <td className="py-3 text-slate-400">{att.subject_topic}</td>
                    <td className="py-3 font-mono text-slate-300">
                      {att.score_obtained} / {att.total_possible}
                    </td>
                    <td className="py-3 font-mono font-bold text-indigo-400">{att.percentage}%</td>
                    <td className="py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          att.is_passed
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {att.is_passed ? 'PASSED' : 'REVISION'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(att.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
