import { describe, it, expect } from 'vitest';
import {
  calculateDailySummary,
  calculateRangeSummary,
  calculateStreak,
} from '../analytics';
import type { Habit, HabitEntry } from '../../types/database';

describe('Analytics & Streak Calculations', () => {
  const dummyHabitDaily: Habit = {
    id: 'habit-1',
    user_id: 'user-123',
    title: 'Morning Run',
    description: '3km jog',
    category: 'Fitness',
    icon: 'activity',
    color: '#244C3A',
    schedule: { type: 'daily' },
    target_value: 3,
    target_unit: 'km',
    start_date: '2026-10-01',
    archived_at: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  };

  const dummyHabitMWF: Habit = {
    id: 'habit-2',
    user_id: 'user-123',
    title: 'Weightlifting',
    description: 'Gym workout',
    category: 'Fitness',
    icon: 'dumbbell',
    color: '#18372B',
    schedule: { type: 'weekdays', days: [1, 3, 5] }, // Mon, Wed, Fri
    target_value: 45,
    target_unit: 'mins',
    start_date: '2026-10-01',
    archived_at: null,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  };

  it('calculates daily summary correctly (1 of 2 habits completed = 50%)', () => {
    // 2026-10-05 is a Monday (both habit 1 and 2 are scheduled)
    const testDate = '2026-10-05';
    const entries: HabitEntry[] = [
      {
        id: 'entry-1',
        user_id: 'user-123',
        habit_id: 'habit-1',
        entry_date: testDate,
        completed: true,
        progress_value: 3,
        completed_at: `${testDate}T08:00:00Z`,
        created_at: `${testDate}T08:00:00Z`,
        updated_at: `${testDate}T08:00:00Z`,
      },
      {
        id: 'entry-2',
        user_id: 'user-123',
        habit_id: 'habit-2',
        entry_date: testDate,
        completed: false,
        progress_value: null,
        completed_at: null,
        created_at: `${testDate}T08:00:00Z`,
        updated_at: `${testDate}T08:00:00Z`,
      },
    ];

    const summary = calculateDailySummary([dummyHabitDaily, dummyHabitMWF], entries, testDate);
    expect(summary.totalScheduled).toBe(2);
    expect(summary.completedCount).toBe(1);
    expect(summary.completionRate).toBe(50);
  });

  it('does not count unscheduled habits in daily total (e.g. Tuesday for MWF habit)', () => {
    // 2026-10-06 is a Tuesday (only habit 1 is scheduled)
    const testDate = '2026-10-06';
    const entries: HabitEntry[] = [
      {
        id: 'entry-1',
        user_id: 'user-123',
        habit_id: 'habit-1',
        entry_date: testDate,
        completed: true,
        progress_value: 3,
        completed_at: `${testDate}T08:00:00Z`,
        created_at: `${testDate}T08:00:00Z`,
        updated_at: `${testDate}T08:00:00Z`,
      },
    ];

    const summary = calculateDailySummary([dummyHabitDaily, dummyHabitMWF], entries, testDate);
    expect(summary.totalScheduled).toBe(1);
    expect(summary.completedCount).toBe(1);
    expect(summary.completionRate).toBe(100);
  });

  it('calculates range completion rate accurately', () => {
    // Week from Mon 2026-10-05 to Sun 2026-10-11
    // dummyHabitDaily: 7 occurrences
    // dummyHabitMWF: 3 occurrences (Mon, Wed, Fri)
    // Total scheduled = 10
    const entries: HabitEntry[] = [
      // 5 completed for habit 1
      { id: '1', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-05', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-06', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      { id: '3', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-07', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      { id: '4', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-08', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      { id: '5', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-09', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      // 2 completed for habit 2 (Mon, Wed)
      { id: '6', user_id: 'u', habit_id: 'habit-2', entry_date: '2026-10-05', completed: true, progress_value: 45, completed_at: null, created_at: '', updated_at: '' },
      { id: '7', user_id: 'u', habit_id: 'habit-2', entry_date: '2026-10-07', completed: true, progress_value: 45, completed_at: null, created_at: '', updated_at: '' },
    ];

    const result = calculateRangeSummary(
      [dummyHabitDaily, dummyHabitMWF],
      entries,
      '2026-10-05',
      '2026-10-11'
    );

    expect(result.totalScheduledOccurrences).toBe(10);
    expect(result.completedOccurrences).toBe(7);
    expect(result.completionRate).toBe(70);
  });

  it('correctly calculates streaks for non-daily habits without breaking on unscheduled days', () => {
    // dummyHabitMWF: scheduled Mon (5th), Wed (7th), Fri (9th)
    // Completed on Mon (5th) and Wed (7th).
    // Tested as of Thursday 2026-10-08 (non-scheduled day).
    // Streak should be 2, because Tue and Thu are not scheduled days!
    const entries: HabitEntry[] = [
      { id: '1', user_id: 'u', habit_id: 'habit-2', entry_date: '2026-10-05', completed: true, progress_value: 45, completed_at: null, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u', habit_id: 'habit-2', entry_date: '2026-10-07', completed: true, progress_value: 45, completed_at: null, created_at: '', updated_at: '' },
    ];

    const streakResult = calculateStreak(dummyHabitMWF, entries, '2026-10-08');
    expect(streakResult.currentStreak).toBe(2);
    expect(streakResult.longestStreak).toBe(2);
  });

  it('does not penalize current streak if today is scheduled but not yet completed (grace period)', () => {
    // dummyHabitDaily: completed yesterday (2026-10-10), evaluated on 2026-10-11
    // 2026-10-11 is not yet completed
    const entries: HabitEntry[] = [
      { id: '1', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-08', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-09', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      { id: '3', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-10', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
    ];

    const streakResult = calculateStreak(dummyHabitDaily, entries, '2026-10-11');
    expect(streakResult.currentStreak).toBe(3);
  });

  it('breaks streak when a past scheduled day is missed', () => {
    // Missed 2026-10-09
    const entries: HabitEntry[] = [
      { id: '1', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-07', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-08', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
      // 10-09 missed!
      { id: '4', user_id: 'u', habit_id: 'habit-1', entry_date: '2026-10-10', completed: true, progress_value: 3, completed_at: null, created_at: '', updated_at: '' },
    ];

    const streakResult = calculateStreak(dummyHabitDaily, entries, '2026-10-10');
    expect(streakResult.currentStreak).toBe(1);
    expect(streakResult.longestStreak).toBe(2);
  });
});
