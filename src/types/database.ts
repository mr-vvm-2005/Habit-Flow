export type HabitCategory =
  | 'Health'
  | 'Fitness'
  | 'Learning'
  | 'Productivity'
  | 'Personal'
  | 'Other';

export type ScheduleType = 'daily' | 'weekdays' | 'frequency';

export interface Schedule {
  type: ScheduleType;
  days?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  frequency?: {
    times: number;
    per: 'week';
  };
}

export interface Profile {
  id: string;
  display_name: string;
  timezone: string;
  theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: HabitCategory;
  icon: string;
  color: string;
  schedule: Schedule;
  target_value: number | null;
  target_unit: string | null;
  start_date: string; // YYYY-MM-DD
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitEntry {
  id: string;
  user_id: string;
  habit_id: string;
  entry_date: string; // YYYY-MM-DD
  completed: boolean;
  progress_value: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitWithStatus extends Habit {
  completedToday: boolean;
  isScheduledToday: boolean;
  currentStreak: number;
  longestStreak: number;
  todayEntry?: HabitEntry;
}

export interface DailySummary {
  date: string;
  totalScheduled: number;
  completedCount: number;
  completionRate: number; // 0 - 100
}

export interface PeriodSummary {
  periodLabel: string;
  totalScheduledOccurrences: number;
  completedOccurrences: number;
  completionRate: number;
}
