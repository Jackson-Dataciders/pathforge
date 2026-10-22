"use client";

import { useSearchParams } from "next/navigation";
import type { CatalogEntry } from "@/content/catalog";
import { filterCatalog } from "@/content/catalog-filter";
import { CourseCard } from "./course-card";

export function CatalogCourseList({ courses }: { courses: CatalogEntry[] }) {
  const searchParams = useSearchParams();
  const filteredCourses = filterCatalog(courses, {
    category: searchParams.get("category") ?? undefined,
    labels: searchParams.getAll("label"),
  });

  if (filteredCourses.length === 0) {
    return <p className="py-6 text-muted">No courses match these filters.</p>;
  }

  return (
    <div>
      {filteredCourses.map((course) => <CourseCard key={course.slug} course={course} />)}
    </div>
  );
}