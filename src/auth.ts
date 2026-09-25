import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { accounts, sessions, users, verificationTokens } from "@/src/db/schema";
import {
  assertWalletMembership,
  persistActiveWallet,
  resolveDefaultWalletId,
} from "@/src/lib/wallet-session";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicRoutes = ["/login", "/register"];
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
      const isWalletRoute = nextUrl.pathname.startsWith("/wallets");

      if (isPublicRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (!auth.walletId && !isWalletRoute) {
        return Response.redirect(new URL("/wallets/select", nextUrl));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
        token.walletId = await resolveDefaultWalletId(user.id);
      }

      if (trigger === "update" && token.id && session) {
        const userId = token.id as string;

        if (session.walletId) {
          await assertWalletMembership(userId, session.walletId);
          await persistActiveWallet(userId, session.walletId);
          token.walletId = session.walletId;
        } else if ("walletId" in session) {
          await persistActiveWallet(userId, null);
          token.walletId = undefined;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      if (token.walletId) {
        session.walletId = token.walletId as string;
      } else {
        session.walletId = undefined;
      }

      return session;
    },
  },
});
