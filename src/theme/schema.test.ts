import { describe, expect, it } from "vitest";
import { THEME_TOKENS, themeFileSchema } from "./schema";

const tokenSet = Object.fromEntries(THEME_TOKENS.map((token) => [token, "#123456"]));

const validTheme = {
  id: "forest-green",
  name: "Forest Green",
  light: tokenSet,
  dark: tokenSet,
};

describe("themeFileSchema", () => {
  it("accepts a theme with every semantic token in both modes", () => {
    expect(themeFileSchema.safeParse(validTheme).success).toBe(true);
  });

  it("rejects malformed ids, colors, and missing tokens", () => {
    expect(themeFileSchema.safeParse({ ...validTheme, id: "Forest Green" }).success).toBe(false);
    expect(
      themeFileSchema.safeParse({
        ...validTheme,
        light: { ...tokenSet, accent: "not-a-color!" },
      }).success,
    ).toBe(false);
    expect(
      themeFileSchema.safeParse({
        ...validTheme,
        dark: Object.fromEntries(Object.entries(tokenSet).filter(([key]) => key !== "danger")),
      }).success,
    ).toBe(false);
  });
});