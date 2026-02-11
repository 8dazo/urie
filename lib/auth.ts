import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      // Run base mapping from authConfig
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { sessionToken?: string }).sessionToken = token.sessionToken as string;
      }
      // Session validation and fresh profile (Node only; not used in Edge middleware)
      if (token.sessionToken && session.user?.id) {
        try {
          if (prisma.userSession?.findFirst) {
            const valid = await prisma.userSession.findFirst({
              where: {
                sessionToken: token.sessionToken as string,
                revokedAt: null,
              },
            });
            if (!valid) {
              return { ...session, user: {} as typeof session.user };
            }
          }
          if (prisma.user?.findUnique) {
            const user = await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { email: true, profile: true },
            });
            if (user) {
              session.user.email = user.email;
              const profile = user.profile && typeof user.profile === "object" ? (user.profile as { name?: string; avatar?: string }) : undefined;
              if (profile) {
                session.user.name = profile.name ?? session.user.name ?? null;
                session.user.image = profile.avatar ?? session.user.image ?? null;
              }
            }
          }
        } catch (err) {
          console.error("[auth] Session validation / profile load error:", err);
        }
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!valid) return null;

        let sessionToken: string | undefined;
        try {
          const userAgent =
            (request as Request | undefined)?.headers?.get?.("user-agent") ?? "";
          sessionToken = randomUUID();
          await prisma.userSession.create({
            data: {
              userId: user.id,
              sessionToken,
              userAgent,
            },
          });
        } catch (err) {
          console.error("[auth] Failed to create UserSession:", err);
          // Continue without session token so login still succeeds; sessions list will be empty
        }

        return {
          id: user.id,
          email: user.email,
          name:
            user.profile && typeof user.profile === "object" && "name" in user.profile
              ? (user.profile as { name?: string }).name ?? null
              : null,
          role: user.role,
          ...(sessionToken && { sessionToken }),
        };
      },
    }),
  ],
});
