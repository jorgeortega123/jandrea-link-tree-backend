import { Hono } from 'hono';
import type { Bindings, PublicEntry } from '../types';

const entries = new Hono<{ Bindings: Bindings }>();

entries.get('/', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, title, description, type, url, r2_key, file_name, sort_order FROM entries WHERE is_active = 1 ORDER BY sort_order ASC'
  ).all<PublicEntry>();

  return c.json(result.results);
});

entries.get('/ai', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT title, description, r2_key FROM entries WHERE is_active = 1 AND type = ? ORDER BY sort_order ASC'
  ).bind('catalog').all<{ title: string; description: string; r2_key: string | null }>();

  const catalogs = result.results.map((row) => ({
    nombre: row.title,
    descripcion: row.description,
    url: row.r2_key ? `${new URL(c.req.url).origin}/api/catalogs/${row.r2_key}` : null,
  }));

  return c.json(catalogs);
});

export default entries;
