import NextAuth from "next-auth";

import { authAdapter } from "@/src/lib/auth-adapter";
import { SESSION_MAX_AGE_SECONDS } from "@/src/lib/credentials-session";
import {
  assertWalletMembership,
  persistActiveWallet,
  resolveDefaultWalletId,
} from "@/src/lib/wallet-session";

function sessionExpires(expires: Date | string) {
  return expires instanceof Date ? expires.toISOString() : expires;
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: authAdapter,
  // A sessão fica na tabela `session`. O provider Credentials do Auth.js
  // só emite JWT e não grava session/account, então o login é feito
  // pelas actions, via adaptador.
  session: {
    strategy: "database",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user?.id);
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

      if (!auth?.walletId && !isWalletRoute) {
        return Response.redirect(new URL("/wallets/select", nextUrl));
      }

      return true;
    },
    async session({ session, user, trigger, newSession }) {
      if (!user?.id) {
        return {
          expires: sessionExpires(session.expires),
          user: {
            id: "",
            name: session.user?.name,
            email: session.user?.email,
            image: session.user?.image,
          },
        };
      }

      if (
        trigger === "update" &&
        newSession &&
        typeof newSession === "object" &&
        "walletId" in newSession
      ) {
        const nextWalletId = newSession.walletId;

        if (typeof nextWalletId === "string" && nextWalletId.length > 0) {
          await assertWalletMembership(user.id, nextWalletId);
          await persistActiveWallet(user.id, nextWalletId);
        } else {
          await persistActiveWallet(user.id, null);
        }
      }

      const walletId = await resolveDefaultWalletId(user.id);

      return {
        expires: sessionExpires(session.expires),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        walletId,
      };
    },
  },
});
