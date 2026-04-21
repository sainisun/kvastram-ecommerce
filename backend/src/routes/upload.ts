import { Hono } from 'hono';
import { verifyAuth } from '../middleware/auth';
import { createHash } from 'crypto';
import { z } from 'zod';
import {
  validateFileUpload,
  getMaxFileSize,
  IMAGE_MAX_FILE_SIZE,
  VIDEO_MAX_FILE_SIZE,
} from '../utils/safe-file-upload';
import {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
} from '../utils/cloudinary';

const uploadRouter = new Hono();

const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().int().positive().max(VIDEO_MAX_FILE_SIZE),
});

uploadRouter.use('*', verifyAuth);

uploadRouter.post('/', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const validationResult = FileUploadSchema.safeParse({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });

    if (!validationResult.success) {
      return c.json(
        { error: 'Invalid file upload parameters', details: validationResult.error.errors },
        400
      );
    }

    const maxFileSize = getMaxFileSize(file.name, file.type);
    if (file.size > maxFileSize) {
      return c.json(
        { error: `File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB` },
        400
      );
    }

    const validation = validateFileUpload(file.name, file.type, file.size);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Determine resource type from mime type
    const isVideo = file.type.startsWith('video/');
    const folder = isVideo ? 'kvastram/products/videos' : 'kvastram/products/images';

    // Upload to Cloudinary
    const result = isVideo
      ? await uploadVideoToCloudinary(file, { folder })
      : await uploadImageToCloudinary(file, { folder });

    // Generate hash for integrity verification
    const buffer = await file.arrayBuffer();
    const fileHash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');

    console.log('✅ File uploaded to Cloudinary:', {
      originalName: file.name,
      publicId: result.publicId,
      size: file.size,
      type: file.type,
      hash: fileHash,
    });

    return c.json({
      url: result.secureUrl,
      publicId: result.publicId,
      filename: result.publicId,
      originalName: file.name,
      size: file.size,
      type: file.type,
      hash: fileHash,
      limits: {
        image_max_size: IMAGE_MAX_FILE_SIZE,
        video_max_size: VIDEO_MAX_FILE_SIZE,
      },
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return c.json({ error: 'Failed to upload file', details: error.message }, 500);
  }
});

export default uploadRouter;
