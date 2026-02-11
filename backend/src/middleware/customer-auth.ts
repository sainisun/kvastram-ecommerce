import { Context, Next } from "hono";
import { verify } from "hono/jwt";
import { config } from "../config";

const JWT_SECRET = config.jwt.secret;

export const verifyCustomer = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Missing or invalid token" }, 401);
  }

  const token = authHeader.split(" ")[1];

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
