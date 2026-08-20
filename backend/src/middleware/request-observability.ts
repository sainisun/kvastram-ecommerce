import { randomUUID } from 'node:crypto';
import { createMiddleware } from 'hono/factory';

const SAFE_TRACE_ID = /^[A-Za-z0-9._:-]{1,128}$/;

function resolveRequestId(incoming: string | undefined): string {
  return incoming && SAFE_TRACE_ID.test(incoming) ? incoming : randomUUID();
}

export const requestObservability = createMiddleware(async (c, next) => {
  const startedAt = performance.now();
  const requestId = resolveRequestId(c.req.header('x-debug-trace'));
  c.header('x-request-id', requestId);

  try {
    await next();
  } finally {
    const durationMs = Number((performance.now() - startedAt).toFixed(2));
    const event = {
      event: 'http_request',
      request_id: requestId,
      method: c.req.method,
      path: c.req.path.split('?')[0],
      status: c.res.status,
      duration_ms: durationMs,
    };

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[OBSERVABILITY] ${JSON.stringify(event)}`);
    }
  }
});
