import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { isCourseSlug, isLessonFileName } from "./course-files";
import { ContentError } from "./errors";
import { getSection, parseMarkdownFile } from "./markdown-file";
import { contentRoot } from "./paths";
import { loadTaxonomy } from "./taxonomy";
import {
  courseFrontmatterSchema,
  publishedCourseSchema,
  readyCourseSchema,
} from "./schema/course-metadata";
import { lessonFrontmatterSchema, lifecycleTag } from "./schema/lesson";

type CourseFrontmatter = z.infer<typeof courseFrontmatterSchema>;
type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
type LessonStage = NonNullable<ReturnType<typeof lifecycleTag>>;

export type LessonMeta = {
  stem: string;
  file: string;
  number: number;
  frontmatter: LessonFrontmatter;
  stage: LessonStage;
};

export type Course = {
  slug: string;
  frontmatter: CourseFrontmatter;
  description: string;
  summary: string;
  lessonPlan: string;
  notes: string;
  lessons: LessonMeta[];
};

const coursesCache = new Map<string, Course[]>();
const courseCache = new Map<string, Course>();

function normalizedRoot(root?: string): string {
  return resolve(root ?? contentRoot());
}

function courseDirectory(slug: string, root?: string): string {
  return resolve(normalizedRoot(root), "courses", slug);
}

function errorMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "frontmatter";
    return `${path}: ${issue.message}`;
  });
}

function parseFile(file: string): ReturnType<typeof parseMarkdownFile> {
  try {
    return parseMarkdownFile(readFileSync(file, "utf8"));
  } catch (error) {
    throw new ContentError(file, [error instanceof Error ? error.message : String(error)]);
  }
}

function combineErrors(errors: ContentError[]): never {
  if (errors.length === 1) throw errors[0];
  throw new AggregateError(errors, errors.map(({ message }) => message).join("\n"));
}

export function discoverCourseFolders(root?: string): string[] {
  const directory = resolve(normalizedRoot(root), "courses");
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) =>
      entry.isDirectory() &&
      !entry.name.startsWith("_") &&
      !entry.name.startsWith(".") &&
      existsSync(resolve(directory, entry.name, "README.md")),
    )
    .map((entry) => entry.name)
    .sort();
}

export function loadCourse(slug: string, root?: string): Course {
  const base = normalizedRoot(root);
  const directory = courseDirectory(slug, base);
  if (dirname(directory) !== resolve(base, "courses")) {
    throw new ContentError(resolve(directory, "README.md"), ["Course slug resolves outside the courses directory"]);
  }

  const cacheKey = `${base}\0${slug}`;
  const cached = courseCache.get(cacheKey);
  if (cached) return cached;

  const readme = resolve(directory, "README.md");
  const parsedCourse = parseFile(readme);
  const parsedFrontmatter = parsedCourse.data;
  const validation = parsedFrontmatter.status === "published"
    ? publishedCourseSchema.safeParse(parsedFrontmatter)
    : parsedFrontmatter.status === "draft"
      ? readyCourseSchema.safeParse({ ...parsedFrontmatter, body: parsedCourse.body })
      : courseFrontmatterSchema.safeParse(parsedFrontmatter);

  if (!validation.success) {
    throw new ContentError(readme, errorMessages(validation.error));
  }

  const lessons: LessonMeta[] = [];
  const lessonErrors: ContentError[] = [];
  for (const name of readdirSync(directory).filter(isLessonFileName).sort()) {
    const file = resolve(directory, name);
    try {
      const parsedLesson = parseFile(file);
      const result = lessonFrontmatterSchema.safeParse(parsedLesson.data);
      if (!result.success) {
        lessonErrors.push(new ContentError(file, errorMessages(result.error)));
        continue;
      }

      const stage = lifecycleTag(result.data);
      if (!stage) {
        lessonErrors.push(new ContentError(file, ["Lesson must have exactly one lifecycle tag"]));
        continue;
      }

      const stem = name.slice(0, -3);
      lessons.push({
        stem,
        file,
        number: Number(stem.slice(0, 3)),
        frontmatter: result.data,
        stage,
      });
    } catch (error) {
      lessonErrors.push(error instanceof ContentError
        ? error
        : new ContentError(file, [error instanceof Error ? error.message : String(error)]));
    }
  }

  if (lessonErrors.length > 0) combineErrors(lessonErrors);

  lessons.sort((left, right) => left.number - right.number || left.stem.localeCompare(right.stem));
  const course: Course = {
    slug,
    frontmatter: validation.data as CourseFrontmatter,
    description: getSection(parsedCourse.body, "Description"),
    summary: getSection(parsedCourse.body, "Summary"),
    lessonPlan: getSection(parsedCourse.body, "Lesson plan"),
    notes: getSection(parsedCourse.body, "Notes"),
    lessons,
  };

  if (course.frontmatter.status === "published" && !lessons.some(({ stage }) => stage === "implemented")) {
    throw new ContentError(readme, ["Published course must contain at least one implemented lesson"]);
  }

  courseCache.set(cacheKey, course);
  return course;
}

