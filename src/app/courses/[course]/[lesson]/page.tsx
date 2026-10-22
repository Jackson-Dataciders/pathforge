import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPublishedCourse,
  getPublishedLesson,
  listPublishedCourses,
  readLessonBody,
} from '@/content/courses';
import { KitResultProvider } from '@/kit/result-context';
import { compileLesson } from '@/kit/compile';

type LessonPageProps = {
  params: Promise<{ course: string; lesson: string }>;
};

export function generateStaticParams() {
  const params = listPublishedCourses().flatMap((course) =>
    course.lessons
      .filter(({ stage }) => stage === 'implemented')
      .map(({ stem }) => ({ course: course.slug, lesson: stem })),
  );
  return params.length > 0
    ? params
    : [{ course: '__pathforge_no_published_courses__', lesson: '__no_implemented_lessons__' }];
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { course, lesson } = await params;
  const publishedLesson = getPublishedLesson(course, lesson);

  return publishedLesson ? { title: publishedLesson.frontmatter.title } : {};
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { course: slug, lesson: stem } = await params;
  const course = getPublishedCourse(slug);
  const lesson = getPublishedLesson(slug, stem);
  const body = readLessonBody(slug, stem);
  if (!course || !lesson || body === undefined) notFound();

  const lessonIndex = course.lessons.findIndex(({ stem: lessonStem }) => lessonStem === stem);
  const previousLesson = course.lessons[lessonIndex - 1];
  const nextLesson = course.lessons[lessonIndex + 1];
  const content = await compileLesson(body, { file: lesson.file });

  return (
    <article lang={course.frontmatter.course_language} className="space-y-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted">
        <Link href="/courses" className="hover:text-accent">Courses</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/courses/${course.slug}`} className="hover:text-accent">
          {course.frontmatter.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-fg">{lesson.frontmatter.title}</span>
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">{lesson.frontmatter.title}</h1>
        <p className="text-sm text-muted">{lesson.frontmatter.estimated_minutes} min</p>
      </header>

      <section aria-labelledby="objectives-heading" className="rounded border border-border bg-surface p-5">
        <h2 id="objectives-heading" className="mb-3 text-lg font-semibold">Objectives</h2>
        <ul className="list-disc space-y-1 pl-5">
          {lesson.frontmatter.objectives.map((objective) => <li key={objective}>{objective}</li>)}
        </ul>
      </section>

      <KitResultProvider>
        <div className="lesson-prose">{content}</div>
      </KitResultProvider>

      <nav aria-label="Lesson navigation" className="flex justify-between gap-4 border-t border-border pt-5">
        {previousLesson ? (
          <Link href={`/courses/${course.slug}/${previousLesson.stem}`} className="hover:text-accent">
            Previous: {previousLesson.frontmatter.title}
          </Link>
        ) : <span />}
        {nextLesson && (
          <Link href={`/courses/${course.slug}/${nextLesson.stem}`} className="ml-auto hover:text-accent">
            Next: {nextLesson.frontmatter.title}
          </Link>
        )}
      </nav>
    </article>
  );
}