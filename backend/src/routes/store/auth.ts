/**
 * Store Authentication Routes
 * 
 * These routes handle customer authentication including:
 * - Customer registration with email verification
 * - Customer login with httpOnly cookie (FIX-010)
 * - Logout (clears auth cookie)
 * - Email verification (FIX-011)
 * - Legal pages retrieval (FIX-008)
 * 
 * Security Features:
 * - JWT stored in httpOnly, Secure cookies (XSS protection)
 * - Email verification required before full access
 * - Password hashing with bcrypt
 * - Token-based verification with expiry
 * 
 * @module store/auth
 */

import { Hono, Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  customerAuthService,
  LoginCustomerSchema,
  RegisterCustomerSchema,
} from "../../services/customer-auth-service";
import { z } from "zod";
import { config } from "../../config";

const storeAuthRouter = new Hono();

// 🔒 FIX-010: Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.server.env === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

// Helper function to set auth cookie
function setAuthCookie(c: Context, token: string) {
  (c as any).cookies.set("auth_token", token, COOKIE_OPTIONS);
}

// Helper function to clear auth cookie
function clearAuthCookie(c: Context) {
  (c as any).cookies.set("auth_token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

// Validation schemas for verification routes
const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

const ResendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// 🔒 FIX-008: Legal pages endpoint
storeAuthRouter.get("/legal", async (c) => {
  const slug = c.req.query("slug");
  if (!slug) {
    return c.json({ error: "Slug is required" }, 400);
  }

  const { pages } = await import("../../db/schema");
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../../db/client");

  const [pageData] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);

  if (!pageData || !pageData.is_visible) {
    return c.json({ error: "Page not found" }, 404);
  }

  return c.json({ page: pageData });
});

// 🔒 FIX-011: Email verification routes

// POST /store/auth/verify-email - Verify email with token
storeAuthRouter.post(
  "/verify-email",
  zValidator("json", VerifyEmailSchema),
  async (c) => {
    const { token } = c.req.valid("json");

    try {
      const customer = await customerAuthService.verifyEmail(token);
      return c.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  },
);

// POST /store/auth/resend-verification - Resend verification email
storeAuthRouter.post(
  "/resend-verification",
  zValidator("json", ResendVerificationSchema),
  async (c) => {
    const { email } = c.req.valid("json");

    try {
      const result = await customerAuthService.resendVerificationEmail(email);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 400);
    }
  },
);

// GET /store/auth/verification-status - Check if email is verified
storeAuthRouter.get("/verification-status", async (c) => {
  const email = c.req.query("email");

  if (!email) {
    return c.json({ error: "Email is required" }, 400);
  }

  const status = await customerAuthService.getVerificationStatus(email);

  if (!status) {
    return c.json({ error: "Customer not found" }, 404);
  }

  return c.json(status);
});

storeAuthRouter.post(
  "/register",
  zValidator(
    "json",
    RegisterCustomerSchema,
    (result, c) => {
      if (!result.success) {
        // Format Zod errors as plain JSON
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          errors[path] = err.message;
        });
        return c.json(
          {
            success: false,
            message: "Validation failed",
            errors,
          },
          400,
        );
      }
    },
  ),
  async (c) => {
    const data = c.req.valid("json");
    try {
      const customer = await customerAuthService.register(data);

      // 🔒 FIX-011: Do NOT auto-login after registration
      // User must verify their email before logging in
      return c.json({
        customer,
        success: true,
        message: "Registration successful! Please check your email to verify your account."
      });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 400);
    }
  },
);

storeAuthRouter.post(
  "/login",
  zValidator("json", LoginCustomerSchema),
  async (c) => {
    const data = c.req.valid("json");
    try {
      const result = await customerAuthService.login(data);

      // 🔒 FIX-010: Set httpOnly cookie
      setAuthCookie(c, result.token);

      // Return token for legacy support, but also set cookie
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 401);
    }
  },
);

// 🔒 FIX-010: Logout route - clears the cookie
storeAuthRouter.post("/logout", async (c) => {
  clearAuthCookie(c);
  return c.json({ success: true, message: "Logged out successfully" });
});

// 🔒 FIX-010: Get current auth status (reads from cookie)
storeAuthRouter.get("/me", async (c) => {
  const token = (c as any).cookies?.get("auth_token") || c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  try {
    const result = await customerAuthService.getCustomer(token);
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 401);
  }
});

export default storeAuthRouter;
