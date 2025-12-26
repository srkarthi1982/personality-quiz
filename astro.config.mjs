// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

import alpinejs from '@astrojs/alpinejs';

import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  output: "server",

  vite: {
    // @ts-ignore
    plugins: [tailwindcss()]
  },

  integrations: [alpinejs({ entrypoint: "/src/alpine.ts" }), db()]
});