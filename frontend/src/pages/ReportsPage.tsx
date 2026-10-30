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
        <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          Academic Performance Reports & Learning Analytics
        </h2>
        <p className="text-xs text-slate-500">
          Comprehensive synthesis of study durations, task completion consistency, quiz averages, and topic mastery.
        </p>
      </div>

      {/* AI Performance Insights Card */}
      {report?.ai_insights && (
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-sky-50/80 to-teal-50 p-6 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold">Intelligent Performance Diagnostics</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-700 md:text-sm">
            {report.ai_insights}
          </p>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Study */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Study Time</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {report?.total_study_formatted || '0m'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Past 7 days: {report?.weekly_study_formatted || '0m'}
          </div>
        </div>

        {/* Study Consistency */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Study Consistency</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {report?.study_consistency_score || 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Days active per week</div>
        </div>

        {/* Average Quiz Score */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Average Quiz Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {report?.average_assessment_percentage || 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Peak score: {report?.highest_assessment_percentage || 0}%
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Task Completion</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-800">
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
        <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              <h3 className="font-bold text-slate-900">Weak Topics Requiring Revision</h3>
            </div>
            <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
              {report?.weak_topics.length || 0} Flagged
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {!report?.weak_topics || report.weak_topics.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 font-bold text-emerald-700">No weak topics detected!</p>
                <p className="mt-0.5 text-slate-500">All recent assessment scores exceed the passing threshold.</p>
              </div>
            ) : (
              report.weak_topics.map((wt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl border border-rose-100 bg-[#fff9f9] p-4 shadow-xs"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{wt.topic}</div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Scored: <span className="font-bold text-rose-600">{wt.percentage}%</span> on{' '}
                      {new Date(wt.date_flagged).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('assessments')}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:from-emerald-700 hover:to-teal-700"
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
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900">Subject Mastery Breakdown</h3>
            <p className="text-xs text-slate-500">Average assessment scores by academic course</p>
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
                    <span className="font-semibold text-slate-900">{sp.subject}</span>
                    <span className="font-mono font-bold text-sky-800">{sp.average_score}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${Math.min(100, sp.average_score)}%` }}
                      className={`h-full rounded-full ${
                        sp.average_score >= 80
                          ? 'bg-emerald-500'
                          : sp.average_score >= 60
                          ? 'bg-sky-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{sp.assessments_count} assessments taken</span>
                    <span className="uppercase font-bold text-slate-500">{sp.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assessment Attempt Progression History */}
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-900">Assessment Attempt History & Progression</h3>
          <p className="text-xs text-slate-500">Timeline of student test attempts</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          {!report?.recent_attempts || report.recent_attempts.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No attempts logged yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 font-semibold">Assessment Title</th>
                  <th className="pb-3 font-semibold">Subject / Topic</th>
                  <th className="pb-3 font-semibold">Score</th>
                  <th className="pb-3 font-semibold">Percentage</th>
                  <th className="pb-3 font-semibold">Result</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.recent_attempts.map((att) => (
                  <tr key={att.attempt_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">{att.title}</td>
                    <td className="py-3 text-slate-500">{att.subject_topic}</td>
                    <td className="py-3 font-mono text-slate-700">
                      {att.score_obtained} / {att.total_possible}
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-800">{att.percentage}%</td>
                    <td className="py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          att.is_passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {att.is_passed ? 'PASSED' : 'REVISION'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
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
