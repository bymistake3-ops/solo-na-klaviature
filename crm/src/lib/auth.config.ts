import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no Prisma imports, no Node-only APIs.
// The Credentials provider lives in auth.ts (Node runtime).
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // extended in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: string }).role ?? "member";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLogin = pathname === "/login";
      const isPublic = isLogin || pathname.startsWith("/api/auth");
      if (isPublic) return true;
      return !!auth;
    },
  },
};
