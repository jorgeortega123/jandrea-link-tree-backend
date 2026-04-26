const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateToken(secret: string): Promise<string> {
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_EXPIRY_MS });
  const payloadB64 = btoa(payload);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  return `${payloadB64}.${arrayBufferToHex(signature)}`;
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signatureHex] = parts;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBytes = new Uint8Array(signatureHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(payloadB64));
  if (!valid) return false;

  try {
    const payload = JSON.parse(atob(payloadB64));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
