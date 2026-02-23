import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db';
import { newsletter_subscribers } from '../db/schema';
import { eq } from 'drizzle-orm';

const NewsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const app = new Hono();

app.post('/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const validated = NewsletterSchema.parse(body);

    // Check if already subscribed
    const existing = await db
      .select()
      .from(newsletter_subscribers)
      .where(eq(newsletter_subscribers.email, validated.email))
      .limit(1);

    if (existing.length > 0) {
      return c.json({
        success: true,
        message: "You're already subscribed!",
      });
    }

    // Add new subscriber
    await db.insert(newsletter_subscribers).values({
      id: crypto.randomUUID(),
      email: validated.email,
      status: 'active',
      created_at: new Date(),
    });

    return c.json({
      success: true,
      message: 'Successfully subscribed! Welcome to the inner circle.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: 'Invalid email address',
        },
        400
      );
    }
    console.error('Newsletter subscription error:', error);
    return c.json(
      {
        error: 'Failed to subscribe. Please try again.',
      },
      500
    );
  }
});

export default app;
