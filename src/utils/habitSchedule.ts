import { getDayOfWeek } from './dateUtils';
import type { Habit, Schedule } from '../types/database';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Checks if a habit is scheduled to occur on a given calendar date (YYYY-MM-DD)
 */
export function isHabitScheduledOnDate(
  habit: Pick<Habit, 'start_date' | 'archived_at' | 'schedule'>,
  dateStr: string
): boolean {
  // Before start date: not scheduled
  if (dateStr < habit.start_date) {
    return false;
  }

  // After archived date: not scheduled
  if (habit.archived_at) {
    const archiveDateStr = habit.archived_at.slice(0, 10);
    if (dateStr > archiveDateStr) {
      return false;
    }
  }

  const { schedule } = habit;
  if (!schedule || schedule.type === 'daily') {
    return true;
  }

  const dayOfWeek = getDayOfWeek(dateStr);

  if (schedule.type === 'weekdays') {
    const days = schedule.days && schedule.days.length > 0 ? schedule.days : [1, 2, 3, 4, 5];
    return days.includes(dayOfWeek);
  }

  if (schedule.type === 'frequency') {
    // If specific target days were selected, verify against them
    if (schedule.days && schedule.days.length > 0) {
      return schedule.days.includes(dayOfWeek);
    }
    // General weekly frequency allows every day as a valid tracking day
    return true;
  }

  return true;
}

/**
 * Generates an intuitive, readable description for a habit's schedule
 */
export function getScheduleDescription(schedule: Schedule): string {
  if (!schedule || schedule.type === 'daily') {
    return 'Every day';
  }

  if (schedule.type === 'weekdays') {
    const days = schedule.days && schedule.days.length > 0 ? schedule.days : [1, 2, 3, 4, 5];
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) {
      return 'Weekdays (Mon–Fri)';
    }
    if (days.length === 2 && [0, 6].every((d) => days.includes(d))) {
      return 'Weekends';
    }
    return days
      .slice()
      .sort((a, b) => a - b)
      .map((d) => DAY_NAMES[d])
      .join(', ');
  }

  if (schedule.type === 'frequency') {
    const times = schedule.frequency?.times || 3;
    return `${times}x per week`;
  }

  return 'Scheduled';
}
