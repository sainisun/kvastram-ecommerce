import { rateLimiter } from "hono-rate-limiter";
import { Context } from "hono";

// Helper to create consistent limiters
const createLimiter = (windowMs: number, limit: number) => {
  return rateLimiter({
    windowMs,
    limit, // Limit each IP to requests per window
    standardHeaders: "draft-7",
    keyGenerator: (c: Context) => {
      const forwarded = c.req.header("x-forwarded-for");
      const realIp = c.req.header("x-real-ip");
      return forwarded ? forwarded.split(",")[0].trim() : realIp || "anonymous";
    },
    handler: (c: Context) => {
      return c.json(
        {
          error: "Too many requests. Please wait a moment before trying again.",
        },
        429,
      );
    },
  });
};

// 1. Auth Limiter (Strict: Login/Register)
// 15 minutes, 5 attempts
export const authLimiter = createLimiter(15 * 60 * 1000, 5);

// 2. Checkout Limiter (Very Strict: Payment/Checkout)
// 1 minute, 3 attempts
export const checkoutLimiter = createLimiter(60 * 1000, 3);

// 3. General Limiter (Browsing/Products/etc)
// 1 minute, 60 requests
export const generalLimiter = createLimiter(60 * 1000, 60);
