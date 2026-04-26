import { Hono } from 'hono';
import type { Bindings, Entry } from '../types';
import { validateEntry, sanitizeFileName } from '../utils/validators';
import { authMiddleware } from '../middleware/auth';

const adminEntries = new Hono<{ Bindings: Bindings }>();

// All admin routes require auth
adminEntries.use('/*', authMiddleware);

// GET all entries (including inactive)
adminEntries.get('/', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT * FROM entries ORDER BY sort_order ASC'
  ).all<Entry>();

  return c.json(result.results);
});

// POST create entry
adminEntries.post('/', async (c) => {
  const formData = await c.req.parseBody();
  const title = formData.title as string;
  const description = (formData.description as string) || '';
  const type = formData.type as string;
  const url = (formData.url as string) || '';
  const file = formData.file as File | undefined;

  const validation = validateEntry({ title, description, type, url });
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400);
  }

  let r2Key: string | null = null;
  let fileName: string | null = null;

  if (type === 'catalog') {
    if (!file) {
      return c.json({ error: 'El archivo PDF es requerido para tipo "catalog"' }, 400);
    }
    if (file.type !== 'application/pdf') {
      return c.json({ error: 'Solo se permiten archivos PDF' }, 400);
    }
    if (file.size > 50 * 1024 * 1024) {
      return c.json({ error: 'El archivo no puede superar 50MB' }, 400);
    }

    fileName = file.name;
    r2Key = `${Date.now()}-${sanitizeFileName(file.name)}`;
    await c.env.BUCKET.put(r2Key, await file.arrayBuffer());
  }

  // Get max sort_order
  const maxResult = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM entries'
  ).first<{ max_order: number }>();
  const sortOrder = (maxResult?.max_order ?? -1) + 1;

  const result = await c.env.DB.prepare(
    'INSERT INTO entries (title, description, type, url, r2_key, file_name, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *'
  ).bind(title, description, type, type === 'link' ? url : null, r2Key, fileName, sortOrder)
    .first<Entry>();

  return c.json(result, 201);
});

// PUT update entry
adminEntries.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));

  // Check entry exists
  const existing = await c.env.DB.prepare(
    'SELECT * FROM entries WHERE id = ?'
  ).bind(id).first<Entry>();

  if (!existing) {
    return c.json({ error: 'Entry no encontrado' }, 404);
  }

  const formData = await c.req.parseBody();
  const title = (formData.title as string) || existing.title;
  const description = (formData.description as string) !== undefined
    ? (formData.description as string)
    : existing.description;
  const type = (formData.type as string) || existing.type;
  const url = (formData.url as string) || existing.url;
  const file = formData.file as File | undefined;

  const validation = validateEntry({ title, description, type, url });
  if (!validation.valid) {
    return c.json({ error: validation.error }, 400);
  }

  let r2Key = existing.r2_key;
  let fileName = existing.file_name;

  if (type === 'catalog' && file) {
    if (file.type !== 'application/pdf') {
      return c.json({ error: 'Solo se permiten archivos PDF' }, 400);
    }
    if (file.size > 50 * 1024 * 1024) {
      return c.json({ error: 'El archivo no puede superar 50MB' }, 400);
    }

    // Upload new file first
    const newKey = `${Date.now()}-${sanitizeFileName(file.name)}`;
    await c.env.BUCKET.put(newKey, await file.arrayBuffer());

    // Delete old file after successful upload
    if (existing.r2_key) {
      await c.env.BUCKET.delete(existing.r2_key);
    }

    r2Key = newKey;
    fileName = file.name;
  }

  const result = await c.env.DB.prepare(
    `UPDATE entries SET title = ?, description = ?, type = ?, url = ?, r2_key = ?, file_name = ?, updated_at = datetime('now') WHERE id = ? RETURNING *`
  ).bind(
    title,
    description,
    type,
    type === 'link' ? url : null,
    r2Key,
    fileName,
    id
  ).first<Entry>();

  return c.json(result);
});

// DELETE entry
adminEntries.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));

  const existing = await c.env.DB.prepare(
    'SELECT * FROM entries WHERE id = ?'
  ).bind(id).first<Entry>();

  if (!existing) {
    return c.json({ error: 'Entry no encontrado' }, 404);
  }

  // Delete R2 object if exists
  if (existing.r2_key) {
    await c.env.BUCKET.delete(existing.r2_key);
  }

  await c.env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(id).run();

  return c.json({ success: true });
});

// PUT reorder entries
adminEntries.put('/reorder', async (c) => {
  const { orders } = await c.req.json<{ orders: { id: number; sort_order: number }[] }>();

  if (!Array.isArray(orders) || orders.length === 0) {
    return c.json({ error: 'Lista de órdenes requerida' }, 400);
  }

  const batch = orders.map(({ id, sort_order }) =>
    c.env.DB.prepare(
      `UPDATE entries SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(sort_order, id)
  );

  await c.env.DB.batch(batch);

  return c.json({ success: true });
});

export default adminEntries;
