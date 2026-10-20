"use client";

import { useTheme } from "next-themes";
import { useColorTheme } from "@/theme/color-theme";
import { THEMES } from "@/theme/themes.generated";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-xs text-muted">
        Mode
        <select
          aria-label="Color mode"
          className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-fg"
          value={theme ?? "system"}
          onChange={(event) => setTheme(event.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-muted">
        Color
        <select
          aria-label="Color theme"
          className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-fg"
          value={colorTheme}
          onChange={(event) => {
            const selectedTheme = THEMES.find(({ id }) => id === event.target.value);
            if (selectedTheme) setColorTheme(selectedTheme.id);
          }}
        >
          {THEMES.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}