import Link from "next/link";
import { buildCatalog } from "@/content/catalog";

export default function Home() {
  const { categories } = buildCatalog();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
      <h1 className="text-3xl font-semibold">Pathforge</h1>
      <p className="max-w-2xl text-lg text-muted">
        Build a clear path from curiosity to capability.
      </p>
      </section>
      <section aria-labelledby="categories-heading" className="space-y-3">
        <h2 id="categories-heading" className="text-xl font-semibold">Categories</h2>
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {categories.map((category) => (
            <li key={category.id} className="border-b border-border py-4">
              {category.courseCount > 0 ? (
                <Link
                  href={`/courses?category=${encodeURIComponent(category.id)}`}
                  className="font-medium hover:text-accent"
                >
                  {category.title}
                </Link>
              ) : (
                <span className="font-medium">{category.title}</span>
              )}
              <p className="mt-1 text-sm text-muted">{category.description}</p>
              <p className="mt-2 text-sm text-muted">
                {category.courseCount > 0
                  ? `${category.courseCount} ${category.courseCount === 1 ? "course" : "courses"}`
                  : "No courses yet"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
