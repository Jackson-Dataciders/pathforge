import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { themesDir } from "@/content/paths";
import { THEME_TOKENS, themeFileSchema } from "@/theme/schema";

type BuildThemesOptions = {
  themesDirectory?: string;
  outputRoot?: string;
};

export function buildThemes({
  themesDirectory = themesDir(),
  outputRoot = process.cwd(),
}: BuildThemesOptions = {}) {
  const files = readdirSync(themesDirectory)
    .filter((file) => file.endsWith(".json"))
    .sort();
  const themes = files.map((file) => {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(themesDirectory, file), "utf8"));
    } catch (error) {
      throw new Error(`${file}: invalid JSON (${String(error)})`);
    }

    const result = themeFileSchema.safeParse(raw);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue.path.length ? issue.path.join(".") : "theme";
      throw new Error(`${file}: invalid ${path} (${issue.message})`);
    }

    return result.data;
  });

  const seenIds = new Set<string>();
  for (const theme of themes) {
    if (seenIds.has(theme.id)) {
      throw new Error(`Duplicate theme id "${theme.id}"`);
    }
    seenIds.add(theme.id);
  }

  if (!seenIds.has("default")) {
    throw new Error('Missing required "default" theme (themes/default.json)');
  }

  const defaultTheme = themes.find((theme) => theme.id === "default")!;
  const css = [
    `:root, [data-color-theme="default"] {\n${tokenDeclarations(defaultTheme.light)}\n}`,
    ...themes
      .filter((theme) => theme.id !== "default")
      .map(
        (theme) =>
          `[data-color-theme="${theme.id}"] {\n${tokenDeclarations(theme.light)}\n}`,
      ),
    ...themes.map(
      (theme) =>
        `.dark[data-color-theme="${theme.id}"] {\n${tokenDeclarations(theme.dark)}\n}`,
    ),
  ].join("\n\n");
  const themeList = `export const THEMES = ${JSON.stringify(
    themes.map(({ id, name }) => ({ id, name })),
    null,
    2,
  )} as const satisfies readonly { id: string; name: string }[];\n`;

  const cssPath = resolve(outputRoot, "src/styles/themes.generated.css");
  const themesPath = resolve(outputRoot, "src/theme/themes.generated.ts");
  mkdirSync(dirname(cssPath), { recursive: true });
  mkdirSync(dirname(themesPath), { recursive: true });
  writeFileSync(cssPath, `${css}\n`);
  writeFileSync(themesPath, themeList);
}

function tokenDeclarations(tokens: Record<(typeof THEME_TOKENS)[number], string>) {
  return THEME_TOKENS.map((token) => `  --color-${token}: ${tokens[token]};`).join(
    "\n",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    buildThemes();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}