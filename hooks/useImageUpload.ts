import { useState, useCallback, useEffect } from 'react';
import { ImageUploadService } from '@/lib/imageUpload';

export function useImageUpload() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const uploadService = new ImageUploadService();

  const handleImageUpload = useCallback(async (file: File) => {
    console.log('[useImageUpload] Image upload triggered:', file);
    setIsUploading(true);

    try {
      const result = await uploadService.processImageUpload(file);

      if (result.success && result.data) {
        setUploadedImage(result.data.file);
        setUploadedImagePreview(result.data.previewUrl);
        console.log(
          '[useImageUpload] Image upload successful:',
          result.data.previewUrl,
        );
      } else {
        console.error('[useImageUpload] Upload failed:', result.error);
        alert(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('[useImageUpload] Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearUploadedImage = useCallback(() => {
    console.log('[useImageUpload] Clearing uploaded image');

    if (uploadedImagePreview) {
      uploadService.cleanupPreviewUrl(uploadedImagePreview);
    }

    setUploadedImage(null);
    setUploadedImagePreview('');
  }, [uploadedImagePreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadedImagePreview) {
        uploadService.cleanupPreviewUrl(uploadedImagePreview);
      }
    };
  }, [uploadedImagePreview]);

  return {
    uploadedImage,
    uploadedImagePreview,
    isUploading,
    handleImageUpload,
    clearUploadedImage,
  };
}
