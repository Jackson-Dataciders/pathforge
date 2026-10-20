import Link from "next/link";

export default function NotFound() {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-muted">The page you requested does not exist.</p>
      <Link className="underline underline-offset-4" href="/">
        Back to home
      </Link>
    </section>
  );
}
