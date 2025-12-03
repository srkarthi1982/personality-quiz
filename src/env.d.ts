/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Astro DB remote URL for Turso/libSQL */
  readonly ASTRO_DB_REMOTE_URL: string;

  /** Astro DB Application Token for remote access */
  readonly ASTRO_DB_APP_TOKEN: string;

  /** Secret used for JWT / session signing */
  readonly ANSIVERSA_AUTH_SECRET: string;

  /** Secret used for cookie encryption / session management */
  readonly ANSIVERSA_SESSION_SECRET: string;

  /** Domain for cookies (e.g., ansiversa.com) */
  readonly ANSIVERSA_COOKIE_DOMAIN: string;

  /** Optional: Override the default session cookie name */
  readonly SESSION_COOKIE_NAME?: string;

  /** Optional: Override the root app URL (fallback: https://ansiversa.com) */
  readonly PUBLIC_ROOT_APP_URL?: string;
}

interface Window {
  Alpine: import('alpinejs').Alpine;
}

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      email: string;
      name?: string;
    };
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


