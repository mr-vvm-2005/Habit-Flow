import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalDemoStore, DEMO_USER } from './localDemoStore';
import type { Profile } from '../types/database';

export interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
}

export const authService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!isSupabaseConfigured || !supabase) {
      const demo = LocalDemoStore.getStoredUser();
      if (!demo) return null;
      const profile = LocalDemoStore.getProfile(demo.id);
      return {
        id: demo.id,
        email: demo.email,
        displayName: profile.display_name,
      };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0],
      };
    } catch {
      return null;
    }
  },

  async signUp(email: string, password: string, displayName: string): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      const id = `user-${Date.now()}`;
      const newUser = { id, email };
      LocalDemoStore.setStoredUser(newUser);
      LocalDemoStore.updateProfile({ id, display_name: displayName });
      return { user: { id, email, displayName }, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Registration failed. Please check your credentials.' };
      }

      // Automatically create/ensure profile in profiles table
      await supabase.from('profiles').upsert({
        id: data.user.id,
        display_name: displayName,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        theme: 'light',
      });

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName,
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      return { user: null, error: message };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      const user = { id: DEMO_USER.id, email: email || DEMO_USER.email };
      LocalDemoStore.setStoredUser(user);
      const profile = LocalDemoStore.getProfile(user.id);
      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: profile.display_name,
        },
        error: null,
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Could not log in' };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        },
        error: null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { user: null, error: message };
    }
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      LocalDemoStore.setStoredUser(null);
      return;
    }
    await supabase.auth.signOut();
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured || !supabase) {
      return LocalDemoStore.getProfile(userId);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Record not found: create default profile
        const newProfile: Partial<Profile> = {
          id: userId,
          display_name: 'HabitFlow User',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          theme: 'light',
        };
        const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
        return created || null;
      }

      return data || null;
    } catch {
      return null;
    }
  },

  async updateProfile(profile: Partial<Profile> & { id: string }): Promise<Profile | null> {
    if (!isSupabaseConfigured || !supabase) {
      return LocalDemoStore.updateProfile(profile);
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },
};
