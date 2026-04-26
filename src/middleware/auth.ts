import { createMiddleware } from 'hono/factory';
import type { Bindings } from '../types';
import { verifyToken } from '../utils/token';

export const authMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Token de autenticación requerido' }, 401);
  }

  const token = authHeader.slice(7);
  const valid = await verifyToken(token, c.env.TOKEN_SECRET);
  if (!valid) {
    return c.json({ error: 'Token inválido o expirado' }, 401);
  }

  await next();
});
