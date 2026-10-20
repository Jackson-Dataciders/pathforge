"use client";

import { useEffect, useState } from "react";
import { THEME_TOKENS } from "./schema";

export type ThemeTokens = Record<(typeof THEME_TOKENS)[number], string>;

function readThemeTokens(): ThemeTokens {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  return Object.fromEntries(
    THEME_TOKENS.map((token) => [
      token,
      computedStyle.getPropertyValue(`--color-${token}`).trim(),
    ]),
  ) as ThemeTokens;
}

function emptyThemeTokens(): ThemeTokens {
  return Object.fromEntries(THEME_TOKENS.map((token) => [token, ""])) as ThemeTokens;
}

export function useThemeTokens(): ThemeTokens {
  const [tokens, setTokens] = useState<ThemeTokens>(emptyThemeTokens);

  useEffect(() => {
    const root = document.documentElement;
    const updateTokens = () => setTokens(readThemeTokens());
    const observer = new MutationObserver(updateTokens);

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-color-theme"],
    });
    updateTokens();

    return () => observer.disconnect();
  }, []);

  return tokens;
}