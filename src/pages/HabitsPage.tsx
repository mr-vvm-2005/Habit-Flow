import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Flame,
  Calendar,
  Inbox,
} from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { HabitIcon } from '../components/common/HabitIcon';
import { HabitFormModal } from '../components/habits/HabitFormModal';
import { DeleteConfirmModal } from '../components/habits/DeleteConfirmModal';
import { getScheduleDescription } from '../utils/habitSchedule';
import { calculateStreak } from '../utils/analytics';
import type { Habit, HabitCategory } from '../types/database';

const CATEGORIES: Array<'All' | HabitCategory> = [
  'All',
  'Health',
  'Fitness',
  'Learning',
  'Productivity',
  'Personal',
  'Other',
];

export const HabitsPage: React.FC = () => {
  const {
    activeHabits,
    archivedHabits,
    entries,
    createHabit,
    updateHabit,
    archiveHabit,
    restoreHabit,
    deleteHabit,
  } = useHabits();

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | HabitCategory>('All');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sourceList = activeTab === 'active' ? activeHabits : archivedHabits;

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return sourceList.filter((habit) => {
      const matchesSearch =
        habit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (habit.description && habit.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || habit.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [sourceList, searchQuery, selectedCategory]);

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsFormModalOpen(true);
  };

  const handleDeletePrompt = (habit: Habit) => {
    setHabitToDelete(habit);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!habitToDelete) return;
    setIsDeleting(true);
    try {
      await deleteHabit(habitToDelete.id);
      setIsDeleteModalOpen(false);
      setHabitToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & TOP CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-[#252B27] dark:text-[#EDECE6]">
            Habit Management
          </h2>
          <p className="text-xs text-[#737B73] dark:text-[#A0AAA0]">
            Create, customize, edit, or archive your daily routines
          </p>
        </div>

        <button
          onClick={() => {
            setEditingHabit(null);
            setIsFormModalOpen(true);
          }}
          className="py-2.5 px-4 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* TABS: ACTIVE vs ARCHIVED */}
      <div className="flex items-center gap-2 border-b border-[#E6E8E0] dark:border-[#2D3D35] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'active'
              ? 'bg-[#244C3A] text-white'
              : 'text-[#737B73] hover:text-[#252B27] dark:hover:text-white'
          }`}
        >
          Active Habits ({activeHabits.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archived')}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
            activeTab === 'archived'
              ? 'bg-[#244C3A] text-white'
              : 'text-[#737B73] hover:text-[#252B27] dark:hover:text-white'
          }`}
        >
          Archived ({archivedHabits.length})
        </button>
      </div>

      {/* SEARCH AND CATEGORY FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737B73]" />
          <input
            type="text"
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] bg-white dark:bg-[#1B2420] text-[#252B27] dark:text-white focus:outline-hidden focus:border-[#244C3A]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#737B73] shrink-0 mr-1 hidden sm:inline" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#DCE8DC] dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0] font-semibold'
                  : 'bg-white dark:bg-[#1B2420] text-[#737B73] hover:text-[#252B27] border border-[#E6E8E0] dark:border-[#2D3D35]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* HABITS GRID */}
      {filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.map((habit) => {
            const { currentStreak, longestStreak } = calculateStreak(habit, entries);
            const scheduleDesc = getScheduleDescription(habit.schedule);

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-[#1B2420] rounded-2xl p-5 border border-[#E6E8E0] dark:border-[#2D3D35] shadow-xs flex flex-col justify-between hover:border-[#7FA58A] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: habit.color || '#244C3A' }}
                      >
                        <HabitIcon name={habit.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[#252B27] dark:text-white leading-snug">
                          {habit.title}
                        </h3>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#F8F7F2] dark:bg-[#222E29] text-[#737B73]">
                          {habit.category}
                        </span>
                      </div>
                    </div>

                    {/* Streak badge */}
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-1 text-xs font-bold text-[#C77B5B] bg-[#F8F7F2] dark:bg-[#222E29] px-2 py-1 rounded-lg">
                        <Flame className="w-3.5 h-3.5 fill-[#C77B5B]" />
                        <span>{currentStreak}d</span>
                      </div>
                    )}
                  </div>

                  {habit.description && (
                    <p className="mt-3 text-xs text-[#737B73] dark:text-[#A0AAA0] line-clamp-2">
                      {habit.description}
                    </p>
                  )}

                  {/* Metadata Chips */}
                  <div className="mt-4 pt-3 border-t border-[#E6E8E0] dark:border-[#2D3D35] flex flex-wrap gap-2 text-xs text-[#737B73] dark:text-[#A0AAA0]">
                    <span className="flex items-center gap-1 bg-[#F8F7F2] dark:bg-[#222E29] px-2.5 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5 text-[#244C3A] dark:text-[#8FBCA0]" />
                      {scheduleDesc}
                    </span>
                    {habit.target_value && (
                      <span className="bg-[#F8F7F2] dark:bg-[#222E29] px-2.5 py-1 rounded-md font-medium text-[#252B27] dark:text-[#EDECE6]">
                        Goal: {habit.target_value} {habit.target_unit || ''}
                      </span>
                    )}
                    {longestStreak > 0 && (
                      <span className="bg-[#F8F7F2] dark:bg-[#222E29] px-2.5 py-1 rounded-md">
                        Best: {longestStreak}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-[#E6E8E0] dark:border-[#2D3D35] flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleEdit(habit)}
                    className="p-1.5 text-[#737B73] hover:text-[#244C3A] hover:bg-[#DCE8DC]/50 dark:hover:bg-[#284435] rounded-lg transition-colors cursor-pointer"
                    title="Edit Habit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {habit.archived_at ? (
                    <button
                      onClick={() => restoreHabit(habit.id)}
                      className="p-1.5 text-[#737B73] hover:text-[#244C3A] hover:bg-[#DCE8DC]/50 dark:hover:bg-[#284435] rounded-lg transition-colors cursor-pointer"
                      title="Restore Habit to Active"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => archiveHabit(habit.id)}
                      className="p-1.5 text-[#737B73] hover:text-[#C77B5B] hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Archive Habit"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeletePrompt(habit)}
                    className="p-1.5 text-[#737B73] hover:text-[#B91C1C] hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Delete Habit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-[#1B2420] rounded-2xl p-8 border border-[#E6E8E0] dark:border-[#2D3D35] text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#DCE8DC] dark:bg-[#284435] text-[#244C3A] dark:text-[#8FBCA0] flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-heading text-[#252B27] dark:text-white">
            {activeTab === 'active' ? 'No active habits found' : 'No archived habits'}
          </h3>
          <p className="text-xs text-[#737B73] dark:text-[#A0AAA0] mt-1">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search query or category filters.'
              : 'Add a new habit to begin tracking your consistent routine.'}
          </p>
          {activeTab === 'active' && !searchQuery && selectedCategory === 'All' && (
            <button
              onClick={() => {
                setEditingHabit(null);
                setIsFormModalOpen(true);
              }}
              className="mt-4 py-2 px-4 bg-[#244C3A] hover:bg-[#18372B] text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              + Create New Habit
            </button>
          )}
        </div>
      )}

      {/* HABIT FORM MODAL (CREATE / EDIT) */}
      <HabitFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingHabit(null);
        }}
        initialHabit={editingHabit}
        onSubmit={async (data) => {
          if (editingHabit) {
            await updateHabit(editingHabit.id, data);
          } else {
            await createHabit(data);
          }
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        habit={habitToDelete}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setHabitToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
