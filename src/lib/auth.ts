// starter/src/lib/auth.ts
import { createHmac } from "node:crypto";

const getEnv = (key: string): string | undefined => {
  // Supports both Astro's import.meta.env and Node's process.env (e.g. when running seeds)
  let metaEnv: Record<string, string> | undefined;

  if (typeof import.meta !== "undefined") {
    const envWrapper = import.meta as { env?: Record<string, string> };
    metaEnv = envWrapper.env;
  }

  if (metaEnv && key in metaEnv) {
    return metaEnv[key];
  }

  const nodeEnv = typeof process !== "undefined" ? process.env : undefined;
  return nodeEnv?.[key];
};

// Same secret as parent app
const SESSION_SECRET =
  getEnv("ANSIVERSA_SESSION_SECRET") ?? "dev-ansiversa-session-secret";

// Shared cookie name for all Ansiversa apps
export const SESSION_COOKIE_NAME =
  getEnv("SESSION_COOKIE_NAME") ?? "ans_session";

export type SessionPayload = {
  userId: string;
  email: string;
  issuedAt: number;
};

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const hmac = createHmac("sha256", SESSION_SECRET);
  hmac.update(body);
  const expected = hmac.digest("base64url");
  if (expected !== sig) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
