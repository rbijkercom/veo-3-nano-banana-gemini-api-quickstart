import {
  compressImage,
  shouldCompressImage,
  validateImageFile,
} from './imageUtils';

export interface ImageGenerationOptions {
  prompt: string;
  imageFile?: File | null;
  base64Data?: string;
  mimeType?: string;
  useIterativeEditing?: boolean;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ImageGenerationService {
  private addLog: (message: string) => void;

  constructor(logCallback: (message: string) => void) {
    this.addLog = logCallback;
  }

  async generateImage(
    options: ImageGenerationOptions,
  ): Promise<ImageGenerationResult> {
    const { prompt, imageFile, base64Data, mimeType, useIterativeEditing } =
      options;

    try {
      // Prepare the enhanced prompt based on context
      const enhancedPrompt = this.createEnhancedPrompt(
        prompt,
        useIterativeEditing,
        !!imageFile,
      );

      this.addLog('🤖 Sending request to Gemini 2.5 Flash Image...');
      this.addLog(`📝 Prompt: "${enhancedPrompt.substring(0, 100)}..."`);

      // Prepare form data
      const formData = await this.prepareFormData(
        enhancedPrompt,
        imageFile,
        base64Data,
        mimeType,
      );

      // Add delay to prevent rapid requests
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Try main API first, then fallback
      let response = await fetch('/api/gemini/edit', {
        method: 'POST',
        body: formData,
      });

      // Fallback to simple API if main fails with 500
      if (!response.ok && response.status === 500) {
        this.addLog('🔄 Main API failed, trying simplified approach...');
        response = await fetch('/api/gemini/edit-simple', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          this.addLog('✅ Fallback API succeeded!');
        }
      }

      this.addLog(`📡 API response status: ${response.status}`);

      if (!response.ok) {
        const errorMessage = await this.handleApiError(response);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      this.addLog('✅ Gemini image generation successful!');

      if (result.image && result.image.imageBytes) {
        this.addLog('🎨 Processing generated image...');
        const imageUrl = `data:${result.image.mimeType};base64,${result.image.imageBytes}`;
        this.addLog('🎉 New brand showcase ready!');
        return { success: true, imageUrl };
      } else {
        throw new Error('No image data received from Gemini');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.addLog(`❌ Generation failed: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  private createEnhancedPrompt(
    prompt: string,
    useIterativeEditing: boolean,
    hasUploadedImage: boolean,
  ): string {
    if (useIterativeEditing) {
      return `Continue editing this brand identity showcase image that was previously modified. Apply these additional changes: ${prompt}. Keep all existing modifications and the overall professional appearance. Maintain the current layout, branding consistency, typography, and visual hierarchy. Keep the same dimensions and aspect ratio.`;
    } else if (hasUploadedImage) {
      return `Edit this uploaded brand identity showcase image. Keep the overall layout, branding consistency, and professional appearance. Only modify these specific elements: ${prompt}. Maintain clean modern business website design, proper typography, and visual hierarchy. Keep the same dimensions and aspect ratio.`;
    } else {
      return `Edit this brand identity showcase image. Keep the overall layout, branding consistency, and professional appearance. Only modify these specific elements: ${prompt}. Maintain clean modern business website design, proper typography, and visual hierarchy. Keep the same dimensions and aspect ratio.`;
    }
  }

  private async prepareFormData(
    prompt: string,
    imageFile?: File | null,
    base64Data?: string,
    mimeType?: string,
  ): Promise<FormData> {
    const formData = new FormData();
    formData.append('prompt', prompt);

    if (base64Data && mimeType) {
      // Try to convert base64 back to File for better compatibility
      try {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const file = new File([blob], 'generated-image.png', {
          type: mimeType,
        });
        formData.append('imageFiles', file);
      } catch (conversionError) {
        // Fallback to base64 approach
        formData.append('imageBase64', base64Data);
        formData.append('imageMimeType', mimeType);
      }
    } else if (imageFile) {
      formData.append('imageFiles', imageFile);
    }

    return formData;
  }

  private async handleApiError(response: Response): Promise<string> {
    const errorText = await response.text();
    let errorData: { error?: string } = {};

    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }

    const errorMessage =
      errorData.error || response.statusText || 'Unknown error';
    this.addLog(`❌ Gemini API error (${response.status}): ${errorMessage}`);

    // Provide specific error guidance
    if (response.status === 500) {
      this.addLog(
        '💡 This might be due to image complexity or temporary service issues',
      );
      this.addLog('🔄 Try with a simpler image or wait a moment and try again');
    } else if (response.status === 400) {
      this.addLog(
        '💡 Check that your image is in a supported format (JPEG, PNG, WebP, GIF)',
      );
    } else if (response.status === 429) {
      this.addLog(
        '💡 Rate limit reached - please wait a moment before trying again',
      );
    }

    return `Gemini API error: ${errorMessage}`;
  }
}
