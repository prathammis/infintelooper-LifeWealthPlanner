import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { usePlanner } from '../context/PlannerContext';
import { calculateProjection, formatCurrency } from '../utils/finance';

export default function ProjectionChart() {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const { state } = usePlanner();
  const { scenarios, timelineStartYear } = state;
  const endYear = timelineStartYear + 60;

  useEffect(() => {
    if (!svgRef.current) return;
    const container = svgRef.current.parentElement;
    const containerWidth = container.clientWidth || 800;
    const height = 380;
    const margin = { top: 20, right: 30, bottom: 50, left: 80 };
    const width = containerWidth - margin.left - margin.right;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', containerWidth).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate projections for all scenarios
    const projections = scenarios.map(s => ({
      scenario: s,
      data: calculateProjection(s, timelineStartYear, endYear),
    }));

    // Scales
    const allNetWorths = projections.flatMap(p => p.data.map(d => d.netWorth));
    const yMin = Math.min(0, d3.min(allNetWorths)) * 1.05;
    const yMax = d3.max(allNetWorths) * 1.1;

    const xScale = d3.scaleLinear().domain([timelineStartYear, endYear]).range([0, width]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height - margin.top - margin.bottom, 0]);

    // Gridlines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('line').attr('stroke', '#2a2f3e').attr('stroke-dasharray', '3,3'));

    // Zero line
    if (yMin < 0) {
      g.append('line')
        .attr('x1', 0).attr('x2', width)
        .attr('y1', yScale(0)).attr('y2', yScale(0))
        .attr('stroke', '#ff4444')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '6,3')
        .attr('opacity', 0.6);

      // Danger zone shading
      g.append('rect')
        .attr('x', 0).attr('y', yScale(0))
        .attr('width', width)
        .attr('height', yScale(yMin) - yScale(0))
        .attr('fill', 'rgba(255,68,68,0.07)');

      g.append('text')
        .attr('x', width - 4).attr('y', yScale(yMin) - 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#ff4444')
        .attr('font-size', '10px')
        .text('⚠ Danger Zone');
    }

    // Area generator
    const area = d3.area()
      .x(d => xScale(d.year))
      .y0(yScale(Math.max(0, yMin)))
      .y1(d => yScale(d.netWorth))
      .curve(d3.curveCatmullRom);

    const line = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.netWorth))
      .curve(d3.curveCatmullRom);

    projections.forEach(({ scenario, data }) => {
      // Area fill
      g.append('path')
        .datum(data)
        .attr('d', area)
        .attr('fill', scenario.color)
        .attr('opacity', 0.1);

      // Line
      g.append('path')
        .datum(data)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', scenario.color)
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.9);

      // Milestone drawdown markers
      scenario.milestones.filter(m => m.cost > 0).forEach(m => {
        const pt = data.find(d => d.year === m.year);
        if (!pt) return;
        const cx = xScale(m.year);
        const cy = yScale(pt.netWorth);

        g.append('circle')
          .attr('cx', cx).attr('cy', cy)
          .attr('r', 6)
          .attr('fill', scenario.color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5);

        g.append('text')
          .attr('x', cx).attr('y', cy - 12)
          .attr('text-anchor', 'middle')
          .attr('fill', scenario.color)
          .attr('font-size', '10px')
          .text(m.icon);
      });
    });

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(10))
      .call(ax => ax.select('.domain').attr('stroke', '#444'))
      .call(ax => ax.selectAll('text').attr('fill', '#aaa').attr('font-size', '11px'));

    g.append('g')
      .call(d3.axisLeft(yScale).tickFormat(formatCurrency).ticks(6))
      .call(ax => ax.select('.domain').attr('stroke', '#444'))
      .call(ax => ax.selectAll('text').attr('fill', '#aaa').attr('font-size', '11px'));

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .attr('y', -65)
      .attr('text-anchor', 'middle')
      .attr('fill', '#aaa')
      .attr('font-size', '12px')
      .text('Net Worth');

    // Legend
    const legend = g.append('g').attr('transform', `translate(${width - 120}, 0)`);
    projections.forEach(({ scenario }, i) => {
      const lg = legend.append('g').attr('transform', `translate(0, ${i * 22})`);
      lg.append('rect').attr('width', 14).attr('height', 14).attr('rx', 2).attr('fill', scenario.color).attr('opacity', 0.8);
      lg.append('text').attr('x', 20).attr('y', 11).attr('fill', '#ccc').attr('font-size', '12px').text(scenario.name);
    });

    // Hover crosshair
    const focus = g.append('g').style('display', 'none');
    focus.append('line').attr('class', 'focus-line').attr('y1', 0).attr('y2', height - margin.top - margin.bottom).attr('stroke', '#555').attr('stroke-dasharray', '4,2');

    const overlay = g.append('rect')
      .attr('width', width)
      .attr('height', height - margin.top - margin.bottom)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    const tooltip = d3.select(tooltipRef.current);

    overlay
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        focus.style('display', null);
        focus.select('.focus-line').attr('x1', xScale(year)).attr('x2', xScale(year));

        const lines = projections.map(({ scenario, data }) => {
          const pt = data.find(d => d.year === year);
          return pt ? `<span style="color:${scenario.color}">${scenario.name}: ${formatCurrency(pt.netWorth)}</span>` : '';
        }).filter(Boolean).join('<br/>');

        tooltip
          .style('display', 'block')
          .style('left', `${event.offsetX + 16}px`)
          .style('top', `${event.offsetY - 10}px`)
          .html(`<strong>${year}</strong><br/>${lines}`);
      })
      .on('mouseleave', function () {
        focus.style('display', 'none');
        tooltip.style('display', 'none');
      });

  }, [scenarios, timelineStartYear]);

  return (
    <div className="projection-chart-container">
      <h2 className="section-title">Net Worth Projection</h2>
      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} />
        <div ref={tooltipRef} className="chart-tooltip" style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}
