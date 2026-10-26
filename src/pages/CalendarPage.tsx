import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitIcon } from '../components/common/HabitIcon';
import {
  formatDateToISO,
  parseISODate,
  getTodayISO,
  formatDisplayDate,
  getMonthName,
} from '../utils/dateUtils';
import { isHabitScheduledOnDate } from '../utils/habitSchedule';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarPage: React.FC = () => {
  const { habits, entries, toggleCompletion } = useHabits();

  const todayStr = getTodayISO();
  const todayDate = parseISODate(todayStr);

  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(todayDate.getFullYear());
    setCurrentMonth(todayDate.getMonth());
    setSelectedDateStr(todayStr);
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    // Days from previous month for alignment
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = formatDateToISO(new Date(prevYear, prevMonth, dayNum));
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });
    }

    // Days of current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = formatDateToISO(new Date(currentYear, currentMonth, day));
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });
    }

    // Fill trailing days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = formatDateToISO(new Date(nextYear, nextMonth, day));
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Lookup map for fast completion checks: `habitId_dateStr` -> completed boolean
  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const entry of entries) {
      if (entry.completed) {
        map.set(`${entry.habit_id}_${entry.entry_date}`, true);
      }
    }
    return map;
  }, [entries]);

  // Day summaries for dots/indicators
  const getDaySummary = (dateStr: string, isFuture: boolean) => {
    // Habits scheduled on that day (including archived ones if date was before their archival)
    const scheduled = habits.filter((h) => isHabitScheduledOnDate(h, dateStr));
    const total = scheduled.length;
    if (total === 0) return { total: 0, completed: 0, status: 'empty' };

    let completed = 0;
    for (const h of scheduled) {
      if (completionMap.get(`${h.id}_${dateStr}`)) {
        completed++;
      }
    }

    let status = 'incomplete';
    if (completed === total) status = 'completed';
    else if (completed > 0) status = 'partial';
    else if (isFuture) status = 'future';

    return { total, completed, status };
  };

  // Habits scheduled for the SELECTED day
  const selectedDayHabits = useMemo(() => {
    return habits
      .filter((h) => isHabitScheduledOnDate(h, selectedDateStr))
      .map((h) => {
        const isCompleted = Boolean(completionMap.get(`${h.id}_${selectedDateStr}`));
        return {
          habit: h,
          isCompleted,
        };
      });
  }, [habits, selectedDateStr, completionMap]);

  const isSelectedDateFuture = selectedDateStr > todayStr;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6] flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#244C3A] dark:text-[#8FBCA0]" />
            Monthly Calendar
          </h2>
          <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
            Review historical completion records and track daily consistency
          </p>
        </div>

        {/* Navigation & Today Jump */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#1B2420] text-[#244C3A] dark:text-[#8FBCA0] hover:bg-[#F8F7F2] transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-white dark:bg-[#1B2420] rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold font-heading text-[#252B27] dark:text-white min-w-[130px] text-center">
              {getMonthName(currentMonth)} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: CALENDAR GRID + SELECTED DAY INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CALENDAR GRID (2 Columns on large screens) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0] py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((dayObj) => {
              const { total, completed, status } = getDaySummary(
                dayObj.dateStr,
                dayObj.isFuture
              );
              const isSelected = dayObj.dateStr === selectedDateStr;

              return (
                <button
                  key={dayObj.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(dayObj.dateStr)}
                  className={`min-h-[72px] sm:min-h-[82px] p-2 rounded-xl flex flex-col justify-between text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-[#244C3A] dark:border-[#8FBCA0] ring-2 ring-[#244C3A]/20 bg-[#DCE8DC]/20 dark:bg-[#284435]/30'
                      : dayObj.isCurrentMonth
                      ? 'border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#1B2420] hover:border-[#7FA58A]'
                      : 'border-transparent bg-[#F8F7F2]/50 dark:bg-[#121915]/50 text-[#737B73]/50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                        dayObj.isToday
                          ? 'bg-[#244C3A] text-white font-bold'
                          : 'text-[#252B27] dark:text-[#EDECE6]'
                      }`}
                    >
                      {dayObj.dayNumber}
                    </span>
                    {dayObj.isToday && (
                      <span className="hidden sm:inline text-[9px] font-bold uppercase text-[#244C3A] dark:text-[#8FBCA0]">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Completion status indicator badge */}
                  <div className="mt-1">
                    {total > 0 ? (
                      dayObj.isFuture ? (
                        <div className="text-[10px] text-[#737B73] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{total} sched.</span>
                        </div>
                      ) : status === 'completed' ? (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                          <span>{completed}/{total}</span>
                        </div>
                      ) : completed > 0 ? (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#D97706] dark:text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
                          <span>{completed}/{total}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-[#737B73]">
                          <span className="w-2 h-2 rounded-full bg-[#E6E8E0] dark:bg-gray-700 shrink-0" />
                          <span>0/{total}</span>
                        </div>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 block">
                        —
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* CALENDAR LEGEND */}
          <div className="mt-5 pt-4 border-t border-[#E6E8E0] dark:border-[#2D3D35] flex flex-wrap items-center gap-4 text-xs text-[#737B73] dark:text-[#A0AAA0]">
            <span className="font-semibold text-[#252B27] dark:text-white">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>All Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <span>Partially Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E6E8E0] dark:bg-gray-700" />
              <span>Missed / Incomplete</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#737B73]" />
              <span>Future Scheduled</span>
            </div>
          </div>
        </div>

        {/* SELECTED DAY DETAILS PANEL */}
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#E6E8E0] dark:border-[#2D3D35]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#737B73] dark:text-[#A0AAA0]">
                Selected Day
              </span>
              <h3 className="text-lg font-bold font-heading text-[#252B27] dark:text-white mt-0.5">
                {formatDisplayDate(selectedDateStr, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              {isSelectedDateFuture && (
                <p className="text-xs text-[#D97706] mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Future date — not counted as missed
                </p>
              )}
            </div>

            {/* List of habits scheduled for this day */}
            <div className="mt-4 space-y-3">
              {selectedDayHabits.length > 0 ? (
                selectedDayHabits.map(({ habit, isCompleted }) => (
                  <div
                    key={habit.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isCompleted
                        ? 'bg-[#DCE8DC]/20 dark:bg-[#284435]/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-[#F8F7F2] dark:bg-[#222E29] border-[#E6E8E0] dark:border-[#2D3D35]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: habit.color || '#244C3A' }}
                      >
                        <HabitIcon name={habit.icon} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            isCompleted ? 'text-emerald-900 dark:text-emerald-300 font-bold' : ''
                          }`}
                        >
                          {habit.title}
                        </h4>
                        <span className="text-[10px] text-[#737B73]">
                          {habit.target_value ? `${habit.target_value} ${habit.target_unit || ''}` : habit.category}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Button for this date */}
                    <button
                      type="button"
                      onClick={() => toggleCompletion(habit.id, selectedDateStr)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-[#244C3A] text-white'
                          : 'border border-[#E6E8E0] dark:border-[#2D3D35] hover:border-[#244C3A] text-transparent hover:text-[#7FA58A]'
                      }`}
                      title={isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-[#737B73]">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#7FA58A]" />
                  <p className="text-xs">No habits scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E6E8E0] dark:border-[#2D3D35] text-[11px] text-[#737B73] dark:text-[#A0AAA0]">
            Tip: You can click any past date to review completion records or log retroactive progress.
          </div>
        </div>
      </div>
    </div>
  );
};
