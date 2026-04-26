import { Hono } from 'hono';
import type { Bindings } from '../types';

const catalogs = new Hono<{ Bindings: Bindings }>();

catalogs.get('/:key', async (c) => {
  const key = c.req.param('key');

  const object = await c.env.BUCKET.get(key);
  if (!object) {
    return c.json({ error: 'Catálogo no encontrado' }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `inline; filename="${key}"`);
  headers.set('Cache-Control', 'public, max-age=86400');
  headers.set('Content-Length', object.size.toString());

  return new Response(object.body, { headers });
});

export default catalogs;
