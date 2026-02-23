import { db } from '../db/client';
import { customers } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { z } from 'zod';
import { config } from '../config';
import crypto from 'crypto';
import {
  validatePassword,
  isCommonPassword,
} from '../utils/password-validator';

const JWT_SECRET = config.jwt.secret;

// 🔒 FIX-011: Email verification constants
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// 🔒 Q9: Account Lockout Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate verification token expiry time
 */
export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);
  return expiry;
}

/**
 * Check if account is locked
 */
function isAccountLocked(lockedUntil: Date | null | undefined): boolean {
  if (!lockedUntil) return false;
  return new Date() < new Date(lockedUntil);
}

/**
 * Get lockout error message with remaining time
 */
function getLockoutMessage(lockedUntil: Date): string {
  const remainingMs = new Date(lockedUntil).getTime() - Date.now();
  const minutesRemaining = Math.ceil(remainingMs / 60000);
  return `Account locked. Try again in ${minutesRemaining} minutes.`;
}

/**
 * Increment failed login attempts
 */
async function incrementFailedAttempts(customerId: string): Promise<void> {
  await db
    .update(customers)
    .set({
      failed_login_attempts: sql`${customers.failed_login_attempts} + 1`,
    })
    .where(eq(customers.id, customerId));
}

/**
 * Lock account after max failed attempts
 */
async function lockAccount(customerId: string): Promise<void> {
  const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  await db
    .update(customers)
    .set({
      failed_login_attempts: MAX_FAILED_ATTEMPTS,
      locked_until: lockedUntil,
    })
    .where(eq(customers.id, customerId));
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(customerId: string): Promise<void> {
  await db
    .update(customers)
    .set({
      failed_login_attempts: 0,
      locked_until: null,
    })
    .where(eq(customers.id, customerId));
}

export const RegisterCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      'Password must contain at least one special character'
    ),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

