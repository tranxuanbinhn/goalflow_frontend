import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import TaskModal from '../components/ui/TaskModal';
import HabitModal from '../components/ui/HabitModal';
import SparkleEffect from '../components/ui/SparkleEffect';
import { tasksAPI, goalsAPI } from '../services/api';
import { feedbackTaskComplete, feedbackHabitComplete } from '../utils/feedback';

import { Flame, Clock, Check, Plus, ChevronDown, ChevronRight, Pencil, Trash2, Eye, Sparkles } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  completedAt?: string;
  dueDate?: string;
  habitId?: string;
  milestoneId?: string;
}

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
  frequency: string;
  isActive: boolean;
  icon?: string;
  color?: string;
  estimatedTime?: number;
  streak: number;
  completedToday: boolean;
  tasks?: Task[];
  milestoneId?: string;
  milestone?: Milestone;
}

interface DashboardStats {
  pendingTasks: number;
  completedTasks: number;
  habitsToday: number;
  bestStreak: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    pendingTasks: 0,
    completedTasks: 0,
    habitsToday: 0,
    bestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [preselectedHabitId, setPreselectedHabitId] = useState<string | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [expandedHabits, setExpandedHabits] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error'; message: string }[]>([]);
  const [centeredNotification, setCenteredNotification] = useState<{ id: string; message: string } | null>(null);
  
  // Sparkle effect state
  const [sparkles, setSparkles] = useState<{ id: string; x: number; y: number }[]>([]);

