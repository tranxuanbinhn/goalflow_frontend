import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { goalsAPI } from '../services/api';
import ActivityHeatmap from '../components/ui/ActivityHeatmap';
import HabitModal from '../components/ui/HabitModal';
import { Check, Flame, Clock, Calendar, X, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { feedbackHabitComplete } from '../utils/feedback';


// Types
interface Milestone {
  id: string;
  title: string;
  icon?: string;
  vision?: {
    id: string;
    title: string;
    icon?: string;
  };
}

interface Habit {
  id: string;
  title: string;
  description?: string;
  // Legacy fields for backward compatibility
  frequency?: string;
  frequencyTarget?: number;
  frequencyPeriod?: 'DAY' | 'WEEK' | 'MONTH';
  // New simplified frequency model: days per week (1-7)
  frequencyPerWeek?: number;
  icon?: string;
  color?: string;
  estimatedTime?: number;
  streak: number;
  completedToday: boolean;
  isActive: boolean;
  milestoneId?: string;
  milestone?: Milestone;
}

interface HabitStats {
  bestStreak: number;
  completedToday: number;
  totalActive: number;
}

type FilterType = 'all' | 'completed' | 'at_risk' | 'by_goal';

const getStreakUnitLabel = (habit: Habit): string => {
  // Streak is now displayed as total completed days
  return 'days';
};

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<HabitStats>({ bestStreak: 0, completedToday: 0, totalActive: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, _setSearchQuery] = useState('');

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([]);
  const habitCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  useEffect(() => {
    loadHabits();
    loadStats();
  }, []);

  const loadHabits = async () => {
    try {
      const response = await goalsAPI.getHabits();
      setHabits(response.data);
    } catch (error) {
      console.error('Failed to load habits');
      showToast('error', 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await goalsAPI.getHabitsStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleToggleComplete = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await goalsAPI.toggleHabitComplete(habitId);
      loadHabits();
      loadStats();
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const wasCompleted = habit.completedToday;
        if (!wasCompleted) {
          const cardEl = habitCardRefs.current[habitId] || undefined;
          feedbackHabitComplete(cardEl || undefined);
          showToast('success', 'Great job! Habit completed!');
        } else {
          showToast('success', 'Habit unchecked!');
        }
      }
    } catch (error) {
      showToast('error', 'Failed to update habit');
    }
  };

  const handleEditClick = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditHabit(habit);
    setSelectedHabit(null);
    setShowCreateModal(true);
  };

  const handleDeleteClick = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHabit(habit);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedHabit) return;
    
    try {
      await goalsAPI.deleteHabit(selectedHabit.id);
      showToast('success', 'Habit deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedHabit(null);
      loadHabits();
      loadStats();
    } catch (error) {
      showToast('error', 'Failed to delete habit');
    }
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setEditHabit(null);
    loadHabits();
    loadStats();
    showToast('success', editHabit ? 'Habit updated successfully!' : 'Habit created successfully!');
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditHabit(null);
  };

  // Filter habits based on search and active filter
  const filteredHabits = habits.filter(habit => {
    // Search filter
    const matchesSearch = habit.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter buttons
    switch (activeFilter) {
      case 'completed':
        return habit.completedToday;
      case 'at_risk':
        return !habit.completedToday && habit.streak >= 3;
      case 'by_goal':
        return true;
      default:
        return true;
    }
  });

  const frequencyLabel = (habit: Habit) => {
    // Use the new frequencyPerWeek field if available
    const daysPerWeek = habit.frequencyPerWeek;
    
    if (daysPerWeek !== undefined) {
      // New model: days per week
      if (daysPerWeek === 1) return '1 day per week';
      if (daysPerWeek === 7) return 'Every day';
      return `${daysPerWeek} days per week`;
    }
    
    // Legacy fallback: convert from old frequency model
    const targetCount = habit.frequencyTarget ?? 1;
    const period = habit.frequencyPeriod === 'WEEK'
      ? 'week'
      : habit.frequencyPeriod === 'MONTH'
        ? 'month'
        : habit.frequency === 'WEEKLY'
          ? 'week'
          : habit.frequency === 'MONTHLY'
            ? 'month'
            : 'day';

    if (targetCount === 1 && period === 'day') return 'Every day';
    if (targetCount === 1 && period === 'week') return 'Every week';
    if (targetCount === 1 && period === 'month') return 'Every month';
    return `${targetCount} times / ${period}`;
  };

  const formatEstimatedTime = (minutes?: number) => {
    if (!minutes) return '--';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#12121a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Today's Habits</h1>
              <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formattedDate}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalActive}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-500">{stats.completedToday}/{stats.totalActive}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500 flex items-center gap-1">
                  <Flame className="w-5 h-5" />
                  {stats.bestStreak}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Best Streak</p>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center justify-between gap-4 pb-4">
            

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <FilterButton 
                active={activeFilter === 'all'} 
                onClick={() => setActiveFilter('all')}
              >
                All
              </FilterButton>
              <FilterButton 
                active={activeFilter === 'completed'} 
                onClick={() => setActiveFilter('completed')}
              >
                Completed
              </FilterButton>
              <FilterButton 
                active={activeFilter === 'at_risk'} 
                onClick={() => setActiveFilter('at_risk')}
              >
                At Risk
              </FilterButton>
              <FilterButton 
                active={activeFilter === 'by_goal'} 
                onClick={() => setActiveFilter('by_goal')}
              >
                By Goal
              </FilterButton>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              New Habit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredHabits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHabits.map((habit, index) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                index={index}
                onToggleComplete={handleToggleComplete}
                onClick={() => setSelectedHabit(habit)}
                onEdit={(e) => handleEditClick(habit, e)}
                onDelete={(e) => handleDeleteClick(habit, e)}
                frequencyLabel={frequencyLabel}
                formatEstimatedTime={formatEstimatedTime}
                cardRef={(el) => {
                  habitCardRefs.current[habit.id] = el;
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState 
            onCreateHabit={() => setShowCreateModal(true)}
            hasSearchQuery={!!searchQuery}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <HabitModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          editHabit={editHabit}
        />
      )}

      {/* Detail Panel */}
      {selectedHabit && !showCreateModal && (
        <HabitDetailPanel
          habit={selectedHabit}
          onClose={() => setSelectedHabit(null)}
          onToggleComplete={handleToggleComplete}
          onEdit={(e) => handleEditClick(selectedHabit, e)}
          onDelete={(e) => handleDeleteClick(selectedHabit, e)}
          frequencyLabel={frequencyLabel}
          formatEstimatedTime={formatEstimatedTime}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          habitName={selectedHabit?.title || ''}
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedHabit(null);
          }}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-20 right-6 z-50 space-y-3">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// Filter Button Component
function FilterButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
        active
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

// Habit Card Component
function HabitCard({
  habit,
  index,
  onToggleComplete,
  frequencyLabel,
  onClick,
  onEdit,
  onDelete,
  formatEstimatedTime,
  cardRef,
}: {
  habit: Habit;
  index: number;
  onToggleComplete: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  frequencyLabel: (habit: Habit) => string;
  formatEstimatedTime: (minutes?: number) => string;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`
        group relative p-5 rounded-2xl border-2 cursor-pointer
        transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
        animate-fadeIn stagger-item
        ${habit.completedToday 
          ? 'border-emerald-500/50 bg-emerald-500/5' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#12121a] hover:border-primary-500/30'
        }
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Action Buttons (Edit/Delete) */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={onEdit}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      {/* Card Content */}
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={(e) => onToggleComplete(habit.id, e)}
          className={`
            flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center
            transition-all duration-200 hover:scale-110
            ${habit.completedToday
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
            }
          `}
        >
          {habit.completedToday && <Check className="w-4 h-4 text-white" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Habit Icon & Name */}
          <div className="flex items-center gap-2 mb-2">
            {habit.icon && <span className="text-xl">{habit.icon}</span>}
            <h3 className={`font-semibold text-lg truncate ${
              habit.completedToday 
                ? 'text-gray-500 dark:text-gray-400 line-through' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {habit.title}
            </h3>
          </div>

          {/* Goal / Milestone */}
          {habit.milestone && (
            <div className="flex items-center gap-1.5 mb-3 text-sm text-gray-500 dark:text-gray-400">
              {habit.milestone.icon && <span>{habit.milestone.icon}</span>}
              <span className="truncate">{habit.milestone.title}</span>
              {habit.milestone.vision && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="truncate">{habit.milestone.vision.title}</span>
                </>
              )}
            </div>
          )}

          {/* Bottom Info Row */}
          <div className="flex items-center gap-4 text-sm">
            {/* Frequency */}
            <span className="text-gray-500 dark:text-gray-400">
              {frequencyLabel(habit)}
            </span>

            {/* Streak */}
            <div className="flex items-center gap-1 text-orange-500">
              <Flame className="w-4 h-4" />
            <span className="font-medium">
              {habit.streak} {getStreakUnitLabel(habit)}
            </span>
            </div>

            {/* Estimated Time */}
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatEstimatedTime(habit.estimatedTime)}</span>
            </div>
          </div>
        </div>

        {/* Arrow Icon */}
        <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Completed Overlay Effect */}
      {habit.completedToday && (
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 pointer-events-none" />
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ onCreateHabit, hasSearchQuery }: { onCreateHabit: () => void; hasSearchQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mb-6">
        <Check className="h-10 w-10 text-primary-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {hasSearchQuery ? 'No habits found' : 'No habits yet'}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {hasSearchQuery 
          ? 'Try adjusting your search or filters'
          : 'Start building good habits to achieve your goals!'
        }
      </p>
      {!hasSearchQuery && (
        <button 
          onClick={onCreateHabit}
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create your first habit
        </button>
      )}
    </div>
  );
}

