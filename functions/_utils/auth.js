import { json } from './response.js';

const encoder = new TextEncoder();

async function sha256(text) {
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(text));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const ensureAdmin = async (request, env) => {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) {
    return unauthorized();
  }

  const decoded = atob(header.replace('Basic ', ''));
  const delimiter = decoded.indexOf(':');
  if (delimiter === -1) {
    return unauthorized();
  }

  const user = decoded.slice(0, delimiter);
  const pass = decoded.slice(delimiter + 1);

  if (!env.ADMIN_USER || !env.ADMIN_PASS_HASH) {
    return json({ error: 'Admin credentials not configured' }, 500);
  }

  if (user !== env.ADMIN_USER) {
    return unauthorized();
  }

  const passHash = await sha256(pass);
  if (passHash !== env.ADMIN_PASS_HASH) {
    return unauthorized();
  }

  return null;
};

const unauthorized = () =>
  json({ error: 'Unauthorized' }, 401, {
    'WWW-Authenticate': 'Basic realm="Admin", charset="UTF-8"'
  });

