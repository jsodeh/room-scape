import { HttpError, requireUser, requireOwnedAsset, fetchAsset } from '../../supabase/functions/_shared/security.ts';
const project = '10000000-0000-4000-8000-000000000001';
const user = '00000000-0000-4000-8000-000000000001';
const base = 'https://fkptdunoizrlkqwdmcyi.supabase.co';
const image = `${base}/storage/v1/object/public/room-images/${user}/room-images/photo.jpg`;
Deno.env.set('SUPABASE_URL', base);
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-only-service-key');
Deno.env.set('GEMINI_API_KEY', 'test-only-provider-key');
const { handleStagingRequest } = await import('../../supabase/functions/generate-staged-room/handlers.ts');
const originalFetch = globalThis.fetch;
Deno.test('legacy refinement sends the owned saved PNG canvas with its actual MIME type', async () => {
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=';
  const saved = image.replace('photo.jpg', 'saved.png');
  let providerCalls = 0;
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init), url = new URL(req.url);
    if (url.pathname === '/auth/v1/user') return Response.json({ id: user });
    if (url.pathname === '/rest/v1/staging_projects') return Response.json({ id: project, user_id: user, original_images: [image], staged_images: [saved], workflow_version: 1 });
    if (req.url === saved) return new Response(Uint8Array.from(atob(png), c => c.charCodeAt(0)), { headers: { 'content-type': 'image/png' } });
    if (url.hostname === 'generativelanguage.googleapis.com') {
      providerCalls++; const body = await req.json();
      assert(body.contents[0].parts[1].inline_data.mime_type === 'image/png');
      return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: png, mimeType: 'image/png' } }] } }] });
    }
    if (url.pathname.startsWith('/storage/v1/object/room-images/')) return Response.json({ Key: url.pathname });
    throw new Error('Unexpected storage or inference access');
  };
  try { assert((await handleStagingRequest(request(saved))).status === 200); assert(providerCalls === 1); }
  finally { globalThis.fetch = originalFetch; }
});
function assert(value: unknown, message = 'Assertion failed'): asserts value { if (!value) throw new Error(message); }
async function expectStatus(action: () => unknown, status: number) {
  try { await action(); } catch (error) {
    assert(error instanceof HttpError && error.status === status, `Expected HTTP ${status}`); return;
  }
  throw new Error(`Expected HTTP ${status}`);
}
function request(url = image) {
  return new Request(`${base}/functions/v1/generate-staged-room`, { method: 'POST', headers: { authorization: 'Bearer test-only-session', 'content-type': 'application/json' }, body: JSON.stringify({ projectId: project, roomImageUrl: url, instructions: 'Stage this room.' }) });
}
Deno.test('asset validation rejects other hosts, other users, and path traversal', async () => {
  assert(requireOwnedAsset(image, user).href === image);
  for (const url of ['https://example.test/image.jpg', image.replace(user, project), image.replace('/room-images/photo.jpg', '/%2e%2e/other/photo.jpg')]) {
    await expectStatus(() => requireOwnedAsset(url, user), 403);
  }
});
Deno.test('unauthenticated requests cannot reach storage, database, or paid providers', async () => {
  globalThis.fetch = () => { throw new Error('Unexpected network request'); };
  try {
    await expectStatus(() => requireUser(new Request(base)), 401);
    const response = await handleStagingRequest(new Request(base, { method: 'POST', body: '{}' }));
    assert(response.status === 401);
  } finally { globalThis.fetch = originalFetch; }
});
Deno.test('generation requires an owned project and never falls through to inference', async () => {
  const calls: string[] = [];
  globalThis.fetch = (input) => {
    const url = new URL(input instanceof Request ? input.url : String(input)); calls.push(url.pathname);
    if (url.pathname === '/auth/v1/user') return Promise.resolve(Response.json({ id: user }));
    if (url.pathname === '/rest/v1/staging_projects') {
      assert(url.searchParams.get('user_id') === `eq.${user}`);
      return Promise.resolve(Response.json([]));
    }
    throw new Error('Unexpected inference or storage request');
  };
  try {
    assert((await handleStagingRequest(request())).status === 404);
    assert(calls.length === 2);
  } finally { globalThis.fetch = originalFetch; }
});
Deno.test('duplicate generation is rejected before a provider is called', async () => {
  globalThis.fetch = (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.pathname === '/auth/v1/user') return Promise.resolve(Response.json({ id: user }));
    if (url.pathname === '/rest/v1/staging_projects') {
      const method = input instanceof Request ? input.method : init?.method;
      return Promise.resolve(Response.json(method === 'PATCH' ? null : { id: project, user_id: user, original_images: [image] }));
    }
    throw new Error('Unexpected inference or storage request');
  };
  try { assert((await handleStagingRequest(request())).status === 409); }
  finally { globalThis.fetch = originalFetch; }
});
Deno.test('image downloads enforce MIME type and declared/streamed size limits', async () => {
  try {
    globalThis.fetch = () => Promise.resolve(new Response('x', { headers: { 'content-type': 'text/html' } }));
    await expectStatus(() => fetchAsset(image), 400);
    globalThis.fetch = () => Promise.resolve(new Response('x', { headers: { 'content-type': 'image/jpeg', 'content-length': String(5 * 1024 * 1024) } }));
    await expectStatus(() => fetchAsset(image), 413);
    globalThis.fetch = () => Promise.resolve(new Response(new Uint8Array(4 * 1024 * 1024 + 1), { headers: { 'content-type': 'image/jpeg' } }));
    await expectStatus(() => fetchAsset(image), 413);
    globalThis.fetch = () => Promise.resolve(new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } }));
    assert((await fetchAsset(image)).data.byteLength === 3);
  } finally { globalThis.fetch = originalFetch; }
});
