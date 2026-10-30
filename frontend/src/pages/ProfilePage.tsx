import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Mail, Calendar, BookOpen, Clock, Target, CheckCircle2, Lock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [semester, setSemester] = useState(user?.semester || '');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.daily_goal_minutes || 120);
  const [passingThreshold, setPassingThreshold] = useState(user?.passing_threshold || 60);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        department,
        semester,
        daily_goal_minutes: Number(dailyGoalMinutes),
        passing_threshold: Number(passingThreshold),
      });
      setMessage({ text: 'Student profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20 md:pb-6">
      {/* Student Identity Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-sky-50/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-sky-500 text-2xl font-black text-white shadow-lg shadow-emerald-500/20">
            {user?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-800">{user?.full_name}</h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                VERIFIED STUDENT
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-mono text-emerald-700 font-bold">
                ID: {user?.student_id}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {user?.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">Academic Details & Preferences</h3>
          <p className="text-xs text-slate-500">
            Update your academic profile and study goals. Your Unique Student ID remains permanently protected.
          </p>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-medium ${
              message.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Student ID (Immutable) */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Unique Student ID (Immutable)
              </label>
              <input
                type="text"
                disabled
                value={user?.student_id || ''}
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-sm text-slate-500 focus:outline-none"
              />
            </div>

            {/* Email (Immutable) */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Registered Email Address
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 focus:outline-none"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbfdfc] px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Department */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Department / Major</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbfdfc] px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Semester */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Semester / Academic Year</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbfdfc] px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Daily Study Goal */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Daily Study Goal: <strong className="text-emerald-700">{dailyGoalMinutes} minutes</strong></span>
                <span className="text-[10px] text-slate-500 font-normal">{(dailyGoalMinutes / 60).toFixed(1)} hrs/day</span>
              </label>
              <input
                type="range"
                min="30"
                max="480"
                step="15"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="mt-2 w-full accent-emerald-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
