import { describe, test, expect } from 'vitest';
import { formatDateRange, formatMonthYear, formatDate, relativeTime } from './format';

describe('formatMonthYear', () => {
  test('formats ISO date as "Mon YYYY"', () => {
    expect(formatMonthYear('2025-01-01')).toMatch(/Jan.*2025/);
  });

  test('handles mid-month dates', () => {
    expect(formatMonthYear('2024-06-15')).toMatch(/Jun.*2024/);
  });

  test('handles December', () => {
    expect(formatMonthYear('2023-12-01')).toMatch(/Dec.*2023/);
  });
});

describe('formatDateRange', () => {
  test('formats start — Present when end is null', () => {
    const result = formatDateRange('2022-10-01', null);
    expect(result).toContain('Present');
    expect(result).toContain('—');
  });

  test('formats both dates when end is provided', () => {
    const result = formatDateRange('2020-02-01', '2021-05-01');
    expect(result).toContain('Feb');
    expect(result).toContain('May');
    expect(result).toContain('—');
  });

  test('handles same month in both fields', () => {
    const result = formatDateRange('2025-03-01', '2025-03-15');
    // Both should show the same month/year
    expect(result).toMatch(/Mar.*2025.*—.*Mar.*2025/);
  });
});

describe('formatDate', () => {
  test('formats ISO date with day, month, year', () => {
    const result = formatDate('2026-07-11');
    expect(result).toContain('2026');
    expect(result).toContain('Jul');
    expect(result).toContain('11');
  });
});

describe('relativeTime', () => {
  test('returns "Xd ago" for recent dates', () => {
    const recent = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = relativeTime(recent);
    expect(result).toContain('d ago');
  });

  test('returns "Xmo ago" for dates 30-365 days ago', () => {
    const monthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = relativeTime(monthsAgo);
    expect(result).toContain('mo ago');
  });

  test('returns "Xyr ago" for dates over a year ago', () => {
    const yearsAgo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const result = relativeTime(yearsAgo);
    expect(result).toContain('yr ago');
  });
});