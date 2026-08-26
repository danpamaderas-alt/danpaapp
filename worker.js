const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://*.supabase.com wss://*.supabase.co wss://*.supabase.com; font-src 'self' data:; frame-ancestors 'none'",
};

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status >= 400) return response;
    const headers = new Headers(response.headers);
    const accept = request.headers.get('accept') || '';
    const url = new URL(request.url);
    const isHTML = accept.includes('text/html') || url.pathname === '/' || url.pathname.endsWith('/');
    if (isHTML) {
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      headers.set('ETag', `"${Date.now()}"`);
    }
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      if (!headers.has(k)) headers.set(k, v);
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
