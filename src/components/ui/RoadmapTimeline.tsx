import React from 'react';

interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  status: string;
  progress: number;
  habits: { id: string; title: string }[];
}

interface RoadmapTimelineProps {
  roadmap: Milestone[];
  today: Date;
}

const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ roadmap, today }) => {
  if (!roadmap || roadmap.length === 0) {
    return (
      <div className="text-center text-text-muted">
        No milestones for this vision.
      </div>
    );
  }

  // Sort roadmap by targetDate (already sorted from backend)
  const sortedRoadmap = [...roadmap].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  // Find position for "You are here"
  const todayTime = today.getTime();
  let youAreHereIndex = -1;
  for (let i = 0; i < sortedRoadmap.length - 1; i++) {
    const currentDate = new Date(sortedRoadmap[i].targetDate).getTime();
    const nextDate = new Date(sortedRoadmap[i + 1].targetDate).getTime();
    if (todayTime >= currentDate && todayTime <= nextDate) {
      youAreHereIndex = i;
      break;
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-text-secondary font-medium">Roadmap Timeline</h3>
      <div className="relative flex items-center justify-between">
        {sortedRoadmap.map((milestone, index) => {
          const isCompleted = milestone.status === 'COMPLETED';
          const color = isCompleted ? 'bg-green-500' : 'bg-gray-400';
          const tooltip = milestone.habits.map(h => h.title).join(', ') || 'No habits';

          return (
            <React.Fragment key={milestone.id}>
              {/* Milestone Node */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full ${color} text-white text-sm font-bold`}
                title={tooltip}
              >
                {isCompleted ? '✓' : milestone.progress + '%'}
              </div>

              {/* Milestone Info */}
              <div className="absolute top-10 text-center">
                <p className="text-xs font-medium text-text-primary">{milestone.title}</p>
                <p className="text-xs text-text-muted">
                  {new Date(milestone.targetDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Connecting Line */}
              {index < sortedRoadmap.length - 1 && (
                <div
                  className={`flex-1 h-1 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  style={{
                    backgroundImage: isCompleted ? 'none' : 'repeat(4px, 2px)',
                    backgroundColor: isCompleted ? '#22c55e' : '#d1d5db',
                  }}
                />
              )}

              {/* You are here marker */}
              {youAreHereIndex === index && (
                <div className="absolute -bottom-6 text-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mx-auto mb-1"></div>
                  <p className="text-xs text-text-primary">You are here</p>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapTimeline;
