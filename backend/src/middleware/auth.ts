import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";
import { config } from "../config";

const JWT_SECRET = config.jwt.secret;

/**
 * Extract token from Authorization header or httpOnly cookie
 */
function getToken(c: Context): string | null {
  // First try Authorization header
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  // Fall back to cookie
  return getCookie(c, "admin_token") || null;
}

/**
 * JWT Payload type for authenticated users (extends hono's default)
 */
export interface UserPayload {
  sub: string;  // User ID
  role: string; // User role (admin/customer)
  exp?: number; // Expiration timestamp
}

/**
 * Auth context variables type
 */
export interface AuthContextVariables {
  user: UserPayload;
}

export const verifyAuth = async (c: Context<{ Variables: AuthContextVariables }>, next: Next) => {
  const token = getToken(c);

  if (!token) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    c.set("user", payload as unknown as UserPayload);
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
};

// Admin verification - checks both authentication AND admin role
export const verifyAdmin = async (c: Context<{ Variables: AuthContextVariables }>, next: Next) => {
  const token = getToken(c);

  if (!token) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, "HS256") as unknown as UserPayload;

    // Check if user has admin role
    if (payload.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    c.set("user", payload);
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
};
