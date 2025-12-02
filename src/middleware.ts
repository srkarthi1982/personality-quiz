// @ts-nocheck
import { defineMiddleware } from "astro:middleware";

const SESSION_COOKIE_NAME =
  import.meta.env.SESSION_COOKIE_NAME ?? "ansiversa_session";

const ROOT_APP_URL =
  import.meta.env.PUBLIC_ROOT_APP_URL ?? "https://ansiversa.com";

function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  const parts = header.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) continue;
    cookies[name] = decodeURIComponent(rest.join("=") ?? "");
  }
  return cookies;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;
  const url = new URL(request.url);

  const cookieHeader = request.headers.get("cookie");
  const cookies = parseCookies(cookieHeader);

  const sessionRaw = cookies[SESSION_COOKIE_NAME] ?? null;
  const isAuthenticated = Boolean(sessionRaw);

  // Expose minimal user/session info to the app
  (locals as any).user = {
    isAuthenticated,
    sessionRaw,
  };

  // If user is already authenticated (via parent), skip /login
  if (url.pathname === "/login" && isAuthenticated) {
    return Response.redirect(new URL("/", url), 302);
  }

  // Example: if you later want to protect routes inside the mini-app itself:
  //
  // if (url.pathname.startsWith("/app") && !isAuthenticated) {
  //   const redirectTo = encodeURIComponent(url.toString());
  //   return Response.redirect(
  //     `${ROOT_APP_URL}/login?redirect=${redirectTo}`,
  //     302
  //   );
  // }

  return next();
});
