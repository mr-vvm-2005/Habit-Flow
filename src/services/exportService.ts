import type { Habit, HabitEntry } from '../types/database';
import { getTodayISO } from '../utils/dateUtils';

export const exportService = {
  downloadJSON(habits: Habit[], entries: HabitEntry[]) {
    const data = {
      exported_at: new Date().toISOString(),
      app: 'HabitFlow',
      version: '1.0.0',
      total_habits: habits.length,
      total_entries: entries.length,
      habits,
      entries,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    this.triggerDownload(blob, `habitflow-export-${getTodayISO()}.json`);
  },

  downloadCSV(habits: Habit[], entries: HabitEntry[]) {
    const habitMap = new Map<string, string>();
    for (const h of habits) {
      habitMap.set(h.id, h.title);
    }

    const headers = [
      'Entry ID',
      'Habit ID',
      'Habit Title',
      'Date',
      'Completed',
      'Progress Value',
      'Completed At',
    ];

    const rows = entries.map((e) => [
      `"${e.id}"`,
      `"${e.habit_id}"`,
      `"${(habitMap.get(e.habit_id) || 'Unknown').replace(/"/g, '""')}"`,
      `"${e.entry_date}"`,
      e.completed ? 'YES' : 'NO',
      e.progress_value ?? '',
      `"${e.completed_at || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, `habitflow-export-${getTodayISO()}.csv`);
  },

  triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
