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
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-2xl font-black text-white shadow-xl shadow-indigo-500/30">
            {user?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{user?.full_name}</h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" />
                VERIFIED STUDENT
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-indigo-400 font-semibold">
                ID: {user?.student_id}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                {user?.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white">Academic Details & Preferences</h3>
          <p className="text-xs text-slate-400">
            Update your academic profile and study goals. Your Unique Student ID remains permanently protected.
          </p>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs ${
              message.type === 'success'
                ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
                : 'border border-rose-500/30 bg-rose-950/40 text-rose-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Student ID (Immutable) */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Unique Student ID (Immutable)
              </label>
              <input
                type="text"
                disabled
                value={user?.student_id || ''}
                className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 font-mono text-sm text-slate-400 focus:outline-none"
              />
            </div>

            {/* Email (Immutable) */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                Registered Email Address
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-400 focus:outline-none"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Department */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Department / Major</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Semester */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Semester / Academic Year</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Daily Study Goal */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-medium text-slate-300">
                <span>Daily Study Goal: {dailyGoalMinutes} minutes</span>
                <span className="text-[10px] text-slate-500">{(dailyGoalMinutes / 60).toFixed(1)} hrs/day</span>
              </label>
              <input
                type="range"
                min="30"
                max="480"
                step="15"
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
