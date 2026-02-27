import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { goalsAPI } from '../../services/api';

interface Habit {
  id: string;
  title: string;
  description?: string;
  // Legacy fields for backward compatibility
  frequency?: string;
  frequencyTarget?: number;
  frequencyPeriod?: 'DAY' | 'WEEK' | 'MONTH';
  // New simplified frequency model
  frequencyPerWeek?: number;
  icon?: string;
  color?: string;
  estimatedTime?: number;
  milestoneId?: string;
  milestone?: {
    id: string;
    title: string;
    icon?: string;
    vision?: { id: string; title: string; icon?: string };
    visionId?: string;
  };
}

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editHabit?: Habit | null;
}

export default function HabitModal({ isOpen, onClose, onSuccess, editHabit }: HabitModalProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  // New simplified frequency: days per week (1-7)
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(7);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [visionId, setVisionId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [visions, setVisions] = useState<{ id: string; title: string; icon?: string | null }[]>([]);
  const [milestones, setMilestones] = useState<{ id: string; title: string; visionId: string; vision?: { id: string; title: string } }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!editHabit;

  // List of available icons for habits
  const habitIcons = [
    '🎯', '💪', '📚', '🏃', '🧘', '💤', '💧', '🥗',
    '✍️', '🎨', '🎵', '💻', '🧠', '❤️', '🌱', '☀️',
    '🌙', '🚶', '🧹', '📝', '🎮', '📱', '💰', '🙏'
  ];

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
      // Load visions + milestones
      Promise.all([goalsAPI.getVisions(), goalsAPI.getMilestones()])
        .then(([visionsRes, milestonesRes]) => {
          setVisions(visionsRes.data || []);
          const ms = (milestonesRes.data || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            visionId: m.visionId,
            vision: m.vision ? { id: m.vision.id, title: m.vision.title } : undefined,
          }));
          setMilestones(ms);
        })
        .catch(_err => console.error('Failed to load visions/milestones'));

      if (editHabit) {
        // Edit mode - populate form with habit data
        setTitle(editHabit.title || '');
        setDescription(editHabit.description || '');
        setIcon(editHabit.icon || '🎯');
        
        // Use new frequencyPerWeek field if available, otherwise convert from legacy
        if (editHabit.frequencyPerWeek) {
          setFrequencyPerWeek(editHabit.frequencyPerWeek);
        } else if (editHabit.frequencyTarget && editHabit.frequencyPeriod) {
          // Convert legacy frequency to frequencyPerWeek
          if (editHabit.frequencyPeriod === 'WEEK') {
            setFrequencyPerWeek(editHabit.frequencyTarget);
          } else if (editHabit.frequencyPeriod === 'MONTH') {
            setFrequencyPerWeek(Math.ceil(editHabit.frequencyTarget / 4)); // ~4 weeks per month
          } else {
            setFrequencyPerWeek(7); // Daily = 7 days per week
          }
        } else {
          // Legacy frequency enum fallback
          if (editHabit.frequency === 'WEEKLY') {
            setFrequencyPerWeek(3);
          } else if (editHabit.frequency === 'MONTHLY') {
            setFrequencyPerWeek(1);
          } else {
            setFrequencyPerWeek(7);
          }
        }
        
        setEstimatedTime(editHabit.estimatedTime?.toString() || '');
        setVisionId(editHabit.milestone?.vision?.id || '');
        setMilestoneId(editHabit.milestoneId || '');
      } else {
        // Create mode - reset form
        setTitle('');
        setDescription('');
        setIcon('🎯');
        setFrequencyPerWeek(7); // Default: every day
        setEstimatedTime('');
        setVisionId('');
        setMilestoneId('');
      }
      setError('');
    }
  }, [isOpen, editHabit]);

  // If vision changes, ensure milestone still matches
  useEffect(() => {
    if (!visionId) {
      if (milestoneId) setMilestoneId('');
      return;
    }
    const allowed = milestones.some(m => m.id === milestoneId && m.visionId === visionId);
    if (milestoneId && !allowed) setMilestoneId('');
  }, [visionId, milestoneId, milestones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Habit name is required');
      return;
    }

    if (frequencyPerWeek < 1 || frequencyPerWeek > 7) {
      setError('Frequency per week must be between 1 and 7');
      return;
    }

    setLoading(true);
    try {
      // Use the new simplified frequency model
      const data = {
        title: title.trim(),
        description: description.trim() || undefined,
        icon,
        frequencyPerWeek,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
        milestoneId: milestoneId || undefined,
      };

      if (isEditMode && editHabit) {
        await goalsAPI.updateHabit(editHabit.id, data);
      } else {
        await goalsAPI.createHabit(data);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || (isEditMode ? 'Failed to update habit' : 'Failed to create habit'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    const form = document.querySelector('.habit-form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  // Get display text for frequency
  const getFrequencyText = (days: number) => {
    if (days === 1) return '1 day per week';
    if (days === 7) return 'Every day';
    return `${days} days per week`;
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
            {isEditMode ? 'Edit Habit' : 'Create New Habit'}
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
          <form onSubmit={handleSubmit} className="habit-form p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Habit Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Morning Exercise, Read Books"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for your habit"
                rows={2}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Choose Icon
              </label>
              <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 bg-black/[0.02] dark:bg-white/5 rounded-lg">
                {habitIcons.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`
                      w-6 h-6 flex items-center justify-center text-xl
                      rounded-lg border-2 transition-all duration-200
                      ${icon === emoji
                        ? 'border-primary-500 bg-primary-500/20'
                        : 'border-transparent hover:border-primary-400/30 hover:bg-primary-500/10'
                      }
                    `}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* New Frequency Slider - Days per week */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                How many days per week?
              </label>
              <div className="space-y-4">
                {/* Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={frequencyPerWeek}
                    onChange={(e) => setFrequencyPerWeek(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex justify-between mt-2 text-xs text-text-muted">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                    <span>7</span>
                  </div>
                </div>
                
                {/* Display selected value */}
                <div className="text-center">
                  <span className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500/20 text-primary-500 font-medium">
                    {getFrequencyText(frequencyPerWeek)}
                  </span>
                </div>
                
                {/* Quick presets */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequencyPerWeek(1)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      frequencyPerWeek === 1
                        ? 'border-primary-500 bg-primary-500/20 text-primary-500'
                        : 'border-glass-border hover:border-primary-400/30 hover:bg-primary-500/10 text-text-secondary'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequencyPerWeek(3)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      frequencyPerWeek === 3
                        ? 'border-primary-500 bg-primary-500/20 text-primary-500'
                        : 'border-glass-border hover:border-primary-400/30 hover:bg-primary-500/10 text-text-secondary'
                    }`}
                  >
                    3x
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequencyPerWeek(5)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      frequencyPerWeek === 5
                        ? 'border-primary-500 bg-primary-500/20 text-primary-500'
                        : 'border-glass-border hover:border-primary-400/30 hover:bg-primary-500/10 text-text-secondary'
                    }`}
                  >
                    5x
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequencyPerWeek(7)}
                    className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      frequencyPerWeek === 7
                        ? 'border-primary-500 bg-primary-500/20 text-primary-500'
                        : 'border-glass-border hover:border-primary-400/30 hover:bg-primary-500/10 text-text-secondary'
                    }`}
                  >
                    Daily
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Estimated Time (minutes)
              </label>
              <input
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="e.g. 3, 5, 10, 30"
                min="1"
                max="180"
                className="input-field"
              />
              <p className="text-xs text-text-muted mt-1">
                Small habits still count! (1-180 minutes)
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Vision (optional)
                </label>
                <select
                  value={visionId}
                  onChange={(e) => setVisionId(e.target.value)}
                  className="input-field"
                >
                  <option value="">No vision</option>
                  {visions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.icon ? `${v.icon} ` : ''}{v.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Milestone (optional)
                </label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="input-field"
                  disabled={!visionId}
                >
                  <option value="">{visionId ? 'No milestone' : 'Select a vision first (or leave standalone)'}</option>
                  {milestones
                    .filter((m) => m.visionId === visionId)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="flex gap-3 p-6 border-t border-glass-border shrink-0 bg-background-card">
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
            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Habit')}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return <></>;

  return createPortal(modalContent, document.body);
}
