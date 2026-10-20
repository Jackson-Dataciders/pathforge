import { z } from 'zod';

export const LIFECYCLE_TAGS = ['created', 'planned', 'implemented'] as const;

const lifecycleTagSchema = z.enum(LIFECYCLE_TAGS);

export const sourceSchema = z.object({
  id: z.string().regex(/^s\d+$/),
  title: z.string().trim().min(1),
  url: z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol)),
  publisher: z.string().trim().min(1),
  accessed: z.iso.date(),
});

export const claimSchema = z.object({
  id: z.string().regex(/^c\d+$/),
  text: z.string().trim().min(1),
  status: z.enum(['draft', 'verified', 'corrected', 'rejected']),
  sources: z.array(z.string()),
  note: z.string().optional(),
});

export const lessonFrontmatterSchema = z
  .object({
    title: z.string().trim().min(1),
    lesson: z.number().int().positive(),
    tags: z.array(z.string()).refine(
      (tags) => tags.filter((tag) => LIFECYCLE_TAGS.includes(tag as (typeof LIFECYCLE_TAGS)[number])).length === 1,
      'Exactly one lifecycle tag is required',
    ),
    objectives: z.array(z.string()),
    outline: z.array(z.string()),
    components: z.array(z.string()),
    claims: z.array(claimSchema),
    sources: z.array(sourceSchema),
    estimated_minutes: z.number().int().positive(),
  })
  .passthrough();

export function lifecycleTag(frontmatter: { tags?: readonly string[] }): (typeof LIFECYCLE_TAGS)[number] | undefined {
  return frontmatter.tags?.find((tag): tag is (typeof LIFECYCLE_TAGS)[number] =>
    lifecycleTagSchema.safeParse(tag).success,
  );
}