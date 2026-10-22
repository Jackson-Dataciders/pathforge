import Link from "next/link";
import type { CatalogEntry } from "@/content/catalog";

export function CourseCard({ course }: { course: CatalogEntry }) {
  return (
    <article className="space-y-2 border-b border-border py-5">
      <p className="text-sm font-medium text-accent">{course.category.title}</p>
      <h2 className="text-xl font-semibold">
        <Link href={`/courses/${course.slug}`} className="hover:text-accent">
          {course.title}
        </Link>
      </h2>
      <p className="text-muted">{course.summaryExcerpt}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <div className="flex flex-wrap gap-2">
          {course.labels.map((label) => (
            <span key={label.id} className="rounded border border-border px-2 py-1">
              {label.title}
            </span>
          ))}
        </div>
        <span className="text-muted">
          {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
        </span>
        <span className="text-muted">{course.totalMinutes} min</span>
      </div>
    </article>
  );
}