import Link from "next/link";
import { ThemeSwitcher } from "./theme-switcher";

export function SiteHeader() {
  return (
    <header className="border-b border-border px-6">
      <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-4 py-2">
        <Link className="font-semibold" href="/">
          Pathforge
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6">
          <Link
            className="text-sm text-muted hover:text-fg"
            href="/courses"
          >
            Courses
          </Link>
          <Link
            className="text-sm text-muted hover:text-fg"
            href="/roadmaps"
          >
            Roadmaps
          </Link>
        </nav>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
