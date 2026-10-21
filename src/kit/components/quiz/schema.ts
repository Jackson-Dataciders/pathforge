import { z } from 'zod';

const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  correct: z.boolean(),
});

const optionsSchema = z
  .array(optionSchema)
  .min(2)
  .max(8)
  .refine((options) => new Set(options.map((option) => option.id)).size === options.length, {
    message: 'Option ids must be unique within a question.',
  });

const questionBase = {
  id: z.string().min(1),
  prompt: z.string(),
  explanation: z.string(),
};

const singleQuestionSchema = z
  .object({
    ...questionBase,
    type: z.literal('single'),
    options: optionsSchema,
  })
  .refine((question) => question.options.filter((option) => option.correct).length === 1, {
    message: 'A single-choice question must have exactly one correct option.',
    path: ['options'],
  });

const multipleQuestionSchema = z
  .object({
    ...questionBase,
    type: z.literal('multiple'),
    options: optionsSchema,
  })
  .refine((question) => question.options.some((option) => option.correct), {
    message: 'A multiple-choice question must have at least one correct option.',
    path: ['options'],
  });

const booleanQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('boolean'),
  answer: z.boolean(),
});

const textQuestionSchema = z.object({
  ...questionBase,
  type: z.literal('text'),
  accepted: z.array(z.string().min(1)).min(1).max(10),
  case_sensitive: z.boolean().default(false),
});

export const questionSchema = z.discriminatedUnion('type', [
  singleQuestionSchema,
  multipleQuestionSchema,
  booleanQuestionSchema,
  textQuestionSchema,
]);

export const quizSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().optional(),
    pass_threshold: z.number().min(0).max(1).default(1),
    questions: z.array(questionSchema).min(1).max(15),
  })
  .refine((quiz) => new Set(quiz.questions.map((question) => question.id)).size === quiz.questions.length, {
    message: 'Question ids must be unique.',
    path: ['questions'],
  });

export type Quiz = z.infer<typeof quizSchema>;
export type QuizQuestion = z.infer<typeof questionSchema>;