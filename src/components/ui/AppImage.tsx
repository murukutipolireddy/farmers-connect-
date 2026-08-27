'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';

interface AppImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  [key: string]: any;
}

const AppImage = memo(function AppImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 80,
  placeholder = 'empty',
  blurDataURL,
  fill = false,
  sizes,
  onClick,
  fallbackSrc = '/assets/images/no_image.png',
  loading = 'lazy',
  unoptimized = true,
  style,
  ...props
}: AppImageProps) {
  const [hasError, setHasError] = useState(false);
  const effectiveSrc = hasError ? fallbackSrc : (src || fallbackSrc);

  if (fill) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={effectiveSrc}
          alt={alt || 'Image'}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          style={{ objectFit: 'cover', ...style }}
          className={className}
          priority={priority}
          loading={priority ? undefined : loading}
          unoptimized={unoptimized}
          onError={() => setHasError(true)}
          onClick={onClick}
          {...props}
        />
      </div>
    );
  }

  return (
    <Image
      src={effectiveSrc}
      alt={alt || 'Image'}
      width={width || 400}
      height={height || 300}
      sizes={sizes}
      style={style}
      className={className}
      priority={priority}
      loading={priority ? undefined : loading}
      unoptimized={unoptimized}
      onError={() => setHasError(true)}
      onClick={onClick}
      {...props}
    />
  );
});

AppImage.displayName = 'AppImage';

export default AppImage;