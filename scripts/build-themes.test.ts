import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { buildThemes } from "./build-themes";

const temporaryDirectories: string[] = [];

function createFixture(themes: Record<string, unknown>) {
  const root = mkdtempSync(join(tmpdir(), "pathforge-themes-"));
  temporaryDirectories.push(root);
  const themesDirectory = join(root, "themes");
  mkdirSync(themesDirectory);
  for (const [file, theme] of Object.entries(themes)) {
    writeFileSync(join(themesDirectory, file), JSON.stringify(theme));
  }
  return { root, themesDirectory };
}

const tokens = {
  bg: "#ffffff",
  surface: "#ffffff",
  fg: "#111111",
  muted: "#444444",
  border: "#cccccc",
  accent: "#0000ff",
  "accent-fg": "#ffffff",
  success: "green",
  warning: "orange",
  danger: "red",
  "code-bg": "#eeeeee",
};

function theme(id: string, name = id) {
  return { id, name, light: tokens, dark: tokens };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("buildThemes", () => {
  it("writes CSS tokens and the typed theme list", () => {
    const fixture = createFixture({
      "default.json": theme("default", "Default"),
      "forest.json": theme("forest", "Forest"),
    });

    buildThemes({ themesDirectory: fixture.themesDirectory, outputRoot: fixture.root });

    const css = readFileSync(join(fixture.root, "src/styles/themes.generated.css"), "utf8");
    expect(css).toContain(':root, [data-color-theme="default"]');
    expect(css).toContain('[data-color-theme="forest"]');
    expect(css).toContain('.dark[data-color-theme="forest"]');
    expect(css).toContain("--color-code-bg: #eeeeee;");
    expect(readFileSync(join(fixture.root, "src/theme/themes.generated.ts"), "utf8")).toContain(
      '"name": "Forest"',
    );
  });

  it("reports the filename and missing token for invalid themes", () => {
    const invalidTokens = { ...tokens };
    delete (invalidTokens as Partial<typeof tokens>).danger;
    const fixture = createFixture({
      "default.json": theme("default"),
      "broken.json": { ...theme("broken"), light: invalidTokens },
    });

    expect(() =>
      buildThemes({ themesDirectory: fixture.themesDirectory, outputRoot: fixture.root }),
    ).toThrow(/broken\.json: invalid light\.danger/);
  });

  it("rejects duplicate ids and a missing default theme", () => {
    const duplicate = createFixture({
      "default.json": theme("default"),
      "forest.json": theme("forest"),
      "copy.json": theme("forest"),
    });
    expect(() =>
      buildThemes({ themesDirectory: duplicate.themesDirectory, outputRoot: duplicate.root }),
    ).toThrow(/Duplicate theme id "forest"/);

    const missingDefault = createFixture({ "forest.json": theme("forest") });
    expect(() =>
      buildThemes({
        themesDirectory: missingDefault.themesDirectory,
        outputRoot: missingDefault.root,
      }),
    ).toThrow(/Missing required "default" theme/);
  });
});