  // Refs for task checkboxes
  const taskCheckboxRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, habitsRes, statsRes] = await Promise.all([
        tasksAPI.getTodayTasks(),
        goalsAPI.getHabits(),
        goalsAPI.getHabitsStats(),
      ]);
      
      setTasks(tasksRes.data);
      setHabits(habitsRes.data.filter((h: Habit) => h.isActive));
      
      // Calculate task stats
      const allTasks = tasksRes.data;
      const pending = allTasks.filter((t: Task) => t.status === 'PENDING').length;
      const completed = allTasks.filter((t: Task) => t.status === 'COMPLETED').length;
      
      setStats({
        pendingTasks: pending,
        completedTasks: completed,
        habitsToday: statsRes.data.completedToday || 0,
        bestStreak: statsRes.data.bestStreak || 0,
      });

      // Expand all habits by default
      const habitIds = habitsRes.data.filter((h: Habit) => h.isActive).map((h: Habit) => h.id);
      setExpandedHabits(new Set(habitIds));
    } catch (error) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Trigger sparkle effect at checkbox position
  const triggerSparkle = (taskId: string) => {
    const checkbox = taskCheckboxRefs.current[taskId];
    if (checkbox) {
      const rect = checkbox.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      const sparkleId = `${taskId}-${Date.now()}`;
      setSparkles(prev => [...prev, { id: sparkleId, x, y }]);
      
      // Remove sparkle after animation
      setTimeout(() => {
        setSparkles(prev => prev.filter(s => s.id !== sparkleId));
      }, 500);
    }
  };

  // Navigate to habits page
  const handleNavigateToHabits = () => {
    navigate('/habits');
  };

  // Toggle habit expand/collapse
  const toggleHabitExpand = (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHabits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(habitId)) {
        newSet.delete(habitId);
      } else {
        newSet.add(habitId);
      }
      return newSet;
    });
  };
  // Toggle single task
  const handleToggleTask = async (taskId: string, currentStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await tasksAPI.updateTaskStatus(taskId, newStatus);
      
      // Trigger sparkle effect on completion
      if (newStatus === 'COMPLETED') {
        triggerSparkle(taskId);
      }
      
      // Update local state
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { 
          ...t, 
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
        } : t
      ));

      // Update tasks in habits
      setHabits(prev => prev.map(h => ({
        ...h,
        tasks: h.tasks?.map(t => 
          t.id === taskId ? {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
          } : t
        )
      })));

      // Update stats
      if (newStatus === 'COMPLETED') {
        setStats(prev => ({
          ...prev,
          pendingTasks: prev.pendingTasks - 1,
          completedTasks: prev.completedTasks + 1,
        }));
      } else {
        setStats(prev => ({
          ...prev,
          pendingTasks: prev.pendingTasks + 1,
          completedTasks: prev.completedTasks - 1,
        }));
      }
      // Sync with backend source of truth after task status change.
      await loadData();
      
      if (newStatus === 'COMPLETED') {
        feedbackTaskComplete();
        // Show centered notification for task completion
        const notificationId = Date.now().toString();
        setCenteredNotification({ id: notificationId, message: '🎉 Task completed!' });
        setTimeout(() => {
          setCenteredNotification(prev => prev?.id === notificationId ? null : prev);
        }, 2000);
      } else {
        showToast('success', 'Task unmarked!');
      }
    } catch (error) {
      console.error('Failed to update task status');
      showToast('error', 'Failed to update task');
    }
  };

  // Toggle entire habit (toggles all nested tasks)
  const handleToggleHabit = async (habitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      
      const newCompletedState = !habit.completedToday;
      const hasTasks = habit.tasks && habit.tasks.length > 0;
      
      // If trying to COMPLETE a habit with tasks, check if all tasks are completed first
      if (newCompletedState && hasTasks) {
        const allTasksCompleted = habit.tasks!.every(t => t.status === 'COMPLETED');
        if (!allTasksCompleted) {
          // Show warning - user must complete all tasks first
          showToast('error', 'Hoàn thành tất cả task trước khi tick habit!');
          return;
        }
      }
      
      // If UNCHECKING a habit, also uncheck all nested tasks
      if (!newCompletedState && hasTasks) {
        const newTaskStatus = 'PENDING';
        
        // Update all tasks to uncompleted
        for (const task of habit.tasks!) {
          await tasksAPI.updateTaskStatus(task.id, newTaskStatus);
        }
        
        // Update local task state
        setTasks(prev => prev.map(t => {
          if (habit.tasks?.some(ht => ht.id === t.id)) {
            return {
              ...t,
              status: newTaskStatus,
              completedAt: undefined
            };
          }
          return t;
        }));

        // Update tasks in habits
        setHabits(prev => prev.map(h => {
          if (h.id === habitId) {
            return {
              ...h,
              tasks: h.tasks?.map(t => ({
                ...t,
                status: newTaskStatus,
                completedAt: undefined
              }))
            };
          }
          return h;
        }));

        // Update stats - reduce completed count
        const completedCount = habit.tasks!.filter(t => t.status === 'COMPLETED').length;
        setStats(prev => ({
          ...prev,
          pendingTasks: prev.pendingTasks + completedCount,
          completedTasks: Math.max(0, prev.completedTasks - completedCount),
          habitsToday: Math.max(0, prev.habitsToday - 1),
        }));
      }
      
      // Toggle habit itself
      await goalsAPI.toggleHabitComplete(habitId);
      
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          return {
            ...h,
            completedToday: newCompletedState,
            streak: newCompletedState ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      }));

      // Update best streak
      if (newCompletedState) {
        setStats(prev => ({
          ...prev,
          bestStreak: Math.max(prev.bestStreak, habit.streak + 1),
        }));
        
        // Trigger habit completion feedback (sound + confetti)
        feedbackHabitComplete();
      }

      showToast('success', newCompletedState ? 'Great job! Habit completed!' : 'Habit unchecked');
    } catch (error: any) {
      console.error('Failed to toggle habit', error);
      if (error.response?.data?.message) {
        showToast('error', error.response.data.message);
      } else {
        showToast('error', 'Failed to update habit');
      }
    }
  };

  // Delete task (no confirm, just toast)
  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksAPI.deleteTask(taskId);
      const taskToDelete = tasks.find(t => t.id === taskId);
      
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setHabits(prev => prev.map(h => ({
        ...h,
        tasks: h.tasks?.filter(t => t.id !== taskId)
      })));
      
      if (taskToDelete) {
        if (taskToDelete.status === 'PENDING') {
          setStats(prev => ({ ...prev, pendingTasks: prev.pendingTasks - 1 }));
        } else {
          setStats(prev => ({ ...prev, completedTasks: prev.completedTasks - 1 }));
        }
      }
      showToast('success', 'Đã xóa task!');
    } catch (error) {
      console.error('Failed to delete task');
      showToast('error', 'Xóa task thất bại');
    }
  };