// Habit Detail Panel (Slide-in from right)
function HabitDetailPanel({
  habit,
  onClose,
  onToggleComplete,
  onEdit,
  onDelete,
  frequencyLabel,
  formatEstimatedTime
}: {
  habit: Habit;
  onClose: () => void;
  onToggleComplete: (id: string, e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  frequencyLabel: (habit: Habit) => string;
  formatEstimatedTime: (minutes?: number) => string;
}) {
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#12121a] border-l border-gray-200 dark:border-gray-700 z-50 shadow-2xl overflow-y-auto animate-slide-in-right">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Habit Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {/* Habit Info */}
          <div className="space-y-6">
            {/* Icon & Name */}
            <div className="flex items-center gap-4">
              {habit.icon && (
                <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-3xl">
                  {habit.icon}
                </div>
              )}
              <div>
                <h3 className={`text-xl font-bold ${
                  habit.completedToday 
                    ? 'text-gray-500 dark:text-gray-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {habit.title}
                </h3>
                {habit.description && (
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{habit.description}</p>
                )}
              </div>
            </div>

            {/* Complete Button */}
            <button
              onClick={(e) => onToggleComplete(habit.id, e)}
              className={`
                w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium
                transition-all duration-200
                ${habit.completedToday
                  ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
                }
              `}
            >
              <Check className="w-5 h-5" />
              {habit.completedToday ? 'Completed Today!' : 'Mark as Complete'}
            </button>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Frequency</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {frequencyLabel(habit)}
                </p>
              </div>
              
              <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Time</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatEstimatedTime(habit.estimatedTime)}
                </p>
              </div>
              
              <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Streak</p>
                <p className="font-medium text-orange-500 flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {habit.streak} {getStreakUnitLabel(habit)}
                </p>
              </div>
              
              <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <p className={`font-medium ${
                  habit.completedToday ? 'text-emerald-500' : 'text-gray-900 dark:text-white'
                }`}>
                  {habit.completedToday ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>

            {/* Goal / Milestone */}
            {habit.milestone && (
              <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Linked to Goal</p>
                <div className="flex items-center gap-2">
                  {habit.milestone.icon && <span className="text-xl">{habit.milestone.icon}</span>}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{habit.milestone.title}</p>
                    {habit.milestone.vision && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        → {habit.milestone.vision.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Activity Heatmap */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <ActivityHeatmap habitId={habit.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  habitName,
  onConfirm,
  onCancel
}: {
  habitName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <div className="relative w-full max-w-sm bg-white dark:bg-[#12121a] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl animate-scaleIn p-6">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Delete Habit
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete "{habitName}"? 
            <br />
            This action cannot be undone.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
