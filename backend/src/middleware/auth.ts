import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { config } from "../config";

const JWT_SECRET = config.jwt.secret;

export const verifyAuth = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");
    c.set("user", payload);
    await next();
  } catch (error) {
    return c.json({ error: "Unauthorized: Invalid token" }, 401);
  }
};

// Admin verification - checks both authentication AND admin role
export const verifyAdmin = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await verify(token, JWT_SECRET, "HS256");

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
