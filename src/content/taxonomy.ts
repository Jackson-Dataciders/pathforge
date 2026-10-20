import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { Category, Label, Taxonomy, taxonomySchema } from "./schema/taxonomy";
import { contentRoot, taxonomyFile } from "./paths";

const taxonomyCache = new Map<string, Taxonomy>();

export type TaxonomyReferenceIssue = {
  categoryId: string;
  path: string;
  message: string;
};

export function loadTaxonomy(root?: string): Taxonomy {
  const contentRootPath = resolve(root ?? contentRoot());
  const file = taxonomyFile(contentRootPath);
  const cached = taxonomyCache.get(file);
  if (cached) return cached;

  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch (error) {
    throw new Error(`Failed to read catalog/taxonomy.yaml: ${errorMessage(error)}`, {
      cause: error,
    });
  }

  let data: unknown;
  try {
    data = parse(source);
  } catch (error) {
    throw new Error(`Invalid catalog/taxonomy.yaml at YAML: ${errorMessage(error)}`, {
      cause: error,
    });
  }

  const result = taxonomySchema.safeParse(data);
  if (!result.success) {
    const failures = result.error.issues
      .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid catalog/taxonomy.yaml at ${failures}`);
  }

  taxonomyCache.set(file, result.data);
  return result.data;
}

export function getCategory(id: string, root?: string): Category | undefined {
  return loadTaxonomy(root).categories.find((category) => category.id === id);
}

export function getLabel(id: string, root?: string): Label | undefined {
  return loadTaxonomy(root).labels.find((label) => label.id === id);
}

export function validateTaxonomyReferences(
  taxonomy: Taxonomy,
  options: { roadmapExists: (roadmapId: string) => boolean },
): TaxonomyReferenceIssue[] {
  return taxonomy.categories.flatMap((category) => {
    if (category.roadmap === null || options.roadmapExists(category.roadmap)) return [];

    const path = `catalog/roadmaps/${category.roadmap}.yaml`;
    return [{
      categoryId: category.id,
      path,
      message: `Roadmap file ${path} does not exist`,
    }];
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}