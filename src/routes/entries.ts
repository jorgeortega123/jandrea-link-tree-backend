import { Hono } from 'hono';
import type { Bindings, PublicEntry } from '../types';

const entries = new Hono<{ Bindings: Bindings }>();

entries.get('/', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, title, description, type, url, r2_key, file_name, sort_order FROM entries WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all<PublicEntry>();

  return c.json(result.results);
});

export default entries;
