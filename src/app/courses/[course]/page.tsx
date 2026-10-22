import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedCourse, listPublishedCourses } from '@/content/courses';
import { getCategory, getLabel } from '@/content/taxonomy';
import { Markdown } from '@/kit/markdown';

type CoursePageProps = {
  params: Promise<{ course: string }>;
};

export function generateStaticParams() {
  const courses = listPublishedCourses();
  return courses.length > 0
    ? courses.map(({ slug }) => ({ course: slug }))
    : [{ course: '__pathforge_no_published_courses__' }];
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { course: slug } = await params;
  const course = getPublishedCourse(slug);

  return course ? { title: course.frontmatter.title } : {};
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { course: slug } = await params;
  const course = getPublishedCourse(slug);
  if (!course) notFound();

  const category = getCategory(course.frontmatter.category ?? '');
  const labels = (course.frontmatter.labels ?? []).map((id) => getLabel(id)?.title ?? id);
  const estimatedMinutes = course.lessons.reduce(
    (total, lesson) => total + lesson.frontmatter.estimated_minutes,
    0,
  );

  return (
    <article lang={course.frontmatter.course_language} className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-accent">{category?.title}</p>
        <h1 className="text-3xl font-semibold">{course.frontmatter.title}</h1>
        <div className="text-muted">
          <Markdown>{course.summary}</Markdown>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {labels.map((label) => (
            <span key={label} className="rounded border border-border px-2 py-1">
              {label}
            </span>
          ))}
          <span className="text-muted">{estimatedMinutes} min total</span>
        </div>
      </header>

      <section aria-labelledby="lessons-heading" className="space-y-3">
        <h2 id="lessons-heading" className="text-xl font-semibold">Lessons</h2>
        <ol className="divide-y divide-border border-y border-border">
          {course.lessons.map((lesson) => (
            <li key={lesson.stem}>
              <Link
                href={`/courses/${course.slug}/${lesson.stem}`}
                className="flex items-center justify-between gap-4 py-4 hover:text-accent"
              >
                <span>{lesson.frontmatter.title}</span>
                <span className="shrink-0 text-sm text-muted">
                  {lesson.frontmatter.estimated_minutes} min
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}