import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { themesDir } from "@/content/paths";
import { themeFileSchema, type ThemeTokenSet } from "./schema";

function luminance(color: string): number {
  const channels = color.slice(1).match(/.{2}/g)!.map((channel) =>
    Number.parseInt(channel, 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function expectReadable(foreground: string, background: string) {
  expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
}

const themeFiles = readdirSync(themesDir()).filter((file) => file.endsWith(".json"));

describe("prebuilt theme contrast", () => {
  for (const file of themeFiles) {
    const theme = themeFileSchema.parse(
      JSON.parse(readFileSync(join(themesDir(), file), "utf8")),
    );

    it(`${theme.name} meets WCAG AA text contrast in light and dark modes`, () => {
      for (const tokens of [theme.light, theme.dark] as ThemeTokenSet[]) {
        expectReadable(tokens.fg, tokens.bg);
        expectReadable(tokens.fg, tokens.surface);
        expectReadable(tokens.muted, tokens.bg);
        expectReadable(tokens["accent-fg"], tokens.accent);
      }
    });
  }
});