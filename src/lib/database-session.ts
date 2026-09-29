import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { sessions } from "@/src/db/schema";
import { resolveDefaultWalletId } from "@/src/lib/wallet-session";

export type DatabaseSession = {
  sessionToken: string;
  expires: Date;
  userId: string;
  walletId?: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export async function getDatabaseSession(
  sessionToken: string | null | undefined,
): Promise<DatabaseSession | null> {
  const token = sessionToken?.trim();

  if (!token) {
    return null;
  }

  const row = await db.query.sessions.findFirst({
    where: eq(sessions.sessionToken, token),
    columns: {
      sessionToken: true,
      userId: true,
      expires: true,
    },
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!row?.user?.id) {
    return null;
  }

  if (row.expires.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
    return null;
  }

  const walletId = await resolveDefaultWalletId(row.user.id);

  return {
    sessionToken: row.sessionToken,
    expires: row.expires,
    userId: row.user.id,
    walletId,
    user: row.user,
  };
}
