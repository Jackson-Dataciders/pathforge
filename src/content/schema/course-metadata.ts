import { z } from 'zod';

export const COURSE_STATUSES = [
  'draft',
  'planning',
  'researching',
  'implementing',
  'validating',
  'published',
  'failed',
] as const;

const languageCodeSchema = z
  .string()
  .regex(/^[a-z]{2}$/)
  .refine(
    (code) => new Intl.DisplayNames(['en'], { type: 'language' }).of(code) !== code,
    'Must be a recognized two-letter language code',
  );

const courseFieldSchemas = {
  title: z.string().optional(),
  topic: z.string().optional(),
  course_language: languageCodeSchema.optional(),
  code_language: z.union([z.literal(''), z.string().regex(/^[a-z][a-z0-9-]*$/)]).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  category: z.string().optional(),
  labels: z.array(z.string()).optional(),
  created: z.iso.date().optional(),
  pipeline: z
    .object({
      run_id: z.string().optional(),
      last_stage: z.string().optional(),
      error: z.string().optional(),
      new_components: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
};

type CourseMetadataField = {
  key: keyof typeof courseFieldSchemas;
  required: 'user' | 'pipeline' | 'optional';
  description: string;
  schema: z.ZodType;
};

export const COURSE_METADATA_FIELDS = [
  { key: 'title', required: 'pipeline', description: 'Course title.', schema: courseFieldSchemas.title },
  { key: 'topic', required: 'user', description: 'Subject the course teaches.', schema: courseFieldSchemas.topic },
  {
    key: 'course_language',
    required: 'user',
    description: 'Two-letter language code for the course content.',
    schema: courseFieldSchemas.course_language,
  },
  {
    key: 'code_language',
    required: 'user',
    description: 'Lowercase identifier for the code language, or none.',
    schema: courseFieldSchemas.code_language,
  },
  { key: 'status', required: 'pipeline', description: 'Pipeline-managed course lifecycle state.', schema: courseFieldSchemas.status },
  { key: 'category', required: 'pipeline', description: 'Course taxonomy category.', schema: courseFieldSchemas.category },
  { key: 'labels', required: 'pipeline', description: 'Course taxonomy labels.', schema: courseFieldSchemas.labels },
  { key: 'created', required: 'pipeline', description: 'Date the course was created.', schema: courseFieldSchemas.created },
  { key: 'pipeline', required: 'pipeline', description: 'Pipeline execution metadata.', schema: courseFieldSchemas.pipeline },
] as const satisfies readonly CourseMetadataField[];

const courseFrontmatterShape = Object.fromEntries(
  COURSE_METADATA_FIELDS.map(({ key, schema }) => [key, schema]),
) as typeof courseFieldSchemas;

export const courseFrontmatterSchema = z.object(courseFrontmatterShape).passthrough();

const nonEmptyString = z.string().trim().min(1);

const readyCourseBaseSchema = courseFrontmatterSchema.extend({
  status: z.literal('draft'),
  topic: nonEmptyString,
  course_language: languageCodeSchema,
  code_language: nonEmptyString,
  body: z.string(),
});

function getDescriptionSection(body: string): string {
  const lines = body.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^##[ \t]+Description[ \t]*$/.test(line));
  if (headingIndex < 0) return '';

  const followingHeadingIndex = lines.findIndex(
    (line, index) => index > headingIndex && /^#{1,6}[ \t]+/.test(line),
  );
  const descriptionLines = lines.slice(
    headingIndex + 1,
    followingHeadingIndex < 0 ? undefined : followingHeadingIndex,
  );

  return descriptionLines.join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();
}

export const readyCourseSchema = readyCourseBaseSchema.superRefine((course, context) => {
  if (!getDescriptionSection(course.body)) {
    context.addIssue({
      code: 'custom',
      path: ['body'],
      message: 'The ## Description section must not be empty',
    });
  }
});

export const publishedCourseSchema = courseFrontmatterSchema.extend({
  status: z.literal('published'),
  title: nonEmptyString,
  category: nonEmptyString,
  labels: z.array(nonEmptyString).min(1),
});