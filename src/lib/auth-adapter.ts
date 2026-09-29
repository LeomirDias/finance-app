import "server-only";

import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { db } from "@/src/db";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "@/src/db/schema";

export const authAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
  authenticatorsTable: authenticators,
});
