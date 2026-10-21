import { z } from 'zod';

function getCodeLineCount(code: string) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  return code.endsWith('\n') ? lines.length - 1 : lines.length;
}

export const codeWalkthroughSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().optional(),
    language: z.string().min(1),
    code: z.string().min(1),
    steps: z
      .array(
        z.object({
          lines: z.string().regex(/^[1-9]\d*(?:-[1-9]\d*)?$/),
          caption: z.string(),
        }),
      )
      .min(1)
      .max(20),
  })
  .superRefine(({ code, steps }, context) => {
    const lineCount = getCodeLineCount(code);
    steps.forEach((step, index) => {
      const [startLine, endLine = startLine] = step.lines.split('-').map(Number);
      if (startLine > endLine || endLine > lineCount) {
        context.addIssue({
          code: 'custom',
          message: `Line range must be within 1-${lineCount} and start before it ends.`,
          path: ['steps', index, 'lines'],
        });
      }
    });
  });