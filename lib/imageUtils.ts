/**
 * Utility functions for image processing and optimization
 */

export interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image file to reduce size while maintaining quality
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 5,
  quality: number = 0.8,
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions to keep under size limit
      const maxDimension = 2048; // Max width or height
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg', // Always convert to JPEG for better compression
            lastModified: Date.now(),
          });

          const originalSize = file.size;
          const compressedSize = compressedFile.size;
          const compressionRatio = originalSize / compressedSize;

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
          });
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if an image needs compression based on size
 */
export function shouldCompressImage(
  file: File,
  maxSizeMB: number = 5,
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size > maxSizeBytes;
}

/**
 * Validate image file format and size
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported format: ${file.type}. Supported: JPEG, PNG, WebP, GIF`,
    };
  }

  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(
        2,
      )}MB. Maximum: 20MB`,
    };
  }

  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return {
      valid: false,
      error: 'File too small or corrupted',
    };
  }

  return { valid: true };
}
