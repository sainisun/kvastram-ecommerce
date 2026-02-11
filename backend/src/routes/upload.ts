import { Hono } from "hono";
import { verifyAuth } from "../middleware/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const uploadRouter = new Hono();

// Allowed file types and extensions
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Use verifiedAuth middleware
uploadRouter.use("*", verifyAuth);

uploadRouter.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        400,
      );
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        400,
      );
    }

    // Check file extension
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return c.json(
        {
          error: `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        400,
      );
    }

    // Generate filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${safeName}`;

    // Path to store - targeting storefront public folder for easy access
    const uploadDir = join(process.cwd(), "../storefront/public/uploads");

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    const buffer = await file.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(buffer));

    // Return URL accessible via Storefront
    const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3002";
    const url = `${storefrontUrl}/uploads/${filename}`;

    return c.json({
      url,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("❌ Upload error:", error);
    console.error("Stack:", error.stack);
    return c.json(
      { error: "Failed to upload file", details: error.message },
      500,
    );
  }
});

export default uploadRouter;
