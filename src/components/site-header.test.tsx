import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("links to home, courses, and roadmaps", () => {
    render(<SiteHeader />);

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
