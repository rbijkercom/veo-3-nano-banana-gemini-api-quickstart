import {
  compressImage,
  shouldCompressImage,
  validateImageFile,
} from './imageUtils';

export interface UploadedImageData {
  file: File;
  previewUrl: string;
  wasCompressed: boolean;
  compressionRatio?: number;
}

export interface ImageUploadResult {
  success: boolean;
  data?: UploadedImageData;
  error?: string;
}

export class ImageUploadService {
  async processImageUpload(file: File): Promise<ImageUploadResult> {
    console.log('[ImageUploadService] Processing image upload:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error(
        '[ImageUploadService] File validation failed:',
        validation.error,
      );
      return { success: false, error: validation.error };
    }

    let finalFile = file;
    let wasCompressed = false;
    let compressionRatio: number | undefined;

    // Compress image if it's too large for optimal processing
    if (shouldCompressImage(file, 5)) {
      try {
        console.log('[ImageUploadService] Compressing large image...');
        const compressed = await compressImage(file, 5, 0.8);
        finalFile = compressed.file;
        wasCompressed = true;
        compressionRatio = compressed.compressionRatio;

        console.log('[ImageUploadService] Image compressed:', {
          originalSize: `${(compressed.originalSize / 1024 / 1024).toFixed(
            2,
          )}MB`,
          compressedSize: `${(compressed.compressedSize / 1024 / 1024).toFixed(
            2,
          )}MB`,
          ratio: `${compressed.compressionRatio.toFixed(2)}x`,
        });

        // Show user that compression happened if significant
        if (compressed.compressionRatio > 1.5) {
          const message = `Image compressed from ${(
            compressed.originalSize /
            1024 /
            1024
          ).toFixed(2)}MB to ${(
            compressed.compressedSize /
            1024 /
            1024
          ).toFixed(2)}MB for better processing.`;
          // Note: In a real app, you might want to use a toast notification instead of alert
          alert(message);
        }
      } catch (error) {
        console.error('[ImageUploadService] Compression failed:', error);
        // Continue with original file if compression fails
      }
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(finalFile);
    console.log('[ImageUploadService] Image preview created:', previewUrl);

    return {
      success: true,
      data: {
        file: finalFile,
        previewUrl,
        wasCompressed,
        compressionRatio,
      },
    };
  }

  cleanupPreviewUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
      console.log('[ImageUploadService] Cleaning up preview URL:', url);
      URL.revokeObjectURL(url);
    }
  }
}
