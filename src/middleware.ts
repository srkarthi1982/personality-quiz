import { defineMiddleware } from "astro:middleware";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./lib/auth";

// Primary domain for Ansiversa (used to build the root app URL)
const COOKIE_DOMAIN =
  import.meta.env.ANSIVERSA_COOKIE_DOMAIN ?? "ansiversa.com";

// Root app URL
const ROOT_APP_URL =
  import.meta.env.PUBLIC_ROOT_APP_URL ?? `https://${COOKIE_DOMAIN}`;

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, locals, url } = context;
  const pathname = url.pathname;

  // Allow static assets
  if (
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/images/")
  ) {
    return next();
  }

  // Ensure predictable shape
  locals.user = locals.user ?? undefined;
  locals.sessionToken = null;
  locals.isAuthenticated = false;
  locals.rootAppUrl = ROOT_APP_URL;

  // 1) Read the shared session cookie
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const payload = verifySessionToken(token);

    if (payload?.userId) {
      locals.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        roleId: payload.roleId ?? undefined,
        stripeCustomerId: payload.stripeCustomerId ?? undefined,
      };

      locals.sessionToken = token;
      locals.isAuthenticated = true;
    } else {
      locals.user = undefined;
      locals.sessionToken = null;
      locals.isAuthenticated = false;
    }
  }

  // ✅ ENFORCE AUTH (protect everything in mini-app)
  if (!locals.isAuthenticated) {
    const loginUrl = new URL("/login", ROOT_APP_URL);
    loginUrl.searchParams.set("returnTo", url.toString()); // ✅ full URL back to quiz
    return context.redirect(loginUrl.toString());
  }

  return next();
});
