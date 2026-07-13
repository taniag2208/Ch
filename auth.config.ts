import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCredentials } from "@/lib/auth-users";

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await verifyCredentials(email, password);
        if (!user) return null;

        return { id: user.email, email: user.email, name: user.name };
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
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;
      const isLogin = pathname.startsWith("/login");

      if (isLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
