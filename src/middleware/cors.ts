import { cors } from 'hono/cors';
import type { Bindings } from '../types';

export const corsMiddleware = cors({
  origin: (origin, c) => {
    const env = c.env as Bindings;
    const allowed = [
      env.FRONTEND_URL,
      'http://localhost:5173',
      'https://jandrea-link-tree-frontend.pages.dev',
      'https://jandrea.art',
      'https://www.jandrea.art',
    ];
    return allowed.includes(origin) ? origin : null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
