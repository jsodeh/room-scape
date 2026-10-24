export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function requireUser(req: Request): Promise<{ id: string; app_metadata?: { role?: string } }> {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Sign in to use this function.');
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: {
      authorization,
      apikey: Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new HttpError(401, 'Your session could not be verified.');
  const user = await response.json();
  if (!user.id) throw new HttpError(401, 'Your session could not be verified.');
  return user;
}

export function requireOwnedAsset(value: string, userId: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new HttpError(400, 'Choose an uploaded room or reference image.'); }
  const base = new URL(Deno.env.get('SUPABASE_URL') || 'http://invalid');
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { throw new HttpError(400, 'Invalid image URL.'); }
  if (url.origin !== base.origin || url.username || url.password || url.hash ||
      !['room-images', 'design-results'].some(bucket => path.startsWith(`/storage/v1/object/public/${bucket}/${userId}/`)) ||
      path.split('/').includes('..') || path.includes('\\')) {
    throw new HttpError(403, 'Use an image uploaded to your own project storage.');
  }
  return url;
}

export async function fetchAsset(url: string, allowPdf = false): Promise<{ data: ArrayBuffer; contentType: string }> {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new HttpError(400, 'The uploaded image could not be downloaded.');
  const contentType = response.headers.get('content-type')?.split(';')[0].trim() || '';
  const allowed = ['image/jpeg', 'image/png', 'image/webp', ...(allowPdf ? ['application/pdf'] : [])];
  if (!allowed.includes(contentType)) throw new HttpError(400, 'Unsupported image type.');
  const limit = 4 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new HttpError(413, 'Choose an image smaller than 4 MB.');
  }
  if (!response.body) throw new HttpError(400, 'The uploaded image is empty.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) throw new HttpError(413, 'Choose an image smaller than 4 MB.');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  if (!length) throw new HttpError(400, 'The uploaded image is empty.');
  const data = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  return { data: data.buffer, contentType };
}
