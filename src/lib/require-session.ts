import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDatabaseSession } from "@/src/lib/database-session";
import { readSessionToken } from "@/src/lib/session-cookie";

const loadRequestSession = cache(async () => {
  const jar = await cookies();
  const sessionToken = readSessionToken((name) => jar.get(name)?.value);
  return getDatabaseSession(sessionToken);
});

export async function requireSession() {
  const session = await loadRequestSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
