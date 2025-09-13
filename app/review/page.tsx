'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/StarRating';
import { CommentSection } from '@/components/CommentSection';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import {
  compressImage,
  shouldCompressImage,
  validateImageFile,
} from '@/lib/imageUtils';

export default function ReviewPage() {
  const [selectedOption, setSelectedOption] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [clarityRating, setClarityRating] = useState(0);
  const [showClarityQuestion, setShowClarityQuestion] = useState(false);
  const [updatedImageSrc, setUpdatedImageSrc] = useState('');
  const [generateImagePrompt, setGenerateImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string>('');

  const correctAnswer =
    'Digital marketing and web development services for small businesses';

  const answerOptions = [
    'E-commerce platform',
    'Social media management',
    'Digital marketing services',
    'Web design and development',
    'Business consulting',
    'Something else',
  ];

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedOption ||
      (selectedOption === 'Something else' && !customAnswer.trim())
    ) {
      return;
    }

    const finalAnswer =
      selectedOption === 'Something else' ? customAnswer : selectedOption;
    setUserAnswer(finalAnswer);

    setShowCorrectAnswer(true);
    setTimeout(() => {
      setShowClarityQuestion(true);
    }, 1000);
  };

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    if (option !== 'Something else') {
      setCustomAnswer('');
    }
  };

  const handleClarityRating = (rating: number) => {
    setClarityRating(rating);
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(`[ReviewPage] ${logMessage}`);
    setGenerationLogs((prev) => [...prev, logMessage]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[ReviewPage] Image upload triggered:', file);

    if (!file) return;

    // Validate the file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error('[ReviewPage] File validation failed:', validation.error);
      alert(validation.error);
      return;
    }

    console.log('[ReviewPage] Image upload valid:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });

    let finalFile = file;

    // Compress image if it's too large for optimal processing
    if (shouldCompressImage(file, 5)) {
      // Compress if larger than 5MB
      try {
        console.log('[ReviewPage] Compressing large image...');
        const compressed = await compressImage(file, 5, 0.8);
        finalFile = compressed.file;

        console.log('[ReviewPage] Image compressed:', {
          originalSize: `${(compressed.originalSize / 1024 / 1024).toFixed(
            2,
          )}MB`,
          compressedSize: `${(compressed.compressedSize / 1024 / 1024).toFixed(
            2,
          )}MB`,
          ratio: `${compressed.compressionRatio.toFixed(2)}x`,
        });

        // Show user that compression happened
        if (compressed.compressionRatio > 1.5) {
          alert(
            `Image compressed from ${(
              compressed.originalSize /
              1024 /
              1024
            ).toFixed(2)}MB to ${(
              compressed.compressedSize /
              1024 /
              1024
            ).toFixed(2)}MB for better processing.`,
          );
        }
      } catch (error) {
        console.error('[ReviewPage] Compression failed:', error);
        alert('Failed to compress image. Using original file.');
      }
    }

    setUploadedImage(finalFile);

    // Create preview URL
    const previewUrl = URL.createObjectURL(finalFile);
    setUploadedImagePreview(previewUrl);

    // Clear any existing generated image
    if (updatedImageSrc && updatedImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(updatedImageSrc);
    }
    setUpdatedImageSrc('');

    console.log('[ReviewPage] Image preview created:', previewUrl);
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateImagePrompt.trim()) return;

    console.log('[ReviewPage] Starting image generation process');
    console.log('[ReviewPage] Current state:', {
      hasUploadedImage: !!uploadedImage,
      hasUpdatedImage: !!updatedImageSrc,
      hasPreviewImage: !!uploadedImagePreview,
      prompt: generateImagePrompt,
    });

    setIsGeneratingImage(true);
    setGenerationLogs([]);

    try {
      let imageFile: File | null = null;
      let useBase64 = false;
      let base64Data = '';
      let mimeType = '';

      // Priority: Use last generated image > uploaded image > default image
      // This allows for iterative editing of the same image
      if (updatedImageSrc && updatedImageSrc.startsWith('data:')) {
        addLog('🔄 Using last generated image for iterative editing...');

        // Extract base64 data and mime type from data URL
        const [header, data] = updatedImageSrc.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);

        useBase64 = true;
        base64Data = data;
        mimeType = mimeMatch ? mimeMatch[1] : 'image/png';

        console.log('[ReviewPage] Using last generated image as base64:', {
          mimeType,
          dataLength: base64Data.length,
          isDataUrl: true,
          headerSample: header.substring(0, 50),
          dataSample: data.substring(0, 50) + '...',
          hasComma: updatedImageSrc.includes(','),
        });
      } else if (uploadedImage) {
        addLog('📱 Using uploaded image for generation...');
        imageFile = uploadedImage;
        console.log('[ReviewPage] Using uploaded image:', {
          name: imageFile.name,
          type: imageFile.type,
          size: imageFile.size,
        });
      } else {
        const currentImageSrc =
          uploadedImagePreview ||
          'https://images.unsplash.com/photo-1614029896656-a094f640558d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMHdlYnNpdGUlMjBzY3JlZW5zaG90fGVufDF8fHx8MTc1Nzc1MTgwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';

        addLog('📱 Starting image generation with Gemini...');
        addLog('🔗 Fetching default brand showcase image...');
        console.log('[ReviewPage] Fetching image from URL:', currentImageSrc);

        // Fetch the current image
        const imageResponse = await fetch(currentImageSrc);
        if (!imageResponse.ok) {
          throw new Error(
            `Failed to fetch base image: ${imageResponse.status}`,
          );
        }

        addLog('✅ Base image retrieved successfully');
        addLog('📤 Preparing image for Gemini API...');

        const imageBlob = await imageResponse.blob();
        imageFile = new File([imageBlob], 'brand-showcase.jpg', {
          type: imageBlob.type || 'image/jpeg',
        });
        console.log('[ReviewPage] Created file from blob:', {
          type: imageFile.type,
          size: imageFile.size,
        });
      }

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

      // Enhanced prompt for Gemini - contextual based on image source
      let enhancedPrompt: string;

      if (updatedImageSrc && updatedImageSrc.startsWith('data:')) {
        // Iterative editing prompt
        enhancedPrompt = `Continue editing this brand identity showcase image that was previously modified. Apply these additional changes: ${generateImagePrompt}. Keep all existing modifications and the overall professional appearance. Maintain the current layout, branding consistency, typography, and visual hierarchy. Keep the same dimensions and aspect ratio.`;
        addLog('🔄 Using iterative editing prompt for generated image');
      } else if (uploadedImage) {
        // User uploaded image prompt
        enhancedPrompt = `Edit this uploaded brand identity showcase image. Keep the overall layout, branding consistency, and professional appearance. Only modify these specific elements: ${generateImagePrompt}. Maintain clean modern business website design, proper typography, and visual hierarchy. Keep the same dimensions and aspect ratio.`;
        addLog('📱 Using custom image editing prompt');
      } else {
        // Default image prompt
        enhancedPrompt = `Edit this brand identity showcase image. Keep the overall layout, branding consistency, and professional appearance. Only modify these specific elements: ${generateImagePrompt}. Maintain clean modern business website design, proper typography, and visual hierarchy. Keep the same dimensions and aspect ratio.`;
        addLog('🖼️ Using default image editing prompt');
      }

      addLog('🤖 Sending request to Gemini 2.5 Flash Image...');
      addLog(`📝 Prompt: "${enhancedPrompt.substring(0, 100)}..."`);
      console.log('[ReviewPage] Full prompt:', enhancedPrompt);

      // Prepare form data for Gemini API
      const formData = new FormData();
      formData.append('prompt', enhancedPrompt);

      if (useBase64) {
        // Validate base64 data
        if (!base64Data || base64Data.length === 0) {
          throw new Error('Invalid base64 data extracted from generated image');
        }

        // Try to convert base64 back to File as a more reliable approach
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

          // Use file approach instead of base64 for better compatibility
          formData.append('imageFiles', file);
          console.log('[ReviewPage] FormData prepared with converted file:', {
            promptLength: enhancedPrompt.length,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          });
        } catch (conversionError) {
          console.warn(
            '[ReviewPage] File conversion failed, falling back to base64:',
            conversionError,
          );
          // Fallback to base64 approach
          formData.append('imageBase64', base64Data);
          formData.append('imageMimeType', mimeType);
          console.log('[ReviewPage] FormData prepared with base64 fallback:', {
            promptLength: enhancedPrompt.length,
            mimeType,
            base64Length: base64Data.length,
          });
        }
      } else if (imageFile) {
        // Use file approach for uploaded/fetched images
        formData.append('imageFiles', imageFile);
        console.log('[ReviewPage] FormData prepared with file:', {
          promptLength: enhancedPrompt.length,
          imageFileName: imageFile.name,
          imageFileSize: imageFile.size,
        });
      }

      addLog('📡 Sending request to /api/gemini/edit...');
      console.log('[ReviewPage] Request details:', {
        useBase64,
        hasImageFile: !!imageFile,
        formDataKeys: Array.from(formData.keys()),
      });

      // Add a small delay to prevent rapid successive requests
      await new Promise((resolve) => setTimeout(resolve, 500));

      let response = await fetch('/api/gemini/edit', {
        method: 'POST',
        body: formData,
      });

      // If the main API fails with 500, try the simple fallback
      if (!response.ok && response.status === 500) {
        addLog('🔄 Main API failed, trying simplified approach...');
        console.log('[ReviewPage] Trying fallback API due to 500 error');

        response = await fetch('/api/gemini/edit-simple', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          addLog('✅ Fallback API succeeded!');
        }
      }

      console.log('[ReviewPage] API response status:', response.status);
      addLog(`📡 API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ReviewPage] API error response:', errorText);

        let errorData: { error?: string } = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        const errorMessage =
          errorData.error || response.statusText || 'Unknown error';
        addLog(`❌ Gemini API error (${response.status}): ${errorMessage}`);

        // Provide more specific error messages based on status
        if (response.status === 500) {
          addLog(
            '💡 This might be due to image complexity or temporary service issues',
          );
          addLog('🔄 Try with a simpler image or wait a moment and try again');
        } else if (response.status === 400) {
          addLog(
            '💡 Check that your image is in a supported format (JPEG, PNG, WebP, GIF)',
          );
        } else if (response.status === 429) {
          addLog(
            '💡 Rate limit reached - please wait a moment before trying again',
          );
        }

        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      const result = await response.json();
      console.log('[ReviewPage] API success response:', {
        hasImage: !!result.image,
        hasImageBytes: !!result.image?.imageBytes,
        mimeType: result.image?.mimeType,
      });

      addLog('✅ Gemini image generation successful!');

      if (result.image && result.image.imageBytes) {
        addLog('🎨 Processing generated image...');
        const imageUrl = `data:${result.image.mimeType};base64,${result.image.imageBytes}`;
        console.log(
          '[ReviewPage] Setting updatedImageSrc to:',
          imageUrl.substring(0, 100) + '...',
        );
        setUpdatedImageSrc(imageUrl);
        addLog('🎉 New brand showcase ready!');
        console.log(
          '[ReviewPage] Generated image URL created, length:',
          imageUrl.length,
        );
      } else {
        console.error('[ReviewPage] No image data in response:', result);
        throw new Error('No image data received from Gemini');
      }
    } catch (error) {
      console.error('[ReviewPage] Error generating image with Gemini:', error);
      addLog(
        `❌ Generation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      addLog('🔄 Loading fallback demo image...');

      // Fallback to demo image
      setUpdatedImageSrc(
        'https://images.unsplash.com/photo-1710799885122-428e63eff691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGJ1c2luZXNzJTIwd2Vic2l0ZSUyMG1vY2t1cCUyMGRlc2lnbnxlbnwxfHx8fDE3NTc3NTQ5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      );
      addLog('📷 Demo showcase loaded');
    } finally {
      console.log('[ReviewPage] Image generation process completed');
      setIsGeneratingImage(false);
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 2;

    if (
      selectedOption &&
      (selectedOption !== 'Something else' || customAnswer.trim())
    ) {
      completed++;
    }

    if (clarityRating > 0) {
      completed++;
    }

    return {
      completed,
      total,
      percentage: (completed / total) * 100,
    };
  };

  const progress = calculateProgress();
  const isSurveyComplete = progress.completed === progress.total;

  useEffect(() => {
    return () => {
      if (updatedImageSrc && updatedImageSrc.startsWith('blob:')) {
        console.log(
          '[ReviewPage] Cleaning up updated image URL:',
          updatedImageSrc,
        );
        URL.revokeObjectURL(updatedImageSrc);
      }
      if (uploadedImagePreview && uploadedImagePreview.startsWith('blob:')) {
        console.log(
          '[ReviewPage] Cleaning up uploaded image preview URL:',
          uploadedImagePreview,
        );
        URL.revokeObjectURL(uploadedImagePreview);
      }
    };
  }, [updatedImageSrc, uploadedImagePreview]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-2">Did you get it?</h1>
          <p className="text-muted-foreground">
            Help us understand how clear this Brand Identity Showcase is to
            potential customers
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          {/* Left Column - Brand Identity Showcase (60%) */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Brand Identity Showcase</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          {uploadedImage ? 'Change Image' : 'Upload Your Image'}
                        </span>
                      </Button>
                    </label>
                  </div>
                  {uploadedImage && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        console.log('[ReviewPage] Clearing uploaded image');
                        setUploadedImage(null);
                        if (uploadedImagePreview) {
                          URL.revokeObjectURL(uploadedImagePreview);
                        }
                        setUploadedImagePreview('');
                        setUpdatedImageSrc('');
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {uploadedImage && (
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {uploadedImage.name} (
                    {(uploadedImage.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                )}
                {/* Debug info */}
                <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900 p-2 rounded">
                  <p>Debug - Current image source:</p>
                  <p>
                    • Generated: {updatedImageSrc ? 'Yes' : 'No'}{' '}
                    {updatedImageSrc &&
                      `(${updatedImageSrc.substring(0, 30)}...)`}
                  </p>
                  <p>
                    • Uploaded: {uploadedImagePreview ? 'Yes' : 'No'}{' '}
                    {uploadedImagePreview &&
                      `(${uploadedImagePreview.substring(0, 30)}...)`}
                  </p>
                  <p>
                    • Using:{' '}
                    {updatedImageSrc
                      ? 'Generated'
                      : uploadedImagePreview
                      ? 'Uploaded'
                      : 'Default'}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <ImageWithFallback
                      src={
                        updatedImageSrc ||
                        uploadedImagePreview ||
                        'https://images.unsplash.com/photo-1614029896656-a094f640558d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBidXNpbmVzcyUyMHdlYnNpdGUlMjBzY3JlZW5zaG90fGVufDF8fHx8MTc1Nzc1MTgwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
                      }
                      alt="Business website Brand Identity Showcase showing logo, tagline and intro message"
                      className={`w-full h-auto rounded-lg shadow-lg transition-opacity duration-500 ${
                        isGeneratingImage ? 'opacity-50' : 'opacity-100'
                      }`}
                    />
                    {isGeneratingImage && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                          <p className="text-muted-foreground">
                            Generating Brand Identity Showcase...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Interactive Questions (40%) */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Let's Test Your Understanding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* First Question */}
                <div>
                  <h3 className="mb-4">
                    What do you think this company offers?
                  </h3>
                  <form onSubmit={handleAnswerSubmit} className="space-y-4">
                    {!showCorrectAnswer && (
                      <div className="space-y-3">
                        {answerOptions.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="radio"
                              id={`option-${index}`}
                              name="answer-option"
                              value={option}
                              checked={selectedOption === option}
                              onChange={(e) =>
                                handleOptionChange(e.target.value)
                              }
                              className="w-4 h-4 text-primary border-2 border-muted-foreground focus:ring-primary focus:ring-2"
                            />
                            <label
                              htmlFor={`option-${index}`}
                              className="cursor-pointer flex-1"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Custom text input for "Something else" */}
                    {selectedOption === 'Something else' &&
                      !showCorrectAnswer && (
                        <div className="mt-3">
                          <Input
                            placeholder="Please specify what you think they offer..."
                            value={customAnswer}
                            onChange={(e) => setCustomAnswer(e.target.value)}
                            className="ml-6"
                          />
                        </div>
                      )}

                    {!showCorrectAnswer && (
                      <Button
                        type="submit"
                        disabled={
                          !selectedOption ||
                          (selectedOption === 'Something else' &&
                            !customAnswer.trim())
                        }
                      >
                        Submit Answer
                      </Button>
                    )}
                  </form>
                </div>

                {/* Correct Answer Reveal */}
                {showCorrectAnswer && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Your Answer</Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{userAnswer}</p>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">
                          What we actually want to say:
                        </Badge>
                      </div>
                      <p className="font-medium">{correctAnswer}</p>
                    </div>
                  </div>
                )}

                {/* Clarity Rating Question */}
                {showClarityQuestion && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="text-center">
                      <h3 className="mb-4">
                        Is this clear from the Brand Identity Showcase?
                      </h3>
                      <StarRating
                        rating={clarityRating}
                        onRatingChange={handleClarityRating}
                      />
                    </div>
                  </div>
                )}

                {/* Generate Image Question */}
                {showClarityQuestion && clarityRating > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <h3 className="mb-4">Generate Image</h3>
                      <p className="text-muted-foreground mb-4">
                        Modify the current brand showcase using AI. Describe
                        specific changes you want to make (e.g., "change colors
                        to blue and green", "add a tech startup feel", "make the
                        design more modern").
                      </p>
                      {updatedImageSrc &&
                        updatedImageSrc.startsWith('data:') && (
                          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              🔄 Iterative editing: Using your last generated
                              image as the base for further modifications
                            </p>
                          </div>
                        )}
                      {!updatedImageSrc && uploadedImage && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            ✨ Using your uploaded image: {uploadedImage.name}
                          </p>
                        </div>
                      )}
                      {!updatedImageSrc && !uploadedImage && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📷 Using default demo image. Upload your own image
                            above for better results!
                          </p>
                        </div>
                      )}
                      <form
                        onSubmit={handleGenerateImage}
                        className="space-y-4"
                      >
                        <Input
                          placeholder="e.g., change to blue color scheme, add tech elements, make more minimalist..."
                          value={generateImagePrompt}
                          onChange={(e) =>
                            setGenerateImagePrompt(e.target.value)
                          }
                          disabled={isGeneratingImage}
                          className="w-full"
                        />

                        {/* Generation Logs */}
                        {generationLogs.length > 0 && (
                          <div className="bg-muted rounded-lg p-4 max-h-40 overflow-y-auto">
                            <h4 className="mb-2 font-medium">
                              Generation Log:
                            </h4>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              {generationLogs.map((log, index) => (
                                <div key={index} className="font-mono">
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={
                              !generateImagePrompt.trim() || isGeneratingImage
                            }
                            className="flex-1"
                          >
                            {isGeneratingImage
                              ? 'Generating...'
                              : updatedImageSrc &&
                                updatedImageSrc.startsWith('data:')
                              ? 'Continue Editing'
                              : 'Generate'}
                          </Button>
                          {updatedImageSrc &&
                            updatedImageSrc.startsWith('data:') && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  console.log(
                                    '[ReviewPage] Resetting to original image',
                                  );
                                  setUpdatedImageSrc('');
                                  addLog(
                                    '🔄 Reset to original image for fresh editing',
                                  );
                                }}
                                disabled={isGeneratingImage}
                              >
                                Reset
                              </Button>
                            )}
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Community Feedback Section - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Community Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {!isSurveyComplete ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Finish survey and see what others think
                </p>
              </div>
            ) : (
              <CommentSection />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
