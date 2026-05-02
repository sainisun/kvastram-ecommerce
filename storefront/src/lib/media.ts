const CLOUDINARY_HOSTNAME = 'res.cloudinary.com';

export function isCloudinaryUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === CLOUDINARY_HOSTNAME;
  } catch {
    return false;
  }
}

export function cloudinaryUrlOrNull(value: unknown): string | null {
  return isCloudinaryUrl(value) ? value : null;
}

/**
 * Inject f_auto,q_auto into a Cloudinary URL so the CDN converts HEIC/HEIF
 * (and any other format) to the best format the browser supports (WebP/AVIF/JPEG).
 * Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeCloudinaryUrl(src: string): string {
  if (!isCloudinaryUrl(src)) return src;
  // Already has transformations — insert f_auto,q_auto if not present
  if (src.includes('f_auto') || src.includes('q_auto')) return src;
  return src.replace('/upload/', '/upload/f_auto,q_auto/');
}
