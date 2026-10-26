import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalDemoStore } from './localDemoStore';
import type { HabitEntry } from '../types/database';

export const entryService = {
  async getEntriesForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitEntry[]> {
    if (!isSupabaseConfigured || !supabase) {
      const all = LocalDemoStore.getEntries(userId);
      return all.filter((e) => e.entry_date >= startDate && e.entry_date <= endDate);
    }

    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);

      if (error) throw error;
      return (data as HabitEntry[]) || [];
    } catch (err) {
      console.error('Error fetching entries from Supabase:', err);
      const all = LocalDemoStore.getEntries(userId);
      return all.filter((e) => e.entry_date >= startDate && e.entry_date <= endDate);
    }
  },

  async getAllEntries(userId: string): Promise<HabitEntry[]> {
    if (!isSupabaseConfigured || !supabase) {
      return LocalDemoStore.getEntries(userId);
    }

    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return (data as HabitEntry[]) || [];
    } catch (err) {
      console.error('Error fetching all entries from Supabase:', err);
      return LocalDemoStore.getEntries(userId);
    }
  },

  async toggleHabitCompletion(
    userId: string,
    habitId: string,
    dateStr: string,
    currentlyCompleted: boolean,
    targetValue?: number | null
  ): Promise<HabitEntry> {
    const nextCompleted = !currentlyCompleted;
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const entries = LocalDemoStore.getEntries(userId);
      const existingIndex = entries.findIndex(
        (e) => e.habit_id === habitId && e.entry_date === dateStr
      );

      let resultEntry: HabitEntry;

      if (existingIndex >= 0) {
        resultEntry = {
          ...entries[existingIndex],
          completed: nextCompleted,
          completed_at: nextCompleted ? now : null,
          progress_value: nextCompleted ? (targetValue ?? null) : 0,
          updated_at: now,
        };
        entries[existingIndex] = resultEntry;
      } else {
        resultEntry = {
          id: `entry-${habitId}-${dateStr}-${Date.now()}`,
          user_id: userId,
          habit_id: habitId,
          entry_date: dateStr,
          completed: nextCompleted,
          completed_at: nextCompleted ? now : null,
          progress_value: nextCompleted ? (targetValue ?? null) : 0,
          created_at: now,
          updated_at: now,
        };
        entries.push(resultEntry);
      }

      LocalDemoStore.saveEntries(entries);
      return resultEntry;
    }

    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .upsert(
          {
            user_id: userId,
            habit_id: habitId,
            entry_date: dateStr,
            completed: nextCompleted,
            progress_value: nextCompleted ? (targetValue ?? null) : 0,
            completed_at: nextCompleted ? now : null,
            updated_at: now,
          },
          { onConflict: 'habit_id,entry_date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as HabitEntry;
    } catch (err) {
      console.error('Error toggling completion in Supabase:', err);
      // Fallback update in local storage so user interaction is not lost
      const entries = LocalDemoStore.getEntries(userId);
      const fallbackEntry: HabitEntry = {
        id: `entry-${habitId}-${dateStr}`,
        user_id: userId,
        habit_id: habitId,
        entry_date: dateStr,
        completed: nextCompleted,
        completed_at: nextCompleted ? now : null,
        progress_value: nextCompleted ? (targetValue ?? null) : 0,
        created_at: now,
        updated_at: now,
      };
      LocalDemoStore.saveEntries([...entries.filter((e) => !(e.habit_id === habitId && e.entry_date === dateStr)), fallbackEntry]);
      return fallbackEntry;
    }
  },

  async updateHabitProgress(
    userId: string,
    habitId: string,
    dateStr: string,
    progressValue: number,
    targetValue?: number | null
  ): Promise<HabitEntry> {
    const isCompleted = targetValue ? progressValue >= targetValue : progressValue > 0;
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const entries = LocalDemoStore.getEntries(userId);
      const existingIndex = entries.findIndex(
        (e) => e.habit_id === habitId && e.entry_date === dateStr
      );

      let resultEntry: HabitEntry;

      if (existingIndex >= 0) {
        resultEntry = {
          ...entries[existingIndex],
          completed: isCompleted,
          completed_at: isCompleted ? now : null,
          progress_value: progressValue,
          updated_at: now,
        };
        entries[existingIndex] = resultEntry;
      } else {
        resultEntry = {
          id: `entry-${habitId}-${dateStr}-${Date.now()}`,
          user_id: userId,
          habit_id: habitId,
          entry_date: dateStr,
          completed: isCompleted,
          completed_at: isCompleted ? now : null,
          progress_value: progressValue,
          created_at: now,
          updated_at: now,
        };
        entries.push(resultEntry);
      }

      LocalDemoStore.saveEntries(entries);
      return resultEntry;
    }

    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .upsert(
          {
            user_id: userId,
            habit_id: habitId,
            entry_date: dateStr,
            progress_value: progressValue,
            completed: isCompleted,
            completed_at: isCompleted ? now : null,
            updated_at: now,
          },
          { onConflict: 'habit_id,entry_date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as HabitEntry;
    } catch (err) {
      console.error('Error updating progress in Supabase:', err);
      throw err;
    }
  },
};
