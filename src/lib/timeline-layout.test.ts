import { describe, test, expect } from 'vitest';
import { computeTimelineLayout, getMonthKey } from './timeline-layout';
import type { TimelineEvent, Role } from '../types';

// Fixtures — minimal data that exercises the layout logic
const roles: Role[] = [
  {
    id: 'role-1',
    company: 'Company A',
    title: 'Engineer',
    startDate: '2020-01-01',
    endDate: '2022-06-01',
    location: 'Sydney',
    description: 'Did things',
    isCurrent: false,
    achievements: [],
    createdAt: '2020-01-01',
    updatedAt: '2020-01-01',
  },
  {
    id: 'role-2',
    company: 'Company B',
    title: 'Senior Engineer',
    startDate: '2022-06-01',
    endDate: null,
    location: 'Adelaide',
    description: 'Does more things',
    isCurrent: true,
    achievements: [],
    createdAt: '2022-06-01',
    updatedAt: '2022-06-01',
  },
];

const events: TimelineEvent[] = [
  {
    id: 'ev-1',
    roleId: 'role-1',
    eventType: 'job',
    date: '2020-01-01',
    title: 'Started at Company A',
    description: 'First day',
    company: 'Company A',
    createdAt: '2020-01-01',
    updatedAt: '2020-01-01',
  },
  {
    id: 'ev-2',
    roleId: 'role-1',
    eventType: 'certification',
    date: '2020-06-01',
    title: 'Got certified',
    description: 'AWS cert',
    company: null,
    createdAt: '2020-06-01',
    updatedAt: '2020-06-01',
  },
  {
    id: 'ev-3',
    roleId: 'role-2',
    eventType: 'job',
    date: '2022-06-01',
    title: 'Started at Company B',
    description: 'New role',
    company: 'Company B',
    createdAt: '2022-06-01',
    updatedAt: '2022-06-01',
  },
];

describe('getMonthKey', () => {
  test('extracts YYYY-MM from ISO date', () => {
    expect(getMonthKey('2025-07-15')).toBe('2025-07');
  });

  test('handles single-digit months', () => {
    expect(getMonthKey('2025-01-01')).toBe('2025-01');
  });
});

describe('computeTimelineLayout', () => {
  const layout = computeTimelineLayout(events, roles, 800);

  test('returns positioned events with x/y coordinates', () => {
    expect(layout.positionedEvents).toHaveLength(3);
    for (const pe of layout.positionedEvents) {
      expect(pe.x).toBeTypeOf('number');
      expect(pe.y).toBeTypeOf('number');
      expect(pe.parsedDate).toBeInstanceOf(Date);
    }
  });

  test('events are positioned left-to-right by date', () => {
    const [first, , third] = layout.positionedEvents;
    expect(first.x).toBeLessThan(third.x);
  });

  test('alternates y-positions (above/below)', () => {
    const [first, second] = layout.positionedEvents;
    // yOffsets should alternate sign: first is negative, second positive (or vice versa)
    expect(first.yOffset * second.yOffset).toBeLessThan(0);
  });

  test('groups events by month key', () => {
    expect(layout.groupedByMonth).toBeInstanceOf(Map);
    expect(layout.groupedByMonth.has('2020-01')).toBe(true);
    expect(layout.groupedByMonth.has('2022-06')).toBe(true);
  });

  test('isGrouped flag is false for single-event months', () => {
    const jan2020 = layout.positionedEvents.find(pe => pe.monthKey === '2020-01');
    expect(jan2020?.isGrouped).toBe(false);
  });

  test('role spans cover the full date range', () => {
    expect(layout.roleSpans).toHaveLength(2);
    const [span1, span2] = layout.roleSpans;
    expect(span1.x0).toBeLessThanOrEqual(span1.x1);
    // Second role has no end date, so x1 should be at "now"
    expect(span2.x1).toBeGreaterThanOrEqual(span2.x0);
  });

  test('nowX is within the visible range (since current role extends to now)', () => {
    expect(layout.nowX).not.toBeNull();
    expect(layout.nowX!).toBeGreaterThan(0);
  });

  test('width matches container minus margins', () => {
    expect(layout.width).toBe(800 - layout.margin.left - layout.margin.right);
  });

  test('lastEvent is the chronologically last event', () => {
    expect(layout.lastEvent).not.toBeNull();
    expect(layout.lastEvent!.event.title).toBe('Started at Company B');
  });

  test('handles empty events array gracefully', () => {
    const emptyLayout = computeTimelineLayout([], [], 800);
    expect(emptyLayout.positionedEvents).toHaveLength(0);
    expect(emptyLayout.lastEvent).toBeNull();
  });
});