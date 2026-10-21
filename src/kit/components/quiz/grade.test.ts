import { describe, expect, it } from 'vitest';
import { gradeQuiz } from './grade';
import { quizSchema } from './schema';

function makeQuiz(questions: unknown[], passThreshold = 1) {
  return quizSchema.parse({ id: 'quiz', pass_threshold: passThreshold, questions });
}

describe('gradeQuiz', () => {
  it('grades single-choice questions by selected option id', () => {
    const quiz = makeQuiz([
      {
        id: 'single',
        type: 'single',
        prompt: 'Pick one.',
        explanation: 'First is correct.',
        options: [
          { id: 'first', text: 'First', correct: true },
          { id: 'second', text: 'Second', correct: false },
        ],
      },
    ]);

    expect(gradeQuiz(quiz, { single: 'first' })).toMatchObject({ score: 1, passed: true });
    expect(gradeQuiz(quiz, { single: 'second' })).toMatchObject({ score: 0, passed: false });
  });

  it('requires the exact correct set for multiple-choice questions', () => {
    const quiz = makeQuiz([
      {
        id: 'multiple',
        type: 'multiple',
        prompt: 'Pick both.',
        explanation: 'First and second are correct.',
        options: [
          { id: 'first', text: 'First', correct: true },
          { id: 'second', text: 'Second', correct: true },
          { id: 'third', text: 'Third', correct: false },
        ],
      },
    ]);

    expect(gradeQuiz(quiz, { multiple: ['first', 'second'] }).score).toBe(1);
    expect(gradeQuiz(quiz, { multiple: ['first'] }).score).toBe(0);
    expect(gradeQuiz(quiz, { multiple: ['first', 'second', 'third'] }).score).toBe(0);
  });

  it('grades true/false answers', () => {
    const quiz = makeQuiz([
      {
        id: 'boolean',
        type: 'boolean',
        prompt: 'Is this true?',
        explanation: 'It is true.',
        answer: true,
      },
    ]);

    expect(gradeQuiz(quiz, { boolean: true }).score).toBe(1);
    expect(gradeQuiz(quiz, { boolean: false }).score).toBe(0);
  });

  it('trims, collapses whitespace, and ignores case for text by default', () => {
    const quiz = makeQuiz([
      {
        id: 'text',
        type: 'text',
        prompt: 'Enter the phrase.',
        explanation: 'Whitespace and case do not matter.',
        accepted: ['Path   Forge'],
      },
    ]);

    expect(gradeQuiz(quiz, { text: '  PATH\tForge  ' }).score).toBe(1);
    expect(gradeQuiz(quiz, { text: '' }).score).toBe(0);
    expect(gradeQuiz(quiz, {}).score).toBe(0);
  });

  it('preserves case when case_sensitive is enabled', () => {
    const quiz = makeQuiz([
      {
        id: 'text',
        type: 'text',
        prompt: 'Enter the code.',
        explanation: 'Case matters.',
        accepted: ['PathForge'],
        case_sensitive: true,
      },
    ]);

    expect(gradeQuiz(quiz, { text: 'PathForge' }).score).toBe(1);
    expect(gradeQuiz(quiz, { text: 'pathforge' }).score).toBe(0);
  });

  it('uses the configured pass threshold and returns per-question results', () => {
    const quiz = makeQuiz(
      [
        {
          id: 'first',
          type: 'boolean',
          prompt: 'First?',
          explanation: 'Yes.',
          answer: true,
        },
        {
          id: 'second',
          type: 'boolean',
          prompt: 'Second?',
          explanation: 'No.',
          answer: false,
        },
      ],
      0.5,
    );

    expect(gradeQuiz(quiz, { first: true, second: true })).toEqual({
      score: 0.5,
      passed: true,
      results: [
        { questionId: 'first', correct: true },
        { questionId: 'second', correct: false },
      ],
    });
  });
});