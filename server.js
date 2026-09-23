import { createServer as createHttpServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNebiusPlanProvider, DEFAULT_MODEL } from './server/nebius-provider.js';
import { validateRequest } from './src/provider.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MAX_BODY_BYTES = 10_000;
const MAX_PROVIDER_CALLS = 3;
const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
  });
  res.end(body);
}

function json(res, status, value) {
  send(res, status, JSON.stringify(value));
}

function sameLocalOrigin(req) {
  if (!req.headers.origin) return true;
  try {
    const origin = new URL(req.headers.origin);
    return origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname) && Number(origin.port) === req.socket.localPort;
  } catch {
    return false;
  }
}

async function readJsonBody(req) {
  if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
    throw Object.assign(new Error('Send this request as JSON.'), { status: 415 });
  }
  const chunks = [];
  let bytes = 0;
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) {
    throw Object.assign(new Error('Request is too large.'), { status: 413 });
  }
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw Object.assign(new Error('Request is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 });
  }
}

async function serveStatic(req, res, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return json(res, 400, { error: 'Invalid path.' });
  }
  const relativePath = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  const target = path.resolve(ROOT, relativePath);
  if (!target.startsWith(`${ROOT}${path.sep}`)) return json(res, 404, { error: 'Not found.' });
  const contentType = MIME_TYPES.get(path.extname(target));
  if (!contentType || path.basename(target).startsWith('.')) return json(res, 404, { error: 'Not found.' });
  try {
    const content = await readFile(target);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    json(res, 404, { error: 'Not found.' });
  }
}

export function createTracePilotServer({
  apiKey = '',
  model = DEFAULT_MODEL,
  fetchImpl = globalThis.fetch,
  maxProviderCalls = MAX_PROVIDER_CALLS
} = {}) {
  let callsUsed = 0;
  const provider = apiKey ? createNebiusPlanProvider({ apiKey, model, fetchImpl }) : null;

  return createHttpServer(async (req, res) => {
    let url;
    try {
      url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`);
    } catch {
      return json(res, 400, { error: 'Invalid request URL.' });
    }

    if (url.pathname === '/src/runtime-config.js' && (req.method === 'GET' || req.method === 'HEAD')) {
      const config = `export const runtimeConfig = Object.freeze(${JSON.stringify({
        remoteProviderEnabled: Boolean(provider),
        model: provider?.model ?? model ?? DEFAULT_MODEL,
        requestsRemaining: provider ? Math.max(0, maxProviderCalls - callsUsed) : 0
      })});\n`;
      return send(res, 200, req.method === 'HEAD' ? '' : config, 'text/javascript; charset=utf-8');
    }

    if (url.pathname === '/api/plan') {
      if (req.method !== 'POST') return json(res, 405, { error: 'Use POST to request a review plan.' });
      if (!sameLocalOrigin(req)) return json(res, 403, { error: 'Requests must come from this local TracePilot page.' });
      if (!provider) return json(res, 503, { error: 'Nebius mode is not configured on this local server.' });
      if (callsUsed >= maxProviderCalls) return json(res, 429, { error: 'Local provider-call limit reached for this server run.' });
      let input;
      try {
        input = await readJsonBody(req);
      } catch (error) {
        return json(res, error.status ?? 400, { error: error.message });
      }
      const validation = validateRequest(input);
      if (!validation.valid) return json(res, 400, { error: validation.message });
      callsUsed += 1;
      try {
        const result = await provider.createPlan(input);
        return json(res, 200, { ...result, requestsRemaining: Math.max(0, maxProviderCalls - callsUsed) });
      } catch (error) {
        return json(res, 502, { error: error.message || 'Nebius request failed. No plan was created.' });
      }
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });
    return serveStatic(req, res, url.pathname);
  });
}

export function startServer({ port = Number(process.env.PORT) || 4173, host = '127.0.0.1' } = {}) {
  const server = createTracePilotServer({
    apiKey: process.env.NEBIUS_API_KEY ?? '',
    model: process.env.NEBIUS_MODEL ?? DEFAULT_MODEL
  });
  server.listen(port, host, () => {
    process.stdout.write(`TracePilot listening on http://${host}:${port}; remote provider ${process.env.NEBIUS_API_KEY ? 'configured' : 'disabled'}.\n`);
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) startServer();
