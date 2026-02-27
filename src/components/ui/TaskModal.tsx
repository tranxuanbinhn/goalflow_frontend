import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { tasksAPI, goalsAPI } from '../../services/api';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onTaskCreated?: (taskId: string, isStandalone: boolean) => void;
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  task?: {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    habitId?: string;
    milestoneId?: string;
    status?: string;
  } | null;
  defaultStatus?: string;
  defaultHabitId?: string;
}

interface Option {
  id: string;
  title: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSuccess,
  onTaskCreated,
  showToast,
  task,
  defaultHabitId,
}: TaskModalProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [habitId, setHabitId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [habits, setHabits] = useState<Option[]>([]);
  const [milestones, setMilestones] = useState<Option[]>([]);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
        setHabitId(task.habitId || '');
        setMilestoneId(task.milestoneId || '');
      } else {
        setTitle('');
        setDescription('');
        setDueDate('');
        setHabitId(defaultHabitId || '');
        setMilestoneId('');
      }
      loadOptions();
      setError('');
    }
  }, [isOpen, task]);

  const loadOptions = async () => {
    try {
      const [habitsRes, milestonesRes] = await Promise.all([
        goalsAPI.getHabits(),
        goalsAPI.getMilestones(),
      ]);
      setHabits(habitsRes.data);
      setMilestones(milestonesRes.data);
    } catch (err) {
      console.error('Failed to load options');
    }
  };

  const validateDate = (date: string): boolean => {
    if (!date) return true;
    const selectedDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= currentDate;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    if (newDate && !validateDate(newDate)) {
      setDateError('Ngày không được nhỏ hơn ngày hiện tại');
    } else {
      setDateError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (dueDate && !validateDate(dueDate)) {
      setDateError('Ngày không được nhỏ hơn ngày hiện tại');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        habitId: habitId || undefined,
        milestoneId: milestoneId || undefined,
      };

      if (task) {
        await tasksAPI.updateTask(task.id, data);
        showToast?.('success', 'Đã cập nhật task!');
      } else {
        const response = await tasksAPI.createTask(data);
        const newTaskId = response.data.id;
        const isStandalone = !habitId && !milestoneId;
        onTaskCreated?.(newTaskId, isStandalone);
        showToast?.('success', 'Đã thêm task thành công!');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
      showToast?.('error', 'Lưu task thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setDeleting(true);
    try {
      await tasksAPI.deleteTask(task.id);
      onSuccess();
      onClose();
      showToast?.('success', 'Đã xóa task!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
      showToast?.('error', 'Xóa task thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateClick = () => {
    const form = document.querySelector('.task-form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-background-card border border-glass-border rounded-2xl shadow-2xl animate-scaleIn overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-glass-border shrink-0">
          <h2 className="text-xl font-semibold text-text-primary">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="task-form p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={handleDateChange}
                min={today}
                className={`input-field ${dateError ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {dateError && (
                <p className="mt-1 text-sm text-red-500">{dateError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Milestone
              </label>
              <select
                value={milestoneId}
                onChange={(e) => {
                  setMilestoneId(e.target.value);
                  setHabitId('');
                }}
                className="input-field"
              >
                <option value="">Select milestone (optional)</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Habit
              </label>
              <select
                value={habitId}
                onChange={(e) => setHabitId(e.target.value)}
                className="input-field"
              >
                <option value="">Select habit (optional)</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </select>
            </div>

          </form>
        </div>

        <div className="flex gap-3 p-6 border-t border-glass-border shrink-0 bg-background-card">
          {task && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-500 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-black/[0.05] dark:bg-white/10 hover:bg-black/[0.1] dark:hover:bg-white/20 text-text-primary font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateClick}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : task ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return <></>;

  return createPortal(modalContent, document.body);
}
