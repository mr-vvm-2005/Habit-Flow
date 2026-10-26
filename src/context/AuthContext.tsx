import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type AuthUser } from '../services/authService';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  updateTimezone: (tz: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isSupabaseConnected = authService.isConfigured();

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const p = await authService.getProfile(currentUser.id);
        setProfile(p);
        if (p?.theme) {
          document.documentElement.setAttribute('data-theme', p.theme);
        }
      }
    } catch (err) {
      console.error('Failed to load user state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const { user: loggedIn, error } = await authService.signIn(email, pass);
    if (error) {
      return { success: false, error };
    }
    if (loggedIn) {
      setUser(loggedIn);
      const p = await authService.getProfile(loggedIn.id);
      setProfile(p);
      if (p?.theme) {
        document.documentElement.setAttribute('data-theme', p.theme);
      }
      return { success: true };
    }
    return { success: false, error: 'Sign in failed' };
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { user: registered, error } = await authService.signUp(email, pass, name);
    if (error) {
      return { success: false, error };
    }
    if (registered) {
      setUser(registered);
      const p = await authService.getProfile(registered.id);
      setProfile(p);
      return { success: true };
    }
    return { success: false, error: 'Registration failed' };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    document.documentElement.removeAttribute('data-theme');
  };

  const updateProfileName = async (name: string) => {
    if (!user) return;
    const updated = await authService.updateProfile({
      id: user.id,
      display_name: name,
    });
    if (updated) {
      setProfile(updated);
      setUser((prev) => (prev ? { ...prev, displayName: name } : null));
    }
  };

  const updateTheme = async (theme: 'light' | 'dark') => {
    if (!user) return;
    document.documentElement.setAttribute('data-theme', theme);
    const updated = await authService.updateProfile({
      id: user.id,
      theme,
    });
    if (updated) {
      setProfile(updated);
    }
  };

  const updateTimezone = async (tz: string) => {
    if (!user) return;
    const updated = await authService.updateProfile({
      id: user.id,
      timezone: tz,
    });
    if (updated) {
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSupabaseConnected,
        signIn,
        signUp,
        signOut,
        updateProfileName,
        updateTheme,
        updateTimezone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
