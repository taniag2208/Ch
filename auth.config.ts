import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const ALLOWED_DOMAIN = "@titamedia.com";

/**
 * Edge-safe auth config (no Prisma adapter). Shared by the middleware and the
 * full Node-runtime config in auth.ts.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "select_account",
          hd: "titamedia.com",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    /** Restrict sign-in to @titamedia.com accounts. */
    async signIn({ profile }) {
      const email = profile?.email;
      return Boolean(email && email.endsWith(ALLOWED_DOMAIN));
    },
    /** Protect every route except /login (middleware entry point). */
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isLogin = pathname.startsWith("/login");

      if (isLogin) {
        // Signed-in users hitting /login get bounced to the dashboard.
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
