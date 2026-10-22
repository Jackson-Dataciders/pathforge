import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentError } from "./errors";
import { parseMarkdownFile, stringifyMarkdownFile } from "./markdown-file";
import {
  discoverCourseFolders,
  getPublishedCourse,
  getPublishedLesson,
  listPublishedCourses,
  readLessonBody,
} from "./courses";

const fixtureRoots: string[] = [];

function copyContentFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "pathforge-content-"));
  cpSync(resolve("fixtures/content"), root, { recursive: true });
  fixtureRoots.push(root);
  return root;
}

function updateCourseMetadata(root: string, updates: Record<string, unknown>): string {
  const readme = join(root, "courses", "sample-course", "README.md");
  const parsed = parseMarkdownFile(readFileSync(readme, "utf8"));
  writeFileSync(readme, stringifyMarkdownFile({ ...parsed.data, ...updates }, parsed.body));
  return readme;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("course content loader", () => {
  it("discovers README folders while ignoring templates and hidden folders", () => {
    const root = copyContentFixture();
    const courses = join(root, "courses");
    for (const folder of ["_templates", ".obsidian"]) {
      const directory = join(courses, folder);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, "README.md"), "---\nstatus: published\n---\n");
    }

    const discovered = discoverCourseFolders(root);

    expect(discovered).toEqual([
      "draft-course",
      "in-progress-course",
      "sample-course",
      "sample-course-two",
    ]);
  });

  it("lists only published courses and skips invalid drafts with a warning", () => {
    const root = copyContentFixture();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(listPublishedCourses(root).map(({ slug }) => slug)).toEqual([
      "sample-course",
      "sample-course-two",
    ]);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("draft-course"));
  });

  it("warns when skipping a non-published course with an invalid folder slug", () => {
    const root = copyContentFixture();
    const invalidCourse = join(root, "courses", "bad_course");
    cpSync(join(root, "courses", "sample-course"), invalidCourse, { recursive: true });
    const readme = join(invalidCourse, "README.md");
    const parsed = parseMarkdownFile(readFileSync(readme, "utf8"));
    writeFileSync(readme, stringifyMarkdownFile({ ...parsed.data, status: "researching" }, parsed.body));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(listPublishedCourses(root).map(({ slug }) => slug)).toEqual([
      "sample-course",
      "sample-course-two",
    ]);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('Course folder name "bad_course" is not a valid slug'));
  });

  it("orders lesson metadata by lesson number", () => {
    const root = copyContentFixture();

    expect(getPublishedCourse("sample-course", root)?.lessons.map(({ stem }) => stem)).toEqual([
      "001-introduction",
      "002-next-steps",
    ]);
  });

  it("exposes and reads only implemented lessons for a published course", () => {
    const root = copyContentFixture();
    const lesson = join(root, "courses", "sample-course", "002-next-steps.md");
    const parsed = parseMarkdownFile(readFileSync(lesson, "utf8"));
    writeFileSync(lesson, stringifyMarkdownFile({ ...parsed.data, tags: ["planned"] }, parsed.body));

    expect(getPublishedCourse("sample-course", root)?.lessons.map(({ stem }) => stem)).toEqual([
      "001-introduction",
    ]);
    expect(getPublishedLesson("sample-course", "002-next-steps", root)).toBeUndefined();
    expect(readLessonBody("sample-course", "002-next-steps", root)).toBeUndefined();
    expect(readLessonBody("sample-course", "001-introduction", root)).toContain("request-response protocol");
  });

  it.each([
    ["unknown category", { category: "unknown-category" }],
    ["unknown label", { labels: ["unknown-label"] }],
  ])("rejects a published course with an %s and names its README", (_description, updates) => {
    const root = copyContentFixture();
    const readme = updateCourseMetadata(root, updates);

    expect(() => listPublishedCourses(root)).toThrow(ContentError);
    try {
      listPublishedCourses(root);
    } catch (error) {
      expect(error).toBeInstanceOf(ContentError);
      expect((error as ContentError).file).toBe(readme);
    }
  });

  it("fails the validation command and prints the README path for an unknown label", () => {
    const root = copyContentFixture();
    const readme = updateCourseMetadata(root, { labels: ["unknown-label"] });
    const result = spawnSync(
      process.execPath,
      [resolve("node_modules/tsx/dist/cli.mjs"), resolve("scripts/validate-content.ts")],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: { ...process.env, PATHFORGE_CONTENT_ROOT: root },
      },
    );

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(readme);
  });
});