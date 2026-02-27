import { useState, useEffect } from 'react';
import { goalsAPI } from '../../services/api';

interface ActivityData {
  date: string;
  completed: boolean;
}

interface ActivityHeatmapProps {
  habitId: string;
}

export default function ActivityHeatmap({ habitId }: ActivityHeatmapProps) {
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, [habitId]);

  const loadActivity = async () => {
    try {
      const response = await goalsAPI.getHabitActivity(habitId, 30);
      setActivity(response.data);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get today date string for comparison
  const today = new Date().toISOString().split('T')[0];

  // Calculate streak intensity
  const getStreakIntensity = (index: number): number => {
    if (!activity[index]?.completed) return 0;
    
    let streak = 0;
    for (let i = index; i >= 0; i--) {
      if (activity[i]?.completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Get color based on completion and streak
  const getCellColor = (index: number): string => {
    const data = activity[index];
    if (!data?.completed) return 'bg-gray-100 dark:bg-gray-700';
    
    const streak = getStreakIntensity(index);
    if (streak >= 3) return 'bg-emerald-600';
    if (streak === 2) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  // Format date for tooltip
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Check if date is in future
  const isFutureDate = (dateStr: string): boolean => {
    return dateStr > today;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Title */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Activity - Last 30 Days
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Consistency over time
        </p>
      </div>

      {/* Heatmap Grid - 10 columns x 3 rows */}
      <div className="grid grid-cols-10 gap-1">
        {activity.map((data, index) => (
          <div
            key={index}
            className={`
              w-6 h-6 rounded-md transition-all duration-200
              ${getCellColor(index)}
              ${isFutureDate(data.date) ? 'opacity-30 cursor-not-allowed' : 'hover:ring-2 hover:ring-primary-400'}
            `}
            title={`${formatDate(data.date)}: ${data.completed ? 'Completed' : 'Missed'}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-400" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span>2+ streak</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-600" />
          <span>3+ streak</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <div className="text-center p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
          <p className="text-lg font-bold text-emerald-500">
            {activity.filter(d => d.completed).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
        </div>
        <div className="text-center p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {30 - activity.filter(d => d.completed).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Missed</p>
        </div>
        <div className="text-center p-2 bg-gray-100 dark:bg-white/5 rounded-lg">
          <p className="text-lg font-bold text-primary-500">
            {Math.round((activity.filter(d => d.completed).length / 30) * 100)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
        </div>
      </div>
    </div>
  );
}
