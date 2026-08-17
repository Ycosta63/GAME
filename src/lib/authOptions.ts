import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * Google sign-in is only wired up once real OAuth credentials exist.
 * Without them the app stays in single-user "local" mode (see
 * currentUser.ts) so `npm run dev` keeps working with zero setup.
 */
export const authEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const authOptions: NextAuthOptions = {
  providers: authEnabled
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        }),
      ]
    : [],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, account }) {
      // account.providerAccountId is Google's stable per-account id — used
      // to key each user's isolated Steam/PSN settings.
      if (account?.providerAccountId) {
        token.userId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as
          | string
          | undefined;
      }
      return session;
    },
  },
};
