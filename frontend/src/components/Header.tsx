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
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            {getPageTitle(activeTab)}
          </h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            Student Academic Performance Tracking System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Active Timer Pill */}
        {isActive && activeSession && (
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-300 shadow-sm shadow-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="hidden font-medium sm:inline">{activeSession.subject}:</span>
            <span className="font-mono font-bold tracking-wider">{formatTimer(elapsedSeconds)}</span>
            <button
              onClick={() => stopTimer('MANUAL_STOP')}
              className="ml-1 rounded p-0.5 text-emerald-400 hover:bg-emerald-800/40 hover:text-white"
              title="Stop Study Session"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          </div>
        )}

        {/* Install Android PWA Button */}
        <button
          onClick={onOpenInstallModal}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/50 px-2.5 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-900/50 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Install PWA</span>
          <span className="sm:hidden">App</span>
        </button>

        {/* Student Avatar & ID */}
        {user && (
          <div className="flex items-center gap-2 pl-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-xs font-bold text-white shadow-md">
              {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-medium text-slate-200">{user.full_name}</div>
              <div className="font-mono text-[10px] text-slate-400">{user.student_id}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
