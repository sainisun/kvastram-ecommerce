import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import {
  matchesTokenVersion,
  verifyAccessToken,
  type AccessTokenClaims,
} from '../services/token-lifecycle-service';

const JWT_SECRET = config.jwt.secret;

/** Extract a token from Authorization header or an httpOnly cookie. */
export function getToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length);
  return getCookie(c, 'admin_token') || null;
}

export interface UserPayload {
  sub: string;
  role: string;
  exp?: number;
  tv?: number;
  jti?: string;
  aud?: string;
}

export interface AuthContextVariables {
  user: UserPayload;
}

async function verifyCurrentAdminToken(token: string): Promise<AccessTokenClaims> {
  const claims = await verifyAccessToken(token, 'admin');
  const [user] = await db
    .select({ id: users.id, token_version: users.token_version })
    .from(users)
    .where(eq(users.id, claims.sub))
    .limit(1);

  if (!user || !matchesTokenVersion(claims.tv, user.token_version)) {
    throw new Error('Access token has been revoked');
  }

  return claims;
}

function createRoleVerifier(allowedRoles: string[]) {
  return async (
    c: Context<{ Variables: AuthContextVariables }>,
    next: Next
  ) => {
    const token = getToken(c);
    if (!token) {
      return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
    }

    try {
      // MCP service tokens retain the existing signed-token compatibility path.
      // Admin tokens must satisfy the stronger lifecycle checks below.
      const preliminary = (await verify(
        token,
        JWT_SECRET,
        'HS256'
      )) as unknown as UserPayload;
      const payload =
        preliminary.role === 'admin'
          ? await verifyCurrentAdminToken(token)
          : preliminary;

      if (!allowedRoles.includes(payload.role)) {
        return c.json({ error: 'Forbidden: Access denied' }, 403);
      }

      c.set('user', payload);
      await next();
    } catch {
      return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
  };
}

export const verifyAuth = async (
  c: Context<{ Variables: AuthContextVariables }>,
  next: Next
) => {
  const token = getToken(c);
  if (!token) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }

  try {
    c.set('user', await verifyCurrentAdminToken(token));
    await next();
  } catch {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
};

export const verifyAdmin = createRoleVerifier(['admin']);
export const verifyAdminOrMcpService = createRoleVerifier(['admin', 'mcp_service']);
