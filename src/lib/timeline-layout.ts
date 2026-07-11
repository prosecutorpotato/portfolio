/**
 * Pure timeline layout computation — extracted from the D3 rendering in
 * Timeline.tsx to create a testable seam.
 *
 * The interface is one function: `computeTimelineLayout(events, roles, width)`.
 * The implementation handles date parsing, scale computation, alternating
 * y-positions, month grouping, and role-span positioning.
 *
 * The D3 rendering in Timeline.tsx consumes the returned layout and only
 * concerns itself with SVG DOM manipulation. Layout bugs (wrong positions,
 * missing month groups, off-by-one in y-alternation) are now testable
 * without a browser.
 */

import * as d3 from 'd3';
import type { TimelineEvent, Role } from '../types';

export interface PositionedEvent {
  event: TimelineEvent;
  parsedDate: Date;
  x: number;
  y: number;
  yOffset: number;
  monthKey: string;
  isGrouped: boolean;
}

export interface PositionedRoleSpan {
  role: Role;
  x0: number;
  x1: number;
  y: number;
}

export interface TimelineLayout {
  positionedEvents: PositionedEvent[];
  roleSpans: PositionedRoleSpan[];
  xScale: d3.ScaleTime<number, number>;
  yOffsets: number[];
  height: number;
  width: number;
  margin: { top: number; right: number; bottom: number; left: number };
  nowX: number | null;
  now: Date;
  groupedByMonth: Map<string, TimelineEvent[]>;
  lastEvent: PositionedEvent | null;
}

export function getMonthKey(date: string): string {
  return date.slice(0, 7);
}

export function computeTimelineLayout(
  events: TimelineEvent[],
  roles: Role[],
  containerWidth: number,
): TimelineLayout {
  const margin = { top: 60, right: 20, bottom: 60, left: 20 };
  const width = containerWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const parseDate = d3.timeParse('%Y-%m-%d');

  // ── Group events by month ──────────────────────────────
  const groupedByMonth = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const key = getMonthKey(ev.date);
    if (!groupedByMonth.has(key)) groupedByMonth.set(key, []);
    groupedByMonth.get(key)!.push(ev);
  }

  // ── Parse dates ────────────────────────────────────────
  const parsed = events.map((e) => ({
    event: e,
    parsedDate: parseDate(e.date)!,
    monthKey: getMonthKey(e.date),
  }));

  // ── X scale — time-based, extend to current date ───────
  const xExtent = d3.extent(parsed, (d) => d.parsedDate) as [Date, Date];
  const now = new Date();
  const xMax = new Date(Math.max(xExtent[1].getTime(), now.getTime()));
  const padding = (xMax.getTime() - xExtent[0].getTime()) * 0.05;
  const xMin = new Date(xExtent[0].getTime() - padding);
  const xMaxPadded = new Date(xMax.getTime() + padding);
  const xScale = d3.scaleTime().domain([xMin, xMaxPadded]).range([0, width]);

  // ── Alternating above/below y-positions ────────────────
  const yOffsets = parsed.map((_, i) => (i % 2 === 0 ? -1 : 1) * (height / 3));

  // ── Positioned events ──────────────────────────────────
  const positionedEvents: PositionedEvent[] = parsed.map((d, i) => ({
    event: d.event,
    parsedDate: d.parsedDate,
    monthKey: d.monthKey,
    x: xScale(d.parsedDate),
    y: height / 2 + yOffsets[i],
    yOffset: yOffsets[i],
    isGrouped: (groupedByMonth.get(d.monthKey)?.length || 0) > 1,
  }));

  // ── Role spans ─────────────────────────────────────────
  const roleSpans: PositionedRoleSpan[] = roles.map((role, idx) => {
    const start = parseDate(role.start_date)!;
    const end = role.end_date ? parseDate(role.end_date)! : new Date();
    return {
      role,
      x0: xScale(start),
      x1: xScale(end),
      y: height / 2 + (idx % 2 === 0 ? 35 : -35),
    };
  });

  // ── "Now" marker ───────────────────────────────────────
  const nowX = xScale(now);
  const nowInRange = nowX > 0 && nowX < width;

  return {
    positionedEvents,
    roleSpans,
    xScale,
    yOffsets,
    height,
    width,
    margin,
    nowX: nowInRange ? nowX : null,
    now,
    groupedByMonth,
    lastEvent: positionedEvents[positionedEvents.length - 1] ?? null,
  };
}