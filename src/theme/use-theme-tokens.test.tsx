import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useThemeTokens } from "./use-theme-tokens";

function TokenProbe() {
  const tokens = useThemeTokens();
  return <output>{tokens.bg}</output>;
}

describe("useThemeTokens", () => {
  it("reads computed tokens and updates when theme attributes change", async () => {
    document.documentElement.style.setProperty("--color-bg", "#123456");
    render(<TokenProbe />);

    expect(await screen.findByText("#123456")).toBeInTheDocument();

    document.documentElement.style.setProperty("--color-bg", "#abcdef");
    document.documentElement.classList.add("dark");
    await waitFor(() => expect(screen.getByText("#abcdef")).toBeInTheDocument());

    document.documentElement.style.setProperty("--color-bg", "#fedcba");
    document.documentElement.dataset.colorTheme = "forest";
    await waitFor(() => expect(screen.getByText("#fedcba")).toBeInTheDocument());
  });
});