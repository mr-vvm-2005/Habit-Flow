import React, { useState } from 'react';
import {
  Check,
  Flame,
  Plus,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitIcon } from '../components/common/HabitIcon';
import { HabitFormModal } from '../components/habits/HabitFormModal';
import { calculateDailySummary } from '../utils/analytics';
import { getTodayISO } from '../utils/dateUtils';
import type { HabitCategory } from '../types/database';

export const DashboardPage: React.FC = () => {
  const { todayHabits, habits, entries, toggleCompletion, createHabit, isLoading } = useHabits();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingStarter, setIsAddingStarter] = useState(false);

  const todayStr = getTodayISO();
  const summary = calculateDailySummary(habits, entries, todayStr);

  const completedCount = summary.completedCount;
  const totalScheduled = summary.totalScheduled;
  const percentage = summary.completionRate;

  // Status message based on completion rate
  let statusMessage = "Let's make today count! Small steps lead to lasting change.";
  if (totalScheduled === 0) {
    statusMessage = 'No habits scheduled for today. Take a mindful break or add a new habit!';
  } else if (percentage === 100) {
    statusMessage = 'Outstanding! You have completed all scheduled habits for today! 🎉';
  } else if (percentage >= 50) {
    statusMessage = 'Great momentum! You are more than halfway through today’s goals.';
  } else if (completedCount > 0) {
    statusMessage = 'Good start! Keep going to maintain your streaks.';
  }

  const starterHabitsList: Array<{
    title: string;
    description: string;
    category: HabitCategory;
    icon: string;
    color: string;
    target_value: number;
    target_unit: string;
  }> = [
    {
      title: 'Morning Exercise',
      description: '20 minutes of movement, jogging, or stretching.',
      category: 'Fitness',
      icon: 'activity',
      color: '#244C3A',
      target_value: 20,
      target_unit: 'minutes',
    },
    {
      title: 'Read a Book',
      description: 'Read 10 pages of insightful literature.',
      category: 'Learning',
      icon: 'book-open',
      color: '#18372B',
      target_value: 10,
      target_unit: 'pages',
    },
    {
      title: 'Practice Coding',
      description: '30 minutes building projects or solving coding challenges.',
      category: 'Productivity',
      icon: 'code',
      color: '#7FA58A',
      target_value: 30,
      target_unit: 'minutes',
    },
    {
      title: 'Practice English',
      description: '15 minutes of speaking, reading, or vocabulary.',
      category: 'Learning',
      icon: 'languages',
      color: '#C77B5B',
      target_value: 15,
      target_unit: 'minutes',
    },
  ];

  const handleAddStarterHabit = async (starter: (typeof starterHabitsList)[0]) => {
    setIsAddingStarter(true);
    try {
      await createHabit({
        title: starter.title,
        description: starter.description,
        category: starter.category,
        icon: starter.icon,
        color: starter.color,
        schedule: { type: 'daily' },
        target_value: starter.target_value,
        target_unit: starter.target_unit,
        start_date: todayStr,
      });
    } finally {
      setIsAddingStarter(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3 text-[#737B73]">
          <div className="w-8 h-8 border-3 border-[#244C3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading your daily dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TODAY'S PROGRESS CARD */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#244C3A] dark:text-[#8FBCA0]" />
              Today's Completion
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-bold font-heading text-[#252B27] dark:text-white">
                {percentage}%
              </span>
              <span className="text-sm font-medium text-[#737B73] dark:text-[#A0AAA0]">
                {totalScheduled > 0 ? (
                  <>
                    <strong className="text-[#244C3A] dark:text-[#8FBCA0]">{completedCount}</strong> of{' '}
                    <strong>{totalScheduled}</strong> habits completed
                  </>
                ) : (
                  '0 habits scheduled'
                )}
              </span>
            </div>
          </div>

          {/* Quick Streak Summary Pill */}
          {completedCount > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#DCE8DC]/50 dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0] text-xs font-medium self-start sm:self-auto">
              <Award className="w-4 h-4 text-[#C77B5B]" />
              <span>
                {completedCount === totalScheduled
                  ? 'All goals achieved today!'
                  : `${totalScheduled - completedCount} more to reach 100%`}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-[#F3F1E9] dark:bg-[#222E29] h-3 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-[#244C3A] dark:bg-[#7FA58A] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${totalScheduled > 0 ? percentage : 0}%` }}
          />
        </div>

        {/* Motivational Status Message */}
        <p className="mt-3 text-xs sm:text-sm text-[#737B73] dark:text-[#A0AAA0] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#C77B5B] shrink-0" />
          <span>{statusMessage}</span>
        </p>
      </div>

      {/* TODAY'S HABITS LIST */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold font-heading text-[#252B27] dark:text-[#EDECE6] flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#244C3A] dark:text-[#8FBCA0]" />
              Today's Scheduled Habits
            </h2>
            <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
              Click the checkmark to mark a habit complete or undo
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-[#244C3A] dark:text-[#8FBCA0] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Habit
          </button>
        </div>

        {todayHabits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {todayHabits.map((habit) => (
              <div
                key={habit.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                  habit.completedToday
                    ? 'bg-[#F8F7F2] dark:bg-[#1B2420]/80 border-[#DCE8DC] dark:border-[#284435]'
                    : 'bg-white dark:bg-[#1B2420] border-[#E6E8E0] dark:border-[#2D3D35] hover:border-[#7FA58A] shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Category icon with color */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform"
                    style={{ backgroundColor: habit.color || '#244C3A' }}
                  >
                    <HabitIcon name={habit.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h3
                      className={`text-sm font-semibold truncate transition-all ${
                        habit.completedToday
                          ? 'line-through text-[#737B73] dark:text-[#7A867A]'
                          : 'text-[#252B27] dark:text-white'
                      }`}
                    >
                      {habit.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-[#737B73] dark:text-[#A0AAA0] mt-0.5">
                      {habit.target_value && (
                        <span>
                          {habit.target_value} {habit.target_unit || 'units'}
                        </span>
                      )}
                      {habit.target_value && habit.currentStreak > 0 && <span>•</span>}
                      {habit.currentStreak > 0 && (
                        <span className="flex items-center gap-1 text-[#C77B5B] font-medium">
                          <Flame className="w-3.5 h-3.5 fill-[#C77B5B]" />
                          {habit.currentStreak} day streak
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Completion Checkmark Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleCompletion(habit.id, todayStr)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    habit.completedToday
                      ? 'bg-[#244C3A] text-white shadow-xs hover:bg-[#18372B]'
                      : 'border-2 border-[#E6E8E0] dark:border-[#2D3D35] hover:border-[#244C3A] text-transparent hover:text-[#7FA58A]'
                  }`}
                  aria-label={habit.completedToday ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
                  title={habit.completedToday ? 'Mark Incomplete' : 'Mark Complete'}
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-8 border border-[#E6E8E0] dark:border-[#2D3D35] text-center max-w-xl mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-[#DCE8DC] dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold font-heading text-[#252B27] dark:text-white">
              No habits scheduled for today
            </h3>
            <p className="text-sm text-[#737B73] dark:text-[#A0AAA0] mt-1.5 max-w-md mx-auto">
              Start building your daily routine with small, consistent steps. Create your own habit or pick from our recommended starters below.
            </p>
            <div className="mt-5">
              <button
                onClick={() => setIsModalOpen(true)}
                className="py-2.5 px-5 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Habit</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* RECOMMENDED STARTER HABITS (Optional one-click additions) */}
      {habits.length < 3 && (
        <section className="pt-2">
          <div className="mb-3">
            <h3 className="text-sm font-bold font-heading uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0]">
              Recommended Starter Habits
            </h3>
            <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
              Click any habit below to instantly add it to your tracking list
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {starterHabitsList.map((starter) => {
              const alreadyExists = habits.some(
                (h) => h.title.toLowerCase() === starter.title.toLowerCase()
              );

              return (
                <div
                  key={starter.title}
                  className="p-4 rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#1B2420] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: starter.color }}
                      >
                        <HabitIcon name={starter.icon} className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#F8F7F2] dark:bg-[#222E29] text-[#737B73]">
                        {starter.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#252B27] dark:text-white">
                      {starter.title}
                    </h4>
                    <p className="text-[11px] text-[#737B73] dark:text-[#A0AAA0] mt-1 leading-snug">
                      {starter.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E6E8E0] dark:border-[#2D3D35] flex items-center justify-between">
                    <span className="text-[11px] text-[#737B73]">
                      {starter.target_value} {starter.target_unit}
                    </span>
                    <button
                      type="button"
                      disabled={alreadyExists || isAddingStarter}
                      onClick={() => handleAddStarterHabit(starter)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        alreadyExists
                          ? 'bg-[#DCE8DC]/50 text-[#737B73] cursor-default'
                          : 'bg-[#244C3A] hover:bg-[#18372B] text-white'
                      }`}
                    >
                      {alreadyExists ? 'Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MODAL */}
      <HabitFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data) => {
          await createHabit(data);
        }}
      />
    </div>
  );
};
