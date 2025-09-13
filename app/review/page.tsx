'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/star-rating';
import { CommentSection } from '@/components/comment-section';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useImageGeneration } from '@/hooks/useImageGeneration';

export default function ReviewPage() {
  const [selectedOption, setSelectedOption] = useState('');
  const [customAnswer, setCustomAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [clarityRating, setClarityRating] = useState(0);
  const [showClarityQuestion, setShowClarityQuestion] = useState(false);
  const [updatedImageSrc, setUpdatedImageSrc] = useState('');
  const [generateImagePrompt, setGenerateImagePrompt] = useState('');

  // Use custom hooks for image handling
  const {
    uploadedImage,
    uploadedImagePreview,
    isUploading,
    handleImageUpload,
    clearUploadedImage,
  } = useImageUpload();

  const {
    isGenerating: isGeneratingImage,
    generationLogs,
    generateImage,
    clearLogs,
  } = useImageGeneration({
    onSuccess: (imageUrl) => {
      setUpdatedImageSrc(imageUrl);
    },
    onError: (error) => {
      console.error('Image generation failed:', error);
    },
    fallbackImageUrl:
      'https://images.unsplash.com/photo-1710799885122-428e63eff691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGJ1c2luZXNzJTIwd2Vic2l0ZSUyMG1vY2t1cCUyMGRlc2lnbnxlbnwxfHx8fDE3NTc3NTQ5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  });

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

  const handleImageUploadChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleImageUpload(file);

    // Clear any existing generated image when uploading new image
    if (updatedImageSrc && updatedImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(updatedImageSrc);
    }
    setUpdatedImageSrc('');
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateImagePrompt.trim()) return;

    await generateImage(generateImagePrompt, uploadedImage, updatedImageSrc);
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
    };
  }, [updatedImageSrc]);

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
        <div className="grid grid-cols-1 gap-8 mb-8">
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
                        onChange={handleImageUploadChange}
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
                        clearUploadedImage();
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
              </CardHeader>
              <CardContent className="p-6">
                {/* Show both original and generated images side by side when we have a generated image */}
                {updatedImageSrc ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Original Image */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground text-center">
                          Original
                        </h4>
                        <div className="relative">
                          {uploadedImagePreview ? (
                            <img
                              src={uploadedImagePreview}
                              alt="Original brand identity showcase"
                              className="w-full h-auto rounded-lg shadow-lg border-2 border-muted"
                              style={{ width: '100%', height: 'auto' }}
                            />
                          ) : (
                            <div className="w-full h-64 rounded-lg shadow-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/10">
                              <div className="text-center text-muted-foreground">
                                <p className="text-sm">No original image</p>
                                <p className="text-xs">
                                  Upload an image to see comparison
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Generated Image */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-primary text-center">
                          AI Generated
                        </h4>
                        <div className="relative">
                          <img
                            src={updatedImageSrc}
                            alt="AI generated brand identity showcase"
                            className={`w-full h-auto rounded-lg shadow-lg border-2 border-primary transition-opacity duration-500 ${
                              isGeneratingImage ? 'opacity-50' : 'opacity-100'
                            }`}
                            style={{ width: '100%', height: 'auto' }}
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
                    </div>

                    {/* Comparison Actions */}
                    <div className="flex justify-center gap-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Use the generated image as the new base for further editing
                          console.log(
                            '[ReviewPage] Using generated image as new base',
                          );
                        }}
                        disabled={isGeneratingImage}
                      >
                        Continue Editing This Version
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          console.log('[ReviewPage] Clearing generated image');
                          if (
                            updatedImageSrc &&
                            updatedImageSrc.startsWith('blob:')
                          ) {
                            URL.revokeObjectURL(updatedImageSrc);
                          }
                          setUpdatedImageSrc('');
                          clearLogs();
                        }}
                        disabled={isGeneratingImage}
                      >
                        Start Over
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          console.log(
                            '[ReviewPage] Clearing all images and starting fresh',
                          );
                          // Clear generated image
                          if (
                            updatedImageSrc &&
                            updatedImageSrc.startsWith('blob:')
                          ) {
                            URL.revokeObjectURL(updatedImageSrc);
                          }
                          setUpdatedImageSrc('');

                          // Clear uploaded image
                          clearUploadedImage();

                          // Clear logs and prompt
                          clearLogs();
                          setGenerateImagePrompt('');
                        }}
                        disabled={isGeneratingImage}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Single image view when no generated image exists */
                  <div className="flex justify-center">
                    <div className="relative">
                      {uploadedImagePreview ? (
                        <>
                          <ImageWithFallback
                            src={uploadedImagePreview}
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
                        </>
                      ) : (
                        <div className="w-full max-w-2xl h-64 rounded-lg shadow-lg border-2 border-dashed border-muted flex items-center justify-center bg-muted/10">
                          <div className="text-center text-muted-foreground">
                            <p className="text-lg font-medium mb-2">
                              No Image Uploaded
                            </p>
                            <p className="text-sm">
                              Upload an image above to get started
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                          placeholder={
                            !uploadedImage && !updatedImageSrc
                              ? 'Upload an image first to start editing...'
                              : 'e.g., change to blue color scheme, add tech elements, make more minimalist...'
                          }
                          value={generateImagePrompt}
                          onChange={(e) =>
                            setGenerateImagePrompt(e.target.value)
                          }
                          disabled={
                            isGeneratingImage ||
                            (!uploadedImage && !updatedImageSrc)
                          }
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
                              !generateImagePrompt.trim() ||
                              isGeneratingImage ||
                              (!uploadedImage && !updatedImageSrc)
                            }
                            className="flex-1"
                          >
                            {isGeneratingImage
                              ? 'Generating...'
                              : !uploadedImage && !updatedImageSrc
                              ? 'Upload Image First'
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
                                  clearLogs();
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
        <div className="mt-16">
          {/* Debug info */}
          <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-900 p-2 rounded">
            <p>Debug - Current image source:</p>
            <p>
              • Generated: {updatedImageSrc ? 'Yes' : 'No'}{' '}
              {updatedImageSrc && `(${updatedImageSrc.substring(0, 30)}...)`}
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
        </div>
      </div>
    </div>
  );
}
