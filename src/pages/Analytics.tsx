import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import GlassCard from '../components/ui/GlassCard';
import { analyticsAPI } from '../services/api';

interface HeatmapPoint {
  date: string;
  count: number;
}

interface VisionTrendPoint {
  date: string;
  current: number | null;
  ideal: number;
}

interface VisionTrend {
  visionId: string;
  title: string;
  startDate: string;
  targetDate: string;
  currentProgress: number;
  idealProgressToday: number;
  line: VisionTrendPoint[];
}

interface LowHabit {
  habitId: string;
  title: string;
  completionRate: number;
}

interface RoadmapMilestone {
  id: string;
  title: string;
  targetDate: string;
  status: string;
  progress: number;
  habits: { id: string; title: string }[];
}

interface AnalyticsOverview {
  totalVisionProgress: number;
  consistencyScore: number;
  bestStreak: number;
  totalTasksCompleted: number;
  heatmap: HeatmapPoint[];
  visionTrend: VisionTrend | null;
  visions: { id: string; title: string; createdAt: string; targetDate?: string | null; updatedAt: string }[];
  selectedVisionId: string | null;
  lowCompletionHabits: LowHabit[];
  roadmap: RoadmapMilestone[];
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVisionId, setSelectedVisionId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await analyticsAPI.getStats(selectedVisionId || undefined);
        const payload: AnalyticsOverview = res.data;
        setData(payload);

        // Nếu chưa chọn, dùng mặc định từ backend (updatedAt gần nhất hoặc visionId truyền vào hợp lệ)
        if (!selectedVisionId) {
          setSelectedVisionId(payload.selectedVisionId);
        }
      } catch (error) {
        console.error('Failed to load analytics overview');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedVisionId]);

  const heatmapData = data?.heatmap || [];
  const visionTrend = data?.visionTrend || null;
  const lowHabits = data?.lowCompletionHabits || [];
  const roadmap = data?.roadmap || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-text-primary">Analyst</h1>
        <p className="text-text-secondary mt-1">
          High-level overview of your long-term goals and habits
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-black/[0.06] dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data ? (
        <GlassCard className="p-8 text-center">
          <p className="text-text-muted">No data yet. Start creating visions, milestones and habits to see analytics.</p>
        </GlassCard>
      ) : (
        <>
          {/* Top row: 4 metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    Vision Progress
                  </p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">
                    {data.totalVisionProgress}%
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Average completion across all your visions.
              </p>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    Consistency (30 days)
                  </p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">
                    {data.consistencyScore}%
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-xl">📈</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Based on expected vs actual habit completions.
              </p>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    Best Habit Streak
                  </p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">
                    {data.bestStreak}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <span className="text-xl">🔥</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Longest run of consecutive days on any habit.
              </p>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-text-muted">
                    Tasks Completed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-text-primary">
                    {data.totalTasksCompleted}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                  <span className="text-xl">✅</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Total completed tasks across all time.
              </p>
            </GlassCard>
          </div>

          {/* Middle row: Heatmap + Vision trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Heatmap */}
            <GlassCard className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-text-secondary font-medium">Activity Heatmap</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Daily completions (habits + tasks) over the last 12 months.
                  </p>
                </div>
              </div>
              {heatmapData.length === 0 ? (
                <p className="text-sm text-text-muted">No data yet.</p>
              ) : (
                <div className="flex flex-wrap gap-[3px]">
                  {heatmapData.map((d, idx) => {
                    const c = d.count || 0;
                    const intensity =
                      c === 0 ? 0 : c < 2 ? 1 : c < 5 ? 2 : 3;
                    const color =
                      intensity === 0
                        ? 'bg-[var(--heatmap-empty)]'
                        : intensity === 1
                        ? 'bg-[var(--heatmap-level-1)]'
                        : intensity === 2
                        ? 'bg-[var(--heatmap-level-2)]'
                        : 'bg-[var(--heatmap-level-3)]';
                    return (
                      <div
                        key={d.date + idx}
                        className={`w-3 h-3 rounded-[3px] ${color}`}
                        title={`${d.date}: ${c} completions`}
                      />
                    );
                  })}
                </div>
              )}
            </GlassCard>

            {/* Vision trend line chart */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-text-secondary font-medium">
                  Vision Progress Trend
                </h3>
                {data.visions?.length > 0 && (
                  <select
                    value={selectedVisionId || ''}
                    onChange={(e) => setSelectedVisionId(e.target.value || null)}
                    className="text-sm px-3 py-2 rounded-lg bg-black/[0.05] dark:bg-white/10 text-text-primary border border-black/[0.06] dark:border-white/10"
                    title="Select vision"
                  >
                    {data.visions.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {!visionTrend ? (
                <p className="text-sm text-text-muted">
                  No active vision with target date. Create a vision to see trend.
                </p>
              ) : (
                <>
                  <p className="text-sm text-text-primary font-medium mb-2">
                    {visionTrend.title}
                  </p>
                  <p className="text-xs text-text-muted mb-4">
                    {visionTrend.startDate} → {visionTrend.targetDate}
                  </p>
                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={visionTrend.line}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ideal"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Ideal"
                        />
                        <Line
                          type="monotone"
                          dataKey="current"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls={false}
                          name="Actual"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </GlassCard>
          </div>

          {/* Bottom row: Roadmap + low completion habits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          

            <GlassCard className="p-6">
              <h3 className="text-text-secondary font-medium mb-4">
                Habits that need attention
              </h3>
              {lowHabits.length === 0 ? (
                <p className="text-sm text-text-muted">No data yet.</p>
              ) : (
                <div className="space-y-2">
                  {lowHabits.map(habit => (
                    <div
                      key={habit.habitId}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/5"
                    >
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {habit.title}
                        </p>
                        <p className="text-xs text-text-muted">
                          Completion last 30 days
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-black/[0.06] dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-2 bg-red-500 rounded-full"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(100, habit.completionRate),
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-red-500">
                          {habit.completionRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
