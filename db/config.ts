import { defineDb } from 'astro:db';
import { tables } from './tables';

// https://astro.build/db/config
export default defineDb({
  tables,
});