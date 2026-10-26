import React, { useState, useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  Database,
  User,
  LogOut,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitContext';
import { HabitFormModal } from '../habits/HabitFormModal';
import { AuthModal } from '../auth/AuthModal';
import { SupabaseSetupModal } from '../common/SupabaseSetupModal';
import { formatDisplayDate, getTodayISO } from '../../utils/dateUtils';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/habits', label: 'My Habits', icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const AppLayout: React.FC = () => {
  const { user, profile, isSupabaseConnected, signOut } = useAuth();
  const { createHabit } = useHabits();
  const location = useLocation();

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const todayStr = getTodayISO();
  const formattedToday = formatDisplayDate(todayStr, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Contextual greeting based on user's local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userDisplayName = profile?.display_name || user?.displayName || 'Friend';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F7F2] dark:bg-[#121915] text-[#252B27] dark:text-[#EDECE6]">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#1B2420] p-5 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-[#244C3A] flex items-center justify-center text-white shadow-xs">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <path
                  d="M9 16.5L14 21.5L23 11"
                  stroke="#DCE8DC"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg font-heading tracking-tight text-[#244C3A] dark:text-[#8FBCA0]">
                HabitFlow
              </h1>
              <p className="text-[11px] text-[#737B73] dark:text-[#A0AAA0] leading-none">
                Small steps. Lasting change.
              </p>
            </div>
          </div>

          {/* Quick Action: New Habit */}
          <button
            onClick={() => setIsHabitModalOpen(true)}
            className="w-full py-2.5 px-4 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Habit</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#DCE8DC]/60 dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0]'
                      : 'text-[#737B73] dark:text-[#A0AAA0] hover:bg-[#F8F7F2] dark:hover:bg-[#222E29] hover:text-[#252B27] dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Supabase Status & User Menu */}
        <div className="space-y-3 pt-4 border-t border-[#E6E8E0] dark:border-[#2D3D35]">
          {/* Backend Status indicator */}
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="w-full text-left p-2.5 rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-[#F8F7F2] dark:bg-[#222E29] hover:border-[#7FA58A] transition-colors cursor-pointer text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-[#252B27] dark:text-[#EDECE6]">
                <Database className="w-3.5 h-3.5 text-[#244C3A] dark:text-[#8FBCA0]" />
                Backend
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  isSupabaseConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                }`}
              >
                {isSupabaseConnected ? 'Supabase Live' : 'Demo Mode'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#737B73] dark:text-[#A0AAA0] flex items-center gap-1">
              {isSupabaseConnected ? 'PostgreSQL & RLS Active' : 'Click to connect database'}
              <ExternalLink className="w-2.5 h-2.5 inline" />
            </p>
          </button>

          {/* User profile / Auth button */}
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1B2420]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#DCE8DC] dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0] flex items-center justify-center font-bold text-xs shrink-0">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#252B27] dark:text-white truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-[10px] text-[#737B73] dark:text-[#A0AAA0] truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="p-1.5 text-[#737B73] hover:text-[#B91C1C] rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-2 px-3 text-xs font-medium border border-[#E6E8E0] dark:border-[#2D3D35] rounded-xl hover:bg-[#F8F7F2] dark:hover:bg-[#222E29] flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Demo Login</span>
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#1B2420] border-b border-[#E6E8E0] dark:border-[#2D3D35] sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#244C3A] flex items-center justify-center text-white">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path
                d="M9 16.5L14 21.5L23 11"
                stroke="#DCE8DC"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-base font-heading text-[#244C3A] dark:text-[#8FBCA0] leading-none">
              HabitFlow
            </h1>
            <p className="text-[10px] text-[#737B73]">Small steps. Lasting change.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHabitModalOpen(true)}
            className="p-2 bg-[#244C3A] text-white rounded-xl cursor-pointer"
            aria-label="New Habit"
          >
            <Plus className="w-4 h-4" />
          </button>
          {user ? (
            <button
              onClick={() => signOut()}
              className="p-2 text-[#737B73] rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="p-2 text-[#244C3A] dark:text-[#8FBCA0] rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35]"
            >
              <User className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* TOP GREETING HEADER */}
        <header className="px-6 py-5 border-b border-[#E6E8E0] dark:border-[#2D3D35] bg-white/70 dark:bg-[#1B2420]/70 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#737B73] dark:text-[#A0AAA0]">
              <span>{formattedToday}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#C77B5B]">
                <Sparkles className="w-3 h-3" /> Daily Routine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6] mt-0.5">
              {greeting}, {userDisplayName}
            </h2>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => setIsHabitModalOpen(true)}
              className="py-2 px-4 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Habit</span>
            </button>
          </div>
        </header>

        {/* DEMO NOTICE BANNER (dismissible or informative) */}
        {!isSupabaseConnected && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#DCE8DC]/50 dark:bg-[#284435]/40 border border-[#7FA58A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#244C3A] dark:text-[#8FBCA0]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 shrink-0" />
              <span>
                <strong>Demo Mode Active:</strong> Data is saved in browser storage. Add your Supabase credentials in <code className="bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded font-mono">.env</code> to connect live PostgreSQL & RLS.
              </span>
            </div>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="underline font-semibold hover:text-[#18372B] shrink-0 cursor-pointer"
            >
              Setup Guide &rarr;
            </button>
          </div>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#1B2420] border-t border-[#E6E8E0] dark:border-[#2D3D35] flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[#244C3A] dark:text-[#8FBCA0]'
                  : 'text-[#737B73] dark:text-[#A0AAA0]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* MODALS */}
      <HabitFormModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSubmit={async (data) => {
          await createHabit(data);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        isConfigured={isSupabaseConnected}
      />
    </div>
  );
};
