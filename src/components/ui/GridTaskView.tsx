import TaskCard from './TaskCard';
import { tasksAPI } from '../../services/api';

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


interface GridTaskViewProps {
  tasks: Task[];
  onTasksChange?: () => void;
  onAddTask?: () => void;
  onEditTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void;
  highlightedTaskId?: string | null;
}

export default function GridTaskView({
  tasks,
  onTasksChange,
  onAddTask,
  onEditTask,
  onStatusChange,
  showToast,
  highlightedTaskId,
}: GridTaskViewProps) {
  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksAPI.deleteTask(taskId);
      if (onTasksChange) onTasksChange();
      showToast?.('success', 'Đã xóa task thành công');
    } catch (error) {
      showToast?.('error', 'Xóa task thất bại');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(taskId, newStatus);
    }
    if (onTasksChange) onTasksChange();
  };

  const handleEditTask = (task: Task) => {
    if (onEditTask) {
      onEditTask(task);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Add Task Button - Always visible when there are tasks */}
      <div className="flex justify-end mb-4">
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Grid Layout */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="stagger-item"
            >
              <TaskCard
                task={task}
                index={index}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
                highlightedTaskId={highlightedTaskId}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No tasks found</h3>
          <p className="text-text-muted mb-6">
            Create your first task to get started
          </p>
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}
