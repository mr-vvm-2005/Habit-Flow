import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalDemoStore } from './localDemoStore';
import type { Habit } from '../types/database';

export const habitService = {
  async getHabits(userId: string, includeArchived = true): Promise<Habit[]> {
    if (!isSupabaseConfigured || !supabase) {
      const all = LocalDemoStore.getHabits(userId);
      return includeArchived ? all : all.filter((h) => !h.archived_at);
    }

    try {
      let query = supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Habit[]) || [];
    } catch (err) {
      console.error('Error fetching habits from Supabase:', err);
      // Fallback to local storage if network or DB issue occurs
      const local = LocalDemoStore.getHabits(userId);
      return includeArchived ? local : local.filter((h) => !h.archived_at);
    }
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'archived_at'>): Promise<Habit> {
    const newId = `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const habitToInsert: Habit = {
      ...habit,
      id: newId,
      archived_at: null,
      created_at: now,
      updated_at: now,
    };

    if (!isSupabaseConfigured || !supabase) {
      const habits = LocalDemoStore.getHabits(habit.user_id);
      habits.push(habitToInsert);
      LocalDemoStore.saveHabits(habits);
      return habitToInsert;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: habit.user_id,
          title: habit.title.trim(),
          description: habit.description ? habit.description.trim() : null,
          category: habit.category,
          icon: habit.icon,
          color: habit.color,
          schedule: habit.schedule,
          target_value: habit.target_value,
          target_unit: habit.target_unit,
          start_date: habit.start_date,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Habit;
    } catch (err) {
      console.error('Error creating habit in Supabase:', err);
      // Save locally to avoid data loss
      const habits = LocalDemoStore.getHabits(habit.user_id);
      habits.push(habitToInsert);
      LocalDemoStore.saveHabits(habits);
      return habitToInsert;
    }
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured || !supabase) {
      const habits = LocalDemoStore.getHabits(updates.user_id || '');
      const index = habits.findIndex((h) => h.id === id);
      if (index === -1) throw new Error('Habit not found');
      const updated = { ...habits[index], ...updates, updated_at: now };
      habits[index] = updated;
      LocalDemoStore.saveHabits(habits);
      return updated;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Habit;
    } catch (err) {
      console.error('Error updating habit in Supabase:', err);
      throw err;
    }
  },

  async archiveHabit(id: string, userId: string): Promise<Habit> {
    const now = new Date().toISOString();
    return this.updateHabit(id, { archived_at: now, user_id: userId });
  },

  async restoreHabit(id: string, userId: string): Promise<Habit> {
    return this.updateHabit(id, { archived_at: null, user_id: userId });
  },

  async deleteHabit(id: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const habits = LocalDemoStore.getHabits(userId);
      const filtered = habits.filter((h) => h.id !== id);
      LocalDemoStore.saveHabits(filtered);
      // Also clean up entries for this habit
      const entries = LocalDemoStore.getEntries(userId);
      const filteredEntries = entries.filter((e) => e.habit_id !== id);
      LocalDemoStore.saveEntries(filteredEntries);
      return;
    }

    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting habit from Supabase:', err);
      throw err;
    }
  },
};
