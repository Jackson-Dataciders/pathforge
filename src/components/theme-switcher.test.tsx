import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ColorThemeProvider } from "@/theme/color-theme";
import { ThemeSwitcher } from "./theme-switcher";

const { setTheme } = vi.hoisted(() => ({ setTheme: vi.fn() }));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}));

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    setTheme.mockClear();
  });

  it("shows all mode and prebuilt theme choices and applies selections", async () => {
    const user = userEvent.setup();
    render(
      <ColorThemeProvider>
        <ThemeSwitcher />
      </ColorThemeProvider>,
    );

    const mode = screen.getByRole("combobox", { name: "Color mode" });
    const color = screen.getByRole("combobox", { name: "Color theme" });
    expect(mode).toHaveValue("system");
    expect(Array.from(mode.querySelectorAll("option")).map((option) => option.textContent)).toEqual([
      "Light",
      "Dark",
      "System",
    ]);
    expect(Array.from(color.querySelectorAll("option")).map((option) => option.textContent)).toEqual([
      "Default",
      "Forest",
      "Ocean",
      "Sunset",
    ]);

    await user.selectOptions(mode, "dark");
    await user.selectOptions(color, "forest");
    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(document.documentElement.dataset.colorTheme).toBe("forest");
    expect(window.localStorage.getItem("pathforge.colorTheme")).toBe("forest");
  });
});