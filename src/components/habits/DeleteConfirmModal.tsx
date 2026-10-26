import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Habit } from '../../types/database';

interface DeleteConfirmModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  habit,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1B2420] rounded-2xl shadow-xl border border-[#E6E8E0] dark:border-[#2D3D35] p-6">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold font-heading text-[#252B27] dark:text-[#EDECE6]">
              Delete Habit
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-[#737B73] dark:text-[#A0AAA0]">
          Are you sure you want to delete <strong className="text-[#252B27] dark:text-white font-semibold">"{habit.title}"</strong>?
          This will permanently remove the habit and all its past completion records. This action cannot be undone.
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-[#737B73] hover:text-[#252B27] dark:hover:text-white rounded-xl border border-[#E6E8E0] dark:border-[#2D3D35] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Habit'}
          </button>
        </div>
      </div>
    </div>
  );
};
