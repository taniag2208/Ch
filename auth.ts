import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

/**
 * Full auth setup (Node runtime). Uses the Prisma adapter to persist users and
 * accounts, with JWT sessions so the middleware stays edge-compatible.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});
