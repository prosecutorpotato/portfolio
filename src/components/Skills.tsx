import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNodeData, GraphLinkData } from '../types';
import { log } from '../lib/logger';
import { useScrollReveal } from '../hooks/useScrollReveal';
import '../styles/skills.css';

// ── D3 graph interfaces ─────────────────────────────────────────────────

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: string;
  type: 'hub' | 'tool' | 'feature';
  radius: number;
  weight: number;
  commitCount: number;
  color: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  strength: number;
  kind: 'membership' | 'related' | 'cooccurrence';
  cooccurrence: number;
}

// ── Per-kind visual properties (replaces repeated switch cascades) ──────

const LINK_STYLE: Record<SimLink['kind'], {
  distance: number;
  strokeWidth: (d: SimLink) => number;
  dash: string;
}> = {
  membership:  { distance: 80,  strokeWidth: () => 1,                                    dash: 'none' },
  cooccurrence: { distance: 180, strokeWidth: (d) => Math.min(0.5 + d.cooccurrence * 0.05, 3), dash: '4 3' },
  related:     { distance: 160, strokeWidth: () => 1.5,                                  dash: '4 3' },
};

// ── Per-node-type visual properties ─────────────────────────────────────

interface NodeStyle {
  fillOpacity: number;
  strokeWidth: number;
  strokeDash: string | null;
  textFill: string;
  textFont: string;
  textSize: (d: SimNode) => string;
  textWeight: (d: SimNode) => string;
  textOpacity: number;
  circleDelay: number;
  circleDuration: number;
  textDelay: number;
  textDuration: number;
}

const NODE_STYLE: Record<SimNode['type'], NodeStyle> = {
  hub: {
    fillOpacity: 0.15,
    strokeWidth: 2.5,
    strokeDash: null,
    textFill: 'var(--color-accent)',
    textFont: 'var(--font-mono)',
    textSize: (d) => d.name.length > 12 ? '9px' : '11px',
    textWeight: () => '700',
    textOpacity: 1,
    circleDelay: 0,
    circleDuration: 600,
    textDelay: 300,
    textDuration: 400,
  },
  tool: {
    fillOpacity: 0.25,
    strokeWidth: 1.5,
    strokeDash: null,
    textFill: 'var(--color-text)',
    textFont: 'var(--font-body)',
    textSize: (d) => (d.radius > 16 ? '11px' : d.radius > 10 ? '10px' : '9px'),
    textWeight: (d) => (d.weight >= 3 ? '600' : '400'),
    textOpacity: 1,
    circleDelay: 200,
    circleDuration: 500,
    textDelay: 500,
    textDuration: 400,
  },
  feature: {
    fillOpacity: 0.1,
    strokeWidth: 1,
    strokeDash: '2 2',
    textFill: 'var(--color-text-muted)',
    textFont: 'var(--font-mono)',
    textSize: () => '8px',
    textWeight: () => '400',
    textOpacity: 0.8,
    circleDelay: 400,
    circleDuration: 400,
    textDelay: 600,
    textDuration: 400,
  },
};

const RESTORE_FILL_OPACITY: Record<SimNode['type'], number> = {
  hub: 0.15,
  tool: 0.25,
  feature: 0.1,
};

interface SkillsProps {
  graph: GraphData;
}

