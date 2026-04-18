'use client';

import Image, { type ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
}

export default function OptimizedImage({
  alt,
  quality = 75,
  loading,
  sizes,
  ...props
}: OptimizedImageProps) {
  // Default loading behavior: lazy unless explicitly priority
  const resolvedLoading: NonNullable<ImageProps['loading']> =
    loading ?? (props.priority ? 'eager' : 'lazy');

  // Default sizes for responsive images when not provided
  const resolvedSizes = sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // If neither width/height nor fill provided, provide sensible defaults
  const shouldProvideDefaults = !props.fill && props.width === undefined && props.height === undefined;
  const defaultWidth = 400;
  const defaultHeight = 400;

  const finalProps: Omit<ImageProps, 'alt'> = {
    quality,
    loading: resolvedLoading,
    sizes: resolvedSizes,
    ...(shouldProvideDefaults ? { width: defaultWidth, height: defaultHeight } : {}),
    ...props,
  };

  return <Image {...finalProps} alt={alt} />;
}
