/**
 * Shared date formatting utilities.
 *
 * Extracted from Experience.tsx and ResumePrint.tsx to concentrate
 * date-presentation logic in one module. The interface covers range
 * formatting (for roles/education), absolute dates (for project details),
 * and relative time (for project cards).
 */

export function formatDateRange(start: string, end: string | null): string {
  return `${formatMonthYear(start)} — ${end ? formatMonthYear(end) : 'Present'}`;
}

export function formatMonthYear(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
  });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}yr ago`;
}