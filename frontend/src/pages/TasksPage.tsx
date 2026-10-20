import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Task, TaskStats } from '../types';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Tag,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'pending'>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // New task form state
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [category, setCategory] = useState('Computer Science');
  const [dueDate, setDueDate] = useState('');

  const loadTasks = async () => {
    try {
      const [taskList, statsData] = await Promise.all([
        api.getTasks(filter),
        api.getTaskStats(),
      ]);
      setTasks(taskList);
      setStats(statsData);
    } catch (err) {
      console.log('[Tasks] Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        category: category.trim() || 'General',
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setIsAdding(false);
      loadTasks();
    } catch (err) {
      console.log('[Tasks] Create task failed:', err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await api.toggleTask(id);
      loadTasks();
    } catch (err) {
      console.log('[Tasks] Toggle failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (err) {
      console.log('[Tasks] Delete failed:', err);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white md:text-2xl">
            Daily Academic To-Do List
          </h2>
          <p className="text-xs text-slate-400">
            Organize coursework, homework deadlines, project milestones, and exam revision.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-transform hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Completion Statistics Bar */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:grid-cols-4">
          <div className="border-r border-slate-800/80 pr-2">
            <div className="text-[11px] font-medium text-slate-400">Total Tasks</div>
            <div className="text-xl font-bold text-white">{stats.total_tasks}</div>
          </div>
          <div className="border-r border-slate-800/80 pr-2">
            <div className="text-[11px] font-medium text-slate-400">Completed</div>
            <div className="text-xl font-bold text-emerald-400">{stats.completed_tasks}</div>
          </div>
          <div className="border-r border-slate-800/80 pr-2">
            <div className="text-[11px] font-medium text-slate-400">Pending</div>
            <div className="text-xl font-bold text-amber-400">{stats.pending_tasks}</div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-400">Completion Rate</div>
            <div className="text-xl font-bold text-indigo-400">
              {stats.completion_rate_percentage}%
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal / Dropdown Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="rounded-2xl border border-indigo-500/30 bg-slate-900 p-5 shadow-xl transition-all"
        >
          <h3 className="mb-3 text-sm font-bold text-white">Create Academic Task</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-300">Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Complete Operating Systems lab assignment"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-300">Description (Optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief notes, problem set numbers, or reference material..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority (Urgent)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Subject / Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Mathematics, Operating Systems"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-300">Due Date & Time</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-500"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {(['all', 'today', 'upcoming', 'pending', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
              filter === f
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            {f === 'all' ? 'All Tasks' : f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
            <CheckCircle2 className="mx-auto h-8 w-8 text-slate-600" />
            <p className="mt-2 text-sm font-medium">No tasks found in this view.</p>
            <p className="text-xs text-slate-500">Add a new task above to start tracking your daily progress!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start justify-between gap-3 rounded-xl border p-4 transition-all ${
                task.is_completed
                  ? 'border-slate-800/60 bg-slate-950/40 opacity-70'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(task.id)}
                  className="mt-0.5 text-slate-400 hover:text-indigo-400"
                >
                  {task.is_completed ? (
                    <CheckSquare className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      task.is_completed ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="mt-0.5 text-xs text-slate-400">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className={`rounded px-2 py-0.5 font-bold ${getPriorityBadge(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                      <Tag className="h-3 w-3" />
                      {task.category}
                    </span>
                    {task.due_date && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="h-3 w-3 text-slate-500" />
                        Due: {new Date(task.due_date).toLocaleDateString()} {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="rounded p-1.5 text-slate-500 hover:bg-rose-950/40 hover:text-rose-400"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
