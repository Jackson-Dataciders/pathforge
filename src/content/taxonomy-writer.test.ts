import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadTaxonomy } from "./taxonomy";
import {
  addCategory,
  addLabels,
  writeTaxonomy,
} from "./taxonomy-writer";

let temporaryDirectory: string | undefined;

afterEach(() => {
  if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

describe("taxonomy writer", () => {
  it("rejects adding a category with an existing id", () => {
    const taxonomy = loadTaxonomy(resolve("fixtures/content"));

    expect(() =>
      addCategory(taxonomy, {
        id: "backend",
        title: "Backend",
        description: "Server-side development.",
        roadmap: null,
      }),
    ).toThrow(/Duplicate category id: backend/);
  });

  it("rejects labels with invalid ids", () => {
    const taxonomy = loadTaxonomy(resolve("fixtures/content"));

    expect(() => addLabels(taxonomy, [{ id: "Bad Label", title: "Bad Label" }])).toThrow();
  });

  it("writes unchanged taxonomy with byte-stable YAML", () => {
    const taxonomy = loadTaxonomy(resolve("fixtures/content"));
    temporaryDirectory = mkdtempSync(join(tmpdir(), "pathforge-taxonomy-"));
    const file = join(temporaryDirectory, "taxonomy.yaml");

    writeTaxonomy(taxonomy, file);
    const firstWrite = readFileSync(file, "utf8");
    writeTaxonomy(taxonomy, file);
    const secondWrite = readFileSync(file, "utf8");

    expect(secondWrite).toBe(firstWrite);
  });
});