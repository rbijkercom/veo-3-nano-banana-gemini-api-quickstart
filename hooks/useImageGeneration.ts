import { useState, useCallback } from 'react';
import { ImageGenerationService } from '@/lib/imageGeneration';

export interface UseImageGenerationOptions {
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: string) => void;
  fallbackImageUrl?: string;
}

export function useImageGeneration(options: UseImageGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(`[useImageGeneration] ${logMessage}`);
    setGenerationLogs((prev) => [...prev, logMessage]);
  }, []);

  const clearLogs = useCallback(() => {
    setGenerationLogs([]);
  }, []);

  const generateImage = useCallback(
    async (
      prompt: string,
      imageFile?: File | null,
      updatedImageSrc?: string,
    ) => {
      if (!prompt.trim()) return;

      console.log('[useImageGeneration] Starting image generation process');
      setIsGenerating(true);
      setGenerationLogs([]);

      const service = new ImageGenerationService(addLog);

      try {
        let useBase64 = false;
        let base64Data = '';
        let mimeType = '';

        // Determine image source priority: generated > uploaded > none
        if (updatedImageSrc && updatedImageSrc.startsWith('data:')) {
          addLog('🔄 Using last generated image for iterative editing...');

          const [header, data] = updatedImageSrc.split(',');
          const mimeMatch = header.match(/data:([^;]+)/);

          useBase64 = true;
          base64Data = data;
          mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        } else if (imageFile) {
          addLog('📱 Using uploaded image for generation...');
        } else {
          addLog('❌ No image available for generation');
          addLog('📱 Please upload an image first');
          throw new Error('Please upload an image before generating');
        }

        // Log image details
        if (useBase64) {
          addLog(
            `🖼️ Image type: ${mimeType}, Size: ${(
              (base64Data.length * 0.75) /
              1024 /
              1024
            ).toFixed(2)}MB (base64)`,
          );
        } else if (imageFile) {
          addLog(
            `🖼️ Image type: ${imageFile.type}, Size: ${(
              imageFile.size /
              1024 /
              1024
            ).toFixed(2)}MB`,
          );
        }

        const result = await service.generateImage({
          prompt,
          imageFile,
          base64Data: useBase64 ? base64Data : undefined,
          mimeType: useBase64 ? mimeType : undefined,
          useIterativeEditing: useBase64,
        });

        if (result.success && result.imageUrl) {
          options.onSuccess?.(result.imageUrl);
        } else {
          throw new Error(result.error || 'Generation failed');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('[useImageGeneration] Error generating image:', error);

        if (options.fallbackImageUrl) {
          addLog('🔄 Loading fallback demo image...');
          options.onSuccess?.(options.fallbackImageUrl);
          addLog('📷 Demo showcase loaded');
        } else {
          options.onError?.(errorMessage);
        }
      } finally {
        console.log('[useImageGeneration] Image generation process completed');
        setIsGenerating(false);
      }
    },
    [addLog, options],
  );

  return {
    isGenerating,
    generationLogs,
    generateImage,
    clearLogs,
  };
}
