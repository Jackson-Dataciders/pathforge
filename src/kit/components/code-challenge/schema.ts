import { z } from 'zod';
import { SUPPORTED_CODE_LANGUAGES } from '../../../runners/types';

export const codeChallengeSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  prompt: z.string(),
  language: z.enum(SUPPORTED_CODE_LANGUAGES),
  starter: z.string(),
  solution: z.string(),
  tests: z.string(),
  hints: z.array(z.string()).max(5).default([]),
  timeout_ms: z.number().int().min(1000).max(15000).default(5000),
});