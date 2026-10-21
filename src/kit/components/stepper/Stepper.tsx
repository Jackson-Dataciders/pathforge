'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { z } from 'zod';
import { Markdown } from '../../markdown';
import { useStepper } from '../../shared/use-stepper';
import { StepperControls } from '../../shared/stepper-controls';
import { Diagram } from '../diagram/Diagram';
import type { stepperSchema } from './schema';

type StepperProps = z.infer<typeof stepperSchema>;

export function Stepper({ title, autoplay, interval_ms, steps }: StepperProps) {
  const { index, next, prev, playing, play, pause } = useStepper({
    count: steps.length,
    autoplay,
    intervalMs: interval_ms,
  });
  const prefersReducedMotion = useReducedMotion();
  const step = steps[index];

  return (
    <section aria-label={title || 'Step-by-step explanation'} className="my-6">
      {title ? <h3 className="mb-3 text-lg font-semibold text-fg">{title}</h3> : null}
      <div aria-live="polite" className="min-h-24 overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -12 }}
            initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
            key={index}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          >
            <div className="mb-2 text-sm font-medium text-fg">
              <Markdown>{step.caption}</Markdown>
            </div>
            {step.diagram ? <Diagram code={step.diagram} /> : null}
            {step.body ? (
              <div className="text-sm leading-6 text-fg">
                <Markdown>{step.body}</Markdown>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
      <StepperControls
        count={steps.length}
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