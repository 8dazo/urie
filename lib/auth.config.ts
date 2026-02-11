import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // Only used for middleware; full providers in auth.ts
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.sessionToken = (user as { sessionToken?: string }).sessionToken;
      }
      return token;
    },
    // No Prisma here so this file stays Edge-safe (used by middleware).
    // Session validation and profile loading are in lib/auth.ts (Node only).
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { sessionToken?: string }).sessionToken = token.sessionToken as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
