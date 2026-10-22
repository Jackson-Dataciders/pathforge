import { Suspense } from "react";
import { CatalogCourseList } from "@/components/catalog/catalog-course-list";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { buildCatalog } from "@/content/catalog";

export default function CoursesPage() {
  const catalog = buildCatalog();

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Courses</h1>
      <Suspense fallback={<p className="text-muted">Loading courses...</p>}>
        <div className="space-y-5">
          <CatalogFilters categories={catalog.categories} labels={catalog.labels} />
          <CatalogCourseList courses={catalog.courses} />
        </div>
      </Suspense>
    </section>
  );
}