import { describe, expect, it } from 'vitest';
import { quizSchema } from './schema';

describe('quizSchema', () => {
  it('rejects single-choice questions with more than one correct option', () => {
    const result = quizSchema.safeParse({
      id: 'quiz',
      questions: [
        {
          id: 'question',
          type: 'single',
          prompt: 'Choose one.',
          explanation: 'Only one answer is correct.',
          options: [
            { id: 'first', text: 'First', correct: true },
            { id: 'second', text: 'Second', correct: true },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});