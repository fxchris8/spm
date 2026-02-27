/**
 * Format a date string to Indonesian locale format.
 * e.g. "2026-02-22 00:00:00+07" → "22 Februari 2026"
 */
export function formatDateIndo(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
