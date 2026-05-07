import { Context } from 'hono';
import { getClientIp } from './client-ip';

type SecurityLogLevel = 'info' | 'warn' | 'error';

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const [localPart, domain] = email.toLowerCase().split('@');
  if (!localPart || !domain) return null;

  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}*@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export function logSecurityEvent(
  level: SecurityLogLevel,
  event: string,
  c: Context,
  details: Record<string, unknown> = {}
) {
  console[level](
    `[Security] ${event} ${JSON.stringify({
      ip: getClientIp(c),
      method: c.req.method,
      path: c.req.path,
      ...details,
    })}`
  );
}
