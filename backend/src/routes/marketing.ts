import { Hono } from 'hono';
import { verifyAdmin } from '../middleware/auth'; // BUG-010 FIX: was verifyAuth
import { z } from 'zod';
import {
  marketingService,
  CampaignSchema,
  DiscountSchema,
  BaseDiscountSchema,
} from '../services/marketing-service';

const app = new Hono();

// --- CAMPAIGNS ---

// PUBLIC: Get active campaigns for storefront (no auth)
app.get('/campaigns/active', async (c) => {
  try {
    const allCampaigns = await marketingService.getAllCampaigns();
    const now = new Date();
    // Filter to active campaigns within date range
    const activeCampaigns = allCampaigns.filter((campaign: any) => {
      if (!campaign.is_active) return false;
      if (campaign.start_date && new Date(campaign.start_date) > now) return false;
      if (campaign.end_date && new Date(campaign.end_date) < now) return false;
      return true;
    });
    return c.json({ campaigns: activeCampaigns });
  } catch (error: any) {
    return c.json({ campaigns: [] }); // Silent fail for storefront
  }
});

// Get all campaigns (admin)
app.get('/campaigns', verifyAdmin, async (c) => {
  try {
    const allCampaigns = await marketingService.getAllCampaigns();
    return c.json({ campaigns: allCampaigns });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create campaign
app.post('/campaigns', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const validated = CampaignSchema.parse(body);

    const newCampaign = await marketingService.createCampaign(validated);
    return c.json({ campaign: newCampaign }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Update campaign
app.put('/campaigns/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = CampaignSchema.partial().parse(body);

    const updated = await marketingService.updateCampaign(id, validated);
    return c.json({ campaign: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Delete campaign
app.delete('/campaigns/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await marketingService.deleteCampaign(id);
    return c.json({ message: 'Campaign deleted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// --- DISCOUNTS ---

// Get all discounts
app.get('/discounts', verifyAdmin, async (c) => {
  try {
    const allDiscounts = await marketingService.getAllDiscounts();
    return c.json({ discounts: allDiscounts });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create discount
app.post('/discounts', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const validated = DiscountSchema.parse(body);

    const newDiscount = await marketingService.createDiscount(validated);
    return c.json({ discount: newDiscount }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    // Handle unique check fail
    if (error.message.includes('unique constraint'))
      return c.json({ error: 'Discount code already exists' }, 409);
    return c.json({ error: error.message }, 500);
  }
});

// Update discount
app.put('/discounts/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = BaseDiscountSchema.partial().parse(body);

    const updated = await marketingService.updateDiscount(id, validated);
    return c.json({ discount: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Delete discount
app.delete('/discounts/:id', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    await marketingService.deleteDiscount(id);
    return c.json({ message: 'Discount deleted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
