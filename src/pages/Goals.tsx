import { useState, useEffect } from 'react';
import IconPicker from '../components/ui/IconPicker';
import { goalsAPI, tasksAPI } from '../services/api';

// Frequency label helper
const frequencyLabel = (freq: string) => {
  switch (freq) {
    case 'DAILY': return 'Daily';
    case 'WEEKLY': return 'Weekly';
    case 'MONTHLY': return 'Monthly';
    default: return freq;
  }
};

interface Vision {
  id: string;
  title: string;
  icon?: string;
  description?: string;
  targetDate?: string;
  progress?: number;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  icon?: string;
  description?: string;
  status: string;
  targetDate?: string;
  progress?: number;
  habits: Habit[];
  tasks: Task[];
}

interface Habit {
  id: string;
  title: string;
  frequency: string;
  isActive: boolean;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  createdAt?: string;
  completedAt?: string;
  habit?: Habit;
  milestone?: Milestone;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Vision Card Component
interface VisionCardProps {
  vision: Vision;
  onMilestoneCreated: () => void;
  onEditVision: (vision: Vision) => void;
  onViewMilestones: (vision: Vision) => void;
  showToast: (type: Toast['type'], message: string) => void;
}

function VisionCard({ vision, onMilestoneCreated, onEditVision, onViewMilestones, showToast }: VisionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await goalsAPI.deleteVision(vision.id);
      onMilestoneCreated();
      showToast('success', 'Vision deleted successfully!');
    } catch (error) {
      showToast('error', 'Failed to delete vision');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
            {vision.icon || '🎯'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{vision.title}</h3>
            {vision.targetDate && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Target: {new Date(vision.targetDate).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onEditVision(vision);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleDelete();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {vision.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">{vision.description}</p>
      )}

      {typeof vision.progress === 'number' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {vision.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-2 bg-primary-500 rounded-full transition-all"
              style={{ width: `${Math.min(Math.max(vision.progress, 0), 100)}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {vision.milestones?.length || 0} milestones
          </span>
        </div>
        <button
          onClick={() => onViewMilestones(vision)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  onCreateVision: () => void;
}

function EmptyState({ onCreateVision }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
        <span className="text-4xl">🎯</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No visions yet</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        Create your first vision to start tracking your long-term goals and milestones
      </p>
      <button
        onClick={onCreateVision}
        className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Create Vision
      </button>
    </div>
  );
}

export default function Goals() {
  const [visions, setVisions] = useState<Vision[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showViewMilestonesModal, setShowViewMilestonesModal] = useState(false);
  const [selectedVisionId, setSelectedVisionId] = useState<string>('');
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);
  const [newVision, setNewVision] = useState({ title: '', icon: '', description: '', targetDate: '' });
  const [newMilestone, setNewMilestone] = useState({ title: '', icon: '', description: '', targetDate: '' });
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingVision, setEditingVision] = useState<{ id: string; title: string; icon: string; description: string; targetDate: string } | null>(null);
  
  const [isEditMilestone, setIsEditMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{ id: string; title: string; icon: string; description: string; targetDate: string } | null>(null);
  
  const [showDeleteMilestoneModal, setShowDeleteMilestoneModal] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<Milestone | null>(null);
  const [milestoneDeleteLoading, setMilestoneDeleteLoading] = useState(false);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskDeleteLoading, setTaskDeleteLoading] = useState(false);
  
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
  });
  const [taskDateError, setTaskDateError] = useState('');
  
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);

  const [visionDateError, setVisionDateError] = useState('');
  const [milestoneDateError, setMilestoneDateError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const validateDate = (date: string): boolean => {
    if (!date) return true;
    const selectedDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= currentDate;
  };

  useEffect(() => {
    loadVisions();
  }, []);

  const loadVisions = async () => {
    try {
      const response = await goalsAPI.getVisions();
      setVisions(response.data);
    } catch (error) {
      console.error('Failed to load visions');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: Toast['type'], message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleCreateVision = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newVision.targetDate && !validateDate(newVision.targetDate)) {
      setVisionDateError('Ngày không được nhỏ hơn ngày hiện tại');
      return;
    }
    
    try {
      await goalsAPI.createVision({
        title: newVision.title,
        icon: newVision.icon || undefined,
        description: newVision.description || undefined,
        targetDate: newVision.targetDate || undefined,
      });
      setShowCreateModal(false);
      setNewVision({ title: '', icon: '', description: '', targetDate: '' });
      setVisionDateError('');
      loadVisions();
      showToast('success', 'Vision created successfully!');
    } catch (error) {
      console.error('Failed to create vision');
      showToast('error', 'Failed to create vision');
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMilestone.targetDate && !validateDate(newMilestone.targetDate)) {
      setMilestoneDateError('Ngày không được nhỏ hơn ngày hiện tại');
      return;
    }
    
    setMilestoneLoading(true);
    try {
      await goalsAPI.createMilestone({
        visionId: selectedVisionId,
        title: newMilestone.title,
        icon: newMilestone.icon || undefined,
        description: newMilestone.description || undefined,
        targetDate: newMilestone.targetDate || undefined,
      });
      setShowMilestoneModal(false);
      setNewMilestone({ title: '', icon: '', description: '', targetDate: '' });
      setSelectedVisionId('');
      setMilestoneDateError('');
      setIsEditMilestone(false);
      setEditingMilestone(null);
      loadVisions();
      showToast('success', 'Milestone created successfully!');
    } catch (error) {
      console.error('Failed to create milestone');
      showToast('error', 'Failed to create milestone');
    } finally {
      setMilestoneLoading(false);
    }
  };

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMilestone) return;
    
    if (editingMilestone.targetDate && !validateDate(editingMilestone.targetDate)) {
      setMilestoneDateError('Ngày không được nhỏ hơn ngày hiện tại');
      return;
    }
    
    setMilestoneLoading(true);
    try {
      await goalsAPI.updateMilestone(editingMilestone.id, {
        title: editingMilestone.title,
        icon: editingMilestone.icon || undefined,
        description: editingMilestone.description || undefined,
        targetDate: editingMilestone.targetDate || undefined,
      });
      setShowMilestoneModal(false);
      setNewMilestone({ title: '', icon: '', description: '', targetDate: '' });
      setSelectedVisionId('');
      setMilestoneDateError('');
      setIsEditMilestone(false);
      setEditingMilestone(null);
      loadVisions();
      showToast('success', 'Milestone updated successfully!');
    } catch (error) {
      console.error('Failed to update milestone');
      showToast('error', 'Failed to update milestone');
    } finally {
      setMilestoneLoading(false);
    }
  };

  const openDeleteMilestoneModal = (milestone: Milestone) => {
    setMilestoneToDelete(milestone);
    setShowDeleteMilestoneModal(true);
  };

  const confirmDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setMilestoneDeleteLoading(true);
    try {
      await goalsAPI.deleteMilestone(milestoneToDelete.id);
      setShowDeleteMilestoneModal(false);
      setMilestoneToDelete(null);
      loadVisions();
      showToast('success', 'Milestone deleted successfully!');
    } catch (error) {
      console.error('Failed to delete milestone');
      showToast('error', 'Failed to delete milestone');
    } finally {
      setMilestoneDeleteLoading(false);
    }
  };

  const closeDeleteMilestoneModal = () => {
    setShowDeleteMilestoneModal(false);
    setMilestoneToDelete(null);
  };

  const openMilestoneModal = (visionId: string, milestone?: Milestone) => {
    setShowViewMilestonesModal(false);
    
    setSelectedVisionId(visionId);
    if (milestone) {
      setIsEditMilestone(true);
      setEditingMilestone({
        id: milestone.id,
        title: milestone.title,
        icon: milestone.icon || '',
        description: milestone.description || '',
        targetDate: milestone.targetDate || ''
      });
      setNewMilestone({ title: '', icon: '', description: '', targetDate: '' });
    } else {
      setIsEditMilestone(false);
      setEditingMilestone(null);
      setNewMilestone({ title: '', icon: '', description: '', targetDate: '' });
    }
    setMilestoneDateError('');
    setShowMilestoneModal(true);
  };

  const openEditVisionModal = (vision: Vision) => {
    setSelectedVision(vision);
    setEditingVision({
      id: vision.id,
      title: vision.title,
      icon: vision.icon || '',
      description: vision.description || '',
      targetDate: vision.targetDate || ''
    });
    setIsEditMode(true);
    setShowCreateModal(true);
  };

  const openViewMilestonesModal = (vision: Vision) => {
    setSelectedVision(vision);
    setExpandedMilestoneId(null);
    setShowViewMilestonesModal(true);
  };

  const toggleMilestoneExpand = (milestoneId: string) => {
    setExpandedMilestoneId(prev => prev === milestoneId ? null : milestoneId);
  };

  const handleUpdateVision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVision) return;
    
    try {
      await goalsAPI.updateVision(editingVision.id, {
        title: editingVision.title,
        icon: editingVision.icon || undefined,
        description: editingVision.description || undefined,
        targetDate: editingVision.targetDate || undefined,
      });
      setShowCreateModal(false);
      setIsEditMode(false);
      setEditingVision(null);
      setSelectedVision(null);
      loadVisions();
      showToast('success', 'Vision updated successfully!');
    } catch (error) {
      console.error('Failed to update vision');
      showToast('error', 'Failed to update vision');
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setIsEditMode(false);
    setEditingVision(null);
    setSelectedVision(null);
    setNewVision({ title: '', icon: '', description: '', targetDate: '' });
  };

  const closeMilestoneModal = () => {
    setShowMilestoneModal(false);
    setIsEditMilestone(false);
    setEditingMilestone(null);
    setNewMilestone({ title: '', icon: '', description: '', targetDate: '' });
    setSelectedVisionId('');
    setMilestoneDateError('');
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setTaskDateError('');
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskFormData({ title: '', description: '', dueDate: '' });
    setTaskDateError('');
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    if (taskFormData.dueDate && !validateDate(taskFormData.dueDate)) {
      setTaskDateError('Ngày không được nhỏ hơn ngày hiện tại');
      return;
    }

    setTaskLoading(true);
    try {
      await tasksAPI.updateTask(editingTask.id, {
        title: taskFormData.title,
        description: taskFormData.description || undefined,
        dueDate: taskFormData.dueDate || undefined,
      });
      closeTaskModal();
      loadVisions();
      showToast('success', 'Task updated successfully!');
    } catch (error) {
      console.error('Failed to update task');
      showToast('error', 'Failed to update task');
    } finally {
      setTaskLoading(false);
    }
  };

  const openDeleteTaskModal = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteTaskModal(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setTaskDeleteLoading(true);
    try {
      await tasksAPI.deleteTask(taskToDelete.id);
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
      loadVisions();
      showToast('success', 'Task deleted successfully!');
    } catch (error) {
      console.error('Failed to delete task');
      showToast('error', 'Failed to delete task');
    } finally {
      setTaskDeleteLoading(false);
    }
  };

  const closeDeleteTaskModal = () => {
    setShowDeleteTaskModal(false);
    setTaskToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-[#12121a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your long-term visions, milestones, and habits</p>
            </div>
            <button 
              onClick={() => {
                setIsEditMode(false);
                setEditingVision(null);
                setNewVision({ title: '', icon: '', description: '', targetDate: '' });
                setShowCreateModal(true);
              }} 
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 active:scale-95 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Vision
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : visions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visions.map(vision => (
              <VisionCard 
                key={vision.id} 
                vision={vision} 
                onMilestoneCreated={loadVisions} 
                onEditVision={openEditVisionModal}
                onViewMilestones={openViewMilestonesModal}
                showToast={showToast}
              />
            ))}
          </div>
        ) : (
          <EmptyState onCreateVision={() => {
            setIsEditMode(false);
            setEditingVision(null);
            setNewVision({ title: '', icon: '', description: '', targetDate: '' });
            setShowCreateModal(true);
          }} />
        )}
      </div>

      {/* Create/Edit Vision Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={closeCreateModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isEditMode ? 'Edit Vision' : 'Create New Vision'}
            </h2>
            <form onSubmit={isEditMode ? handleUpdateVision : handleCreateVision} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vision Title</label>
                <input
                  type="text"
                  value={isEditMode ? (editingVision?.title || '') : newVision.title}
                  onChange={(e) => isEditMode 
                    ? setEditingVision(prev => prev ? { ...prev, title: e.target.value } : null)
                    : setNewVision({ ...newVision, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., Become a Senior Automation Tester"
                  required
                />
              </div>
              <IconPicker
                value={isEditMode ? (editingVision?.icon || '') : newVision.icon}
                onChange={(icon) => isEditMode 
                  ? setEditingVision(prev => prev ? { ...prev, icon } : null)
                  : setNewVision({ ...newVision, icon })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={isEditMode ? (editingVision?.description || '') : newVision.description}
                  onChange={(e) => isEditMode 
                    ? setEditingVision(prev => prev ? { ...prev, description: e.target.value } : null)
                    : setNewVision({ ...newVision, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white h-24"
                  placeholder="Describe your long-term goal..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Date</label>
                <input
                  type="date"
                  value={isEditMode ? (editingVision?.targetDate || '') : newVision.targetDate}
                  onChange={(e) => isEditMode 
                    ? setEditingVision(prev => prev ? { ...prev, targetDate: e.target.value } : null)
                    : setNewVision({ ...newVision, targetDate: e.target.value })
                  }
                  min={today}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white ${visionDateError ? 'border-red-500' : ''}`}
                />
                {visionDateError && (
                  <p className="mt-1 text-sm text-red-500">{visionDateError}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeCreateModal} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                  {isEditMode ? 'Save Changes' : 'Create Vision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={closeMilestoneModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {isEditMilestone ? 'Edit Milestone' : 'Create New Milestone'}
            </h2>
            <form onSubmit={isEditMilestone ? handleUpdateMilestone : handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Milestone Title</label>
                <input
                  type="text"
                  value={isEditMilestone ? (editingMilestone?.title || '') : newMilestone.title}
                  onChange={(e) => isEditMilestone 
                    ? setEditingMilestone(prev => prev ? { ...prev, title: e.target.value } : null)
                    : setNewMilestone({ ...newMilestone, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., Learn Automation Basics"
                  required
                />
              </div>
              <IconPicker
                value={isEditMilestone ? (editingMilestone?.icon || '') : newMilestone.icon}
                onChange={(icon) => isEditMilestone 
                  ? setEditingMilestone(prev => prev ? { ...prev, icon } : null)
                  : setNewMilestone({ ...newMilestone, icon })
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={isEditMilestone ? (editingMilestone?.description || '') : newMilestone.description}
                  onChange={(e) => isEditMilestone 
                    ? setEditingMilestone(prev => prev ? { ...prev, description: e.target.value } : null)
                    : setNewMilestone({ ...newMilestone, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white h-24"
                  placeholder="Describe your milestone..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Date</label>
                <input
                  type="date"
                  value={isEditMilestone ? (editingMilestone?.targetDate || '') : newMilestone.targetDate}
                  onChange={(e) => isEditMilestone 
                    ? setEditingMilestone(prev => prev ? { ...prev, targetDate: e.target.value } : null)
                    : setNewMilestone({ ...newMilestone, targetDate: e.target.value })
                  }
                  min={today}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white ${milestoneDateError ? 'border-red-500' : ''}`}
                />
                {milestoneDateError && (
                  <p className="mt-1 text-sm text-red-500">{milestoneDateError}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={closeMilestoneModal}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={milestoneLoading}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {milestoneLoading ? 'Saving...' : (isEditMilestone ? 'Save Changes' : 'Create Milestone')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Milestones Modal with Expandable Tasks */}
      {showViewMilestonesModal && selectedVision && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowViewMilestonesModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>Goals</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 dark:text-white font-medium">{selectedVision.title}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Milestones</span>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Milestones</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedVision.milestones?.length || 0} milestones</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowViewMilestonesModal(false);
                    openMilestoneModal(selectedVision.id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
                <button 
                  onClick={() => setShowViewMilestonesModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Milestones List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedVision.milestones?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No milestones yet</p>
                  <button 
                    onClick={() => {
                      setShowViewMilestonesModal(false);
                      openMilestoneModal(selectedVision.id);
                    }}
                    className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Create your first milestone
                  </button>
                </div>
              ) : (
                selectedVision.milestones?.map(milestone => (
                  <div 
                    key={milestone.id}
                    className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleMilestoneExpand(milestone.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xl">
                          {milestone.icon || '🎯'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{milestone.title}</h3>
                          {typeof milestone.progress === 'number' && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Progress: {milestone.progress}%
                            </p>
                          )}
                          {milestone.targetDate && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Target: {new Date(milestone.targetDate).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          milestone.status === 'completed' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : milestone.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {milestone.status === 'in_progress' ? 'In Progress' : milestone.status === 'completed' ? 'Completed' : 'Not Started'}
                        </span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 text-gray-400 transition-transform ${expandedMilestoneId === milestone.id ? 'rotate-180' : ''}`}
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    
                    {expandedMilestoneId === milestone.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {milestone.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{milestone.description}</p>
                        )}
                        
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openMilestoneModal(selectedVision.id, milestone);
                            }}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteMilestoneModal(milestone);
                            }}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                        
                        {/* Habits Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Habits</h4>
                          </div>
                          {milestone.habits && milestone.habits.length > 0 ? (
                            milestone.habits.map(habit => (
                              <div 
                                key={habit.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={habit.isActive}
                                    onChange={() => {}}
                                    className="rounded border-gray-300"
                                  />
                                  <span className={`text-sm ${habit.isActive ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {habit.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {frequencyLabel(habit.frequency)}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">No habits yet</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Milestone Modal */}
      {showDeleteMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={closeDeleteMilestoneModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Milestone</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{milestoneToDelete?.title}"? This will also delete all associated tasks.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={closeDeleteMilestoneModal}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteMilestone}
                disabled={milestoneDeleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {milestoneDeleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={closeTaskModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Edit Task</h2>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Title</label>
                <input
                  type="text"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  placeholder="e.g., Complete Selenium course"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white h-24"
                  placeholder="Describe your task..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={taskFormData.dueDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  min={today}
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white ${taskDateError ? 'border-red-500' : ''}`}
                />
                {taskDateError && (
                  <p className="mt-1 text-sm text-red-500">{taskDateError}</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={closeTaskModal}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={taskLoading}
                  className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {taskLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {showDeleteTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={closeDeleteTaskModal}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Task</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete "{taskToDelete?.title}"?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={closeDeleteTaskModal}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteTask}
                disabled={taskDeleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {taskDeleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
