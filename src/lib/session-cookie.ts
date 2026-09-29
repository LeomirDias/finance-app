export const SESSION_COOKIE = "authjs.session-token";
export const SECURE_SESSION_COOKIE = `__Secure-${SESSION_COOKIE}`;

export function readSessionToken(get: (name: string) => string | undefined) {
  const secure = get(SECURE_SESSION_COOKIE)?.trim();
  if (secure) return secure;

  const plain = get(SESSION_COOKIE)?.trim();
  return plain || null;
}
