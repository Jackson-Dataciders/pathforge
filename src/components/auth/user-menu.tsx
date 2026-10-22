"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span
        aria-label="Loading account"
        className="inline-block size-8 rounded-full bg-subtle"
      />
    );
  }

  if (!session?.user) {
    return (
      <button
        className="text-sm font-medium text-muted hover:text-fg"
        onClick={() => void signIn("github")}
        type="button"
      >
        Sign in with GitHub
      </button>
    );
  }

  const login = session.user.login || session.user.name || "GitHub user";

  return (
    <div className="flex items-center gap-2">
      <span
        aria-label={`${login} avatar`}
        className="flex size-8 items-center justify-center rounded-full bg-subtle bg-cover bg-center text-xs font-semibold text-fg"
        role="img"
        style={
          session.user.image
            ? { backgroundImage: `url("${session.user.image}")` }
            : undefined
        }
      >
        {!session.user.image && login.slice(0, 1).toUpperCase()}
      </span>
      <span className="text-sm text-fg">{login}</span>
      <button
        className="text-sm text-muted hover:text-fg"
        onClick={() => void signOut()}
        type="button"
      >
        Sign out
      </button>
    </div>
  );
}