export function listPublishedCourses(root?: string): Course[] {
  const base = normalizedRoot(root);
  const cached = coursesCache.get(base);
  if (cached) return cached;

  const taxonomy = loadTaxonomy(base);
  const categoryIds = new Set(taxonomy.categories.map(({ id }) => id));
  const labelIds = new Set(taxonomy.labels.map(({ id }) => id));
  const published: Course[] = [];
  const errors: ContentError[] = [];

  for (const slug of discoverCourseFolders(base)) {
    const readme = resolve(courseDirectory(slug, base), "README.md");
    let status: unknown;
    try {
      status = parseFile(readme).data.status;
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error));
      continue;
    }

    if (status !== "published") {
      if (!isCourseSlug(slug)) {
        console.warn(`${readme}: Course folder name "${slug}" is not a valid slug`);
        continue;
      }

      try {
        loadCourse(slug, base);
      } catch (error) {
        console.warn(error instanceof Error ? error.message : String(error));
      }
      continue;
    }

    if (!isCourseSlug(slug)) {
      errors.push(new ContentError(readme, [`Course folder name "${slug}" is not a valid slug`]));
      continue;
    }

    try {
      const course = loadCourse(slug, base);
      const messages: string[] = [];
      if (!categoryIds.has(course.frontmatter.category ?? "")) {
        messages.push(`Unknown category: ${course.frontmatter.category ?? "<missing>"}`);
      }
      for (const label of course.frontmatter.labels ?? []) {
        if (!labelIds.has(label)) messages.push(`Unknown label: ${label}`);
      }

      if (messages.length > 0) errors.push(new ContentError(readme, messages));
      else published.push(course);
    } catch (error) {
      if (error instanceof AggregateError) {
        errors.push(...error.errors.filter((entry): entry is ContentError => entry instanceof ContentError));
      } else if (error instanceof ContentError) {
        errors.push(error);
      } else {
        errors.push(new ContentError(readme, [error instanceof Error ? error.message : String(error)]));
      }
    }
  }

  if (errors.length > 0) combineErrors(errors);

  coursesCache.set(base, published);
  return published;
}

export function getPublishedCourse(slug: string, root?: string): Course | undefined {
  const course = listPublishedCourses(root).find((item) => item.slug === slug);
  return course
    ? { ...course, lessons: course.lessons.filter(({ stage }) => stage === "implemented") }
    : undefined;
}

export function getPublishedLesson(slug: string, stem: string, root?: string): LessonMeta | undefined {
  return getPublishedCourse(slug, root)?.lessons.find(
    (lesson) => lesson.stem === stem && lesson.stage === "implemented",
  );
}

export function readLessonBody(slug: string, stem: string, root?: string): string | undefined {
  const lesson = getPublishedLesson(slug, stem, root);
  return lesson ? parseFile(lesson.file).body : undefined;
}