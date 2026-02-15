import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { setCookie, deleteCookie } from "hono/cookie";
import {
  authService,
  LoginSchema,
  RegisterSchema,
} from "../services/auth-service";
import { verifyAuth, AuthContextVariables } from "../middleware/auth";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  asyncHandler,
  AuthError,
  NotFoundError,
} from "../middleware/error-handler";
import { successResponse, HttpStatus } from "../utils/api-response";
import { config } from "../config";
import { serializeUser } from "../utils/safe-user";

const authRouter = new Hono<{ Variables: AuthContextVariables }>();

// Cookie configuration for httpOnly JWT storage
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.server.env === "production",
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

// POST /auth/login
authRouter.post(
  "/login",
  zValidator("json", LoginSchema),
  asyncHandler(async (c) => {
    // Use loose typing for zValidator output due to generic context
    const data = (c.req as any).valid("json");

    try {
      const result = await authService.login(data);
      // Set JWT in httpOnly cookie for XSS protection
      setCookie(c, "admin_token", result.token, COOKIE_OPTIONS);
      // Return user data only (token is in cookie)
      return successResponse(c, { user: result.user }, "Login successful");
    } catch (error: any) {
      if (error.message === "Invalid email or password") {
        throw new AuthError("Invalid credentials");
      }
      if (error.message === "2FA_REQUIRED") {
        // Custom response for 2FA flow - adhering to existing contract
        return c.json(
          {
            success: false,
            message: "Two-Factor Authentication Required",
            require2fa: true,
          },
          HttpStatus.FORBIDDEN,
        );
      }
      if (error.message === "Invalid 2FA Code") {
        throw new AuthError("Invalid 2FA Code");
      }
      throw error;
    }
  }),
);

// POST /auth/register
authRouter.post(
  "/register",
  zValidator("json", RegisterSchema),
  asyncHandler(async (c) => {
    const data = (c.req as any).valid("json");
    const result = await authService.register(data);
    // Set JWT in httpOnly cookie for XSS protection
    setCookie(c, "admin_token", result.token, COOKIE_OPTIONS);
    // Return user data only (token is in cookie)
    return successResponse(
      c,
      { user: result.user },
      "Registration successful",
      HttpStatus.CREATED,
    );
  }),
);

// POST /auth/logout - Clear the httpOnly cookie
authRouter.post(
  "/logout",
  asyncHandler(async (c) => {
    deleteCookie(c, "admin_token", {
      path: "/",
      httpOnly: true,
      secure: config.server.env === "production",
      sameSite: "strict",
    });
    return successResponse(c, null, "Logout successful");
  }),
);

// GET /auth/me - Get current user profile for Settings
authRouter.get(
  "/me",
  verifyAuth,
  asyncHandler(async (c) => {
    const userPayload = c.get("user") as any;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userPayload.sub));

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // 🔒 FIX-007: Use serializeUser utility to ensure password_hash is never leaked
    const safeUser = serializeUser(user);

    return successResponse(
      c,
      {
        user: safeUser,
        two_factor_enabled: user.two_factor_enabled,
      },
      "Profile retrieved successfully",
    );
  }),
);

export default authRouter;
