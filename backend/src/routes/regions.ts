import { Hono } from 'hono';
import { verifyAuth } from '../middleware/auth';
import { zValidator } from '@hono/zod-validator';
import { regionService, RegionSchema } from '../services/region-service';

const regionsRouter = new Hono();

// GET /regions - List all regions
regionsRouter.get('/', async (c) => {
  try {
    const result = await regionService.list();
    return c.json({ regions: result });
  } catch (error: unknown) {
    console.error('Error fetching regions:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// GET /regions/:id - Get single region
regionsRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const region = await regionService.getById(id);
    if (!region) return c.json({ error: 'Region not found' }, 404);
    return c.json({ region });
  } catch (error: unknown) {
    console.error('Error fetching region:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// POST /regions - Create a new region (Protected)
regionsRouter.post(
  '/',
  verifyAuth,
  zValidator('json', RegionSchema),
  async (c) => {
    const data = c.req.valid('json');
    console.log('📝 Creating region:', data);

    try {
      const region = await regionService.create(data);
      console.log('🎉 Region creation complete!');
      return c.json({ region }, 201);
    } catch (error: any) {
      console.error('❌ Error creating region:', error);
      return c.json(
        {
          error: 'Failed to create region',
          message: error.message || String(error),
        },
        500
      );
    }
  }
);

// PUT /regions/:id - Update a region (Protected)
regionsRouter.put(
  '/:id',
  verifyAuth,
  zValidator('json', RegionSchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    console.log('📝 Updating region:', id, data);

    try {
      const updatedRegion = await regionService.update(id, data);
      if (!updatedRegion) return c.json({ error: 'Region not found' }, 404);

      console.log('🎉 Region update complete!');
      return c.json({ region: updatedRegion });
    } catch (error: any) {
      console.error('❌ Error updating region:', error);
      return c.json(
        {
          error: 'Failed to update region',
          message: error.message || String(error),
        },
        500
      );
    }
  }
);

// DELETE /regions/:id - Delete a region (Protected)
regionsRouter.delete('/:id', verifyAuth, async (c) => {
  const id = c.req.param('id');
  try {
    await regionService.delete(id);
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting region:', error);
    return c.json({ error: String(error) }, 500);
  }
});

export default regionsRouter;
