import type { Quiz } from './schema';

export type QuizAnswer = string | string[] | boolean;
export type QuizAnswers = Record<string, QuizAnswer | undefined>;

export type QuizGrade = {
  score: number;
  passed: boolean;
  results: { questionId: string; correct: boolean }[];
};

function normalizeText(value: string, caseSensitive: boolean): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return caseSensitive ? normalized : normalized.toLowerCase();
}

export function gradeQuiz(quiz: Quiz, answers: QuizAnswers): QuizGrade {
  const results = quiz.questions.map((question) => {
    const answer = answers[question.id];
    let correct = false;

    switch (question.type) {
      case 'single': {
        const correctOption = question.options.find((option) => option.correct);
        correct = typeof answer === 'string' && answer === correctOption?.id;
        break;
      }
      case 'multiple': {
        const selected = Array.isArray(answer) ? new Set(answer) : new Set<string>();
        const expected = new Set(
          question.options.filter((option) => option.correct).map((option) => option.id),
        );
        correct = selected.size === expected.size && [...expected].every((id) => selected.has(id));
        break;
      }
      case 'boolean':
        correct = typeof answer === 'boolean' && answer === question.answer;
        break;
      case 'text': {
        if (typeof answer === 'string') {
          correct = question.accepted.some(
            (accepted) =>
              normalizeText(answer, question.case_sensitive) ===
              normalizeText(accepted, question.case_sensitive),
          );
        }
        break;
      }
    }

    return { questionId: question.id, correct };
  });

  const score = results.filter((result) => result.correct).length / results.length;

  return {
    score,
    passed: score >= quiz.pass_threshold,
    results,
  };
}