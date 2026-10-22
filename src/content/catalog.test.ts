import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCatalog, CatalogEntry, filterCatalog } from "./catalog";

const fixtureRoot = resolve("fixtures/content");

function entry(
  slug: string,
  category: string,
  labels: string[],
): CatalogEntry {
  return {
    slug,
    title: slug,
    summaryExcerpt: "Summary.",
    category: { id: category, title: category },
    labels: labels.map((id) => ({ id, title: id })),
    lessonCount: 1,
    totalMinutes: 10,
  };
}

describe("course catalog", () => {
  it("builds published course, category, and label counts with a first-sentence excerpt", () => {
    const catalog = buildCatalog(fixtureRoot);

    expect(catalog.courses).toEqual([
      expect.objectContaining({
        slug: "sample-course-two",
        title: "Database Fundamentals",
        summaryExcerpt: "An introduction to tables, keys, and relational data.",
        category: { id: "data", title: "Data" },
        labels: [{ id: "databases", title: "Databases" }],
        lessonCount: 1,
        totalMinutes: 7,
      }),
      expect.objectContaining({
        slug: "sample-course",
        title: "HTTP Status Codes",
        summaryExcerpt: "An introduction to common HTTP response status codes.",
        category: { id: "backend", title: "Backend" },
        labels: [{ id: "http", title: "HTTP" }],
        lessonCount: 2,
        totalMinutes: 13,
      }),
    ]);
    expect(catalog.categories).toEqual([
      expect.objectContaining({ id: "backend", courseCount: 1 }),
      expect.objectContaining({ id: "data", courseCount: 1 }),
    ]);
    expect(catalog.labels).toEqual([
      expect.objectContaining({ id: "http", courseCount: 1 }),
      expect.objectContaining({ id: "databases", courseCount: 1 }),
    ]);
  });

  it("matches all recognized labels with AND semantics", () => {
    const entries = [
      entry("both", "backend", ["http", "databases"]),
      entry("http-only", "backend", ["http"]),
    ];

    expect(filterCatalog(entries, { labels: ["http", "databases"] }).map(({ slug }) => slug))
      .toEqual(["both"]);
  });

  it("ignores unknown category and label filters", () => {
    const entries = [entry("one", "backend", ["http"])];

    expect(filterCatalog(entries, { category: "unknown", labels: ["unknown"] }))
      .toEqual(entries);
  });
});