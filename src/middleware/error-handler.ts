import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  console.error('Error:', err);
  if ('getResponse' in err) {
    return (err as any).getResponse();
  }
  return c.json({ error: 'Error interno del servidor' }, 500);
};
