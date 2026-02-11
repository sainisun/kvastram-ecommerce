import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { contacts } from "../db/schema";

const ContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const app = new Hono();

app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validated = ContactSchema.parse(body);
    
    // Save to database
    await db.insert(contacts).values({
      id: crypto.randomUUID(),
      first_name: validated.firstName,
      last_name: validated.lastName,
      email: validated.email,
      message: validated.message,
      created_at: new Date(),
    });
    
    return c.json({ 
      success: true, 
      message: "Message sent successfully! We'll get back to you soon." 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, 400);
    }
    console.error("Contact form error:", error);
    return c.json({ 
      error: "Failed to send message. Please try again." 
    }, 500);
  }
});

export default app;
