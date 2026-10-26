import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { habitService } from '../services/habitService';
import { entryService } from '../services/entryService';
import { getTodayISO } from '../utils/dateUtils';
import type { Habit, HabitEntry, HabitWithStatus } from '../types/database';
import { isHabitScheduledOnDate } from '../utils/habitSchedule';
import { calculateStreak } from '../utils/analytics';

interface HabitContextType {
  habits: Habit[];
  activeHabits: Habit[];
  archivedHabits: Habit[];
  todayHabits: HabitWithStatus[];
  entries: HabitEntry[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createHabit: (data: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'archived_at' | 'user_id'>) => Promise<Habit>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<Habit>;
  archiveHabit: (id: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, dateStr?: string) => Promise<void>;
  updateProgress: (habitId: string, value: number, dateStr?: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [fetchedHabits, fetchedEntries] = await Promise.all([
        habitService.getHabits(user.id, true),
        entryService.getAllEntries(user.id),
      ]);
      setHabits(fetchedHabits);
      setEntries(fetchedEntries);
    } catch (err: unknown) {
      console.error('Failed to load habit data:', err);
      setError('Could not load habits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createHabit = async (data: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'archived_at' | 'user_id'>) => {
    if (!user) throw new Error('Must be authenticated');
    const newHabit = await habitService.createHabit({
      ...data,
      user_id: user.id,
    });
    setHabits((prev) => [...prev, newHabit]);
    return newHabit;
  };

  const updateHabit = async (id: string, data: Partial<Habit>) => {
    if (!user) throw new Error('Must be authenticated');
    const updated = await habitService.updateHabit(id, { ...data, user_id: user.id });
    setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    return updated;
  };

  const archiveHabit = async (id: string) => {
    if (!user) throw new Error('Must be authenticated');
    const archived = await habitService.archiveHabit(id, user.id);
    setHabits((prev) => prev.map((h) => (h.id === id ? archived : h)));
  };

  const restoreHabit = async (id: string) => {
    if (!user) throw new Error('Must be authenticated');
    const restored = await habitService.restoreHabit(id, user.id);
    setHabits((prev) => prev.map((h) => (h.id === id ? restored : h)));
  };

  const deleteHabit = async (id: string) => {
    if (!user) throw new Error('Must be authenticated');
    await habitService.deleteHabit(id, user.id);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setEntries((prev) => prev.filter((e) => e.habit_id !== id));
  };

  const toggleCompletion = async (habitId: string, dateStr: string = getTodayISO()) => {
    if (!user) return;
    const targetHabit = habits.find((h) => h.id === habitId);
    if (!targetHabit) return;

    const currentEntry = entries.find((e) => e.habit_id === habitId && e.entry_date === dateStr);
    const isCurrentlyCompleted = Boolean(currentEntry?.completed);

    // Optimistic UI update
    const nextCompleted = !isCurrentlyCompleted;
    if (nextCompleted) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#244C3A', '#7FA58A', '#C77B5B', '#DCE8DC'],
        });
      } catch {
        // Safe if confetti fails or in non-browser
      }
    }

    try {
      const updatedEntry = await entryService.toggleHabitCompletion(
        user.id,
        habitId,
        dateStr,
        isCurrentlyCompleted,
        targetHabit.target_value
      );

      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.habit_id === habitId && e.entry_date === dateStr);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedEntry;
          return next;
        }
        return [...prev, updatedEntry];
      });
    } catch (err) {
      console.error('Failed to toggle completion:', err);
      // Revert optimistic update by refreshing
      loadData();
    }
  };

  const updateProgress = async (habitId: string, value: number, dateStr: string = getTodayISO()) => {
    if (!user) return;
    const targetHabit = habits.find((h) => h.id === habitId);
    if (!targetHabit) return;

    try {
      const updatedEntry = await entryService.updateHabitProgress(
        user.id,
        habitId,
        dateStr,
        value,
        targetHabit.target_value
      );

      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.habit_id === habitId && e.entry_date === dateStr);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedEntry;
          return next;
        }
        return [...prev, updatedEntry];
      });
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const activeHabits = habits.filter((h) => !h.archived_at);
  const archivedHabits = habits.filter((h) => Boolean(h.archived_at));

  // Build today's enriched habits with streaks and completion states
  const todayISO = getTodayISO();
  const todayHabits: HabitWithStatus[] = activeHabits
    .filter((h) => isHabitScheduledOnDate(h, todayISO))
    .map((habit) => {
      const entry = entries.find((e) => e.habit_id === habit.id && e.entry_date === todayISO);
      const { currentStreak, longestStreak } = calculateStreak(habit, entries, todayISO);
      return {
        ...habit,
        isScheduledToday: true,
        completedToday: Boolean(entry?.completed),
        todayEntry: entry,
        currentStreak,
        longestStreak,
      };
    });

  return (
    <HabitContext.Provider
      value={{
        habits,
        activeHabits,
        archivedHabits,
        todayHabits,
        entries,
        isLoading,
        error,
        refreshData: loadData,
        createHabit,
        updateHabit,
        archiveHabit,
        restoreHabit,
        deleteHabit,
        toggleCompletion,
        updateProgress,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
