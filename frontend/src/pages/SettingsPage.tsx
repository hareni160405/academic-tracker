import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  Globe,
  Bell,
  Lock,
  LogOut,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface SettingsPageProps {
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  const { user, updateProfile } = useAuth();

  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [passingThreshold, setPassingThreshold] = useState(user?.passing_threshold || 60);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(user?.daily_goal_minutes || 120);

  // Password change form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Profile preferences message
  const [prefMsg, setPrefMsg] = useState<string | null>(null);
  const [prefLoading, setPrefLoading] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrefLoading(true);
    setPrefMsg(null);
    try {
      await updateProfile({
        timezone,
        passing_threshold: Number(passingThreshold),
        daily_goal_minutes: Number(dailyGoalMinutes),
      });
      setPrefMsg('Preferences updated successfully!');
    } catch (err: any) {
      setPrefMsg(`Error: ${err.message || err}`);
    } finally {
      setPrefLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setPwdLoading(true);
    setPwdMsg(null);

    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwdMsg({ text: 'Password successfully changed!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Failed to update password', type: 'error' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleConfirmLogout = () => {
    if (window.confirm('Are you sure you want to log out of your Academic Tracker account?')) {
      onLogout();
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl">
          Settings & Account Configurations
        </h2>
        <p className="text-xs text-slate-500">
          Configure academic thresholds, local timezones for morning reminders, and account security.
        </p>
      </div>

      {/* Preferences Form */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <Sliders className="h-5 w-5" />
            <h3 className="text-sm font-bold text-slate-800">Academic Preferences</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Customize timer accumulation and assessment remediation thresholds.
          </p>
        </div>

        {prefMsg && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
            {prefMsg}
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Timezone */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Globe className="h-4 w-4 text-emerald-600" />
                Local Timezone (Used for 8:00 AM reminders & midnight timer reset)
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbfdfc] px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="America/New_York">America/New_York (EST - UTC-05:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST - UTC-08:00)</option>
                <option value="Europe/London">Europe/London (GMT/BST - UTC+00:00)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST - UTC+10:00)</option>
                <option value="UTC">Universal Coordinated Time (UTC)</option>
              </select>
            </div>

            {/* Daily Study Goal */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Daily Target Study Time</span>
                <span className="font-mono text-emerald-700 font-bold">{dailyGoalMinutes} mins ({(dailyGoalMinutes / 60).toFixed(1)} hrs)</span>
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

            {/* Assessment Passing Threshold */}
            <div className="md:col-span-2">
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Assessment Passing & Weak-Topic Threshold</span>
                <span className="font-mono text-emerald-700 font-bold">{passingThreshold}%</span>
              </label>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={passingThreshold}
                onChange={(e) => setPassingThreshold(Number(e.target.value))}
                className="mt-2 w-full accent-emerald-600"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Scores below this threshold automatically trigger weak-topic tagging and 3-step AI revision suggestions.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={prefLoading}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
            >
              {prefLoading ? 'Saving...' : 'Save Academic Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Change */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <Lock className="h-5 w-5" />
            <h3 className="text-sm font-bold text-slate-800">Security & Password</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Keep your account secure with an updated password.
          </p>
        </div>

        {pwdMsg && (
          <div
            className={`mt-4 rounded-xl p-3 text-xs font-medium ${
              pwdMsg.type === 'success'
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {pwdMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-[#fbfdfc] px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-[#fbfdfc] px-3 py-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwdLoading}
              className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone / Logout */}
      <div className="rounded-3xl border border-rose-200/80 bg-rose-50/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-900">Log Out of Student Session</h3>
            <p className="mt-1 text-xs text-rose-700">
              Sign out on this device. All your saved tasks, study logs, and quiz results remain securely stored.
            </p>
          </div>
          <button
            onClick={handleConfirmLogout}
            className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-500 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
