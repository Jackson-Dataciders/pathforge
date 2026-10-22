import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  trustHost: true,
  providers: [
    GitHub({ authorization: { params: { scope: "read:user" } } }),
  ],
  session: { strategy: "jwt" },
  pages: { error: "/auth/error" },
  callbacks: {
    signIn({ profile }) {
      return (
        !!process.env.ALLOWED_GITHUB_USER_ID &&
        String(profile?.id) === process.env.ALLOWED_GITHUB_USER_ID
      );
    },
    jwt({ token, profile }) {
      if (profile) {
        token.githubId = String(profile.id);
        token.login = String(profile.login ?? "");
      }
      return token;
    },
    session({ session, token }) {
      session.user.githubId = String(token.githubId ?? "");
      session.user.login = String(token.login ?? "");
      return session;
    },
  },
} satisfies NextAuthConfig;