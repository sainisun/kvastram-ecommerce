import { describe, expect, it, vi } from 'vitest';

const { testMiddleware } = vi.hoisted(() => {
  process.env.JWT_SECRET = 'rf003-integration-test-secret';
  process.env.NODE_ENV = 'test';
  return {
    testMiddleware: async (
      _context: unknown,
      next: () => Promise<void>
    ) => next(),
  };
});

vi.mock('../src/services/tag-application-service', () => ({
  tagApplicationService: {},
}));
vi.mock('../src/middleware/auth', () => ({ verifyAdmin: testMiddleware }));
vi.mock('../src/middleware/audit', () => ({
  auditLog: () => testMiddleware,
}));

import { Hono, type MiddlewareHandler } from 'hono';
import { createTagsRouter } from '../src/routes/tags';
import type { Tag, TagService } from '../src/application/tags/contracts';

const bypassMiddleware: MiddlewareHandler = async (_context, next) => {
  await next();
};

const bypassAudit = () => bypassMiddleware;

function tag(id = 'tag-1'): Tag {
  return {
    id,
    name: 'Textiles',
    slug: 'textiles',
    metadata: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };
}

function makeService(overrides: Partial<TagService> = {}): TagService {
  return {
    list: vi.fn(async () => [tag()]),
    getForAudit: vi.fn(async () => tag()),
    create: vi.fn(async () => tag()),
    update: vi.fn(async () => tag()),
    delete: vi.fn(async () => undefined),
    ...overrides,
  };
}

function createTestApp(service: TagService) {
  const app = new Hono();
  app.route(
    '/tags',
    createTagsRouter({
      service,
      adminMiddleware: bypassMiddleware,
      auditMiddleware: bypassAudit,
    })
  );
  return app;
}

describe('tags route service boundary', () => {
  it('returns tags through the injected service without a database dependency in the route', async () => {
    const service = makeService();
    const response = await createTestApp(service).request('/tags');

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ tags: [{ id: 'tag-1' }] });
    expect(service.list).toHaveBeenCalledOnce();
  });

  it('validates and delegates tag creation through the service', async () => {
    const service = makeService();
    const response = await createTestApp(service).request('/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Textiles', slug: 'textiles' }),
    });

    expect(response.status).toBe(201);
    expect(service.create).toHaveBeenCalledWith({ name: 'Textiles', slug: 'textiles' });
    expect(await response.json()).toMatchObject({ tag: { id: 'tag-1' } });
  });

  it('preserves the not-found response when the service cannot update a tag', async () => {
    const service = makeService({ update: vi.fn(async () => undefined) });
    const response = await createTestApp(service).request('/tags/missing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Tag not found' });
    expect(service.getForAudit).toHaveBeenCalledWith('missing');
    expect(service.update).toHaveBeenCalledWith('missing', { name: 'Updated' });
  });

  it('preserves delete behavior while recording the pre-delete value through the service', async () => {
    const service = makeService();
    const response = await createTestApp(service).request('/tags/tag-1', {
      method: 'DELETE',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(service.getForAudit).toHaveBeenCalledWith('tag-1');
    expect(service.delete).toHaveBeenCalledWith('tag-1');
  });
});
