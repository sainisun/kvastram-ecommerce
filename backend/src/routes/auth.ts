import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  authService,
  LoginSchema,
  RegisterSchema,
} from "../services/auth-service";
import { verifyAuth } from "../middleware/auth";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  asyncHandler,
  AuthError,
  NotFoundError,
} from "../middleware/error-handler";
import { successResponse, HttpStatus } from "../utils/api-response";

const authRouter = new Hono<{ Variables: { user: any } }>();

// POST /auth/login
authRouter.post(
  "/login",
  zValidator("json", LoginSchema),
  asyncHandler(async (c) => {
    // Use loose typing for zValidator output due to generic context
    const data = (c.req as any).valid("json");

    try {
      const result = await authService.login(data);
      return successResponse(c, result, "Login successful");
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
    return successResponse(
      c,
      result,
      "Registration successful",
      HttpStatus.CREATED,
    );
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
      .where(eq(users.id, userPayload.id));

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Return safe user object (exclude password and 2fa secret)
    const { password_hash, two_factor_secret, ...safeUser } = user;

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