// Task modal handlers
  const handleOpenTaskModal = (task?: Task, habitId?: string) => {
    if (task) {
      setEditingTask(task);
      setPreselectedHabitId(undefined);
    } else {
      setEditingTask(null);
      setPreselectedHabitId(habitId);
    }
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setPreselectedHabitId(undefined);
  };

  const handleTaskSuccess = () => {
    loadData();
  };

  // Handle task created from TaskModal - navigate to Tasks page for standalone tasks
  const handleTaskCreated = (taskId: string, isStandalone: boolean) => {
    if (isStandalone) {
      // Navigate to Tasks page with highlight query param
      navigate(`/tasks?highlight=${taskId}`);
    }
  };

  // Habit modal handlers
  const handleOpenHabitModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
    } else {
      setEditingHabit(null);
    }
    setIsHabitModalOpen(true);
  };

  const handleCloseHabitModal = () => {
    setIsHabitModalOpen(false);
    setEditingHabit(null);
  };

  const handleHabitSuccess = () => {
    loadData();
  };

  // Edit habit handler
  const handleEditHabit = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  // Delete habit handlers
  const handleDeleteClick = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setHabitToDelete(habit);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;
    
    try {
      await goalsAPI.deleteHabit(habitToDelete.id);
      showToast('success', 'Habit deleted successfully!');
      setShowDeleteConfirm(false);
      setHabitToDelete(null);
      loadData();
    } catch (error) {
      showToast('error', 'Failed to delete habit');
    }
  };

  const cancelDeleteHabit = () => {
    setShowDeleteConfirm(false);
    setHabitToDelete(null);
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Format estimated time
  const formatEstimatedTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get tasks for each habit (from today's tasks that have habitId)
  const getHabitsWithTasks = () => {
    return habits.map(habit => ({
      ...habit,
      tasks: tasks.filter(t => t.habitId === habit.id)
    }));
  };

  const habitsWithTasks = getHabitsWithTasks();
  const incompleteHabits = habitsWithTasks.filter(h => !h.completedToday);
  const completeHabits = habitsWithTasks.filter(h => h.completedToday);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header - Fixed at top, white background with shadow */}
      <div className="sticky top-16 z-40 bg-white dark:bg-[#12121a] border-b border-gray-200 dark:border-gray-800 -mx-6 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left side: Title and Subtitle */}
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              🧭 Productivity Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your tasks and build better habits
            </p>
          </div>
          
          {/* Right side: Add Task and Add Habit buttons + Toasts */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleOpenTaskModal()}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 active:scale-95 transition-all duration-200 shadow-lg shadow-primary-500/25"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
              <button 
                onClick={() => handleOpenHabitModal()}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-primary-500 text-primary-500 dark:text-primary-400 rounded-xl font-medium hover:bg-primary-500/10 active:scale-95 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Add Habit
              </button>
            </div>
            
            {/* Toast Notifications - Displayed below buttons in header area */}
            <div className="space-y-2 w-full max-w-md">
              {toasts.map(toast => (
                <div
                  key={toast.id}
                  className={`px-4 py-2.5 rounded-lg shadow-lg transform transition-all duration-300 text-sm font-medium ${
                    toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {toast.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar - 4 cards horizontal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Tasks */}
        <GlassCard className="p-5 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.pendingTasks}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Completed Tasks */}
        <GlassCard className="p-5 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.completedTasks}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </GlassCard>

        {/* Habits Today */}
        <GlassCard className="p-5 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Habits Today</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.habitsToday}/{habits.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </GlassCard>

        {/* Best Streak */}
        <GlassCard className="p-5 hover:scale-[1.02] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Best Streak</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                🔥 {stats.bestStreak}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Habit List - Grid Layout with Nested Tasks */}
      <div className="space-y-4">
        {/* Uncompleted Habits */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-xl">⏳</span>
            To do
            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-sm rounded-full">
              {incompleteHabits.length}
            </span>
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : incompleteHabits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incompleteHabits.map((habit, index) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  onToggleHabit={handleToggleHabit}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenTaskModal={handleOpenTaskModal}
                  isExpanded={expandedHabits.has(habit.id)}
                  onToggleExpand={(e) => toggleHabitExpand(habit.id, e)}
                  formatDate={formatDate}
                  formatEstimatedTime={formatEstimatedTime}
                  onEditHabit={handleEditHabit}
                  onDeleteHabit={handleDeleteClick}
                  onNavigateToHabits={handleNavigateToHabits}
                  taskCheckboxRefs={taskCheckboxRefs}
                />
              ))}
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Tất cả habits đã hoàn thành! 🎉</p>
            </GlassCard>
          )}
        </div>

        {/* Completed Habits */}
        {completeHabits.length > 0 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-xl">✅</span>
              Completed
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-full">
                {completeHabits.length}
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completeHabits.map((habit, index) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  onToggleHabit={handleToggleHabit}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenTaskModal={handleOpenTaskModal}
                  isExpanded={expandedHabits.has(habit.id)}
                  onToggleExpand={(e) => toggleHabitExpand(habit.id, e)}
                  formatDate={formatDate}
                  formatEstimatedTime={formatEstimatedTime}
                  onEditHabit={handleEditHabit}
                  onDeleteHabit={handleDeleteClick}
                  onNavigateToHabits={handleNavigateToHabits}
                  taskCheckboxRefs={taskCheckboxRefs}
                />
              ))}
            </div>
          </div>
        )}
      </div>

{/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSuccess={handleTaskSuccess}
        onTaskCreated={handleTaskCreated}
        task={editingTask}
        defaultHabitId={preselectedHabitId}
      />

      {/* Habit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={handleCloseHabitModal}
        onSuccess={handleHabitSuccess}
        editHabit={editingHabit}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && habitToDelete && (
        <DeleteConfirmModal
          habitName={habitToDelete.title}
          onConfirm={confirmDeleteHabit}
          onCancel={cancelDeleteHabit}
        />
      )}

      {/* Centered Notification - Task Completion */}
      {/*{centeredNotification && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div 
            className="px-8 py-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xl font-semibold rounded-2xl shadow-2xl animate-scale-in flex items-center gap-3"
          >
            <span className="text-3xl">🎉</span>
            {centeredNotification.message}
          </div>
        </div>
      )}*/}

      {/* Sparkle Effects */}
      {/*{sparkles.map(sparkle => (
        <SparkleEffect
          key={sparkle.id}
          x={sparkle.x}
          y={sparkle.y}
          onComplete={() => {}}
        />
      ))}*/}
    </div>
  );
}

// Habit Card Component with Nested Tasks
function HabitCard({
  habit,
  index,
  onToggleHabit,
  onToggleTask,
  onDeleteTask,
  onOpenTaskModal,
  isExpanded,
  onToggleExpand,
  formatDate,
  formatEstimatedTime,
  onEditHabit,
  onDeleteHabit,
  onNavigateToHabits,
  taskCheckboxRefs,
}: {
  habit: Habit & { tasks?: Task[] };
  index: number;
  onToggleHabit: (id: string, e?: React.MouseEvent) => void;
  onToggleTask: (id: string, status: string, e?: React.MouseEvent) => void;
  onDeleteTask: (id: string) => void;
  onOpenTaskModal: (task?: Task, habitId?: string) => void;
  isExpanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  formatDate: (date?: string) => string;
  formatEstimatedTime: (minutes?: number) => string | null;
  onEditHabit?: (habit: Habit, e: React.MouseEvent) => void;
  onDeleteHabit?: (habit: Habit, e: React.MouseEvent) => void;
  onNavigateToHabits?: () => void;
  taskCheckboxRefs?: React.MutableRefObject<{ [key: string]: HTMLButtonElement | null }>;
}) {
  const hasTasks = habit.tasks && habit.tasks.length > 0;
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Handle view details click - navigate to habits page
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigateToHabits) {
      onNavigateToHabits();
    }
  };

  // Handle card click - navigate to habits page
  const handleCardClick = () => {
    if (onNavigateToHabits) {
      onNavigateToHabits();
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        group relative rounded-2xl border-2 overflow-hidden cursor-pointer
        transition-all duration-300 hover:shadow-xl
        animate-fadeIn
        ${habit.completedToday 
          ? 'border-emerald-500/50 bg-emerald-500/5' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#12121a] hover:border-primary-500/30'
        }
      `}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleCardClick}
    >
      {/* Habit Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Habit Checkbox - does NOT trigger navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleHabit(habit.id, e);
            }}
            className={`
              flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center
              transition-all duration-200 hover:scale-110 mt-0.5
              ${habit.completedToday
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
              }
            `}
          >
            {habit.completedToday && <Check className="w-4 h-4 text-white" />}
          </button>

          {/* Habit Icon */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${habit.color || 'from-purple-500 to-pink-500'} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
            {habit.icon || '🎯'}
          </div>

          {/* Habit Info */}
          <div className="flex-1 min-w-0">
            {/* Habit Title - Full name, no truncation, allow wrap */}
            <h3 className={`font-semibold text-lg leading-snug ${
              habit.completedToday 
                ? 'text-gray-500 dark:text-gray-400 line-through' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {habit.title}
            </h3>
            
            {/* Milestone display */}
            {habit.milestone && (
              <div className="flex items-center gap-1 mt-1 text-xs text-purple-600 dark:text-purple-400">
                <span>{habit.milestone.icon || '🎯'}</span>
                <span className="truncate">Milestone: {habit.milestone.title}</span>
              </div>
            )}
            
            {/* Habit Meta Info */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Streak */}
              {habit.streak > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-medium">{habit.streak} days</span>
                </div>
              )}

              {/* Estimated Time */}
              {formatEstimatedTime(habit.estimatedTime) && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{formatEstimatedTime(habit.estimatedTime)}</span>
                </div>
              )}

              {/* Task Count */}
              {hasTasks && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm">
                    {habit.tasks!.filter(t => t.status === 'COMPLETED').length}/{habit.tasks!.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - View Details, Edit, Delete */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* View Details Button - Navigate to Habits Page */}
            {onNavigateToHabits && (
              <button
                onClick={handleViewDetails}
                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Click để xem tiến trình chi tiết"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            
            {/* Expand/Collapse Button */}
            {hasTasks && (
              <button 
                onClick={(e) => onToggleExpand(e)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Edit Button */}
            {onEditHabit && (
              <button
                onClick={(e) => onEditHabit(habit, e)}
                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Edit habit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            
            {/* Delete Button */}
            {onDeleteHabit && (
              <button
                onClick={(e) => onDeleteHabit(habit, e)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Delete habit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            {/* Add Task Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTaskModal(undefined, habit.id);
              }}
              className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Add task to this habit"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Nested Tasks - Body */}
      {isExpanded && hasTasks && (
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="p-4 pl-14 space-y-2">
            {habit.tasks!.map((task) => (

              <div
                key={task.id}
                className={`
                  group/task flex items-center gap-3 p-2 rounded-lg
                  transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50
                  ${task.status === 'COMPLETED' ? 'opacity-60' : ''}
                `}
              >
                {/* Task Checkbox */}
                <button
                  ref={(el) => {
                    if (taskCheckboxRefs && taskCheckboxRefs.current) {
                      taskCheckboxRefs.current[task.id] = el;
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id, task.status, e);
                  }}
                  className={`
                    flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                    transition-all duration-200 hover:scale-110
                    ${task.status === 'COMPLETED'
                      ? 'bg-primary-500 border-primary-500 animate-checkbox-pop'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                    }
                  `}
                >
                  {task.status === 'COMPLETED' && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Task Title */}
                <span 
                  className={`flex-1 text-sm cursor-pointer hover:text-primary-500 ${
                    task.status === 'COMPLETED'
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTaskModal(task);
                  }}
                >
                  {task.title}
                </span>

                {/* Task Due Date */}
                {task.dueDate && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(task.dueDate)}
                  </span>
                )}

                {/* Delete Task Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="opacity-0 group-hover/task:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add Task Button at bottom of task list */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTaskModal(undefined, habit.id);
              }}
              className="flex items-center gap-2 w-full p-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Add task
            </button>
          </div>
        </div>
      )}

      {/* Completed Overlay Effect */}
      {habit.completedToday && (
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 pointer-events-none" />
      )}
    </div>
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
}): JSX.Element {
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

