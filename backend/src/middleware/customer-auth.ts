import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { config } from "../config";

const JWT_SECRET = config.jwt.secret;

export const verifyCustomer = async (c: Context, next: Next) => {
  // 🔒 FIX-010: Read token from httpOnly cookie, not Authorization header
  const token = (c as any).cookies?.get("auth_token");

  if (!token) {
    return c.json({ error: "Unauthorized: Missing auth cookie" }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    if (payload.role !== "customer") {
      return c.json({ error: "Unauthorized: internal role mismatch" }, 403);
    }
    c.set("customer", payload);
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
};
