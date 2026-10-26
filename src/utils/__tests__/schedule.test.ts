import { describe, it, expect } from 'vitest';
import { isHabitScheduledOnDate, getScheduleDescription } from '../habitSchedule';
import {
  formatDateToISO,
  parseISODate,
  addDays,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
} from '../dateUtils';
import type { Habit } from '../../types/database';

describe('Schedule Logic & Date Utilities', () => {
  const sampleHabit: Habit = {
    id: 'h-1',
    user_id: 'u-1',
    title: 'Code React',
    description: null,
    category: 'Learning',
    icon: 'code',
    color: '#244C3A',
    schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
    target_value: 60,
    target_unit: 'minutes',
    start_date: '2026-10-01',
    archived_at: null,
    created_at: '',
    updated_at: '',
  };

  it('correctly formats and parses ISO dates without timezone drift', () => {
    const originalStr = '2026-10-17';
    const parsed = parseISODate(originalStr);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(9); // 0-indexed month for October
    expect(parsed.getDate()).toBe(17);
    expect(formatDateToISO(parsed)).toBe(originalStr);
  });

  it('correctly calculates week start and end (Monday through Sunday)', () => {
    // 2026-10-17 is a Saturday (day 6)
    // Week start should be Monday 2026-10-12
    // Week end should be Sunday 2026-10-18
    expect(getStartOfWeek('2026-10-17')).toBe('2026-10-12');
    expect(getEndOfWeek('2026-10-17')).toBe('2026-10-18');
  });

  it('correctly identifies month start and end', () => {
    expect(getStartOfMonth(2026, 9)).toBe('2026-10-01'); // October
    expect(getEndOfMonth(2026, 9)).toBe('2026-10-31');
    expect(getStartOfMonth(2026, 1)).toBe('2026-02-01'); // February
    expect(getEndOfMonth(2026, 1)).toBe('2026-02-28');
  });

  it('handles addDays properly', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
  });

  it('determines scheduled status for weekdays vs weekends', () => {
    // 2026-10-16 is Friday (day 5) -> scheduled
    expect(isHabitScheduledOnDate(sampleHabit, '2026-10-16')).toBe(true);
    // 2026-10-17 is Saturday (day 6) -> not scheduled
    expect(isHabitScheduledOnDate(sampleHabit, '2026-10-17')).toBe(false);
  });

  it('respects start_date and archived_at bounds', () => {
    // Before start_date 2026-10-01
    expect(isHabitScheduledOnDate(sampleHabit, '2026-09-30')).toBe(false);

    // After archived_at
    const archivedHabit: Habit = {
      ...sampleHabit,
      archived_at: '2026-10-10T12:00:00Z',
    };
    expect(isHabitScheduledOnDate(archivedHabit, '2026-10-09')).toBe(true);
    expect(isHabitScheduledOnDate(archivedHabit, '2026-10-15')).toBe(false);
  });

  it('formats schedule descriptions clearly', () => {
    expect(getScheduleDescription({ type: 'daily' })).toBe('Every day');
    expect(getScheduleDescription({ type: 'weekdays', days: [1, 2, 3, 4, 5] })).toBe('Weekdays (Mon–Fri)');
    expect(getScheduleDescription({ type: 'weekdays', days: [0, 6] })).toBe('Weekends');
    expect(getScheduleDescription({ type: 'weekdays', days: [1, 3, 5] })).toBe('Mon, Wed, Fri');
    expect(getScheduleDescription({ type: 'frequency', frequency: { times: 4, per: 'week' } })).toBe('4x per week');
  });
});
