import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import TaskModal from './TaskModal';
import { tasksAPI } from '../../services/api';
import { feedbackTaskComplete } from '../../utils/feedback';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  completedAt?: string;
  dueDate?: string;
  habitId?: string;
  milestoneId?: string;
  milestone?: {
    id: string;
    title: string;
  };
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const defaultColumns: Column[] = [
  { id: 'PENDING', title: 'To Do', tasks: [] },
  { id: 'IN_PROGRESS', title: 'In Progress', tasks: [] },
  { id: 'COMPLETED', title: 'Completed', tasks: [] },
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Notification state
  const [centeredNotification, setCenteredNotification] = useState<{ id: string; message: string } | null>(null);
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'error' | 'info'; message: string }[]>([]);
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks();
      const tasks = response.data;
      
      setColumns([
        { 
          id: 'PENDING', 
          title: 'To Do', 
          tasks: tasks.filter((t: Task) => t.status === 'PENDING') 
        },
        { 
          id: 'IN_PROGRESS', 
          title: 'In Progress', 
          tasks: tasks.filter((t: Task) => t.status === 'IN_PROGRESS') 
        },
        { 
          id: 'COMPLETED', 
          title: 'Completed', 
          tasks: tasks.filter((t: Task) => t.status === 'COMPLETED') 
        },
      ]);
    } catch (error) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;

    const sourceTasks = [...sourceColumn.tasks];
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, movedTask);
      setColumns(columns.map(col => 
        col.id === source.droppableId ? { ...col, tasks: sourceTasks } : col
      ));
    } else {
      const destTasks = [...destColumn.tasks];
      destTasks.splice(destination.index, 0, movedTask);
      
      setColumns(columns.map(col => {
        if (col.id === source.droppableId) return { ...col, tasks: sourceTasks };
        if (col.id === destination.droppableId) return { ...col, tasks: destTasks };
        return col;
      }));

      try {
        await tasksAPI.updateTaskStatus(draggableId, destination.droppableId);
        
        // Show notification when task is moved to COMPLETED
        if (destination.droppableId === 'COMPLETED') {
          const notificationId = Date.now().toString();
          setCenteredNotification({ id: notificationId, message: '🎉 Task completed!' });
          setTimeout(() => {
            setCenteredNotification(prev => prev?.id === notificationId ? null : prev);
          }, 2000);
          feedbackTaskComplete();
        }
      } catch (error) {
        console.error('Failed to update task status');
        loadTasks();
      }
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksAPI.deleteTask(taskId);
      loadTasks();
      showToast('success', 'Đã xóa task!');
    } catch (error) {
      console.error('Failed to delete task');
      showToast('error', 'Xóa task thất bại');
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    // Show notification when task is completed
    if (newStatus === 'COMPLETED') {
      const notificationId = Date.now().toString();
      setCenteredNotification({ id: notificationId, message: '🎉 Task completed!' });
      setTimeout(() => {
        setCenteredNotification(prev => prev?.id === notificationId ? null : prev);
      }, 2000);
      feedbackTaskComplete();
    }
    loadTasks();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleModalSuccess = () => {
    loadTasks();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-text-muted mt-1">Organize your tasks with Kanban board</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={column.tasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))}
          </DragDropContext>
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        onTaskCreated={() => {}}
        showToast={showToast}
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

      {/* Toast notifications - top-right */}
      <div className="fixed top-4 right-4 z-[70] space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
