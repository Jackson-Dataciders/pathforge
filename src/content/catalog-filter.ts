import type { CatalogEntry, CatalogFilters } from "./catalog";

export function filterCatalog(entries: CatalogEntry[], filters: CatalogFilters): CatalogEntry[] {
  const knownCategories = new Set(entries.map(({ category }) => category.id));
  const knownLabels = new Set(entries.flatMap(({ labels }) => labels.map(({ id }) => id)));
  const category = filters.category && knownCategories.has(filters.category)
    ? filters.category
    : undefined;
  const labels = (filters.labels ?? []).filter((id) => knownLabels.has(id));

  return entries.filter((entry) =>
    (!category || entry.category.id === category) &&
    labels.every((id) => entry.labels.some((label) => label.id === id)),
  );
}