export function Skills({ graph }: SkillsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ref, visible] = useScrollReveal<HTMLDivElement>();

  // ── Force-directed graph (data-driven from commit analysis) ───────────
  useEffect(() => {
    if (!visible || !svgRef.current || graph.nodes.length === 0) return;

    log.info('D3', `Skills: rendering data-driven graph with ${graph.nodes.length} nodes and ${graph.links.length} links`);

    // ── Map DB nodes to simulation nodes ────────────────────────────────
    const maxCommitCount = d3.max(graph.nodes, (d) => d.commitCount) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxCommitCount])
      .range([6, 28]);

    const nodes: SimNode[] = graph.nodes.map((d: GraphNodeData) => ({
      id: d.nodeId,
      name: d.name,
      group: d.group,
      type: d.type as 'hub' | 'tool' | 'feature',
      radius: d.type === 'hub'
        ? Math.max(radiusScale(d.commitCount), 18)
        : radiusScale(d.commitCount),
      weight: d.weight,
      commitCount: d.commitCount,
      color: d.color || '#94a3b8',
    }));

    const links: SimLink[] = graph.links.map((d: GraphLinkData) => ({
      source: d.source,
      target: d.target,
      strength: d.strength,
      kind: d.kind as 'membership' | 'related' | 'cooccurrence',
      cooccurrence: d.cooccurrence,
    }));

    // ── Setup SVG ───────────────────────────────────────────────────────
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = svgRef.current.parentElement?.clientWidth || 800;
    const width = containerWidth;
    const height = 560;

    svg.attr('width', width).attr('height', height);
    svg.attr('viewBox', [-width / 2, -height / 2, width, height] as unknown as string);
    svg.style('max-width', '100%');
    svg.style('height', 'auto');

    // ── Simulation ──────────────────────────────────────────────────────
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => LINK_STYLE[d.kind].distance)
          .strength((d) => d.strength * 0.5),
      )
      .force('charge', d3.forceManyBody().strength((d) => {
        const node = d as SimNode;
        return node.type === 'hub' ? -80 : node.type === 'feature' ? -20 : -40;
      }))
      .force('x', d3.forceX().strength(0.12))
      .force('y', d3.forceY().strength(0.12))
      .force(
        'collision',
        d3.forceCollide<SimNode>().radius((d) => d.radius + 8),
      );

    // ── Links ───────────────────────────────────────────────────────────
    const link = svg
      .append('g')
      .attr('stroke', 'var(--color-border)')
      .attr('stroke-opacity', 0.35)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => LINK_STYLE[d.kind].strokeWidth(d))
      .attr('stroke-dasharray', (d) => LINK_STYLE[d.kind].dash);

    // ── Nodes (shared render for all types) ─────────────────────────────
    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', (d) => `skill-node skill-node--${d.type}`)
      .style('cursor', 'grab');

    for (const nodeType of ['hub', 'tool', 'feature'] as const) {
      const s = NODE_STYLE[nodeType];
      const subset = node.filter((d) => d.type === nodeType);

      subset
        .append('circle')
        .attr('r', 0)
        .attr('fill', (d) => d.color)
        .attr('fill-opacity', s.fillOpacity)
        .attr('stroke', (d) => d.color)
        .attr('stroke-width', s.strokeWidth)
        .attr('stroke-dasharray', s.strokeDash ?? null)
        .transition()
        .duration(s.circleDuration)
        .delay(s.circleDelay)
        .attr('r', (d) => d.radius);

      subset
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', s.textFill)
        .attr('font-family', s.textFont)
        .attr('font-size', (d) => s.textSize(d))
        .attr('font-weight', (d) => s.textWeight(d))
        .style('opacity', 0)
        .style('pointer-events', 'none')
        .text((d) => nodeType === 'feature' && d.name.length > 15
          ? d.name.substring(0, 14) + '…'
          : d.name)
        .transition()
        .duration(s.textDuration)
        .delay(s.textDelay)
        .style('opacity', s.textOpacity);
    }

    // ── Hover interactions ──────────────────────────────────────────────
    node
      .on('mouseenter', function (_, d) {
        d3.select(this).select('circle').transition().duration(150).attr('fill-opacity', 0.55);
        link
          .attr('stroke-opacity', (l) => {
            const s = l.source as SimNode;
            const t = l.target as SimNode;
            return s.id === d.id || t.id === d.id ? 0.9 : 0.15;
          })
          .attr('stroke', (l) => {
            const s = l.source as SimNode;
            const t = l.target as SimNode;
            return s.id === d.id || t.id === d.id ? d.color : 'var(--color-border)';
          });
      })
      .on('mouseleave', function () {
        d3.select(this).select('circle').transition().duration(150).attr('fill-opacity', function () {
          const parent = d3.select(this);
          if (parent.classed('skill-node--hub')) return RESTORE_FILL_OPACITY.hub;
          if (parent.classed('skill-node--feature')) return RESTORE_FILL_OPACITY.feature;
          return RESTORE_FILL_OPACITY.tool;
        });
        link
          .attr('stroke-opacity', 0.35)
          .attr('stroke', 'var(--color-border)');
      });

    // ── Drag behaviour ──────────────────────────────────────────────────
    node.call(
      d3.drag<any, SimNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

    // ── Tick handler ────────────────────────────────────────────────────
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x!)
        .attr('y1', (d) => (d.source as SimNode).y!)
        .attr('x2', (d) => (d.target as SimNode).x!)
        .attr('y2', (d) => (d.target as SimNode).y!);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // ── Resize handler ──────────────────────────────────────────────────
    const resize = () => {
      if (!svgRef.current) return;
      const newWidth = svgRef.current.parentElement?.clientWidth || 800;
      svg.attr('width', newWidth).attr('viewBox', [-newWidth / 2, -height / 2, newWidth, height] as unknown as string);
      simulation.force('x', d3.forceX().strength(0.05));
      simulation.force('y', d3.forceY().strength(0.05));
      simulation.alpha(0.3).restart();
    };
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      simulation.stop();
    };
  }, [visible, graph]);

  return (
    <section id="skills" className="skills-section" ref={ref}>
      <div className="container">
        <p className="section-label">Capabilities</p>
        <h2 className="section-title">My tech stack, visualised</h2>
        <p className="skills-section__intro">
          A force-directed graph derived from analysing {graph.totalCommits.toLocaleString()} commits
          across {graph.totalRepos} repositories over two years. Node size reflects commit frequency.
          Dashed lines connect technologies that co-occur in the same commits — drag nodes to explore.
        </p>

        <div className="skills-graphs-layout">
          <div className="skills-chart-wrapper">
            <svg ref={svgRef} className="skills-chart" role="img" aria-label="Technology stack force-directed graph from commit analysis" />
          </div>

          {/* Role distribution summary */}
          {graph.roleDistribution.length > 0 && (
            <div className="skills-roles">
            <p className="skills-roles__label">Role distribution by commit volume</p>
            <div className="skills-roles__bars">
              {graph.roleDistribution.map((role) => {
                const maxCount = graph.roleDistribution[0].count;
                const pct = (role.count / maxCount) * 100;
                return (
                  <div key={role.value} className="skills-role">
                    <span className="skills-role__name">{role.value}</span>
                    <div className="skills-role__track">
                      <div className="skills-role__fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="skills-role__count">{role.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}