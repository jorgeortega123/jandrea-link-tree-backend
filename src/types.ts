export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ADMIN_PASSWORD: string;
  TOKEN_SECRET: string;
  FRONTEND_URL: string;
};

export type Entry = {
  id: number;
  title: string;
  description: string;
  type: 'catalog' | 'link';
  url: string | null;
  r2_key: string | null;
  file_name: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type PublicEntry = Omit<Entry, 'is_active' | 'created_at' | 'updated_at'>;

export type SocialLink = {
  id: number;
  label: string;
  icon: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PublicSocialLink = Omit<SocialLink, 'created_at' | 'updated_at'>;
