export function validateEntry(data: {
  title?: string;
  description?: string;
  type?: string;
  url?: string;
}): { valid: boolean; error?: string } {
  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, error: 'El título es requerido' };
  }
  if (data.title.length > 200) {
    return { valid: false, error: 'El título no puede superar 200 caracteres' };
  }
  if (data.description && data.description.length > 500) {
    return { valid: false, error: 'La descripción no puede superar 500 caracteres' };
  }
  if (!data.type || !['catalog', 'link'].includes(data.type)) {
    return { valid: false, error: 'El tipo debe ser "catalog" o "link"' };
  }
  if (data.type === 'link') {
    if (!data.url || data.url.trim().length === 0) {
      return { valid: false, error: 'La URL es requerida para tipo "link"' };
    }
    try {
      const parsed = new URL(data.url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, error: 'La URL debe comenzar con http:// o https://' };
      }
    } catch {
      return { valid: false, error: 'URL inválida' };
    }
  }
  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}
