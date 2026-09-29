import { NextResponse, type NextRequest } from "next/server";

import { getDatabaseSession } from "@/src/lib/database-session";
import {
  readSessionToken,
  SECURE_SESSION_COOKIE,
  SESSION_COOKIE,
} from "@/src/lib/session-cookie";

const PUBLIC_PATHS = new Set(["/login", "/register"]);

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(SECURE_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = readSessionToken(
    (name) => request.cookies.get(name)?.value,
  );
  const session = await getDatabaseSession(sessionToken);
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (isPublic) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = NextResponse.next();

    if (sessionToken) {
      clearSessionCookies(response);
    }

    return response;
  }

  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url));

    if (sessionToken) {
      clearSessionCookies(response);
    }

    return response;
  }

  const isWalletRoute = pathname.startsWith("/wallets");

  if (!session.walletId && !isWalletRoute) {
    return NextResponse.redirect(new URL("/wallets/select", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