export const LoginCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const customerAuthService = {
  async setupPassword(token: string, password: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.verification_token, token))
      .limit(1);

    if (!customer) {
      throw new Error('Invalid or expired token');
    }

    if (
      customer.verification_expires_at &&
      customer.verification_expires_at < new Date()
    ) {
      throw new Error('Token has expired');
    }

    if (customer.password_hash && customer.password_hash !== '') {
      throw new Error('Password already set');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(
        `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`
      );
    }

    if (isCommonPassword(password)) {
      throw new Error(
        'Password is too common. Please choose a more secure password.'
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [updated] = await db
      .update(customers)
      .set({
        password_hash,
        verification_token: null,
        verification_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id))
      .returning();

    return updated;
  },

  async register(data: z.infer<typeof RegisterCustomerSchema>) {
    // Check if customer exists
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, data.email.toLowerCase()));

    // 🔒 Q10: Validate password strength
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(
        `Password does not meet requirements: ${passwordValidation.errors.join(', ')}`
      );
    }

    // 🔒 Q10: Check for common passwords
    if (isCommonPassword(data.password)) {
      throw new Error(
        'Password is too common. Please choose a more secure password.'
      );
    }

    const password_hash = await bcrypt.hash(data.password, 10);

    if (existing.length > 0) {
      const customer = existing[0];
      if (customer.has_account) {
        throw new Error('Customer already has an account');
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
          failed_login_attempts: 0,
          locked_until: null,
        })
        .where(eq(customers.id, customer.id))
        .returning();

      return updated[0];
    } else {
      // Create new customer
      const verificationToken = generateVerificationToken();
      const verificationExpires = getVerificationExpiry();

      const created = await db
        .insert(customers)
        .values({
          email: data.email.toLowerCase(),
          password_hash,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          has_account: true,
          verification_token: verificationToken,
          verification_expires_at: verificationExpires,
          email_verified: false,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .returning();

      const newCustomer = created[0];

      // Send verification email
      try {
        const { emailService } = await import('./email-service');
        await emailService.sendVerificationEmail({
          email: newCustomer.email!,
          first_name: newCustomer.first_name!,
          token: verificationToken,
        });
      } catch (emailError: unknown) {
        console.error('Failed to send verification email:', emailError);
      }

      return newCustomer;
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
      throw new Error('Invalid email or password');
    }

    const customer = existing[0];

    // 🔒 Q9: Check if account is locked
    if (isAccountLocked(customer.locked_until)) {
      throw new Error(getLockoutMessage(customer.locked_until!));
    }

    const valid = await bcrypt.compare(data.password, customer.password_hash!);

    if (!valid) {
      // Increment failed attempts
      await incrementFailedAttempts(customer.id);

      // Check if we should lock the account
      const newFailedAttempts = (customer.failed_login_attempts || 0) + 1;
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        await lockAccount(customer.id);
        throw new Error(
          getLockoutMessage(new Date(Date.now() + LOCKOUT_DURATION_MS))
        );
      }

      const attemptsRemaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      throw new Error(
        `Invalid credentials. ${attemptsRemaining} attempts remaining before lockout.`
      );
    }

    // 🔒 FIX-011: Check if email is verified AFTER password validation
    if (!customer.email_verified) {
      throw new Error(
        'Please verify your email before logging in. Check your inbox for the verification link.'
      );
    }

    // 🔒 Q9: Reset failed attempts on successful login
    await resetFailedAttempts(customer.id);

    const token = await sign(
      {
        sub: customer.id,
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET
    );

    return { token, customer };
  },

  // 🔒 FIX-011: Email verification methods

  async verifyEmail(token: string) {
    // Find customer with this verification token
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.verification_token, token))
      .limit(1);

    if (!customer) {
      throw new Error('Invalid verification token');
    }

    // Check if token has expired
    if (
      customer.verification_expires_at &&
      customer.verification_expires_at < new Date()
    ) {
      throw new Error('Verification token has expired');
    }

    // Check if already verified
    if (customer.email_verified) {
      throw new Error('Email is already verified');
    }

    // Update customer to verified
    const [updated] = await db
      .update(customers)
      .set({
        email_verified: true,
        verification_token: null,
        verification_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id))
      .returning();

    return updated;
  },

  async resendVerificationEmail(email: string) {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (customer.email_verified) {
      throw new Error('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = getVerificationExpiry();

    // Update customer with new token
    await db
      .update(customers)
      .set({
        verification_token: verificationToken,
        verification_expires_at: verificationExpires,
        updated_at: new Date(),
      })
      .where(eq(customers.id, customer.id));

    // Send verification email
    try {
      const { emailService } = await import('./email-service');
      await emailService.sendVerificationEmail({
        email: customer.email!,
        first_name: customer.first_name!,
        token: verificationToken,
      });
    } catch (emailError: unknown) {
      console.error('Failed to send verification email:', emailError);
      throw new Error('Failed to send verification email');
    }

    return { message: 'Verification email sent' };
  },

  async getVerificationStatus(email: string) {
    const [customer] = await db
      .select({
        email_verified: customers.email_verified,
        has_account: customers.has_account,
      })
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    if (!customer) {
      return null;
    }

    return {
      is_verified: customer.email_verified,
      requires_verification: customer.has_account && !customer.email_verified,
    };
  },

  // 🔒 FIX-010: Get customer by token (for cookie-based auth)
  async getCustomer(token: string) {
    try {
      // Verify and decode the JWT token
      const payload = await verify(token, JWT_SECRET, 'HS256');
      const customerId = payload.sub as string;

      const [customer] = await db
        .select({
          id: customers.id,
          email: customers.email,
          first_name: customers.first_name,
          last_name: customers.last_name,
          phone: customers.phone,
          has_account: customers.has_account,
          email_verified: customers.email_verified,
          created_at: customers.created_at,
        })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (!customer) {
        throw new Error('Customer not found');
      }

      return { customer };
    } catch (error: unknown) {
      throw new Error('Invalid or expired token');
    }
  },

  // Social Login (Google/Facebook)
  async socialLogin({
    provider,
    providerId,
    email,
    name,
    avatar,
  }: {
    provider: 'google' | 'facebook';
    providerId: string;
    email: string;
    name?: string;
    avatar?: string;
  }) {
    // Find or create customer
    let [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email.toLowerCase()))
      .limit(1);

    let isNewUser = false;

    if (!customer) {
      // Create new customer
      const nameParts = (name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      [customer] = await db
        .insert(customers)
        .values({
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          password_hash: `social_${provider}_${Date.now()}`,
          email_verified: true, // Social login verifies email
          has_account: true,
          metadata: {
            provider,
            provider_id: providerId,
            avatar,
          },
        })
        .returning();

      isNewUser = true;
    } else {
      // Update existing customer with social login info
      await db
        .update(customers)
        .set({
          metadata: {
            ...((customer.metadata as Record<string, any>) || {}),
            provider,
            provider_id: providerId,
            avatar,
          },
        })
        .where(eq(customers.id, customer.id));
    }

    // Generate JWT token
    const token = await sign(
      {
        sub: customer.id,
        role: 'customer',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
      },
      JWT_SECRET
    );

    return { token, customer, isNewUser };
  },
};
