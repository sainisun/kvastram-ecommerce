import { db } from "../db/client";
import { customers } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { sign } from "hono/jwt";
import { z } from "zod";
import { config } from "../config";

const JWT_SECRET = config.jwt.secret;

export const RegisterCustomerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

export const LoginCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const customerAuthService = {
  async register(data: z.infer<typeof RegisterCustomerSchema>) {
    // Check if customer exists
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email.toLowerCase()));

    const password_hash = await bcrypt.hash(data.password, 10);

    if (existing.length > 0) {
      const customer = existing[0];
      if (customer.has_account) {
        throw new Error("Customer already has an account");
      }

      // Upgrade guest to account
      const updated = await db
        .update(customers)
        .set({
          has_account: true,
          password_hash,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          updated_at: new Date(),
        })
        .where(eq(customers.id, customer.id))
        .returning();

      return updated[0];
    } else {
      // Create new customer
      const created = await db
        .insert(customers)
        .values({
          email: data.email.toLowerCase(),
          password_hash,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          has_account: true,
        })
        .returning();

      return created[0];
    }
  },

  async login(data: z.infer<typeof LoginCustomerSchema>) {
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email.toLowerCase()));

    if (
      existing.length === 0 ||
      !existing[0].has_account ||
      !existing[0].password_hash
    ) {
      throw new Error("Invalid email or password");
    }

    const customer = existing[0];
    const valid = await bcrypt.compare(data.password, customer.password_hash!);

    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const token = await sign(
      {
        sub: customer.id,
        role: "customer",
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET,
    ); // 7 days

    return { token, customer };
  },
};
