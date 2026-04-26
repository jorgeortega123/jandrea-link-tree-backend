import { Hono } from 'hono';
import type { Bindings } from './types';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import authRoutes from './routes/auth';
import entriesRoutes from './routes/entries';
import catalogsRoutes from './routes/catalogs';
import adminEntriesRoutes from './routes/admin-entries';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('/api/*', corsMiddleware);
app.onError(errorHandler);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// Public routes
app.route('/api/entries', entriesRoutes);
app.route('/api/catalogs', catalogsRoutes);

// Auth routes
app.route('/api/auth', authRoutes);

// Admin routes
app.route('/api/admin/entries', adminEntriesRoutes);

export default app;
