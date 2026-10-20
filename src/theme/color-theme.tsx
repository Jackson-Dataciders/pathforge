"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { THEMES } from "./themes.generated";

const STORAGE_KEY = "pathforge.colorTheme";
type ColorThemeId = (typeof THEMES)[number]["id"];

type ColorThemeContextValue = {
  colorTheme: ColorThemeId;
  setColorTheme: (theme: ColorThemeId) => void;
};

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

function isColorThemeId(value: string | null): value is ColorThemeId {
  return value !== null && THEMES.some((theme) => theme.id === value);
}

function subscribeToColorTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-color-theme"],
  });
  return () => observer.disconnect();
}

function getColorThemeSnapshot(): ColorThemeId {
  const currentTheme = document.documentElement.dataset.colorTheme;
  return currentTheme && isColorThemeId(currentTheme) ? currentTheme : "default";
}

function getServerColorThemeSnapshot(): ColorThemeId {
  return "default";
}

function storeColorTheme(theme: ColorThemeId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const colorTheme = useSyncExternalStore(
    subscribeToColorTheme,
    getColorThemeSnapshot,
    getServerColorThemeSnapshot,
  );

  function setColorTheme(theme: ColorThemeId) {
    document.documentElement.dataset.colorTheme = theme;
    storeColorTheme(theme);
  }

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used within ColorThemeProvider");
  }
  return context;
}