'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';
import { Markdown } from '../../markdown';
import { StepperControls } from '../../shared/stepper-controls';
import { useStepper } from '../../shared/use-stepper';
import { stateAt } from './reducer';
import type { ArrayViz as ArrayVizData } from './schema';

const cellWidth = 84;
const cellHeight = 48;
const cellGap = 12;

export function ArrayViz({ id, title, kind, initial, steps }: ArrayVizData) {
  const prefersReducedMotion = useReducedMotion();
  const markerId = `array-viz-arrow-${useId().replaceAll(':', '')}`;
  const { index, next, prev, playing, play, pause } = useStepper({
    count: steps.length + 1,
    autoplay: false,
    intervalMs: 2500,
  });
  const state = stateAt({ kind, initial }, steps, index);
  const caption = index === 0 ? 'Initial state.' : steps[index - 1].caption;
  const entries = state.values.map((value, valueIndex) => ({ value, valueIndex }));
  if (kind === 'stack') entries.reverse();

  const isVertical = kind === 'stack';
  const width = isVertical ? 280 : Math.max(120, entries.length * (cellWidth + cellGap) + 16);
  const height = isVertical ? Math.max(108, entries.length * (cellHeight + cellGap) + 20) : 150;
  const cellPosition = (valueIndex: number) => {
    const displayIndex = kind === 'stack' ? state.values.length - 1 - valueIndex : valueIndex;
    return isVertical
      ? { x: 88, y: 16 + displayIndex * (cellHeight + cellGap) }
      : { x: 16 + displayIndex * (cellWidth + cellGap), y: 52 };
  };
  const description = `Values: ${state.values.map((value) => String(value)).join(', ') || 'empty'}. Highlighted indices: ${state.highlights.join(', ') || 'none'}.`;

  return (
    <section aria-label={title || `${kind} visualization`} className="my-6">
      {title ? <h3 className="mb-3 text-lg font-semibold text-fg">{title}</h3> : null}
      <div className="mb-3 text-sm leading-6 text-fg"><Markdown>{caption}</Markdown></div>
      <div className="overflow-x-auto">
        <svg
          aria-label={`${caption} ${description}`}
          className="max-w-none"
          height={height}
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
        >
          <title>{`${id}: ${caption} ${description}`}</title>
          <defs>
            <marker id={markerId} markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
              <path d="M0,0 L7,3.5 L0,7 z" fill="var(--color-accent)" />
            </marker>
          </defs>
          {kind === 'queue' && state.values.length > 0 ? (
            <>
              <text className="fill-muted text-xs" textAnchor="middle" x={cellPosition(0).x + cellWidth / 2} y="22">
                Front
              </text>
              <text
                className="fill-muted text-xs"
                textAnchor="middle"
                x={cellPosition(state.values.length - 1).x + cellWidth / 2}
                y="137"
              >
                Back
              </text>
            </>
          ) : null}
          {entries.map(({ value, valueIndex }) => {
            const position = cellPosition(valueIndex);
            const highlighted = state.highlights.includes(valueIndex);
            return (
              <motion.g
                key={valueIndex}
                layout
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              >
                <motion.rect
                  animate={{ fill: highlighted ? 'var(--color-accent)' : 'var(--color-surface)' }}
                  height={cellHeight}
                  layout
                  rx="3"
                  stroke={highlighted ? 'var(--color-accent)' : 'var(--color-border)'}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  width={cellWidth}
                  x={position.x}
                  y={position.y}
                />
                <text
                  className={highlighted ? 'fill-accent-fg text-sm font-semibold' : 'fill-fg text-sm'}
                  dominantBaseline="middle"
                  textAnchor="middle"
                  x={position.x + cellWidth / 2}
                  y={position.y + cellHeight / 2}
                >
                  {String(value)}
                </text>
                <text
                  className={highlighted ? 'fill-accent-fg text-xs' : 'fill-muted text-xs'}
                  textAnchor="end"
                  x={position.x + cellWidth - 5}
                  y={position.y + cellHeight - 5}
                >
                  {valueIndex}
                </text>
              </motion.g>
            );
          })}
          {Object.entries(state.pointers).map(([name, valueIndex]) => {
            const position = cellPosition(valueIndex);
            const horizontal = kind !== 'stack';
            return (
              <g key={name}>
                <text
                  className="fill-accent text-xs font-semibold"
                  textAnchor={horizontal ? 'middle' : 'start'}
                  x={horizontal ? position.x + cellWidth / 2 : 218}
                  y={horizontal ? 43 : position.y + cellHeight / 2 - 8}
                >
                  {name}
                </text>
                <line
                  markerEnd={`url(#${markerId})`}
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                  x1={horizontal ? position.x + cellWidth / 2 : 214}
                  x2={horizontal ? position.x + cellWidth / 2 : position.x + cellWidth + 4}
                  y1={horizontal ? 46 : position.y + cellHeight / 2}
                  y2={horizontal ? position.y - 3 : position.y + cellHeight / 2}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <ol className="sr-only" aria-live="polite" aria-label="Current values">
        {state.values.map((value, valueIndex) => <li key={valueIndex}>{`Index ${valueIndex}: ${value}`}</li>)}
      </ol>
      <StepperControls
        count={steps.length + 1}
        index={index}
        next={next}
        pause={pause}
        play={play}
        playing={playing}
        prev={prev}
      />
    </section>
  );
}