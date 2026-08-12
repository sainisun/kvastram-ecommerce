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

function forceSeoSafeImageExtension(src: string): string {
  return src.replace(/\.(heic|heif)(?=$|[?#])/i, '.jpg');
}

export function optimizeCloudinaryUrl(src: string): string {
  if (!isCloudinaryUrl(src)) return src;
  const seoSafeSrc = forceSeoSafeImageExtension(src);
  if (seoSafeSrc.includes('f_auto') || seoSafeSrc.includes('q_auto')) return seoSafeSrc;
  return seoSafeSrc.replace('/upload/', '/upload/f_auto,q_auto/');
}

export function cloudinaryImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!isCloudinaryUrl(src)) return src;
  const seoSafeSrc = forceSeoSafeImageExtension(src);
  return seoSafeSrc.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}
