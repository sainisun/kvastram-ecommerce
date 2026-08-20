import { describe, expect, it } from 'vitest';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  TOKEN_ISSUER,
  issueAccessToken,
  matchesTokenVersion,
  verifyAccessToken,
} from '../src/services/token-lifecycle-service';

describe('token lifecycle service', () => {
  it('issues a versioned, audience-bound token with lifecycle claims', async () => {
    const now = new Date(Date.now() - 60_000);
    const issuedAt = Math.floor(now.getTime() / 1000);
    const token = await issueAccessToken({
      subject: 'customer-1',
      email: 'customer@example.com',
      role: 'customer',
      audience: 'customer',
      tokenVersion: 3,
      now,
    });

    const claims = await verifyAccessToken(token, 'customer');
    expect(claims).toMatchObject({
      sub: 'customer-1',
      email: 'customer@example.com',
      role: 'customer',
      aud: 'customer',
      iss: TOKEN_ISSUER,
      tv: 3,
      iat: issuedAt,
      exp: issuedAt + ACCESS_TOKEN_TTL_SECONDS,
    });
    expect(claims.jti).toEqual(expect.any(String));
  });

  it('rejects a token at the wrong audience boundary', async () => {
    const token = await issueAccessToken({
      subject: 'admin-1',
      role: 'admin',
      audience: 'admin',
      tokenVersion: 1,
    });

    await expect(verifyAccessToken(token, 'customer')).rejects.toThrow(
      'Invalid access token audience'
    );
  });

  it('identifies revoked tokens through a token-version mismatch and permits the current version', () => {
    expect(matchesTokenVersion(4, 5)).toBe(false);
    expect(matchesTokenVersion(5, 5)).toBe(true);
    expect(matchesTokenVersion(1, null)).toBe(true);
  });
});
