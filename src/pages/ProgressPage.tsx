import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitIcon } from '../components/common/HabitIcon';
import {
  calculateDailySummary,
  calculateRangeSummary,
  calculateStreak,
  getHabitPerformance,
} from '../utils/analytics';
import {
  getTodayISO,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  addDays,
  parseISODate,
} from '../utils/dateUtils';

export const ProgressPage: React.FC = () => {
  const { habits, entries } = useHabits();

  const todayStr = getTodayISO();
  const todayDate = parseISODate(todayStr);

  // 1. Weekly completion summary
  const weeklySummary = useMemo(() => {
    const start = getStartOfWeek(todayStr);
    const end = getEndOfWeek(todayStr);
    return calculateRangeSummary(habits, entries, start, end, 'This Week');
  }, [habits, entries, todayStr]);

  // 2. Monthly completion summary
  const monthlySummary = useMemo(() => {
    const start = getStartOfMonth(todayDate.getFullYear(), todayDate.getMonth());
    const end = getEndOfMonth(todayDate.getFullYear(), todayDate.getMonth());
    return calculateRangeSummary(habits, entries, start, end, 'This Month');
  }, [habits, entries, todayDate]);

  // 3. Current & Longest Streaks across habits
  const streakStats = useMemo(() => {
    let maxCurrentStreak = 0;
    let maxHistoricalStreak = 0;

    for (const habit of habits) {
      const { currentStreak, longestStreak } = calculateStreak(habit, entries, todayStr);
      if (currentStreak > maxCurrentStreak) maxCurrentStreak = currentStreak;
      if (longestStreak > maxHistoricalStreak) maxHistoricalStreak = longestStreak;
    }

    return { maxCurrentStreak, maxHistoricalStreak };
  }, [habits, entries, todayStr]);

  // 4. Weekly Activity Chart Data (Mon - Sun)
  const weeklyChartData = useMemo(() => {
    const startOfWeek = getStartOfWeek(todayStr);
    const data = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const dateStr = addDays(startOfWeek, i);
      const isFuture = dateStr > todayStr;
      const daily = calculateDailySummary(habits, entries, dateStr);

      data.push({
        dayName: days[i],
        date: dateStr,
        Scheduled: isFuture ? 0 : daily.totalScheduled,
        Completed: isFuture ? 0 : daily.completedCount,
        isFuture,
      });
    }

    return data;
  }, [habits, entries, todayStr]);

  // 5. 30-Day Activity Heatmap Grid
  const heatmapData = useMemo(() => {
    const cells = [];
    for (let i = 29; i >= 0; i--) {
      const dateStr = addDays(todayStr, -i);
      const daily = calculateDailySummary(habits, entries, dateStr);
      cells.push({
        dateStr,
        rate: daily.completionRate,
        completed: daily.completedCount,
        scheduled: daily.totalScheduled,
      });
    }
    return cells;
  }, [habits, entries, todayStr]);

  // 6. Habit Rankings (Best vs Low Completion)
  const { bestHabits, strugglingHabits } = useMemo(
    () => getHabitPerformance(habits, entries, 30),
    [habits, entries]
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#244C3A] dark:text-[#8FBCA0]" />
          Progress & Habit Analytics
        </h2>
        <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
          Data-driven metrics computed directly from your Supabase completion records
        </p>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Completion Rate */}
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0] block">
            Weekly Rate
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-heading text-[#244C3A] dark:text-[#8FBCA0]">
              {weeklySummary.totalScheduledOccurrences > 0
                ? `${weeklySummary.completionRate}%`
                : '—'}
            </span>
          </div>
          <p className="text-[11px] text-[#737B73] dark:text-[#A0AAA0] mt-1">
            {weeklySummary.totalScheduledOccurrences > 0 ? (
              `${weeklySummary.completedOccurrences} of ${weeklySummary.totalScheduledOccurrences} completed`
            ) : (
              'No habits scheduled this week'
            )}
          </p>
        </div>

        {/* Monthly Completion Rate */}
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0] block">
            Monthly Rate
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-heading text-[#244C3A] dark:text-[#8FBCA0]">
              {monthlySummary.totalScheduledOccurrences > 0
                ? `${monthlySummary.completionRate}%`
                : '—'}
            </span>
          </div>
          <p className="text-[11px] text-[#737B73] dark:text-[#A0AAA0] mt-1">
            {monthlySummary.totalScheduledOccurrences > 0 ? (
              `${monthlySummary.completedOccurrences} of ${monthlySummary.totalScheduledOccurrences} completed`
            ) : (
              'No habits scheduled this month'
            )}
          </p>
        </div>

        {/* Current Active Streak */}
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#C77B5B]" />
            Current Streak
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-heading text-[#C77B5B]">
              {streakStats.maxCurrentStreak}{' '}
              <span className="text-sm font-normal text-[#737B73]">days</span>
            </span>
          </div>
          <p className="text-[11px] text-[#737B73] dark:text-[#A0AAA0] mt-1">
            Based on scheduled habit occurrences
          </p>
        </div>

        {/* Longest Historical Streak */}
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0] flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-[#244C3A] dark:text-[#8FBCA0]" />
            Longest Streak
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-heading text-[#252B27] dark:text-white">
              {streakStats.maxHistoricalStreak}{' '}
              <span className="text-sm font-normal text-[#737B73]">days</span>
            </span>
          </div>
          <p className="text-[11px] text-[#737B73] dark:text-[#A0AAA0] mt-1">
            Personal all-time consistency record
          </p>
        </div>
      </div>

      {/* WEEKLY ACTIVITY RECHARTS GRAPH */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white">
              Weekly Activity Overview
            </h3>
            <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
              Scheduled habits vs completed habits for the current week
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="dayName" stroke="#737B73" fontSize={12} tickLine={false} />
              <YAxis allowDecimals={false} stroke="#737B73" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1B2420',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Scheduled" fill="#DCE8DC" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Completed" fill="#244C3A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 30-DAY CONSISTENCY HEATMAP */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white">
            30-Day Activity Heatmap
          </h3>
          <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
            Daily consistency pattern across the last month
          </p>
        </div>

        {/* Heatmap grid */}
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-2">
          {heatmapData.map((cell) => {
            let bgClass = 'bg-[#F8F7F2] dark:bg-[#222E29] border border-[#E6E8E0] dark:border-[#2D3D35]';
            if (cell.scheduled > 0) {
              if (cell.rate === 100) bgClass = 'bg-[#244C3A] text-white';
              else if (cell.rate >= 50) bgClass = 'bg-[#7FA58A] text-white';
              else if (cell.rate > 0) bgClass = 'bg-[#DCE8DC] text-[#244C3A]';
              else bgClass = 'bg-red-100 dark:bg-red-950/40 text-red-600';
            }

            return (
              <div
                key={cell.dateStr}
                className={`h-11 rounded-lg p-1.5 flex flex-col justify-between text-[10px] font-medium transition-transform hover:scale-105 cursor-default ${bgClass}`}
                title={`${cell.dateStr}: ${cell.completed}/${cell.scheduled} habits completed (${cell.rate}%)`}
              >
                <span className="opacity-70">{cell.dateStr.slice(8)}</span>
                <span className="font-bold">{cell.scheduled > 0 ? `${cell.rate}%` : '—'}</span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-3 text-xs text-[#737B73]">
          <span>Less</span>
          <div className="flex gap-1">
            <span className="w-3.5 h-3.5 rounded bg-[#F8F7F2] dark:bg-[#222E29] border border-[#E6E8E0]" />
            <span className="w-3.5 h-3.5 rounded bg-[#DCE8DC]" />
            <span className="w-3.5 h-3.5 rounded bg-[#7FA58A]" />
            <span className="w-3.5 h-3.5 rounded bg-[#244C3A]" />
          </div>
          <span>More completed</span>
        </div>
      </div>

      {/* BEST PERFORMING & STRUGGLING HABITS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Habits */}
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
          <h3 className="text-sm font-bold font-heading text-[#252B27] dark:text-white flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Top Performing Habits (30 Days)
          </h3>
          {bestHabits.length > 0 ? (
            <div className="space-y-2.5">
              {bestHabits.slice(0, 5).map(({ habit, rate, completedCount, totalScheduled }) => (
                <div
                  key={habit.id}
                  className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#222E29] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: habit.color || '#244C3A' }}
                    >
                      <HabitIcon name={habit.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-[#252B27] dark:text-white">
                      {habit.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {rate}% ({completedCount}/{totalScheduled})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#737B73] py-4 text-center">
              Complete your daily habits consistently to unlock top performer rankings.
            </p>
          )}
        </div>

        {/* Habits needing attention */}
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
          <h3 className="text-sm font-bold font-heading text-[#252B27] dark:text-white flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
            Habits Needing Attention (&lt; 70%)
          </h3>
          {strugglingHabits.length > 0 ? (
            <div className="space-y-2.5">
              {strugglingHabits.slice(0, 5).map(({ habit, rate, completedCount, totalScheduled }) => (
                <div
                  key={habit.id}
                  className="p-3 rounded-xl bg-[#F8F7F2] dark:bg-[#222E29] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: habit.color || '#244C3A' }}
                    >
                      <HabitIcon name={habit.icon} className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-[#252B27] dark:text-white">
                      {habit.title}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#D97706]">
                    {rate}% ({completedCount}/{totalScheduled})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#737B73] py-4 text-center">
              🎉 Excellent routine management! No habits currently have a low completion rate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
