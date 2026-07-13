import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { TimelineEvent, Role, EventType } from '../types';
import { log } from '../lib/logger';
import {
  computeTimelineLayout,
  getMonthKey,
  type PositionedEvent,
} from '../lib/timeline-layout';
import '../styles/timeline.css';

interface TimelineProps {
  events: TimelineEvent[];
  roles: Role[];
}

const EVENT_COLORS: Record<EventType, string> = {
  job: 'var(--color-event-job)',
  promotion: 'var(--color-event-promotion)',
  certification: 'var(--color-event-certification)',
  award: 'var(--color-event-award)',
  education: 'var(--color-event-education)',
};

const EVENT_ICONS: Record<EventType, string> = {
  job: '◆',
  promotion: '↑',
  certification: '☑',
  award: '♛',
  education: '⚑',
};

export function Timeline({ events, roles }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredEvents, setHoveredEvents] = useState<TimelineEvent[]>([]);
  const [pinnedEvents, setPinnedEvents] = useState<TimelineEvent[]>([]);
  const pinnedRef = useRef<TimelineEvent[]>([]);

  // Keep ref in sync so D3 closures can read current pinned state
  useEffect(() => { pinnedRef.current = pinnedEvents; }, [pinnedEvents]);

  const displayEvents = pinnedEvents.length > 0 ? pinnedEvents : hoveredEvents;
  const isPinned = pinnedEvents.length > 0;

  useEffect(() => {
    if (!svgRef.current || events.length === 0) {
      log.warn('D3', `Timeline: no data to render (events=${events.length})`);
      return;
    }

    log.info('D3', `Timeline: rendering ${events.length} events, ${roles.length} roles`);

    // ── Compute layout (pure, testable) ───────────────────
    const containerWidth = svgRef.current.parentElement?.clientWidth || 1000;
    const layout = computeTimelineLayout(events, roles, containerWidth);
    const { xScale, height, margin, width, positionedEvents, roleSpans, groupedByMonth } = layout;

    // ── D3 rendering (DOM only — no layout logic here) ────
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ── Axis ────────────────────────────────────────────
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeYear.every(1))
      .tickFormat(d3.timeFormat('%Y') as unknown as (d: d3.AxisDomain) => string)
      .tickSize(0);

    const axisG = g
      .append('g')
      .attr('class', 'timeline-axis')
      .attr('transform', `translate(0,${height / 2})`)
      .call(xAxis as unknown as d3.Axis<Date>);

    axisG.select('.domain').attr('stroke', 'var(--color-border)').attr('stroke-width', 2);
    axisG
      .selectAll('.tick text')
      .attr('fill', 'var(--color-text-subtle)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '12px')
      .attr('dy', '1.5em');

    // ── Center line glow ────────────────────────────────
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.5);

    // ── "Now" marker ─────────────────────────────────────
    if (layout.nowX !== null) {
      g.append('line')
        .attr('x1', layout.nowX)
        .attr('x2', layout.nowX)
        .attr('y1', height / 2 - 25)
        .attr('y2', height / 2 + 25)
        .attr('stroke', 'var(--color-accent)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3 2')
        .attr('opacity', 0.5);
      g.append('text')
        .attr('x', layout.nowX)
        .attr('y', height / 2 + 38)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--color-accent)')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .text('Now');
    }

    // ── Role spans ──────────────────────────────────────
    roleSpans.forEach((rs, idx) => {
      g.append('rect')
        .attr('class', 'timeline-role-span')
        .attr('x', rs.x0)
        .attr('y', rs.y - 3)
        .attr('width', Math.max(0, rs.x1 - rs.x0))
        .attr('height', 6)
        .attr('rx', 3)
        .attr('fill', 'var(--color-accent)')
        .attr('opacity', 0.15);

      g.append('text')
        .attr('class', 'timeline-role-label')
        .attr('x', (rs.x0 + rs.x1) / 2)
        .attr('y', rs.y + (idx % 2 === 0 ? 22 : -12))
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--color-text-muted)')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '11px')
        .text(rs.role.company);
    });

    // ── Event nodes ─────────────────────────────────────
    const nodeGroups = g
      .selectAll('.timeline-node')
      .data(positionedEvents)
      .enter()
      .append('g')
      .attr('class', (d) => 'timeline-node' + (d.isGrouped ? ' timeline-node--grouped' : ''))
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer');

    // Connector lines from node to axis
    nodeGroups
      .append('line')
      .attr('class', 'timeline-connector')
      .attr('y1', (d) => -d.yOffset)
      .attr('y2', 0)
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-width', 1)
      .attr('opacity', 0.4)
      .attr('stroke-dasharray', '2 3');

    // Event circles
    nodeGroups
      .append('circle')
      .attr('class', 'timeline-dot')
      .attr('r', 0)
      .attr('fill', (d) => EVENT_COLORS[d.event.eventType as EventType] || 'var(--color-accent)')
      .attr('stroke', 'var(--color-bg-card)')
      .attr('stroke-width', 3)
      .transition()
      .duration(600)
      .delay((_, i) => i * 80)
      .attr('r', 10);

    // Grouped-month indicator ring
    nodeGroups
      .filter((d) => d.isGrouped)
      .append('circle')
      .attr('class', 'timeline-group-ring')
      .attr('r', 14)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-accent)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 2')
      .attr('opacity', 0.5)
      .style('pointer-events', 'none');

    // Pulse ring for the most recent event
    if (layout.lastEvent) {
      const lastIdx = positionedEvents.length - 1;
      g.select(`.timeline-node:nth-child(${positionedEvents.length + roleSpans.length + 1})`)
        .append('circle')
        .attr('class', 'timeline-pulse')
        .attr('r', 10)
        .attr('fill', 'none')
        .attr('stroke', EVENT_COLORS[layout.lastEvent.event.eventType as EventType])
        .attr('stroke-width', 2)
        .attr('opacity', 0.6)
        .style('animation', 'timeline-pulse 2s ease-out infinite');
      void lastIdx;
    }

    // Event icons
    nodeGroups
      .append('text')
      .attr('class', 'timeline-icon')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '10px')
      .attr('fill', 'var(--color-bg-card)')
      .attr('font-weight', 'bold')
      .text((d) => EVENT_ICONS[d.event.eventType as EventType] || '●')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .transition()
      .duration(400)
      .delay((_, i) => i * 80 + 300)
      .style('opacity', 1);

    // Hover area (invisible, larger)
    nodeGroups
      .append('circle')
      .attr('r', 20)
      .attr('fill', 'transparent')
      .on('mouseenter', function (_, d) {
        d3.select(this.parentElement).select('.timeline-dot').transition().duration(200).attr('r', 14);
        if (pinnedRef.current.length === 0) {
          const monthEvents = groupedByMonth.get(d.monthKey) || [d.event];
          setHoveredEvents(monthEvents);
        }
      })
      .on('mouseleave', function () {
        d3.select(this.parentElement).select('.timeline-dot').transition().duration(200).attr('r', 10);
        setHoveredEvents([]);
      })
      .on('click', function (_, d) {
        const monthKey = d.monthKey;
        const isAlreadyPinned = pinnedRef.current.length > 0 && getMonthKey(pinnedRef.current[0].date) === monthKey;
        setPinnedEvents(isAlreadyPinned ? [] : (groupedByMonth.get(monthKey) || [d.event]));
        setHoveredEvents([]);
      });

    // ── Responsive ──────────────────────────────────────
    const resize = () => {
      if (!svgRef.current) return;
      const newContainerWidth = svgRef.current.parentElement?.clientWidth || 1000;
      const newWidth = newContainerWidth - margin.left - margin.right;
      xScale.range([0, newWidth]);
      svg.attr('width', newWidth + margin.left + margin.right);
      // Update center line
      g.select('line').attr('x2', newWidth);
      // Redraw axis
      (g.select('.timeline-axis') as unknown as d3.Selection<d3.BaseType, unknown, null, undefined>).call(xAxis as unknown as (sel: d3.Selection<d3.BaseType, unknown, null, undefined>) => void);
      // Update node positions
      g.selectAll('.timeline-node').attr('transform', (d: unknown) => {
        const pe = d as PositionedEvent;
        const x = xScale(pe.parsedDate);
        return `translate(${x},${pe.y})`;
      });
      // Update connectors
      g.selectAll('.timeline-connector').attr('y1', (_: unknown, i: number) => -layout.yOffsets[i]);
      // Update role spans
      roleSpans.forEach((rs, i) => {
        const parseDate = d3.timeParse('%Y-%m-%d');
        rs.x0 = xScale(parseDate(roles[i].startDate)!);
        rs.x1 = xScale(roles[i].endDate ? parseDate(roles[i].endDate)! : new Date());
      });
      g.selectAll('.timeline-role-span')
        .attr('x', (_, i) => roleSpans[i].x0)
        .attr('width', (_, i) => Math.max(0, roleSpans[i].x1 - roleSpans[i].x0));
      g.selectAll('.timeline-role-label').attr('x', (_, i) => (roleSpans[i].x0 + roleSpans[i].x1) / 2);
    };

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [events, roles]);

  return (
    <section id="timeline" className="timeline-section">
      <div className="container">
        <p className="section-label">The Journey</p>
        <h2 className="section-title">A career told in data points</h2>
        <p className="timeline-section__intro">
          Hover over any point to preview, or click to pin a month and scroll through every
          event. Click again (or ✕) to unpin.
        </p>
      </div>
      <div className="container">
        <div className="timeline-section__chart">
          <svg ref={svgRef} className="timeline-svg" role="img" aria-label="Career timeline" />
        </div>
      </div>
      <div className="container">
        <div className="timeline-legend">
          {(Object.entries(EVENT_ICONS) as [EventType, string][]).map(([type, icon]) => (
            <div key={type} className="timeline-legend__item">
              <span className="timeline-legend__dot" style={{ background: EVENT_COLORS[type] }}>
                {icon}
              </span>
              <span className="timeline-legend__label">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
      {displayEvents.length > 0 && (
        <div className={`timeline-card timeline-card--hover${isPinned ? ' timeline-card--pinned' : ''}`}>
          <p className="timeline-card__date-header">
            {new Date(displayEvents[0].date).toLocaleDateString('en-AU', {
              year: 'numeric',
              month: 'long',
            })}
            {isPinned && (
              <button
                className="timeline-card__unpin"
                onClick={() => setPinnedEvents([])}
                aria-label="Unpin"
              >
                ✕
              </button>
            )}
          </p>
          <div className="timeline-card__list">
            {displayEvents.map((ev) => (
              <div key={ev.id} className="timeline-card__item">
                <span
                  className="timeline-card__type"
                  style={{ color: EVENT_COLORS[ev.eventType as EventType] }}
                >
                  {ev.eventType}
                </span>
                <h3 className="timeline-card__title">{ev.title}</h3>
                {ev.company && <p className="timeline-card__company">{ev.company}</p>}
                <p className="timeline-card__desc">{ev.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}