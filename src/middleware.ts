// @ts-nocheck
import { defineMiddleware } from "astro:middleware";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/auth";

// Primary domain for Ansiversa (used to build the root app URL)
const COOKIE_DOMAIN =
  import.meta.env.ANSIVERSA_COOKIE_DOMAIN ?? "ansiversa.com";

// Root app URL – prefers explicit PUBLIC_ROOT_APP_URL if you ever set it,
// otherwise builds from ANSIVERSA_COOKIE_DOMAIN, with a safe default.
const ROOT_APP_URL =
  import.meta.env.PUBLIC_ROOT_APP_URL ?? `https://${COOKIE_DOMAIN}`;

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies } = context;
  const locals = context.locals as any;

  // Ensure predictable shape
  locals.user = locals.user ?? null;
  locals.sessionToken = null;
  locals.isAuthenticated = false;
  locals.rootAppUrl = ROOT_APP_URL;

  // 1) Read the shared session cookie (ans_session)
  const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
  const token = sessionCookie?.value;

  if (token) {
    const payload = verifySessionToken(token);

    if (payload) {
      // 2) Populate locals.user in the same shape as parent app expects
      locals.user = {
        id: payload.userId,
        email: payload.email,
        // We don't have name in the token, so leave undefined
        name: undefined,
      };

      locals.sessionToken = token;
      locals.isAuthenticated = true;
    } else {
      // Invalid token → treat as logged out
      locals.user = null;
      locals.sessionToken = null;
      locals.isAuthenticated = false;
    }
  }

  return next();
});
