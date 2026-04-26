import { Hono } from 'hono';
import type { Bindings } from '../types';
import { generateToken } from '../utils/token';

const auth = new Hono<{ Bindings: Bindings }>();

auth.post('/login', async (c) => {
  const body = await c.req.json<{ password?: string }>();

  if (!body.password || body.password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: 'Contraseña incorrecta' }, 401);
  }

  const token = await generateToken(c.env.TOKEN_SECRET);
  return c.json({ success: true, token });
});

export default auth;
