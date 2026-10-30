import React from 'react';
import {
  LayoutDashboard,
  UserCircle,
  CheckSquare,
  Clock,
  Sparkles,
  Calendar,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  X,
  BookOpen
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
    { id: 'tasks', label: 'To-Do List', icon: CheckSquare },
    { id: 'timer', label: 'Study Tracker', icon: Clock },
    { id: 'assistant', label: 'AI Study Assistant', icon: Sparkles },
    { id: 'calendar', label: 'Calendar & Reminders', icon: Calendar },
    { id: 'assessments', label: 'Assessments', icon: GraduationCap },
    { id: 'reports', label: 'Performance Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden h-full w-64 flex-col justify-between border-r border-emerald-100/90 bg-white/85 p-4 backdrop-blur-md md:flex">
        <div className="space-y-6">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 text-white shadow-md shadow-emerald-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-slate-900">Academic Tracker</div>
              <div className="text-[11px] font-semibold text-emerald-700">Student Portal</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-100/80 to-sky-100/80 text-emerald-900 border border-emerald-200/80 shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-emerald-50/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="border-t border-slate-200/80 pt-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Out Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-Out Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-emerald-100 bg-[#f7fcf9] p-5 shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Academic Tracker</div>
                <div className="text-[11px] font-semibold text-emerald-700">Mobile Edition</div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-100/90 to-sky-100/90 text-emerald-900 border border-emerald-200 font-semibold'
                      : 'text-slate-600 hover:bg-emerald-50/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200/80 pt-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Quick Access on Android phones) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-emerald-100/90 bg-white/95 px-2 backdrop-blur-lg md:hidden">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'timer', label: 'Study', icon: Clock },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'assistant', label: 'AI Tutor', icon: Sparkles },
          { id: 'assessments', label: 'Quiz', icon: GraduationCap },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-lg px-3 py-1 text-[11px] font-medium transition-colors ${
                isActive ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
