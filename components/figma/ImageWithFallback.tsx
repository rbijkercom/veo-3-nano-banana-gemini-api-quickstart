import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackSrc = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1080&h=720&fit=crop',
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Update imgSrc when src prop changes
  useEffect(() => {
    console.log(
      '[ImageWithFallback] Source changed:',
      src.substring(0, 50) + '...',
    );
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    console.log(
      '[ImageWithFallback] Image error, falling back to:',
      fallbackSrc,
    );
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  const handleLoad = () => {
    console.log('[ImageWithFallback] Image loaded successfully');
    setIsLoading(false);
  };

  // For data URLs (base64 images), use regular img tag instead of Next.js Image
  if (imgSrc.startsWith('data:')) {
    console.log('[ImageWithFallback] Using regular img tag for data URL');
    return (
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
        )}
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
    );
  }

  // For regular URLs, use Next.js Image component
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        width={1080}
        height={720}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        priority
        unoptimized={imgSrc.startsWith('blob:')}
      />
    </div>
  );
}
