import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
// @ts-ignore
import { authenticator } from "otplib";

// --- Configuration ---
const JWT_SECRET = config.jwt.secret;
const JWT_EXPIRES_IN = config.jwt.expiresIn;

// --- Types & Schemas ---

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  twoFactorCode: z.string().optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

export class AuthService {
  /**
   * Authenticate a user and return a JWT token.
   */
  async login(data: LoginInput) {
    // 1. Find user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    const user = result[0];

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // 3. Check 2FA
    if (user.two_factor_enabled) {
      if (!data.twoFactorCode) {
        throw new Error("2FA_REQUIRED");
      }

      if (!user.two_factor_secret) {
        // Should not happen if enabled is true, but safety check
        throw new Error("2FA enabled but secret missing");
      }

      const isValid = authenticator.verify({
        token: data.twoFactorCode,
        secret: user.two_factor_secret,
      });

      if (!isValid) {
        throw new Error("Invalid 2FA Code");
      }
    }

    // 4. Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET as any,
      { expiresIn: JWT_EXPIRES_IN } as any,
    );

    // Return user info (excluding password) and token
    const { password_hash, ...userInfo } = user;
    return { user: userInfo, token };
  }

  /**
   * Register a new admin user (Initial scaffolding).
   */
  async register(data: RegisterInput) {
    // 1. Check if user exists
    const existingResult = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    const existing = existingResult[0];

    if (existing) {
      throw new Error("User already exists");
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(data.password, salt);

    // 3. Create user
    const newUserResult = await db
      .insert(users)
      .values({
        email: data.email,
        password_hash: hash,
        first_name: data.first_name,
        last_name: data.last_name,
        role: "admin",
      })
      .returning();
    const newUser = newUserResult[0];

    // 4. Generate Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET as any,
      { expiresIn: JWT_EXPIRES_IN } as any,
    );

    const { password_hash, ...userInfo } = newUser;
    return { user: userInfo, token };
  }
}

export const authService = new AuthService();
