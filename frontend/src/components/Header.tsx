import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { Menu, Play, Square, Download, Sparkles, User, Bell } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onOpenMobileMenu: () => void;
  onOpenInstallModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenInstallModal,
}) => {
  const { user } = useAuth();
  const { isActive, activeSession, elapsedSeconds, stopTimer } = useTimer();

  const formatTimer = (sec: number) => {
    const safeSec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(safeSec / 3600);
    const m = Math.floor((safeSec % 3600) / 60);
    const s = safeSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Dashboard';
      case 'profile': return 'My Profile';
      case 'tasks': return 'Daily To-Do List';
      case 'timer': return 'Study Tracker';
      case 'assistant': return 'AI Study Assistant';
      case 'calendar': return 'Calendar & Smart Reminders';
      case 'assessments': return 'Assessments & Quizzes';
      case 'reports': return 'Performance Reports';
      case 'settings': return 'Settings & Account';
      default: return 'Academic Tracker';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-emerald-100/90 bg-white/85 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-600 hover:bg-emerald-50 hover:text-slate-900 md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
            {getPageTitle(activeTab)}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Student Academic Performance Tracking System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Active Timer Pill */}
        {isActive && activeSession && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50/90 px-3 py-1 text-xs text-emerald-800 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="hidden font-medium sm:inline">{activeSession.subject}:</span>
            <span className="font-mono font-bold tracking-wider text-emerald-900">{formatTimer(elapsedSeconds)}</span>
            <button
              onClick={() => stopTimer('MANUAL_STOP')}
              className="ml-1 rounded p-0.5 text-emerald-700 hover:bg-emerald-200/60 hover:text-emerald-950"
              title="Stop Study Session"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          </div>
        )}

        {/* Install Android PWA Button */}
        <button
          onClick={onOpenInstallModal}
          className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800 transition-colors hover:bg-sky-100 hover:text-sky-900"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Install PWA</span>
          <span className="sm:hidden">App</span>
        </button>

        {/* Student Avatar & ID */}
        {user && (
          <div className="flex items-center gap-2 pl-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 text-xs font-bold text-white shadow-sm">
              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-semibold text-slate-800">{user.full_name}</div>
              <div className="font-mono text-[10px] text-emerald-700 font-medium">{user.student_id}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
