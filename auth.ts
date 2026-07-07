import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * JWT-only auth — no DB adapter needed for session management.
 * Users are stored in the JWT token, not in a database table.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
});
