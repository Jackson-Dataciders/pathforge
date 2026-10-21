'use client';

import { useState } from 'react';
import { Markdown } from '../../markdown';
import { useReportResult } from '../../result-context';
import { gradeQuiz, type QuizAnswers } from './grade';
import type { Quiz } from './schema';

type QuizProps = Quiz;

function ResultIcon({ correct }: { correct: boolean }) {
  return (
    <svg aria-hidden="true" className="size-4 shrink-0" fill="none" viewBox="0 0 16 16">
      {correct ? (
        <path d="m3 8 3.25 3.25L13 4.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      ) : (
        <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      )}
    </svg>
  );
}

export function Quiz({ id, title, pass_threshold, questions }: QuizProps) {
  const reportResult = useReportResult();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [grade, setGrade] = useState<ReturnType<typeof gradeQuiz> | null>(null);

  function setAnswer(questionId: string, answer: string | string[] | boolean) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    setGrade(null);
  }

  function hasAnswer(question: Quiz['questions'][number]): boolean {
    const answer = answers[question.id];
    if (question.type === 'multiple') return Array.isArray(answer) && answer.length > 0;
    if (question.type === 'boolean') return typeof answer === 'boolean';
    return typeof answer === 'string' && (question.type !== 'text' || answer.trim().length > 0);
  }

  function checkAnswers() {
    const result = gradeQuiz({ id, title, pass_threshold, questions }, answers);
    setGrade(result);
    reportResult({ blockId: id, kind: 'quiz', passed: result.passed });
  }

  function tryAgain() {
    setAnswers({});
    setGrade(null);
  }

  return (
    <section aria-label={title ?? 'Quiz'} className="my-6 space-y-5">
      {title ? <h2 className="text-xl font-semibold">{title}</h2> : null}
      <div className="space-y-5">
        {questions.map((question, index) => {
          const result = grade?.results.find((item) => item.questionId === question.id);
          const answer = answers[question.id];

          return (
            <fieldset className="space-y-3 border border-border bg-surface p-4" key={question.id}>
              <legend className="sr-only">Question {index + 1}</legend>
              <div className="font-medium">
                <span className="mr-2 text-muted">{index + 1}.</span>
                <Markdown>{question.prompt}</Markdown>
              </div>

              {question.type === 'single' || question.type === 'multiple' ? (
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const inputId = `${id}-${question.id}-${option.id}`;
                    const checked =
                      question.type === 'single'
                        ? answer === option.id
                        : Array.isArray(answer) && answer.includes(option.id);

                    return (
                      <label className="flex cursor-pointer items-start gap-3 text-sm" htmlFor={inputId} key={option.id}>
                        <input
                          aria-label={option.text}
                          checked={checked}
                          className="mt-1 accent-accent"
                          id={inputId}
                          name={`${id}-${question.id}`}
                          onChange={(event) => {
                            if (question.type === 'single') {
                              setAnswer(question.id, option.id);
                            } else {
                              const selected = Array.isArray(answer) ? answer : [];
                              setAnswer(
                                question.id,
                                event.target.checked
                                  ? [...selected, option.id]
                                  : selected.filter((selectedId) => selectedId !== option.id),
                              );
                            }
                          }}
                          type={question.type === 'single' ? 'radio' : 'checkbox'}
                        />
                        <span>{option.text}</span>
                      </label>
                    );
                  })}
                </div>
              ) : question.type === 'boolean' ? (
                <div className="flex gap-5">
                  {[true, false].map((value) => {
                    const inputId = `${id}-${question.id}-${value}`;
                    return (
                      <label className="flex cursor-pointer items-center gap-2 text-sm" htmlFor={inputId} key={inputId}>
                        <input
                          aria-label={value ? 'True' : 'False'}
                          checked={answer === value}
                          className="accent-accent"
                          id={inputId}
                          name={`${id}-${question.id}`}
                          onChange={() => setAnswer(question.id, value)}
                          type="radio"
                        />
                        {value ? 'True' : 'False'}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <label className="block space-y-1 text-sm" htmlFor={`${id}-${question.id}`}>
                  <span className="sr-only">Your answer</span>
                  <input
                    aria-label="Your answer"
                    autoComplete="off"
                    className="w-full rounded border border-border bg-background px-3 py-2 text-fg"
                    id={`${id}-${question.id}`}
                    onChange={(event) => setAnswer(question.id, event.target.value)}
                    type="text"
                    value={typeof answer === 'string' ? answer : ''}
                  />
                </label>
              )}

              {result ? (
                <div aria-live="polite" className={result.correct ? 'text-success' : 'text-danger'}>
                  <p className="flex items-center gap-2 font-medium">
                    <ResultIcon correct={result.correct} />
                    {result.correct ? 'Correct' : 'Incorrect'}
                  </p>
                  <div className="mt-2 text-sm text-fg">
                    <Markdown>{question.explanation}</Markdown>
                  </div>
                </div>
              ) : null}
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded border border-border bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!questions.every(hasAnswer)}
          onClick={checkAnswers}
          type="button"
        >
          Check answers
        </button>
        {grade ? (
          <>
            <p aria-live="polite" className="font-medium">
              {grade.passed ? 'Passed' : 'Not passed'}
              <span className="ml-2 text-sm font-normal text-muted">
                Score: {Math.round(grade.score * 100)}%
              </span>
            </p>
            <button
              className="rounded border border-border px-4 py-2 text-sm text-fg"
              onClick={tryAgain}
              type="button"
            >
              Try again
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}