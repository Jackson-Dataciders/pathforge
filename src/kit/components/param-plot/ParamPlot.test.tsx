import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParamPlot } from './ParamPlot';
import { paramPlotSchema } from './schema';

let scheduledFrames: FrameRequestCallback[];

beforeEach(() => {
  scheduledFrames = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    scheduledFrames.push(callback);
    return scheduledFrames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function flushAnimationFrame() {
  act(() => {
    const callbacks = scheduledFrames;
    scheduledFrames = [];
    callbacks.forEach((callback) => callback(0));
  });
}

describe('ParamPlot', () => {
  it('updates the rendered path when a parameter slider changes', () => {
    const plot = paramPlotSchema.parse({
      id: 'linear-growth',
      x: { min: 0, max: 10 },
      params: [{ name: 'c', min: 0, max: 5, step: 1, value: 1 }],
      series: [
        { expression: 'c*x', label: 'c times x' },
        { expression: 'x^2', label: 'x squared' },
      ],
    });
    render(<ParamPlot {...plot} />);

    const path = screen.getByRole('img').querySelector('path');
    const originalPath = path?.getAttribute('d');
    fireEvent.change(screen.getByRole('slider', { name: 'c' }), { target: { value: '3' } });
    flushAnimationFrame();

    expect(path?.getAttribute('d')).not.toBe(originalPath);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /c = 3/ })).toBeInTheDocument();
  });

  it('leaves a gap at non-finite samples without crashing', () => {
    const plot = paramPlotSchema.parse({
      id: 'singularity',
      x: { min: 0, max: 10 },
      samples: 21,
      params: [],
      series: [{ expression: '1/(x-5)' }],
    });
    render(<ParamPlot {...plot} />);

    const path = screen.getByRole('img').querySelector('path');
    const pathData = path?.getAttribute('d') ?? '';
    expect(pathData.match(/M/g)).toHaveLength(2);
    expect(pathData).not.toMatch(/NaN|Infinity/);
  });
});