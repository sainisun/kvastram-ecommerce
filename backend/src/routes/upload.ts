import { Hono } from "hono";
import { verifyAuth } from "../middleware/auth";
import * as path from "path";
import { createHash } from "crypto";
import { z } from "zod";
import {
  validateFileUpload,
  isPathWithinUploadDir,
  MAX_FILE_SIZE,
  getUploadDir,
} from "../utils/safe-file-upload";
import { writeFile, mkdir } from "fs/promises";

const uploadRouter = new Hono();

// Allowed file types for documentation purposes
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

// 🔒 FIX-005: Zod schema for robust input validation
// Validates file upload parameters with strict type checking
const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive().max(10 * 1024 * 1024), // Max 10MB for schema, actual limit 5MB
});

type FileUploadInput = z.infer<typeof FileUploadSchema>;

// Use verifiedAuth middleware
uploadRouter.use("*", verifyAuth);

uploadRouter.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // 🔒 FIX-005: Zod schema validation for robust input validation
    const validationResult = FileUploadSchema.safeParse({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });

    if (!validationResult.success) {
      return c.json(
        {
          error: "Invalid file upload parameters",
          details: validationResult.error.errors,
        },
        400,
      );
    }

    // 🔒 FIX-005: Validate file size first (prevent memory exhaustion)
    if (file.size > MAX_FILE_SIZE) {
      return c.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        400,
      );
    }

    // 🔒 FIX-005: Defense-in-depth file validation
    const validation = validateFileUpload(file.name, file.type, file.size);

    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // 🔒 FIX-005: Use cryptographically secure filename
    // User input (file.name) is NOT used in final filename
    const secureFilename = validation.secureFilename!;

    // Get upload directory
    const uploadDir = getUploadDir();

    // 🔒 FIX-005: Construct target path and validate no traversal
    const targetPath = path.join(uploadDir, secureFilename);

    // 🔒 FIX-005: Additional path traversal defense - resolve to absolute and verify
    const resolvedPath = path.resolve(targetPath);
    const resolvedUploadDir = path.resolve(uploadDir);
    const relativePath = path.relative(resolvedUploadDir, resolvedPath);

    // Verify resolved path is still within upload directory
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      console.error("🚨 Path traversal attack detected (resolved path):", {
        filename: file.name,
        secureFilename,
        targetPath,
        resolvedPath,
      });
      return c.json({ error: "Invalid file path" }, 400);
    }

    if (!isPathWithinUploadDir(targetPath, uploadDir)) {
      console.error("🚨 Path traversal attack detected:", {
        filename: file.name,
        secureFilename,
        targetPath,
      });
      return c.json({ error: "Invalid file path" }, 400);
    }

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // 🔒 FIX-005: Additional check - ensure path is not a directory
    try {
      const { stat } = await import("fs/promises");
      const stats = await stat(targetPath);
      if (stats.isDirectory()) {
        return c.json({ error: "Cannot overwrite directory" }, 400);
      }
    } catch (e) {
      // File doesn't exist - safe to proceed
    }

    // Write file
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);
    await writeFile(targetPath, fileBuffer);

    // 🔒 FIX-005: Generate SHA-256 hash for file integrity verification
    const fileHash = createHash("sha256").update(fileBuffer).digest("hex");

    // Construct URL (using secure filename only)
    const protocol = c.req.header("x-forwarded-proto") || "http";
    const host = c.req.header("host") || "localhost";
    const url = `${protocol}://${host}/uploads/${secureFilename}`;

    console.log("✅ File uploaded securely:", {
      originalName: file.name,
      secureFilename,
      size: file.size,
      path: targetPath,
      hash: fileHash,
    });

    return c.json({
      url,
      filename: secureFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      hash: fileHash,
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
