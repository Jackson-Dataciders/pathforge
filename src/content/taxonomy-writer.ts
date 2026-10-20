import { writeFileSync } from "node:fs";
import { stringify } from "yaml";
import { Category, Label, Taxonomy, taxonomySchema } from "./schema/taxonomy";

export function addCategory(taxonomy: Taxonomy, category: Category): Taxonomy {
  return taxonomySchema.parse({
    ...taxonomy,
    categories: [...taxonomy.categories, category],
  });
}

export function addLabels(taxonomy: Taxonomy, labels: Label[]): Taxonomy {
  return taxonomySchema.parse({
    ...taxonomy,
    labels: [...taxonomy.labels, ...labels],
  });
}

export function setCategoryRoadmap(
  taxonomy: Taxonomy,
  id: string,
  roadmapId: string,
): Taxonomy {
  const categoryIndex = taxonomy.categories.findIndex((category) => category.id === id);
  if (categoryIndex < 0) {
    throw new Error(`Category not found: ${id}`);
  }

  const categories = taxonomy.categories.map((category, index) =>
    index === categoryIndex ? { ...category, roadmap: roadmapId } : category,
  );
  return taxonomySchema.parse({ ...taxonomy, categories });
}

export function writeTaxonomy(taxonomy: Taxonomy, file: string): void {
  const validatedTaxonomy = taxonomySchema.parse(taxonomy);
  writeFileSync(file, stringify(validatedTaxonomy, { indent: 2 }), "utf8");
}