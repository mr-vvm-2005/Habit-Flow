import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  Globe,
  Download,
  LogOut,
  Check,
  Shield,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { exportService } from '../services/exportService';
import { SupabaseSetupModal } from '../components/common/SupabaseSetupModal';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
];

export const SettingsPage: React.FC = () => {
  const { user, profile, isSupabaseConnected, updateProfileName, updateTheme, updateTimezone, signOut } = useAuth();
  const { habits, entries } = useHabits();

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.displayName || '');
  const [selectedTimezone, setSelectedTimezone] = useState(
    profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [isSavedName, setIsSavedName] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const currentTheme = profile?.theme || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    await updateProfileName(displayName.trim());
    setIsSavedName(true);
    setTimeout(() => setIsSavedName(false), 2500);
  };

  const handleTimezoneChange = async (tz: string) => {
    setSelectedTimezone(tz);
    await updateTimezone(tz);
  };

  const handleThemeChange = async (theme: 'light' | 'dark') => {
    await updateTheme(theme);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <h2 className="text-xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6] flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#244C3A] dark:text-[#8FBCA0]" />
          Application Settings
        </h2>
        <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
          Manage your account profile, appearance, data exports, and backend connections
        </p>
      </div>

      {/* 1. PROFILE INFORMATION */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-[#244C3A] dark:text-[#8FBCA0]" />
          Profile Information
        </h3>

        <form onSubmit={handleSaveName} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isSavedName ? <Check className="w-4 h-4" /> : null}
                <span>{isSavedName ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
              Account Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || 'alex@habitflow.app'}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-[#F8F7F2] dark:bg-[#222E29] text-[#737B73] cursor-not-allowed"
            />
          </div>
        </form>
      </div>

      {/* 2. APPEARANCE & THEME */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white flex items-center gap-2 mb-4">
          <Sun className="w-4 h-4 text-[#244C3A] dark:text-[#8FBCA0]" />
          Appearance &amp; Theme
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              currentTheme === 'light'
                ? 'border-[#244C3A] ring-2 ring-[#244C3A]/20 bg-[#F8F7F2]'
                : 'border-[#E6E8E0] dark:border-[#2D3D35] hover:border-[#7FA58A]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                <Sun className="w-4 h-4" />
              </div>
              {currentTheme === 'light' && (
                <span className="text-[10px] font-bold uppercase text-[#244C3A]">Active</span>
              )}
            </div>
            <h4 className="font-bold text-sm text-[#252B27]">Warm Ivory (Light)</h4>
            <p className="text-xs text-[#737B73] mt-0.5">
              Refined nature-inspired ivory and forest greens.
            </p>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              currentTheme === 'dark'
                ? 'border-[#8FBCA0] ring-2 ring-[#8FBCA0]/20 bg-[#121915]'
                : 'border-[#E6E8E0] dark:border-[#2D3D35] hover:border-[#7FA58A]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400">
                <Moon className="w-4 h-4" />
              </div>
              {currentTheme === 'dark' && (
                <span className="text-[10px] font-bold uppercase text-[#8FBCA0]">Active</span>
              )}
            </div>
            <h4 className="font-bold text-sm text-[#252B27] dark:text-white">Forest Night (Dark)</h4>
            <p className="text-xs text-[#737B73] mt-0.5">
              Deep muted greens designed for low-light focus.
            </p>
          </button>
        </div>
      </div>

      {/* 3. TIMEZONE & LOCALIZATION */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-[#244C3A] dark:text-[#8FBCA0]" />
          Timezone &amp; Local Date
        </h3>

        <div className="max-w-md">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
            Configured Timezone
          </label>
          <select
            value={selectedTimezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A] cursor-pointer"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#737B73] dark:text-[#A0AAA0] mt-1.5">
            Habit completion dates and streaks align with this calendar timezone to ensure accurate local calculations.
          </p>
        </div>
      </div>

      {/* 4. DATA EXPORT */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#244C3A] dark:text-[#8FBCA0]" />
              Data Export &amp; Backup
            </h3>
            <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
              Download your entire habit catalog and historical completion records anytime
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <button
            type="button"
            onClick={() => exportService.downloadJSON(habits, entries)}
            className="p-3 rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] hover:border-[#244C3A] bg-[#F8F7F2] dark:bg-[#222E29] flex items-center gap-3 transition-colors text-left cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#244C3A] dark:text-[#8FBCA0]">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#252B27] dark:text-white">Export as JSON</h4>
              <p className="text-[10px] text-[#737B73]">Raw backup with all relations</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => exportService.downloadCSV(habits, entries)}
            className="p-3 rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] hover:border-[#244C3A] bg-[#F8F7F2] dark:bg-[#222E29] flex items-center gap-3 transition-colors text-left cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950 text-[#C77B5B]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#252B27] dark:text-white">Export as CSV</h4>
              <p className="text-[10px] text-[#737B73]">Compatible with Excel &amp; Sheets</p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. BACKEND & SECURITY STATUS */}
      <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-6 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#244C3A] dark:text-[#8FBCA0]" />
              Database Architecture &amp; RLS
            </h3>
            <p className="text-xs text-[#737B73] dark:text-[#A0AAA0] mt-0.5">
              Status:{' '}
              {isSupabaseConnected ? (
                <strong className="text-emerald-700 dark:text-emerald-400">
                  Supabase Live Connection Active
                </strong>
              ) : (
                <strong className="text-amber-600 dark:text-amber-400">
                  Demo Mode (Offline Local PostgreSQL Storage)
                </strong>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSetupModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#244C3A] text-[#244C3A] dark:text-[#8FBCA0] hover:bg-[#DCE8DC]/40 transition-colors cursor-pointer self-start sm:self-auto"
          >
            View Setup Instructions
          </button>
        </div>
      </div>

      {/* 6. LOGOUT */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => signOut()}
          className="px-5 py-2.5 rounded-xl border border-[#B91C1C]/40 text-[#B91C1C] hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* SUPABASE SETUP MODAL */}
      <SupabaseSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        isConfigured={isSupabaseConnected}
      />
    </div>
  );
};
