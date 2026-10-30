import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CalendarEvent } from '../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Bell,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  // New event form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('09:00');
  const [category, setCategory] = useState<'EXAM' | 'ASSIGNMENT' | 'PROJECT' | 'REVISION' | 'COLLEGE' | 'STUDY'>('EXAM');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderNote, setReminderNote] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      const data = await api.getCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.log('[Calendar] Error loading events:', err);
    }
  };

  useEffect(() => {
    loadEvents();

    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setPushSupported(true);
      if (Notification.permission === 'granted') {
        setPushSubscribed(true);
      }
    }
  }, []);

  // Past 8:00 AM warning calculation
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (eventDate === todayStr) {
      const now = new Date();
      if (now.getHours() >= 8) {
        setReminderNote('Note: 8:00 AM has already passed today. An immediate alert will be dispatched instead.');
      } else {
        setReminderNote('Default morning reminder is scheduled for 8:00 AM today.');
      }
    } else {
      setReminderNote('Default morning reminder is scheduled for 8:00 AM on the day of the event.');
    }
  }, [eventDate]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    try {
      await api.createCalendarEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        event_time: eventTime ? `${eventTime}:00` : undefined,
        category,
        reminder_enabled: reminderEnabled,
      });

      setTitle('');
      setDescription('');
      setIsAdding(false);
      loadEvents();
    } catch (err) {
      console.log('[Calendar] Create event error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.deleteCalendarEvent(id);
      loadEvents();
    } catch (err) {
      console.log('[Calendar] Delete error:', err);
    }
  };

  const enablePushNotifications = async () => {
    if (!pushSupported) {
      setPushStatusMessage('Web Push is not supported in this browser environment.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatusMessage('Notification permission denied by user.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidData = await api.getVapidKey();
      
      let sub = await reg.pushManager.getSubscription();
      if (!sub && vapidData.vapid_public_key) {
        const convertedKey = urlBase64ToUint8Array(vapidData.vapid_public_key);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      if (sub) {
        await api.savePushSubscription(sub);
      }

      setPushSubscribed(true);
      setPushStatusMessage('Smart 8:00 AM morning push notifications enabled successfully!');
    } catch (err: any) {
      setPushStatusMessage(`Failed to enable push: ${err.message || err}`);
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Days in month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Academic Calendar & Smart Reminders
          </h2>
          <p className="text-xs text-slate-500">
            Schedule exams, assignment deadlines, and study blocks with automated 8:00 AM morning push alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pushSupported && (
            <button
              onClick={enablePushNotifications}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                pushSubscribed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xs'
                  : 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 shadow-xs'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>{pushSubscribed ? '8:00 AM Alerts Active' : 'Enable 8:00 AM Push'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {pushStatusMessage && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 font-medium">
          {pushStatusMessage}
        </div>
      )}

      {/* Add Event Form Modal */}
      {isAdding && (
        <form
          onSubmit={handleCreateEvent}
          className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-lg"
        >
          <h3 className="mb-3 text-sm font-bold text-slate-900">Schedule New Academic Event</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Midterm Examination in Distributed Systems"
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="EXAM">Examination</option>
                <option value="ASSIGNMENT">Assignment Due</option>
                <option value="PROJECT">Project Submission</option>
                <option value="REVISION">Revision Schedule</option>
                <option value="COLLEGE">College Event</option>
                <option value="STUDY">Study Block</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Event Date *</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Event Time</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="reminderCheck"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="accent-emerald-600"
              />
              <label htmlFor="reminderCheck" className="text-xs font-medium text-slate-700">
                Schedule morning 8:00 AM reminder
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Classroom venue, syllabus coverage, or required materials..."
                className="w-full rounded-xl border border-slate-200 bg-[#f7faf8] px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {reminderNote && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 font-medium">
              {reminderNote}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700"
            >
              Save Event
            </button>
          </div>
        </form>
      )}

      {/* Calendar Grid & Event List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Month View Grid */}
        <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-xs lg:col-span-2">
          {/* Month Header Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 rounded-xl bg-slate-50/50" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.event_date === dateStr);
              const isToday =
                new Date().getDate() === dayNum &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={dayNum}
                  className={`flex h-16 flex-col justify-between rounded-xl border p-1.5 transition-colors ${
                    isToday
                      ? 'border-emerald-400 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-100 bg-[#f9fbf9] hover:border-emerald-200'
                  }`}
                >
                  <span
                    className={`text-xs ${
                      isToday ? 'text-emerald-900 font-black' : 'text-slate-700 font-semibold'
                    }`}
                  >
                    {dayNum}
                  </span>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((e) => (
                      <div
                        key={e.id}
                        className="truncate rounded bg-sky-100 px-1 text-[9px] font-semibold text-sky-900"
                        title={e.title}
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] font-medium text-slate-500">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events Agenda */}
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-xs lg:col-span-1">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900">Event Agenda</h3>
            <p className="text-xs text-slate-500">All registered upcoming deadlines</p>
          </div>

          <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No events scheduled. Use "Schedule Event" to track exams and submissions!
              </p>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-slate-100 bg-[#f7faff] p-4 transition-colors hover:border-sky-200 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                      {evt.description && (
                        <p className="mt-1 text-[11px] text-slate-600">{evt.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(evt.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {evt.event_date} {evt.event_time ? `at ${evt.event_time}` : ''}
                    </span>
                    <span className="rounded bg-sky-100 border border-sky-200 px-2 py-0.5 font-bold text-sky-800">
                      {evt.category}
                    </span>
                  </div>

                  {evt.reminder_enabled && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                      <Bell className="h-3 w-3" />
                      <span>8:00 AM Morning Push Scheduled</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
