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
