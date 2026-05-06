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
const publicOAuthEnabled = process.env.MCP_PUBLIC_OAUTH_ENABLED === 'true';

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

function respondOAuthDisabled(res: Response) {
  res.status(404).json({ error: 'Not found' });
}

function setWwwAuthenticateHeader(res: Response) {
  const value = publicOAuthEnabled
    ? `Bearer realm="kvastram-admin", resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"`
    : 'Bearer realm="kvastram-admin"';
  res.setHeader('WWW-Authenticate', value);
}

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
  if (!publicOAuthEnabled) {
    respondOAuthDisabled(res);
    return;
  }

  res.json({
    resource: `${BASE_URL}/mcp`,
    authorization_servers: [BASE_URL],
  });
});

// RFC 8414: Authorization Server Metadata
app.get('/.well-known/oauth-authorization-server', (_req, res) => {
  if (!publicOAuthEnabled) {
    respondOAuthDisabled(res);
    return;
  }

  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    registration_endpoint: `${BASE_URL}/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: ['mcp'],
  });
});

// ── OAuth: Dynamic Client Registration (RFC 7591) ─────────────
// claude.ai requires this before it will start the OAuth browser flow
app.post('/register', (req, res) => {
  if (!publicOAuthEnabled) {
    respondOAuthDisabled(res);
    return;
  }

  const { client_name, redirect_uris, grant_types, response_types } = req.body as Record<string, unknown>;
  const clientId = `mcp-client-${randomUUID()}`;
  console.log(`[OAuth] Client registered: ${client_name} → ${clientId}`);
  res.status(201).json({
    client_id: clientId,
    client_name: client_name || 'MCP Client',
    redirect_uris: redirect_uris || [],
    grant_types: grant_types || ['authorization_code'],
    response_types: response_types || ['code'],
    token_endpoint_auth_method: 'none',
  });
});

// ── OAuth: Authorization endpoint ────────────────────────────
// claude.ai redirects here — we auto-approve (single-user admin)
app.get('/authorize', (req, res) => {
  if (!publicOAuthEnabled) {
    respondOAuthDisabled(res);
    return;
  }

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

  res.redirect(302, url.toString());
});

// ── OAuth: Token endpoint ─────────────────────────────────────
app.post('/token', (req, res) => {
  if (!publicOAuthEnabled) {
    respondOAuthDisabled(res);
    return;
  }

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
    setWwwAuthenticateHeader(res);
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
    setWwwAuthenticateHeader(res);
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
