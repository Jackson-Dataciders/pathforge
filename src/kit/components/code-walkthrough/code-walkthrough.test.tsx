import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CodeWalkthrough } from './CodeWalkthrough';
import { codeWalkthroughSchema } from './schema';

describe('CodeWalkthrough', () => {
  it('advances the caption and highlighted line range', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    render(
      <CodeWalkthrough
        code={'one();\ntwo();'}
        id="example-walkthrough"
        language="javascript"
        steps={[
          { lines: '1', caption: 'Run the first call.' },
          { lines: '2', caption: 'Then run the second call.' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Then run the second call.')).toBeInTheDocument();
    expect(screen.getByText('two();')).toBeInTheDocument();
  });

  it('rejects a line range beyond the code sample', () => {
    const result = codeWalkthroughSchema.safeParse({
      id: 'invalid-range',
      language: 'javascript',
      code: Array.from({ length: 10 }, (_, index) => `line ${index + 1}`).join('\n'),
      steps: [{ lines: '40-45', caption: 'Outside the sample.' }],
    });

    expect(result.success).toBe(false);
  });
});