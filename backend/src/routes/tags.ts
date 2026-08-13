import { Hono, type MiddlewareHandler } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verifyAdmin } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import type { TagService } from '../application/tags/contracts';
import { tagApplicationService } from '../services/tag-application-service';

const TagSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

type AuditMiddlewareFactory = (
  entity: string,
  action: string
) => MiddlewareHandler;

export interface TagsRouterDependencies {
  service?: TagService;
  adminMiddleware?: MiddlewareHandler;
  auditMiddleware?: AuditMiddlewareFactory;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function createTagsRouter({
  service = tagApplicationService,
  adminMiddleware = verifyAdmin,
  auditMiddleware = auditLog,
}: TagsRouterDependencies = {}) {
  const tagsRouter = new Hono();

  tagsRouter.get('/', async (c) => {
    try {
      return c.json({ tags: await service.list() });
    } catch (error: unknown) {
      console.error('Error fetching tags:', error);
      return c.json({ error: 'Failed to fetch tags' }, 500);
    }
  });

  tagsRouter.post(
    '/',
    adminMiddleware,
    auditMiddleware('tag', 'tag.create'),
    zValidator('json', TagSchema),
    async (c) => {
      try {
        return c.json({ tag: await service.create(c.req.valid('json')) }, 201);
      } catch (error: unknown) {
        return c.json({ error: errorMessage(error, 'Failed to create tag') }, 500);
      }
    }
  );

  tagsRouter.put(
    '/:id',
    adminMiddleware,
    auditMiddleware('tag', 'tag.update'),
    zValidator('json', TagSchema.partial()),
    async (c) => {
      const id = c.req.param('id');
      try {
        const oldValue = await service.getForAudit(id);
        c.set('auditOldValue' as never, oldValue as never);
        const updatedTag = await service.update(id, c.req.valid('json'));

        if (!updatedTag) return c.json({ error: 'Tag not found' }, 404);
        return c.json({ tag: updatedTag });
      } catch (error: unknown) {
        return c.json({ error: errorMessage(error, 'Failed to update tag') }, 500);
      }
    }
  );

  tagsRouter.delete(
    '/:id',
    adminMiddleware,
    auditMiddleware('tag', 'tag.delete'),
    async (c) => {
      const id = c.req.param('id');
      try {
        const oldValue = await service.getForAudit(id);
        c.set('auditOldValue' as never, oldValue as never);
        await service.delete(id);
        return c.json({ success: true });
      } catch (error: unknown) {
        return c.json({ error: errorMessage(error, 'Failed to delete tag') }, 500);
      }
    }
  );

  return tagsRouter;
}

export default createTagsRouter();
