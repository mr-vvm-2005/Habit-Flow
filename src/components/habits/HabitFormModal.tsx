import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { HabitIcon } from '../common/HabitIcon';
import { HABIT_ICONS, HABIT_COLORS } from '../../constants/habitIcons';
import { getTodayISO } from '../../utils/dateUtils';
import type { Habit, HabitCategory, Schedule, ScheduleType } from '../../types/database';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (habitData: {
    title: string;
    description: string | null;
    category: HabitCategory;
    icon: string;
    color: string;
    schedule: Schedule;
    target_value: number | null;
    target_unit: string | null;
    start_date: string;
  }) => Promise<void>;
  initialHabit?: Habit | null;
}

const CATEGORIES: HabitCategory[] = [
  'Health',
  'Fitness',
  'Learning',
  'Productivity',
  'Personal',
  'Other',
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Personal');
  const [icon, setIcon] = useState('check-circle');
  const [color, setColor] = useState('#244C3A');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [frequencyTimes, setFrequencyTimes] = useState(3);
  const [targetValue, setTargetValue] = useState<string>('');
  const [targetUnit, setTargetUnit] = useState<string>('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialHabit) {
      setTitle(initialHabit.title);
      setDescription(initialHabit.description || '');
      setCategory(initialHabit.category);
      setIcon(initialHabit.icon);
      setColor(initialHabit.color);
      setScheduleType(initialHabit.schedule?.type || 'daily');
      setSelectedDays(initialHabit.schedule?.days || [1, 2, 3, 4, 5]);
      setFrequencyTimes(initialHabit.schedule?.frequency?.times || 3);
      setTargetValue(initialHabit.target_value ? String(initialHabit.target_value) : '');
      setTargetUnit(initialHabit.target_unit || '');
      setStartDate(initialHabit.start_date || getTodayISO());
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setIcon('check-circle');
      setColor('#244C3A');
      setScheduleType('daily');
      setSelectedDays([1, 2, 3, 4, 5]);
      setFrequencyTimes(3);
      setTargetValue('');
      setTargetUnit('');
      setStartDate(getTodayISO());
    }
    setError(null);
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length === 1) {
        setError('At least one day must be selected.');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a habit title.');
      return;
    }

    let finalSchedule: Schedule = { type: scheduleType };
    if (scheduleType === 'weekdays') {
      if (selectedDays.length === 0) {
        setError('Please select at least one day for this schedule.');
        return;
      }
      finalSchedule = { type: 'weekdays', days: selectedDays };
    } else if (scheduleType === 'frequency') {
      finalSchedule = {
        type: 'frequency',
        frequency: { times: Number(frequencyTimes), per: 'week' },
      };
    }

    const parsedTarget = targetValue.trim() ? parseFloat(targetValue) : null;
    if (parsedTarget !== null && (isNaN(parsedTarget) || parsedTarget <= 0)) {
      setError('Target value must be a positive number.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        category,
        icon,
        color,
        schedule: finalSchedule,
        target_value: parsedTarget,
        target_unit: targetUnit.trim() ? targetUnit.trim() : null,
        start_date: startDate,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save habit';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1B2420] rounded-2xl shadow-xl border border-[#E6E8E0] dark:border-[#2D3D35] p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E0] dark:border-[#2D3D35]">
          <h2 className="text-xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6]">
            {initialHabit ? 'Edit Habit' : 'Create New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
              Habit Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Exercise, Read 10 Pages..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
              Description <span className="font-normal lowercase text-[10px]">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this habit matter to you? Any tips or guidelines..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A] resize-none"
            />
          </div>

          {/* Category & Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A] cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
              />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1.5">
              Schedule Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType('daily')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                  scheduleType === 'daily'
                    ? 'border-[#244C3A] bg-[#DCE8DC]/50 dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0]'
                    : 'border-[#E6E8E0] dark:border-[#2D3D35] text-[#737B73] hover:text-[#252B27]'
                }`}
              >
                Every Day
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('weekdays')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                  scheduleType === 'weekdays'
                    ? 'border-[#244C3A] bg-[#DCE8DC]/50 dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0]'
                    : 'border-[#E6E8E0] dark:border-[#2D3D35] text-[#737B73] hover:text-[#252B27]'
                }`}
              >
                Specific Days
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('frequency')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors cursor-pointer ${
                  scheduleType === 'frequency'
                    ? 'border-[#244C3A] bg-[#DCE8DC]/50 dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0]'
                    : 'border-[#E6E8E0] dark:border-[#2D3D35] text-[#737B73] hover:text-[#252B27]'
                }`}
              >
                Weekly Goal
              </button>
            </div>

            {/* Days selector for specific weekdays */}
            {scheduleType === 'weekdays' && (
              <div className="flex gap-1.5 mt-2.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = selectedDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#244C3A] text-white border-[#244C3A]'
                          : 'bg-[#F8F7F2] dark:bg-[#222E29] text-[#737B73] border-[#E6E8E0] dark:border-[#2D3D35]'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Times per week for frequency */}
            {scheduleType === 'frequency' && (
              <div className="flex items-center gap-3 mt-2.5">
                <input
                  type="range"
                  min={1}
                  max={6}
                  value={frequencyTimes}
                  onChange={(e) => setFrequencyTimes(Number(e.target.value))}
                  className="flex-1 accent-[#244C3A]"
                />
                <span className="text-xs font-semibold text-[#244C3A] dark:text-[#8FBCA0] px-2 py-1 bg-[#DCE8DC]/40 rounded-md">
                  {frequencyTimes} days / week
                </span>
              </div>
            )}
          </div>

          {/* Optional Measurable Target */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
                Target Value <span className="font-normal lowercase text-[10px]">(optional)</span>
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 20, 10, 3"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1">
                Unit
              </label>
              <input
                type="text"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                placeholder="e.g. mins, pages, km"
                className="w-full px-3 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#121915] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
              />
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2 p-2 bg-[#F8F7F2] dark:bg-[#222E29] rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35]">
              {HABIT_ICONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIcon(item.id)}
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    icon === item.id
                      ? 'bg-[#244C3A] text-white shadow-xs'
                      : 'text-[#737B73] hover:text-[#252B27] dark:hover:text-white'
                  }`}
                  title={item.label}
                >
                  <HabitIcon name={item.id} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#737B73] mb-1.5">
              Color Accent
            </label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  style={{ backgroundColor: c.id }}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs"
                  title={c.label}
                >
                  {color === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-3 border-t border-[#E6E8E0] dark:border-[#2D3D35] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
