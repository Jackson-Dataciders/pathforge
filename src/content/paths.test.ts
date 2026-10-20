import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  catalogDir,
  contentRoot,
  coursesDir,
  pipelineDir,
  roadmapsDir,
  taxonomyFile,
  themesDir,
} from "./paths";

afterEach(() => {
  delete process.env.PATHFORGE_CONTENT_ROOT;
});

describe("content paths", () => {
  it("uses the working directory when no content root is configured", () => {
    delete process.env.PATHFORGE_CONTENT_ROOT;

    expect(contentRoot()).toBe(process.cwd());
    expect(coursesDir()).toBe(resolve(process.cwd(), "courses"));
    expect(catalogDir()).toBe(resolve(process.cwd(), "catalog"));
    expect(taxonomyFile()).toBe(
      resolve(process.cwd(), "catalog", "taxonomy.yaml"),
    );
    expect(roadmapsDir()).toBe(resolve(process.cwd(), "catalog", "roadmaps"));
  });

  it("resolves a relative content root against the working directory", () => {
    process.env.PATHFORGE_CONTENT_ROOT = "fixtures/content";

    expect(contentRoot()).toBe(resolve(process.cwd(), "fixtures/content"));
    expect(coursesDir()).toBe(
      resolve(process.cwd(), "fixtures/content", "courses"),
    );
    expect(catalogDir()).toBe(
      resolve(process.cwd(), "fixtures/content", "catalog"),
    );
  });

  it("keeps themes and pipeline rooted in the repository", () => {
    process.env.PATHFORGE_CONTENT_ROOT = "fixtures/content";

    expect(themesDir()).toBe(resolve(process.cwd(), "themes"));
    expect(pipelineDir()).toBe(resolve(process.cwd(), "pipeline"));
  });
});
