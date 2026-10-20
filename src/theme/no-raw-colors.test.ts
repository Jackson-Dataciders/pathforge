import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceDirectories = ["src/app", "src/components", "src/kit"];
const colorLiteralPattern = /#[\da-f]{3,8}\b|\b(?:rgb|hsl)\s*\(/i;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.(?:ts|tsx|css)$/.test(entry.name) || entry.name.includes(".generated.")) {
      return [];
    }
    return [path];
  });
}

describe("semantic color usage", () => {
  it("contains no raw hex, rgb(), or hsl() colors in UI source", () => {
    const matches = sourceDirectories
      .flatMap((directory) => {
        const path = resolve(process.cwd(), directory);
        return existsSync(path) ? sourceFiles(path) : [];
      })
      .flatMap((file) => {
        const match = readFileSync(file, "utf8").match(colorLiteralPattern);
        return match ? [`${file}: ${match[0]}`] : [];
      });

    expect(matches).toEqual([]);
  });
});