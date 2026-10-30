import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { StudySession, TimerStatus } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

/**
 * Safely parse a timestamp into milliseconds since epoch in UTC.
 * Prevents timezone offset bugs (such as IST +05:30 jumping to 05:30:00 on start).
 */
export const parseUtcTimestamp = (val: string | Date | number | null | undefined): number => {
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  if (val instanceof Date) return val.getTime();
  const str = String(val).trim();
  // If string has no timezone offset (+HH:MM, -HH:MM, or Z), treat as UTC by appending 'Z'
  if (!str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
    return new Date(`${str}Z`).getTime();
  }
  return new Date(str).getTime();
};

interface TimerContextType {
  isActive: boolean;
  activeSession: StudySession | null;
  elapsedSeconds: number;
  todayTotalSeconds: number;
  todayTotalFormatted: string;
  dailyGoalMinutes: number;
  goalProgressPercentage: number;
  startTimer: (subject?: string) => Promise<void>;
  stopTimer: (reason?: string, notes?: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [todayTotalSeconds, setTodayTotalSeconds] = useState<number>(0);
  const [todayTotalFormatted, setTodayTotalFormatted] = useState<string>('0m');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(120);
  const [goalProgressPercentage, setGoalProgressPercentage] = useState<number>(0);

  const heartbeatIntervalRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const activeSessionRef = useRef<StudySession | null>(null);

  activeSessionRef.current = activeSession;

  const refreshStatus = async () => {
    if (!user) return;
    try {
      const status: TimerStatus = await api.getTimerStatus();
      setIsActive(status.is_active);
      setActiveSession(status.current_session);
      setTodayTotalSeconds(status.today_total_seconds);
      setTodayTotalFormatted(status.today_total_formatted);
      setDailyGoalMinutes(status.daily_goal_minutes);
      setGoalProgressPercentage(status.goal_progress_percentage);

      if (status.is_active && status.current_session) {
        const start = parseUtcTimestamp(status.current_session.start_time);
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diff);
      } else {
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.log('[TimerContext] Failed to fetch timer status:', err);
    }
  };

  // Initial fetch when user logs in
  useEffect(() => {
    if (user) {
      refreshStatus();
    } else {
      setIsActive(false);
      setActiveSession(null);
      setElapsedSeconds(0);
    }
  }, [user]);

  // Tick elapsed seconds every 1s while active
  useEffect(() => {
    if (isActive && activeSession) {
      tickIntervalRef.current = window.setInterval(() => {
        const start = parseUtcTimestamp(activeSession.start_time);
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        setElapsedSeconds(diff);
      }, 1000);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isActive, activeSession]);

  // Heartbeat every 20s while active
  useEffect(() => {
    if (isActive && activeSession) {
      heartbeatIntervalRef.current = window.setInterval(async () => {
        if (activeSessionRef.current) {
          try {
            await api.sendHeartbeat(activeSessionRef.current.id);
          } catch (e) {
            console.log('[TimerContext] Heartbeat failed:', e);
          }
        }
      }, 20000);
    } else {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [isActive, activeSession]);

  // Handle visibility change and page unload (Auto-stop on background/tab switch)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && activeSessionRef.current) {
        console.log('[TimerContext] App backgrounded or tab hidden -> Auto-stopping session');
        try {
          await api.stopTimer('BACKGROUND_SUSPEND', 'Auto-stopped due to backgrounding/tab switch');
          setIsActive(false);
          setActiveSession(null);
          refreshStatus();
        } catch (err) {
          console.log('[TimerContext] Failed to stop on background:', err);
        }
      } else if (document.visibilityState === 'visible' && user) {
        // App brought back to foreground -> check state & reconcile
        refreshStatus();
      }
    };

    const handleBeforeUnload = () => {
      if (activeSessionRef.current) {
        const token = localStorage.getItem('token');
        if (token && navigator.sendBeacon) {
          const blob = new Blob(
            [JSON.stringify({ reason: 'PAGE_UNLOAD', notes: 'Browser closed or reloaded' })],
            { type: 'application/json' }
          );
          navigator.sendBeacon('/api/timer/stop', blob);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const startTimer = async (subject: string = 'General Study') => {
    const session = await api.startTimer(subject);
    setActiveSession(session);
    setIsActive(true);
    setElapsedSeconds(0);
    await refreshStatus();
  };

  const stopTimer = async (reason: string = 'MANUAL_STOP', notes?: string) => {
    if (!activeSession) return;
    await api.stopTimer(reason, notes);
    setIsActive(false);
    setActiveSession(null);
    setElapsedSeconds(0);
    await refreshStatus();
  };

  return (
    <TimerContext.Provider
      value={{
        isActive,
        activeSession,
        elapsedSeconds,
        todayTotalSeconds,
        todayTotalFormatted,
        dailyGoalMinutes,
        goalProgressPercentage,
        startTimer,
        stopTimer,
        refreshStatus,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
