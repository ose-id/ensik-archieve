export default defineEventHandler((event) => {
  const contentSecurityPolicy = [
    'default-src \'self\'',
    'base-uri \'self\'',
    'connect-src \'self\' https://discord.com',
    'font-src \'self\' data:',
    'form-action \'self\'',
    'frame-ancestors \'none\'',
    'img-src \'self\' data: blob: https://cdn.discordapp.com',
    'object-src \'none\'',
    'script-src \'self\' \'unsafe-inline\'',
    'style-src \'self\' \'unsafe-inline\'',
  ].join('; ');

  setResponseHeaders(event, {
    'Content-Security-Policy': contentSecurityPolicy,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  });

  if (!import.meta.dev) {
    setResponseHeader(
      event,
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }
});
