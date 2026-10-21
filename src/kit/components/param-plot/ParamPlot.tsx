'use client';

import { compileExpression } from './expression';
import type { ParamPlot as ParamPlotData } from './schema';
import { useEffect, useRef, useState } from 'react';

const chart = { width: 720, height: 360, left: 64, right: 18, top: 18, bottom: 48 };
const seriesColors = ['var(--color-accent)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'];

function formatTick(value: number): string {
  return Number(value.toPrecision(3)).toString();
}

function getTicks(min: number, max: number): number[] {
  return Array.from({ length: 5 }, (_, index) => min + ((max - min) * index) / 4);
}

function PlotSvg({ id, title, x, y, samples, params, series, parameterValues }: ParamPlotData & { parameterValues: Record<string, number> }) {
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const values = parameterValues;
  const compiled = series.map((item) => compileExpression(item.expression, ['x', ...params.map((param) => param.name)]));
  const points = compiled.map((result) => {
    if (!result.ok) return [];
    return Array.from({ length: samples }, (_, index) => {
      const xValue = x.min + ((x.max - x.min) * index) / (samples - 1);
      try {
        return { x: xValue, y: result.evaluate({ ...values, x: xValue }) };
      } catch {
        return { x: xValue, y: Number.NaN };
      }
    });
  });
  const finiteYValues = points.flatMap((seriesPoints) => seriesPoints.map((point) => point.y).filter(Number.isFinite));
  const dataMin = finiteYValues.length > 0 ? Math.min(...finiteYValues) : -1;
  const dataMax = finiteYValues.length > 0 ? Math.max(...finiteYValues) : 1;
  const dataSpan = dataMax - dataMin || Math.max(Math.abs(dataMin), 1);
  const yMin = y?.min ?? dataMin - dataSpan * 0.05;
  const yMax = y?.max ?? dataMax + dataSpan * 0.05;
  const xScale = (value: number) => chart.left + ((value - x.min) / (x.max - x.min)) * plotWidth;
  const yScale = (value: number) => chart.top + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const xTicks = getTicks(x.min, x.max);
  const yTicks = getTicks(yMin, yMax);
  const description = [
    `Series: ${series.map((item) => item.label ?? item.expression).join(', ')}.`,
    `Parameters: ${params.map((param) => `${param.label ?? param.name} = ${formatTick(values[param.name])}`).join(', ') || 'none'}.`,
  ].join(' ');

  return (
    <div className="min-w-0">
      <svg aria-label={description} className="block h-auto w-full" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
        <title>{title ?? 'Parameter plot'}</title>
        {xTicks.map((tick) => (
          <g key={`x-${tick}`}>
            <line stroke="var(--color-border)" strokeWidth="1" x1={xScale(tick)} x2={xScale(tick)} y1={chart.top} y2={chart.height - chart.bottom} />
            <text fill="var(--color-muted)" fontSize="12" textAnchor="middle" x={xScale(tick)} y={chart.height - chart.bottom + 22}>
              {formatTick(tick)}
            </text>
          </g>
        ))}
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line stroke="var(--color-border)" strokeWidth="1" x1={chart.left} x2={chart.width - chart.right} y1={yScale(tick)} y2={yScale(tick)} />
            <text fill="var(--color-muted)" fontSize="12" textAnchor="end" x={chart.left - 10} y={yScale(tick) + 4}>
              {formatTick(tick)}
            </text>
          </g>
        ))}
        <line stroke="var(--color-fg)" strokeWidth="1.5" x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.height - chart.bottom} />
        <line stroke="var(--color-fg)" strokeWidth="1.5" x1={chart.left} x2={chart.width - chart.right} y1={chart.height - chart.bottom} y2={chart.height - chart.bottom} />
        {x.label ? (
          <text fill="var(--color-fg)" fontSize="13" textAnchor="middle" x={chart.left + plotWidth / 2} y={chart.height - 8}>
            {x.label}
          </text>
        ) : null}
        {y?.label ? (
          <text fill="var(--color-fg)" fontSize="13" textAnchor="middle" transform={`rotate(-90 15 ${chart.top + plotHeight / 2})`} x="15" y={chart.top + plotHeight / 2}>
            {y.label}
          </text>
        ) : null}
        {points.map((seriesPoints, seriesIndex) => {
          let segmentOpen = false;
          const path = seriesPoints
            .map((point) => {
              if (!Number.isFinite(point.y)) {
                segmentOpen = false;
                return '';
              }
              const command = segmentOpen ? 'L' : 'M';
              segmentOpen = true;
              return `${command}${xScale(point.x).toFixed(2)},${yScale(point.y).toFixed(2)}`;
            })
            .join(' ');

          return <path d={path} fill="none" key={`${id}-series-${seriesIndex}`} stroke={seriesColors[seriesIndex]} strokeWidth="2.5" />;
        })}
      </svg>
      {series.length > 1 ? (
        <ul aria-label="Plot legend" className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          {series.map((item, index) => (
            <li className="flex items-center gap-2" key={`${id}-legend-${index}`}>
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: seriesColors[index] }} />
              {item.label ?? item.expression}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ParamPlot(props: ParamPlotData) {
  const initialValues = Object.fromEntries(props.params.map((param) => [param.name, param.value]));
  const [values, setValues] = useState(initialValues);
  const [plotValues, setPlotValues] = useState(initialValues);
  const pendingValues = useRef(initialValues);
  const frame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function updateParameter(name: string, value: number) {
    const nextValues = { ...pendingValues.current, [name]: value };
    pendingValues.current = nextValues;
    setValues(nextValues);

    if (frame.current === null) {
      frame.current = requestAnimationFrame(() => {
        setPlotValues(pendingValues.current);
        frame.current = null;
      });
    }
  }

  return (
    <section aria-label={props.title ?? 'Parameter plot'} className="my-6 space-y-3">
      {props.title ? <h3 className="text-lg font-semibold">{props.title}</h3> : null}
      <PlotSvg {...props} parameterValues={plotValues} />
      {props.params.length > 0 ? (
        <div className="space-y-3">
          {props.params.map((param) => {
            const inputId = `${props.id}-${param.name}`;
            return (
              <div className="space-y-1" key={param.name}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <label className="font-medium" htmlFor={inputId}>
                    {param.label ?? param.name}
                  </label>
                  <output htmlFor={inputId}>{formatTick(values[param.name])}</output>
                </div>
                <input
                  aria-label={param.label ?? param.name}
                  className="w-full accent-accent"
                  id={inputId}
                  max={param.max}
                  min={param.min}
                  onChange={(event) => updateParameter(param.name, Number(event.target.value))}
                  step={param.step}
                  type="range"
                  value={values[param.name]}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}