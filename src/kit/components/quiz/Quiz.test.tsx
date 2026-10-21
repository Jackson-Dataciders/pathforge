import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KitResultProvider } from '../../result-context';
import { Quiz } from './Quiz';
import { quizSchema } from './schema';

function renderQuiz(report = vi.fn()) {
  const quiz = quizSchema.parse({
    id: 'test-quiz',
    title: 'Test quiz',
    questions: [
      {
        id: 'language',
        type: 'single',
        prompt: 'Which is correct?',
        explanation: 'JavaScript is correct.',
        options: [
          { id: 'javascript', text: 'JavaScript', correct: true },
          { id: 'ruby', text: 'Ruby', correct: false },
        ],
      },
    ],
  });

  render(
    <KitResultProvider report={report}>
      <Quiz {...quiz} />
    </KitResultProvider>,
  );

  return report;
}

describe('Quiz', () => {
  afterEach(cleanup);

  it('reports a passing result after all questions are answered correctly', async () => {
    const user = userEvent.setup();
    const report = renderQuiz();
    const checkButton = screen.getByRole('button', { name: 'Check answers' });

    expect(checkButton).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'JavaScript' }));
    expect(checkButton).toBeEnabled();
    await user.click(checkButton);

    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('JavaScript is correct.')).toBeInTheDocument();
    expect(report).toHaveBeenCalledWith({ blockId: 'test-quiz', kind: 'quiz', passed: true });
  });

  it('shows the explanation and reports a failing result for an incorrect answer', async () => {
    const user = userEvent.setup();
    const report = renderQuiz();

    await user.click(screen.getByRole('radio', { name: 'Ruby' }));
    await user.click(screen.getByRole('button', { name: 'Check answers' }));

    expect(screen.getByText('Not passed')).toBeInTheDocument();
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.getByText('JavaScript is correct.')).toBeInTheDocument();
    expect(report).toHaveBeenCalledWith({ blockId: 'test-quiz', kind: 'quiz', passed: false });
  });

  it('clears answers and feedback when trying again', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole('radio', { name: 'JavaScript' }));
    await user.click(screen.getByRole('button', { name: 'Check answers' }));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.queryByText('Passed')).not.toBeInTheDocument();
    expect(screen.queryByText('Correct')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'JavaScript' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Check answers' })).toBeDisabled();
  });
});