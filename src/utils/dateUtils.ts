/**
 * Local-date handling utilities
 * Avoids timezone off-by-one errors caused by UTC conversion
 */

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getTodayISO(): string {
  return formatDateToISO(new Date());
}

export function getDayOfWeek(dateStr: string): number {
  return parseISODate(dateStr).getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export function addDays(dateStr: string, days: number): string {
  const date = parseISODate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
}

export function isDateBefore(d1: string, d2: string): boolean {
  return d1 < d2;
}

export function isDateAfter(d1: string, d2: string): boolean {
  return d1 > d2;
}

export function isDateEqual(d1: string, d2: string): boolean {
  return d1 === d2;
}

/**
 * Returns array of ISO date strings [startDate, ..., endDate] inclusive
 */
export function getDateRangeArray(startDate: string, endDate: string): string[] {
  if (startDate > endDate) return [];
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Get start of current week (Monday)
 */
export function getStartOfWeek(dateStr: string): string {
  const date = parseISODate(dateStr);
  const day = date.getDay(); // 0 is Sun, 1 is Mon...
  const diff = day === 0 ? -6 : 1 - day; // Monday as week start
  date.setDate(date.getDate() + diff);
  return formatDateToISO(date);
}

/**
 * Get end of current week (Sunday)
 */
export function getEndOfWeek(dateStr: string): string {
  const start = getStartOfWeek(dateStr);
  return addDays(start, 6);
}

/**
 * Get start of month (e.g. 2026-10-01)
 */
export function getStartOfMonth(year: number, monthZeroIndexed: number): string {
  const y = String(year);
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/**
 * Get end of month (e.g. 2026-10-31)
 */
export function getEndOfMonth(year: number, monthZeroIndexed: number): string {
  const lastDay = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const y = String(year);
  const m = String(monthZeroIndexed + 1).padStart(2, '0');
  const d = String(lastDay).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Human friendly date formatting
 */
export function formatDisplayDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseISODate(dateStr);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options || defaultOptions);
}

export function getMonthName(monthZeroIndexed: number): string {
  const date = new Date(2026, monthZeroIndexed, 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}
