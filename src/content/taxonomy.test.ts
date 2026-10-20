import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadTaxonomy, validateTaxonomyReferences } from "./taxonomy";
import { taxonomySchema } from "./schema/taxonomy";

describe("taxonomy", () => {
  it("loads and validates the content fixture", () => {
    const taxonomy = loadTaxonomy(resolve("fixtures/content"));

    expect(taxonomy.categories.map(({ id }) => id)).toEqual(["backend"]);
    expect(taxonomy.labels.map(({ id }) => id)).toEqual(["http"]);
  });

  it("rejects duplicate category and label ids", () => {
    const result = taxonomySchema.safeParse({
      version: 1,
      categories: [
        { id: "backend", title: "Backend", description: "Services.", roadmap: null },
        { id: "backend", title: "Backend", description: "Services.", roadmap: null },
      ],
      labels: [
        { id: "http", title: "HTTP" },
        { id: "http", title: "HTTP" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects ids that are not lowercase kebab-case ASCII", () => {
    const result = taxonomySchema.safeParse({
      version: 1,
      categories: [
        { id: "Backend API", title: "Backend", description: "Services.", roadmap: null },
      ],
      labels: [],
    });

    expect(result.success).toBe(false);
  });

  it("reports a missing roadmap file", () => {
    const taxonomy = loadTaxonomy(resolve("fixtures/content"));
    const withRoadmap = {
      ...taxonomy,
      categories: taxonomy.categories.map((category) => ({
        ...category,
        roadmap: "backend",
      })),
    };

    expect(
      validateTaxonomyReferences(withRoadmap, { roadmapExists: () => false }),
    ).toEqual([
      {
        categoryId: "backend",
        path: "catalog/roadmaps/backend.yaml",
        message: "Roadmap file catalog/roadmaps/backend.yaml does not exist",
      },
    ]);
  });
});