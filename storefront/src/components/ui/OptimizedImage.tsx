'use client';

import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
}

export default function OptimizedImage({
  quality = 75,
  loading,
  sizes,
  ...props
}: OptimizedImageProps) {
  // Default loading behavior: lazy unless explicitly priority
  const resolvedLoading = loading ?? (props.priority ? 'eager' : 'lazy');

  // Default sizes for responsive images when not provided
  const resolvedSizes = sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // If neither width/height nor fill provided, provide sensible defaults
  const shouldProvideDefaults = !props.fill && props.width === undefined && props.height === undefined;
  const defaultWidth = 400;
  const defaultHeight = 400;

  const finalProps: ImageProps = {
    quality,
    loading: resolvedLoading as any,
    sizes: resolvedSizes,
    ...(shouldProvideDefaults ? { width: defaultWidth, height: defaultHeight } : {}),
    ...((props as unknown) as ImageProps),
  };

  return <Image {...finalProps} />;
}
