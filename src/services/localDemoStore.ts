import type { Habit, HabitEntry, Profile } from '../types/database';
import { addDays, getTodayISO } from '../utils/dateUtils';

const STORAGE_KEYS = {
  USER: 'habitflow_demo_user',
  PROFILE: 'habitflow_demo_profile',
  HABITS: 'habitflow_demo_habits',
  ENTRIES: 'habitflow_demo_entries',
};

export const DEMO_USER = {
  id: 'demo-user-12345',
  email: 'alex@habitflow.app',
};

const DEFAULT_PROFILE: Profile = {
  id: DEMO_USER.id,
  display_name: 'Alex Rivera',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  theme: 'light',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Creates curated starter habits for demo exploration
 */
export function getStarterHabits(userId: string): Habit[] {
  const today = getTodayISO();
  const startDate = addDays(today, -14); // 2 weeks ago

  return [
    {
      id: 'demo-habit-1',
      user_id: userId,
      title: 'Morning Exercise',
      description: 'Cardio, stretching, or brisk walk to start the morning with energy.',
      category: 'Fitness',
      icon: 'activity',
      color: '#244C3A',
      schedule: { type: 'daily' },
      target_value: 20,
      target_unit: 'minutes',
      start_date: startDate,
      archived_at: null,
      created_at: `${startDate}T07:00:00Z`,
      updated_at: `${startDate}T07:00:00Z`,
    },
    {
      id: 'demo-habit-2',
      user_id: userId,
      title: 'Read a Book',
      description: 'Daily nonfiction or self-improvement reading.',
      category: 'Learning',
      icon: 'book-open',
      color: '#18372B',
      schedule: { type: 'daily' },
      target_value: 10,
      target_unit: 'pages',
      start_date: startDate,
      archived_at: null,
      created_at: `${startDate}T07:00:00Z`,
      updated_at: `${startDate}T07:00:00Z`,
    },
    {
      id: 'demo-habit-3',
      user_id: userId,
      title: 'Practice Coding',
      description: 'Work on personal projects and algorithm problem solving.',
      category: 'Productivity',
      icon: 'code',
      color: '#7FA58A',
      schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] }, // Mon-Fri
      target_value: 30,
      target_unit: 'minutes',
      start_date: startDate,
      archived_at: null,
      created_at: `${startDate}T07:00:00Z`,
      updated_at: `${startDate}T07:00:00Z`,
    },
    {
      id: 'demo-habit-4',
      user_id: userId,
      title: 'Practice English',
      description: 'Speaking, vocabulary, or listening practice.',
      category: 'Learning',
      icon: 'languages',
      color: '#C77B5B',
      schedule: { type: 'weekdays', days: [1, 3, 5] }, // Mon, Wed, Fri
      target_value: 15,
      target_unit: 'minutes',
      start_date: startDate,
      archived_at: null,
      created_at: `${startDate}T07:00:00Z`,
      updated_at: `${startDate}T07:00:00Z`,
    },
  ];
}

/**
 * Generates initial demo entries to show rich historical data in calendar and charts
 */
export function getStarterEntries(userId: string, habits: Habit[]): HabitEntry[] {
  const today = getTodayISO();
  const entries: HabitEntry[] = [];

  // Generate completions for the past 14 days
  for (let i = 14; i >= 0; i--) {
    const date = addDays(today, -i);
    for (const habit of habits) {
      // Create entries with plausible realistic consistency (~70-80% completion)
      const shouldComplete = (i + habit.title.length) % 4 !== 0;
      if (shouldComplete) {
        entries.push({
          id: `entry-${habit.id}-${date}`,
          user_id: userId,
          habit_id: habit.id,
          entry_date: date,
          completed: true,
          progress_value: habit.target_value,
          completed_at: `${date}T19:30:00Z`,
          created_at: `${date}T19:30:00Z`,
          updated_at: `${date}T19:30:00Z`,
        });
      }
    }
  }

  return entries;
}

export class LocalDemoStore {
  static getStoredUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : DEMO_USER;
  }

  static setStoredUser(user: { id: string; email: string } | null) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }

  static getProfile(userId: string): Profile {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    const profile = { ...DEFAULT_PROFILE, id: userId };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    return profile;
  }

  static updateProfile(profile: Partial<Profile>): Profile {
    const current = this.getProfile(profile.id || DEMO_USER.id);
    const updated = {
      ...current,
      ...profile,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  }

  static getHabits(userId: string): Habit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (raw) {
      try {
        const list: Habit[] = JSON.parse(raw);
        return list.filter((h) => h.user_id === userId);
      } catch {
        // fallback
      }
    }
    const starters = getStarterHabits(userId);
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(starters));
    return starters;
  }

  static saveHabits(habits: Habit[]) {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }

  static getEntries(userId: string): HabitEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (raw) {
      try {
        const list: HabitEntry[] = JSON.parse(raw);
        return list.filter((e) => e.user_id === userId);
      } catch {
        // fallback
      }
    }
    const habits = this.getHabits(userId);
    const starters = getStarterEntries(userId, habits);
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(starters));
    return starters;
  }

  static saveEntries(entries: HabitEntry[]) {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  }

  static resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  }
}
