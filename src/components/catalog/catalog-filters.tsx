"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Catalog } from "@/content/catalog";

type CatalogFiltersProps = Pick<Catalog, "categories" | "labels">;

export function CatalogFilters({ categories, labels }: CatalogFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const availableCategories = categories.filter(({ courseCount }) => courseCount > 0);
  const availableLabels = labels.filter(({ courseCount }) => courseCount > 0);
  const selectedCategory = availableCategories.some(({ id }) => id === searchParams.get("category"))
    ? searchParams.get("category") ?? ""
    : "";
  const selectedLabels = new Set(
    searchParams.getAll("label").filter((id) => availableLabels.some((label) => label.id === id)),
  );

  function updateFilters(category: string, selected: Set<string>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("label");
    if (category) params.set("category", category);
    for (const label of selected) params.append("label", label);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggleLabel(id: string) {
    const nextLabels = new Set(selectedLabels);
    if (nextLabels.has(id)) nextLabels.delete(id);
    else nextLabels.add(id);
    updateFilters(selectedCategory, nextLabels);
  }

  return (
    <section aria-label="Course filters" className="space-y-4 border-y border-border py-4">
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="catalog-category" className="text-sm font-medium">Category</label>
        <select
          id="catalog-category"
          value={selectedCategory}
          onChange={(event) => updateFilters(event.target.value, selectedLabels)}
          className="min-h-10 rounded border border-border bg-background px-3"
        >
          <option value="">All categories</option>
          {availableCategories.map(({ id, title }) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
        <Link href={pathname} className="text-sm text-accent underline underline-offset-4">
          Clear filters
        </Link>
      </div>
      {availableLabels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium">Labels</span>
          {availableLabels.map(({ id, title }) => {
            const selected = selectedLabels.has(id);
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleLabel(id)}
                className={`rounded border px-3 py-1.5 text-sm ${selected
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border hover:border-accent"}`}
              >
                {title}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}