import { Hono } from 'hono';
import type { Bindings, SocialLink } from '../types';
import { authMiddleware } from '../middleware/auth';

const adminSocialLinks = new Hono<{ Bindings: Bindings }>();

// All admin routes require auth
adminSocialLinks.use('/*', authMiddleware);

// GET all social links
adminSocialLinks.get('/', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM social_links ORDER BY sort_order ASC'
  ).all<SocialLink>();

  return c.json(result.results);
});

// POST create social link
adminSocialLinks.post('/', async (c) => {
  const body = await c.req.json<{ label: string; icon: string; url: string }>();

  if (!body.label?.trim() || !body.icon?.trim() || !body.url?.trim()) {
    return c.json({ error: 'label, icon y url son requeridos' }, 400);
  }

  // Get max sort_order
  const maxResult = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM social_links'
  ).first<{ max_order: number }>();
  const sortOrder = (maxResult?.max_order ?? -1) + 1;

  const result = await c.env.DB.prepare(
    'INSERT INTO social_links (label, icon, url, sort_order) VALUES (?, ?, ?, ?) RETURNING *'
  ).bind(body.label.trim(), body.icon.trim(), body.url.trim(), sortOrder)
    .first<SocialLink>();

  return c.json(result, 201);
});

// PUT reorder social links
adminSocialLinks.put('/reorder', async (c) => {
  const { orders } = await c.req.json<{ orders: { id: number; sort_order: number }[] }>();

  if (!Array.isArray(orders) || orders.length === 0) {
    return c.json({ error: 'Lista de órdenes requerida' }, 400);
  }

  const batch = orders.map(({ id, sort_order }) =>
    c.env.DB.prepare(
      `UPDATE social_links SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(sort_order, id)
  );

  await c.env.DB.batch(batch);

  return c.json({ success: true });
});

// PUT update social link
adminSocialLinks.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));

  const existing = await c.env.DB.prepare(
    'SELECT * FROM social_links WHERE id = ?'
  ).bind(id).first<SocialLink>();

  if (!existing) {
    return c.json({ error: 'Red social no encontrada' }, 404);
  }

  const body = await c.req.json<{ label?: string; icon?: string; url?: string }>();

  const label = body.label?.trim() || existing.label;
  const icon = body.icon?.trim() || existing.icon;
  const url = body.url?.trim() || existing.url;

  const result = await c.env.DB.prepare(
    `UPDATE social_links SET label = ?, icon = ?, url = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`
  ).bind(label, icon, url, id).first<SocialLink>();

  return c.json(result);
});

// DELETE social link
adminSocialLinks.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));

  const existing = await c.env.DB.prepare(
    'SELECT * FROM social_links WHERE id = ?'
  ).bind(id).first<SocialLink>();

  if (!existing) {
    return c.json({ error: 'Red social no encontrada' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM social_links WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

export default adminSocialLinks;
