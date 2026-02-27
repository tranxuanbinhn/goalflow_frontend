import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GridTaskView from '../components/ui/GridTaskView';
import TaskModal from '../components/ui/TaskModal';
import { tasksAPI } from '../services/api';
import { feedbackTaskComplete } from '../utils/feedback';
import { ListTodo, CheckCircle, Clock, AlertCircle } from 'lucide-react';

type TaskFilter = 'ALL' | 'TODO' | 'COMPLETED' | 'OVERDUE';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  completedAt?: string;
  dueDate?: string;
  createdAt?: string;
  habitId?: string;
  milestoneId?: string;
  milestone?: {
    id: string;
    title: string;
    vision?: {
      id: string;
      title: string;
    };
  };
}

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('ALL');
  const [filterTransitioning, setFilterTransitioning] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  
  // Modal state - lifted to page level for proper positioning
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Notification state
  const [centeredNotification, setCenteredNotification] = useState<{ id: string; message: string } | null>(null);

  // Modal handlers
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleModalSuccess = () => {
    loadTasks();
  };

  // Handle task status change from GridTaskView/TaskCard
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (newStatus === 'COMPLETED') {
      // Show notification
      const notificationId = Date.now().toString();
      setCenteredNotification({ id: notificationId, message: '🎉 Task completed!' });
      setTimeout(() => {
        setCenteredNotification(prev => prev?.id === notificationId ? null : prev);
      }, 2000);
      
      // Play sound feedback
      feedbackTaskComplete();
    }
    // Reload tasks to reflect the change
    loadTasks();
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  useEffect(() => {
    loadTasks();
    
    // Check for highlight query param on mount
    const highlightParam = searchParams.get('highlight');
    if (highlightParam) {
      setHighlightedTaskId(highlightParam);
      setActiveFilter('TODO');
      // Clear the highlight param from URL after processing
      setSearchParams({});
    }
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    return new Date(task.dueDate) < new Date();
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (activeFilter) {
      case 'TODO':
        if (task.status === 'COMPLETED') return false;
        if (!task.dueDate) return true;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today;
      case 'COMPLETED':
        return task.status === 'COMPLETED';
      case 'OVERDUE':
        return isOverdue(task);
      default:
        return true;
    }
  });

  // Handle filter change with animation
  const handleFilterChange = (filter: TaskFilter) => {
    if (filter === activeFilter) return;
    
    setFilterTransitioning(true);
    
    setTimeout(() => {
      setActiveFilter(filter);
      setFilterTransitioning(false);
    }, 150);
  };

  // Stats
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const todoCount = tasks.filter(t => t.status !== 'COMPLETED').length;
  const overdueCount = tasks.filter(t => isOverdue(t)).length;

  // Stat card data
  const stats = [
    { 
      label: 'Total Tasks', 
      value: totalTasks, 
      icon: ListTodo, 
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10'
    },
    { 
      label: 'Completed', 
      value: completedCount, 
      icon: CheckCircle, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      label: 'Todo', 
      value: todoCount, 
      icon: Clock, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      label: 'Overdue', 
      value: overdueCount, 
      icon: AlertCircle, 
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">Tasks</h1>
          <p className="text-text-secondary mt-1">
            View and manage your tasks
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <GlassCard 
            key={index} 
            className="p-4 hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-xs text-text-muted">{stat.label}</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-black/[0.05] dark:bg-white/5 p-1 rounded-xl w-fit">
        {(['ALL', 'TODO', 'COMPLETED', 'OVERDUE'] as TaskFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${activeFilter === filter 
                ? 'bg-primary-500 text-white shadow-md' 
                : 'text-text-muted hover:text-text-primary hover:bg-black/[0.05] dark:hover:bg-white/5'
              }
            `}
          >
            {filter === 'ALL' && 'All Tasks'}
            {filter === 'TODO' && 'Todo'}
            {filter === 'COMPLETED' && 'Completed'}
            {filter === 'OVERDUE' && 'Overdue'}
          </button>
        ))}
      </div>

      {/* Main Content Area - Always show Grid View */}
      <div className={`
        transition-all duration-200 ease-in-out
        ${filterTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}
      `}>
        <GlassCard className="p-6 min-h-[500px]">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-black/[0.05] dark:bg-white/5 rounded-lg" />
              <div className="h-12 bg-black/[0.05] dark:bg-white/5 rounded-lg" />
              <div className="h-12 bg-black/[0.05] dark:bg-white/5 rounded-lg" />
            </div>
          ) : filteredTasks.length > 0 ? (
            <GridTaskView 
              tasks={filteredTasks} 
              onTasksChange={loadTasks}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onStatusChange={handleStatusChange}
              highlightedTaskId={highlightedTaskId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">
                {activeFilter === 'TODO' ? '✅' : 
                 activeFilter === 'COMPLETED' ? '🎉' : 
                 activeFilter === 'OVERDUE' ? '⚠️' : '📋'}
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {activeFilter === 'TODO' ? 'All caught up!' : 
                 activeFilter === 'COMPLETED' ? 'No completed tasks yet' : 
                 activeFilter === 'OVERDUE' ? 'No overdue tasks' : 
                 'No tasks yet'}
              </h3>
              <p className="text-text-muted">
                {activeFilter === 'TODO' 
                  ? 'You have no tasks to do right now. Great job!' 
                  : activeFilter === 'COMPLETED' 
                  ? 'Complete some tasks to see them here'
                  : activeFilter === 'OVERDUE'
                  ? 'You have no overdue tasks. Keep it up!'
                  : 'Create your first task to get started'}
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Task Modal - Rendered at page level for proper fixed positioning */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        task={editingTask}
      />

      {/* Centered Notification - Task Completion */}
      {centeredNotification && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div 
            className="px-8 py-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xl font-semibold rounded-2xl shadow-2xl animate-scale-in flex items-center gap-3"
          >
            <span className="text-3xl">🎉</span>
            {centeredNotification.message}
          </div>
        </div>
      )}
    </div>
  );
}
