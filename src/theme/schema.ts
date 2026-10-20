import { z } from "zod";

export const THEME_TOKENS = [
  "bg",
  "surface",
  "fg",
  "muted",
  "border",
  "accent",
  "accent-fg",
  "success",
  "warning",
  "danger",
  "code-bg",
] as const;

const cssColorSchema = z
  .string()
  .regex(
    /^(#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|(?:rgb|hsl|hwb|lab|lch|oklab|oklch|color)\([^;]+\)|[a-z]+)$/i,
    "Expected a CSS color string",
  );

const tokenSetSchema = z.object({
  bg: cssColorSchema,
  surface: cssColorSchema,
  fg: cssColorSchema,
  muted: cssColorSchema,
  border: cssColorSchema,
  accent: cssColorSchema,
  "accent-fg": cssColorSchema,
  success: cssColorSchema,
  warning: cssColorSchema,
  danger: cssColorSchema,
  "code-bg": cssColorSchema,
});

export const themeFileSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Expected a kebab-case id"),
    name: z.string().trim().min(1),
    light: tokenSetSchema,
    dark: tokenSetSchema,
  })
  .strict();

export type ThemeFile = z.infer<typeof themeFileSchema>;
export type ThemeTokenSet = z.infer<typeof tokenSetSchema>;