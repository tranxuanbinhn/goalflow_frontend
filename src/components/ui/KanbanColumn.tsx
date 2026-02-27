import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

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

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

const columnColors: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-500',
    border: 'border-yellow-500/30'
  },
  IN_PROGRESS: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/30'
  },
  COMPLETED: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/30'
  },
  SKIPPED: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-500',
    border: 'border-gray-500/30'
  },
};

export default function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  onEditTask, 
  onDeleteTask,
  onStatusChange
}: KanbanColumnProps) {
  const colors = columnColors[id] || columnColors.PENDING;

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      <div className={`
        flex items-center justify-between p-4 rounded-t-xl
        ${colors.bg} ${colors.text} ${colors.border}
        border-t border-x
      `}>
        <h3 className="font-semibold">{title}</h3>
        <span className={`
          text-sm px-2 py-0.5 rounded-full
          ${colors.bg} ${colors.text}
        `}>
          {tasks.length}
        </span>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-12rem)]
              bg-black/[0.02] dark:bg-white/[0.02]
              border-x border-b border-glass-border rounded-b-xl
              transition-colors duration-200 overflow-y-auto
              ${snapshot.isDraggingOver ? 'bg-primary-500/5 dark:bg-primary-500/10' : ''}
            `}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStatusChange={onStatusChange}
              />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                <p className="text-sm">No tasks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
