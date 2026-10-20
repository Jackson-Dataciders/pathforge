import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 px-6">
      <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-6">
        <Link className="font-semibold" href="/">
          Pathforge
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6">
          <Link
            className="text-sm text-black/70 hover:text-black"
            href="/courses"
          >
            Courses
          </Link>
          <Link
            className="text-sm text-black/70 hover:text-black"
            href="/roadmaps"
          >
            Roadmaps
          </Link>
        </nav>
      </div>
    </header>
  );
}
