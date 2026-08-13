import { randomUUID } from 'node:crypto';
import { sign, verify } from 'hono/jwt';
import { config } from '../config';

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
export const TOKEN_ISSUER = 'kvastram-api';

export type TokenAudience = 'admin' | 'customer';

export interface AccessTokenClaims {
  sub: string;
  role: string;
  aud: TokenAudience;
  iss: typeof TOKEN_ISSUER;
  tv: number;
  iat: number;
  exp: number;
  jti: string;
  email?: string;
}

export async function issueAccessToken(input: {
  subject: string;
  role: string;
  audience: TokenAudience;
  tokenVersion?: number | null;
  email?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const claims: AccessTokenClaims = {
    sub: input.subject,
    role: input.role,
    aud: input.audience,
    iss: TOKEN_ISSUER,
    tv: input.tokenVersion ?? 1,
    iat,
    exp: iat + ACCESS_TOKEN_TTL_SECONDS,
    jti: randomUUID(),
    ...(input.email ? { email: input.email } : {}),
  };

  return sign(claims as any, config.jwt.secret, 'HS256');
}

export async function verifyAccessToken(
  token: string,
  expectedAudience?: TokenAudience
): Promise<AccessTokenClaims> {
  const claims = (await verify(
    token,
    config.jwt.secret,
    'HS256'
  )) as unknown as AccessTokenClaims;
  if (
    !claims.sub ||
    !claims.role ||
    !claims.jti ||
    claims.iss !== TOKEN_ISSUER ||
    !Number.isInteger(claims.tv) ||
    claims.tv < 1
  ) {
    throw new Error('Invalid access token claims');
  }
  if (expectedAudience && claims.aud !== expectedAudience) {
    throw new Error('Invalid access token audience');
  }
  return claims;
}

export function matchesTokenVersion(
  tokenVersion: number | null | undefined,
  currentVersion: number | null | undefined
) {
  return tokenVersion === (currentVersion ?? 1);
}
