import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, Calendar, Check, Eye } from 'lucide-react';
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

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  highlightedTaskId?: string | null;
}

export default function TaskCard({ task, index, onEdit, onDelete, onStatusChange, highlightedTaskId }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Check if this task is the highlighted one
  const isHighlighted = highlightedTaskId === task.id;
  
  // Scroll to highlighted task when it appears
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isHighlighted]);

  const isOverdue = () => {
    if (!task.dueDate || task.status === 'COMPLETED') return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleting) return;

    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    
    setIsCompleting(true);
    
    if (newStatus === 'COMPLETED') {
      setJustCompleted(true);
      setTimeout(() => {
        setJustCompleted(false);
      }, 600);
    }
    
    try {
      await tasksAPI.updateTaskStatus(task.id, newStatus);
      if (onStatusChange) {
        onStatusChange(task.id, newStatus);
      }
    } catch (error) {
      console.error('Failed to update task status');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        group relative p-4 rounded-xl bg-background-card border border-glass-border
        transition-all duration-300 ease-out
        hover:border-primary-500/30 hover:bg-background-cardHover hover:shadow-lg hover:scale-[1.02]
        ${task.status === 'COMPLETED' ? 'opacity-75' : ''}
        ${justCompleted ? 'animate-complete-task' : ''}
        ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background-card animate-pulse' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Highlight indicator */}
      {isHighlighted && (
        <div className="absolute -top-2 -right-2 z-20">
          <span className="flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 items-center justify-center text-xs">
              ✨
            </span>
          </span>
        </div>
      )}

      <div 
        className={`
          absolute top-3 right-3 flex gap-1 transition-all duration-200 z-10
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'}
          ${task.status === 'COMPLETED' ? 'cursor-not-allowed' : ''}
        `}
      >
        {task.status !== 'COMPLETED' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1.5 rounded-lg bg-black/20 dark:bg-white/10 hover:bg-primary-500/30 text-text-muted hover:text-primary-400 transition-all"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className={`p-1.5 rounded-lg bg-black/20 dark:bg-white/10 hover:bg-red-500/30 text-text-muted hover:text-red-400 transition-all ${task.status === 'COMPLETED' ? 'opacity-50' : ''}`}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className={`
              mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
              transition-all duration-300 ease-out cursor-pointer
              ${task.status === 'COMPLETED' 
                ? 'bg-primary-500 border-primary-500 scale-100' 
                : 'border-text-muted hover:border-primary-500 hover:scale-110'
              }
              ${isCompleting ? 'animate-pulse' : ''}
            `}
            title={task.status === 'COMPLETED' ? 'Click to mark as incomplete' : 'Mark as complete'}
          >
            {task.status === 'COMPLETED' && (
              <Check size={12} className="text-white animate-checkmark" strokeWidth={3} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 
              className={`
                font-semibold text-text-primary line-clamp-2 transition-all duration-300
                ${task.status === 'COMPLETED' ? 'line-through opacity-60' : ''}
                ${isHighlighted ? 'text-yellow-600 dark:text-yellow-400' : ''}
              `}
            >
              {task.title}
            </h4>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-text-muted line-clamp-2 pl-8">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-3 pl-8">
          {task.milestone?.vision && (
            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
              <Eye size={10} className="inline mr-1" />
              {task.milestone.vision.title}
            </span>
          )}

          {task.milestone && (
            <span className="text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full">
              📌 {task.milestone.title}
            </span>
          )}

          {task.createdAt && (
            <span className="text-xs text-text-muted">
              Created: {formatDate(task.createdAt)}
            </span>
          )}

          {task.dueDate && (
            <span 
              className={`
                inline-flex items-center gap-1 text-xs
                ${isOverdue() ? 'text-red-400 font-medium' : 'text-text-muted'}
              `}
            >
              <Calendar size={12} />
              {formatDate(task.dueDate)}
              {isOverdue() && <span className="text-red-400">(Overdue)</span>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
