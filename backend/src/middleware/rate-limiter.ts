import { rateLimiter } from 'hono-rate-limiter';
import { Context } from 'hono';

// Get environment
const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Helper to create consistent limiters
const createLimiter = (windowMs: number, limit: number) => {
  // Skip rate limiting in test mode, use higher limits in dev
  if (isTest) {
    return rateLimiter({
      windowMs: windowMs * 100, // Much longer window in test
      limit: limit * 100, // Much higher limit in test
      standardHeaders: 'draft-7',
      keyGenerator: (c: Context) => {
        const forwarded = c.req.header('x-forwarded-for');
        const realIp = c.req.header('x-real-ip');
        return forwarded
          ? forwarded.split(',')[0].trim()
          : realIp || 'anonymous';
      },
      handler: (c: Context) => {
        return c.json(
          {
            error:
              'Too many requests. Please wait a moment before trying again.',
          },
          429
        );
      },
    });
  }

  return rateLimiter({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    keyGenerator: (c: Context) => {
      const forwarded = c.req.header('x-forwarded-for');
      const realIp = c.req.header('x-real-ip');
      return forwarded ? forwarded.split(',')[0].trim() : realIp || 'anonymous';
    },
    handler: (c: Context) => {
      return c.json(
        {
          error: 'Too many requests. Please wait a moment before trying again.',
        },
        429
      );
    },
  });
};

// 1. Auth Limiter (Strict: Login/Register)
// Test: 500 requests per 1500 min, Dev: 500 requests per 15 min
export const authLimiter = createLimiter(15 * 60 * 1000, isDev ? 500 : 500);

// 2. Checkout Limiter (Very Strict: Payment/Checkout)
// Test: 300 requests per 100 min, Dev: 50 requests per 1 min
export const checkoutLimiter = createLimiter(60 * 1000, isDev ? 50 : 300);

// 3. General Limiter (Browsing/Products/etc)
// Test: 6000 requests per 100 min, Dev: 500 requests per 1 min
export const generalLimiter = createLimiter(60 * 1000, isDev ? 500 : 6000);

// 4. 🔒 FIX-004: Email Rate Limiter (Strict: Email sending operations)
// Test: 300 requests per 1500 min (10 * 100 = 1000, windowMs * 100 = 1500 min), Dev: 3 requests per 15 min
// Prevents email bombing attacks on resend verification endpoint
export const emailLimiter = createLimiter(15 * 60 * 1000, isDev ? 3 : 10);
