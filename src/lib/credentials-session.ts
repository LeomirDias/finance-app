import "server-only";

import type { AdapterAccountType } from "@auth/core/adapters";
import { cookies, headers } from "next/headers";

import { authAdapter } from "@/src/lib/auth-adapter";
import {
  SECURE_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/src/lib/session-cookie";

export const CREDENTIALS_PROVIDER = "credentials";
export const SESSION_MAX_AGE_SECONDS = 60 * 24 * 60 * 60;

export function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);

    if ("code" in current && current.code === "23505") {
      return true;
    }

    current = "cause" in current ? current.cause : undefined;
  }

  return false;
}

async function usesSecureCookies() {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;

  if (authUrl) {
    try {
      return new URL(authUrl).protocol === "https:";
    } catch {
      // Segue para o protocolo da requisição.
    }
  }

  const headerList = await headers();
  const proto = headerList
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .replace(/:$/, "");

  return proto === "https";
}

function clearCookie(
  jar: Awaited<ReturnType<typeof cookies>>,
  name: string,
) {
  jar.delete({ name, path: "/" });

  for (let index = 0; index < 5; index += 1) {
    jar.delete({ name: `${name}.${index}`, path: "/" });
  }
}

export async function ensureCredentialsAccount(userId: string) {
  if (!authAdapter.getUserByAccount || !authAdapter.linkAccount) {
    throw new Error("O adaptador de autenticação não expõe o vínculo de conta.");
  }

  const linkedUser = await authAdapter.getUserByAccount({
    provider: CREDENTIALS_PROVIDER,
    providerAccountId: userId,
  });

  if (linkedUser) {
    return;
  }

  try {
    await authAdapter.linkAccount({
      userId,
      type: "credentials" as AdapterAccountType,
      provider: CREDENTIALS_PROVIDER,
      providerAccountId: userId,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
}

export async function createDatabaseSession(userId: string) {
  if (!authAdapter.createSession) {
    throw new Error("O adaptador de autenticação não expõe a criação de sessão.");
  }

  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const session = await authAdapter.createSession({
    sessionToken: crypto.randomUUID(),
    userId,
    expires,
  });

  const secure = await usesSecureCookies();
  const cookieName = secure ? SECURE_SESSION_COOKIE : SESSION_COOKIE;
  const jar = await cookies();

  clearCookie(jar, SESSION_COOKIE);
  clearCookie(jar, SECURE_SESSION_COOKIE);

  jar.set(cookieName, session.sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires: session.expires,
  });
}

export async function destroyDatabaseSession() {
  const jar = await cookies();
  const sessionToken =
    jar.get(SECURE_SESSION_COOKIE)?.value ?? jar.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    if (!authAdapter.deleteSession) {
      throw new Error("O adaptador de autenticação não expõe a exclusão de sessão.");
    }

    await authAdapter.deleteSession(sessionToken);
  }

  clearCookie(jar, SESSION_COOKIE);
  clearCookie(jar, SECURE_SESSION_COOKIE);
}
