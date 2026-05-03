import { Hono } from 'hono';
import type { Bindings, PublicSocialLink } from '../types';

const socialLinks = new Hono<{ Bindings: Bindings }>();

socialLinks.get('/', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT id, label, icon, url, sort_order FROM social_links ORDER BY sort_order ASC'
  ).all<PublicSocialLink>();

  return c.json(result.results);
});

export default socialLinks;
