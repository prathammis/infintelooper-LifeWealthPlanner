import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { usePlanner } from '../context/PlannerContext';

export default function Timeline() {
  const svgRef = useRef(null);
  const { state, dispatch } = usePlanner();
  const { scenarios, activeScenarioId, timelineStartYear } = state;
  const endYear = timelineStartYear + 60;

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const containerWidth = svgRef.current.parentElement.clientWidth || 800;
    const height = 180;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = containerWidth - margin.left - margin.right;

    svg.selectAll('*').remove();
    svg.attr('width', containerWidth).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([timelineStartYear, endYear])
      .range([0, width]);

    // Clip path
    svg.append('defs').append('clipPath').attr('id', 'timeline-clip')
      .append('rect').attr('width', width).attr('height', height);

    const innerG = g.append('g').attr('clip-path', 'url(#timeline-clip)');

    // Background bands
    for (let y = timelineStartYear; y < endYear; y += 10) {
      innerG.append('rect')
        .attr('x', xScale(y))
        .attr('y', 0)
        .attr('width', xScale(y + 10) - xScale(y))
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', (Math.floor((y - timelineStartYear) / 10) % 2 === 0) ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)');
    }

    // X axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('d'))
      .ticks(12);

    g.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom + 5})`)
      .call(xAxis)
      .call(ax => ax.select('.domain').attr('stroke', '#444'))
      .call(ax => ax.selectAll('text').attr('fill', '#aaa').attr('font-size', '11px'));

    // Scenario lane labels and milestone markers
    const laneHeight = (height - margin.top - margin.bottom) / scenarios.length;

    scenarios.forEach((scenario, i) => {
      const laneY = i * laneHeight;
      const midY = laneY + laneHeight / 2;

      // Lane label
      g.append('text')
        .attr('x', -8)
        .attr('y', midY + 4)
        .attr('text-anchor', 'end')
        .attr('fill', scenario.color)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(scenario.name);

      // Lane line
      innerG.append('line')
        .attr('x1', 0).attr('x2', width)
        .attr('y1', midY).attr('y2', midY)
        .attr('stroke', scenario.color)
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4');

      // Milestone markers
      scenario.milestones.forEach(milestone => {
        const mx = xScale(milestone.year);
        if (mx < 0 || mx > width) return;

        const markerG = innerG.append('g')
          .attr('transform', `translate(${mx},${midY})`)
          .attr('class', 'milestone-marker')
          .style('cursor', 'grab')
          .attr('data-id', milestone.id)
          .attr('data-scenario', scenario.id);

        // Vertical tick line
        markerG.append('line')
          .attr('x1', 0).attr('x2', 0)
          .attr('y1', -laneHeight / 2 + 4).attr('y2', laneHeight / 2 - 4)
          .attr('stroke', scenario.color)
          .attr('stroke-width', 2);

        // Circle
        markerG.append('circle')
          .attr('r', 12)
          .attr('fill', scenario.id === activeScenarioId ? scenario.color : 'transparent')
          .attr('stroke', scenario.color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.9);

        // Icon text
        markerG.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', '12px')
          .text(milestone.icon);

        // Tooltip group (hidden)
        const tooltip = markerG.append('g')
          .attr('class', 'tooltip')
          .attr('transform', 'translate(0,-40)')
          .style('display', 'none');

        tooltip.append('rect')
          .attr('x', -50).attr('y', -12)
          .attr('width', 100).attr('height', 24)
          .attr('rx', 4)
          .attr('fill', '#1a1f2e')
          .attr('stroke', scenario.color)
          .attr('stroke-width', 1);

        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#fff')
          .attr('font-size', '11px')
          .text(`${milestone.name} (${milestone.year})`);

        markerG
          .on('mouseenter', function () { d3.select(this).select('.tooltip').style('display', null); })
          .on('mouseleave', function () { d3.select(this).select('.tooltip').style('display', 'none'); });

        // Drag behavior
        const drag = d3.drag()
          .on('start', function () {
            d3.select(this).style('cursor', 'grabbing');
          })
          .on('drag', function (event) {
            const newX = Math.max(0, Math.min(width, event.x));
            d3.select(this).attr('transform', `translate(${newX},${midY})`);
          })
          .on('end', function (event) {
            d3.select(this).style('cursor', 'grab');
            const newX = Math.max(0, Math.min(width, event.x));
            const newYear = Math.round(xScale.invert(newX));
            const clampedYear = Math.max(timelineStartYear, Math.min(endYear, newYear));
            dispatch({
              type: 'UPDATE_MILESTONE',
              scenarioId: scenario.id,
              milestoneId: milestone.id,
              updates: { year: clampedYear },
            });
          });

        markerG.call(drag);
      });
    });

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', event => {
        innerG.attr('transform', event.transform);
      });

    svg.call(zoom);
  }, [scenarios, activeScenarioId, timelineStartYear, dispatch]);

  return (
    <div className="timeline-container">
      <h2 className="section-title">Life Timeline</h2>
      <p className="section-hint">Drag milestones to reposition · Scroll to zoom</p>
      <div className="timeline-svg-wrapper">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
