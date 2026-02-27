'use client';

import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
}

export default function OptimizedImage({
  quality = 75,
  ...props
}: OptimizedImageProps) {
  return <Image quality={quality} {...props} />;
}
