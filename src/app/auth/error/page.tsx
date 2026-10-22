import Link from "next/link";

export const instant = false;

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const denied = error === "AccessDenied";

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl font-semibold text-fg">
        {denied ? "Access denied" : "Sign-in error"}
      </h1>
      <p className="text-muted">
        {denied
          ? "This GitHub account is not allowed to sign in."
          : "Something went wrong while signing in. Please try again."}
      </p>
      <Link className="text-sm font-medium text-fg underline" href="/">
        Return home
      </Link>
    </section>
  );
}