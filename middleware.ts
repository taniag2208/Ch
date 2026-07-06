import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-compatible middleware: uses the adapter-free config to gate every route
// via the `authorized` callback.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)",
  ],
};
