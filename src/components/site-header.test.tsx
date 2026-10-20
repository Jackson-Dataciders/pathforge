import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorThemeProvider } from "@/theme/color-theme";
import { SiteHeader } from "./site-header";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));

describe("SiteHeader", () => {
  it("links to home, courses, and roadmaps", () => {
    render(
      <ColorThemeProvider>
        <SiteHeader />
      </ColorThemeProvider>,
    );

    expect(screen.getByRole("link", { name: "Pathforge" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute(
      "href",
      "/courses",
    );
    expect(screen.getByRole("link", { name: "Roadmaps" })).toHaveAttribute(
      "href",
      "/roadmaps",
    );
  });
});
