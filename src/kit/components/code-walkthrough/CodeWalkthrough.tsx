'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { z } from 'zod';
import { Markdown } from '../../markdown';
import { useStepper } from '../../shared/use-stepper';
import { StepperControls } from '../../shared/stepper-controls';
import type { codeWalkthroughSchema } from './schema';

type CodeWalkthroughProps = z.infer<typeof codeWalkthroughSchema>;

function getCodeLines(code: string) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  if (code.endsWith('\n')) lines.pop();
  return lines;
}

export function CodeWalkthrough({ title, language, code, steps }: CodeWalkthroughProps) {
  const prefersReducedMotion = useReducedMotion();
  const { index, next, prev, playing, play, pause } = useStepper({
    count: steps.length,
    autoplay: false,
    intervalMs: 2500,
  });
  const lines = getCodeLines(code);
  const activeStep = steps[index];
  const [startLine, endLine = startLine] = activeStep.lines.split('-').map(Number);

  return (
    <section aria-label={title || `${language} code walkthrough`} className="my-6">
      {title ? <h3 className="mb-3 text-lg font-semibold text-fg">{title}</h3> : null}
      <pre className="overflow-x-auto rounded border border-border bg-surface py-2 text-sm">
        <code aria-label={`${language} code`} className="block font-mono text-xs leading-6">
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const highlighted = lineNumber >= startLine && lineNumber <= endLine;
            return (
              <motion.div
                className="relative grid min-w-max grid-cols-[3rem_auto] px-3"
                key={lineNumber}
                layout
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              >
                <motion.span
                  animate={{ opacity: highlighted ? 1 : 0 }}
                  className="absolute inset-0 bg-accent/15"
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                />
                <span className="relative select-none pr-3 text-right text-muted" aria-hidden="true">
                  {lineNumber}
                </span>
                <span className="relative whitespace-pre text-fg">{line || ' '}</span>
              </motion.div>
            );
          })}
        </code>
      </pre>
      <div className="mt-3 text-sm leading-6 text-fg">
        <Markdown>{activeStep.caption}</Markdown>
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