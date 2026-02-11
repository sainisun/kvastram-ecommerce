import { Hono } from "hono";
// @ts-ignore
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { verifyAuth } from "../middleware/auth";

const app = new Hono<{ Variables: { user: any } }>();

// Generate 2FA Secret & QR Code
app.post("/generate", verifyAuth, async (c) => {
  try {
    const userPayload = c.get("user") as any;
    // Fetch full user to get email if needed, or rely on payload
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userPayload.id));

    if (!user) return c.json({ error: "User not found" }, 404);

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, "Kvastram Admin", secret);

    // Save secret but keep enabled=false until verified
    await db
      .update(users)
      .set({ two_factor_secret: secret })
      .where(eq(users.id, user.id));

    const qrCode = await QRCode.toDataURL(otpauth);

    return c.json({ qrCode, secret });
  } catch (error: any) {
    console.error("2FA Generate Error:", error);
    return c.json({ error: "Failed to generate 2FA" }, 500);
  }
});

// Verify OTP and Enable 2FA
app.post("/verify", verifyAuth, async (c) => {
  try {
    const userPayload = c.get("user") as any;
    const { token } = await c.req.json();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userPayload.id));

    if (!user || !user.two_factor_secret) {
      return c.json({ error: "2FA not initialized. Generate first." }, 400);
    }

    const isValid = authenticator.verify({
      token,
      secret: user.two_factor_secret,
    });

    if (isValid) {
      await db
        .update(users)
        .set({ two_factor_enabled: true })
        .where(eq(users.id, user.id));
      return c.json({ success: true, message: "2FA Enabled successfully" });
    } else {
      return c.json({ error: "Invalid OTP code" }, 400);
    }
  } catch (error: any) {
    console.error("2FA Verify Error:", error);
    return c.json({ error: "Verification failed" }, 500);
  }
});

// Disable 2FA
app.post("/disable", verifyAuth, async (c) => {
  try {
    const userPayload = c.get("user") as any;

    // In a real app, require OTP or Password to disable.
    // For now, trusting the auth token (Phase 3 MVP).

    await db
      .update(users)
      .set({ two_factor_enabled: false, two_factor_secret: null })
      .where(eq(users.id, userPayload.id));

    return c.json({ success: true, message: "2FA Disabled" });
  } catch (error: any) {
    return c.json({ error: "Failed to disable 2FA" }, 500);
  }
});

export default app;
