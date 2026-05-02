import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { registerProductTools } from './tools/products.js';
import { registerCategoryTools } from './tools/categories.js';
import { registerCollectionTools } from './tools/collections.js';
import { registerBannerTools } from './tools/banners.js';
import { registerOrderTools } from './tools/orders.js';
import { registerMarketingTools } from './tools/marketing.js';
import { registerTrustItemTools } from './tools/trust-items.js';

const PORT = Number(process.env.PORT) || 3002;
const SECRET = process.env.MCP_SECRET_TOKEN;
const BASE_URL = process.env.MCP_BASE_URL || `http://localhost:${PORT}`;

if (!SECRET) {
  console.error('❌ MCP_SECRET_TOKEN is not set in .env');
  process.exit(1);
}

// In-memory stores
const authCodes = new Map<string, { redirect_uri: string; expires: number }>();
const sessions = new Map<string, StreamableHTTPServerTransport>();

function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'kvastram-admin', version: '1.0.0' });
  registerProductTools(server);
  registerCategoryTools(server);
  registerCollectionTools(server);
  registerBannerTools(server);
  registerOrderTools(server);
  registerMarketingTools(server);
  registerTrustItemTools(server);
  return server;
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// ── Health ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', server: 'kvastram-mcp' });
});


// ── OAuth 2.0 metadata (required by claude.ai) ───────────────

// RFC 9728: Protected Resource Metadata — claude.ai fetches this first
app.get('/.well-known/oauth-protected-resource', (_req, res) => {
  res.json({
    resource: `${BASE_URL}/mcp`,
    authorization_servers: [BASE_URL],
  });
});

// RFC 8414: Authorization Server Metadata
app.get('/.well-known/oauth-authorization-server', (_req, res) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  });
});

// ── OAuth: Authorization endpoint ────────────────────────────
// claude.ai redirects here — we auto-approve (single-user admin)
app.get('/authorize', (req, res) => {
  const { redirect_uri, state, client_id } = req.query as Record<string, string>;

  if (!redirect_uri) {
    res.status(400).send('Missing redirect_uri');
    return;
  }

  // Generate a short-lived auth code
  const code = randomUUID();
  authCodes.set(code, {
    redirect_uri,
    expires: Date.now() + 5 * 60 * 1000, // 5 min
  });

  const url = new URL(redirect_uri);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);

  console.log(`[OAuth] Authorizing client_id="${client_id}" → redirecting with code`);

  // Return HTML that redirects after a short delay so the OAuth client
  // can set up its callback listener before the redirect fires.
  const callbackUrl = url.toString();
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Kvastram Admin – Connecting…</title>
<style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#faf9f7;}
h2{color:#8b5e3c;}p{color:#555;}</style>
</head>
<body>
<h2>Kvastram Admin</h2>
<p>Authorizing Claude AI access…</p>
<script>setTimeout(()=>{window.location.href=${JSON.stringify(callbackUrl)};},500);</script>
</body>
</html>`);
});

// ── OAuth: Token endpoint ─────────────────────────────────────
app.post('/token', (req, res) => {
  const { grant_type, code, redirect_uri } = req.body as Record<string, string>;

  if (grant_type !== 'authorization_code') {
    res.status(400).json({ error: 'unsupported_grant_type' });
    return;
  }

  const entry = authCodes.get(code);
  if (!entry) {
    res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code not found or expired' });
    return;
  }

  if (Date.now() > entry.expires) {
    authCodes.delete(code);
    res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code expired' });
    return;
  }

  // Validate redirect_uri matches
  if (redirect_uri && entry.redirect_uri !== redirect_uri) {
    res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
    return;
  }

  authCodes.delete(code);
  console.log('[OAuth] Token issued');

  res.json({
    access_token: SECRET,
    token_type: 'bearer',
    expires_in: 7 * 24 * 3600, // 7 days
  });
});

// ── MCP POST handler (shared between / and /mcp) ─────────────
async function handleMcpPost(req: Request, res: Response): Promise<void> {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${SECRET}`) {
    // RFC 6750 §3.1 — WWW-Authenticate lets clients discover OAuth server
    res.setHeader(
      'WWW-Authenticate',
      `Bearer realm="kvastram-admin", resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"`
    );
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = req.body;
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (isInitializeRequest(parsed)) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => { sessions.set(id, transport); },
    });
    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) sessions.delete(sid);
    };
    const server = createMcpServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, parsed);
    return;
  }

  if (sessionId && sessions.has(sessionId)) {
    await sessions.get(sessionId)!.handleRequest(req, res, parsed);
    return;
  }

  res.status(400).json({ error: 'Bad request: missing or invalid session' });
}

// Register on both / (base URL) and /mcp so it works regardless of what
// URL the user entered in claude.ai (with or without /mcp suffix)
app.post('/', handleMcpPost);
app.post('/mcp', handleMcpPost);

// GET /mcp for SSE stream (some clients use this)
app.get('/mcp', async (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${SECRET}`) {
    res.setHeader(
      'WWW-Authenticate',
      `Bearer realm="kvastram-admin", resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"`
    );
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    await sessions.get(sessionId)!.handleRequest(req, res);
    return;
  }
  res.status(400).json({ error: 'Bad request: no active session' });
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId && sessions.has(sessionId)) {
    const t = sessions.get(sessionId)!;
    await t.close();
    sessions.delete(sessionId);
  }
  res.sendStatus(204);
});

const httpServer = createServer(app);
httpServer.listen(PORT, () => {
  console.log(`✅ Kvastram MCP server running on port ${PORT}`);
  console.log(`   MCP endpoint : ${BASE_URL}/mcp`);
  console.log(`   OAuth issuer : ${BASE_URL}`);
});
