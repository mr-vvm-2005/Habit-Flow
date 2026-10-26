import { isHabitScheduledOnDate } from './habitSchedule';
import { addDays, getDateRangeArray, getTodayISO } from './dateUtils';
import type { DailySummary, Habit, HabitEntry, PeriodSummary } from '../types/database';

/**
 * Calculates completion statistics for a single calendar day
 */
export function calculateDailySummary(
  habits: Habit[],
  entries: HabitEntry[],
  dateStr: string
): DailySummary {
  // Only include habits scheduled for this day
  const scheduledHabits = habits.filter((habit) => isHabitScheduledOnDate(habit, dateStr));
  const totalScheduled = scheduledHabits.length;

  if (totalScheduled === 0) {
    return {
      date: dateStr,
      totalScheduled: 0,
      completedCount: 0,
      completionRate: 0,
    };
  }

  // Build entry lookup map for O(1) checking
  const entryMap = new Map<string, boolean>();
  for (const entry of entries) {
    if (entry.entry_date === dateStr && entry.completed) {
      entryMap.set(entry.habit_id, true);
    }
  }

  let completedCount = 0;
  for (const habit of scheduledHabits) {
    if (entryMap.get(habit.id)) {
      completedCount++;
    }
  }

  const completionRate = Math.round((completedCount / totalScheduled) * 100);

  return {
    date: dateStr,
    totalScheduled,
    completedCount,
    completionRate,
  };
}

/**
 * Calculates completion rate across a date range [startDate, endDate],
 * strictly excluding future dates beyond today.
 */
export function calculateRangeSummary(
  habits: Habit[],
  entries: HabitEntry[],
  startDate: string,
  endDate: string,
  periodLabel: string = 'Period'
): PeriodSummary {
  const today = getTodayISO();
  const cappedEndDate = endDate > today ? today : endDate;

  if (startDate > cappedEndDate) {
    return {
      periodLabel,
      totalScheduledOccurrences: 0,
      completedOccurrences: 0,
      completionRate: 0,
    };
  }

  const dates = getDateRangeArray(startDate, cappedEndDate);
  let totalScheduledOccurrences = 0;
  let completedOccurrences = 0;

  // Build lookup: `${habit_id}_${entry_date}` -> completed
  const completedEntries = new Set<string>();
  for (const entry of entries) {
    if (entry.completed) {
      completedEntries.add(`${entry.habit_id}_${entry.entry_date}`);
    }
  }

  for (const date of dates) {
    for (const habit of habits) {
      if (isHabitScheduledOnDate(habit, date)) {
        totalScheduledOccurrences++;
        if (completedEntries.has(`${habit.id}_${date}`)) {
          completedOccurrences++;
        }
      }
    }
  }

  const completionRate =
    totalScheduledOccurrences > 0
      ? Math.round((completedOccurrences / totalScheduledOccurrences) * 100)
      : 0;

  return {
    periodLabel,
    totalScheduledOccurrences,
    completedOccurrences,
    completionRate,
  };
}

/**
 * Calculates current streak and all-time longest streak for a specific habit.
 * 
 * Rules:
 * 1. Streaks only count occurrences that were actually SCHEDULED.
 *    (e.g., A Mon-Wed-Fri habit is NOT penalized on Tuesday or Thursday).
 * 2. Uncompleted today rule:
 *    If today is scheduled and already completed, today counts in the streak.
 *    If today is scheduled but not yet completed, the streak from previous scheduled
 *    days remains valid (the user has until midnight to finish it).
 *    If a past scheduled day was missed, the current streak resets to 0.
 */
export function calculateStreak(
  habit: Habit,
  entries: HabitEntry[],
  asOfDateStr: string = getTodayISO()
): { currentStreak: number; longestStreak: number } {
  // If habit starts after the evaluated date, streak is 0
  if (habit.start_date > asOfDateStr) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Build completed dates set for this habit
  const completedDates = new Set<string>();
  for (const entry of entries) {
    if (entry.habit_id === habit.id && entry.completed) {
      completedDates.add(entry.entry_date);
    }
  }

  // 1. Gather all scheduled dates from habit.start_date up to asOfDateStr
  const allScheduledDates: string[] = [];
  let cur = habit.start_date;
  while (cur <= asOfDateStr) {
    if (isHabitScheduledOnDate(habit, cur)) {
      allScheduledDates.push(cur);
    }
    cur = addDays(cur, 1);
  }

  if (allScheduledDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 2. Calculate Longest Streak historically
  let longestStreak = 0;
  let tempStreak = 0;

  for (const date of allScheduledDates) {
    if (completedDates.has(date)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  // 3. Calculate Current Streak
  // Step backward from the most recent scheduled date
  let currentStreak = 0;
  const lastIndex = allScheduledDates.length - 1;
  const mostRecentScheduledDate = allScheduledDates[lastIndex];

  // Check if today is the most recent scheduled date
  const isMostRecentToday = mostRecentScheduledDate === asOfDateStr;
  const isCompletedToday = completedDates.has(asOfDateStr);

  let startIndex = lastIndex;

  if (isMostRecentToday) {
    if (isCompletedToday) {
      // Completed today -> counts toward streak
      currentStreak = 1;
      startIndex = lastIndex - 1;
    } else {
      // Scheduled today, but not yet completed today:
      // Grace period: today doesn't break yesterday's streak yet. Check backward from previous scheduled day.
      startIndex = lastIndex - 1;
    }
  }

  // Traverse backward from startIndex
  for (let i = startIndex; i >= 0; i--) {
    const scheduledDate = allScheduledDates[i];
    if (completedDates.has(scheduledDate)) {
      currentStreak++;
    } else {
      // Missed a previous scheduled day -> streak stops here
      break;
    }
  }

  // Ensure longestStreak is at least currentStreak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return { currentStreak, longestStreak };
}

/**
 * Ranks habits by their completion performance over the last N days
 */
export function getHabitPerformance(
  habits: Habit[],
  entries: HabitEntry[],
  daysBack: number = 30
): {
  bestHabits: Array<{ habit: Habit; rate: number; totalScheduled: number; completedCount: number }>;
  strugglingHabits: Array<{ habit: Habit; rate: number; totalScheduled: number; completedCount: number }>;
} {
  const today = getTodayISO();
  const startDate = addDays(today, -(daysBack - 1));

  const stats = habits
    .filter((h) => !h.archived_at) // focus on active habits
    .map((habit) => {
      const summary = calculateRangeSummary([habit], entries, startDate, today);
      return {
        habit,
        rate: summary.completionRate,
        totalScheduled: summary.totalScheduledOccurrences,
        completedCount: summary.completedOccurrences,
      };
    })
    .filter((item) => item.totalScheduled > 0);

  // Sort descending by rate
  const sorted = [...stats].sort((a, b) => b.rate - a.rate);

  const bestHabits = sorted.filter((h) => h.rate >= 70);
  const strugglingHabits = sorted.filter((h) => h.rate < 70).reverse(); // lowest first

  return { bestHabits, strugglingHabits };
}
