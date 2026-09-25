import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    walletId?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    walletId?: string;
  }
}
