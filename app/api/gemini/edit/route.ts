import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const prompt = (form.get('prompt') as string) || '';

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // Handle multiple image files
    const imageFiles = form.getAll('imageFiles');
    console.log('Received imageFiles from form:', imageFiles.length);
    console.log(
      'Image file details:',
      imageFiles.map((f, i) => ({
        index: i,
        name: f instanceof File ? f.name : 'not-file',
        type: f instanceof File ? f.type : typeof f,
      })),
    );

    const contents: (
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    )[] = [];

    // Add the prompt as text
    contents.push({ text: prompt });

    // Process each image file
    console.log('Processing image files...');
    for (const imageFile of imageFiles) {
      if (imageFile && imageFile instanceof File) {
        console.log(
          `Processing file: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`,
        );

        // Validate file size (20MB limit for Gemini)
        const maxFileSize = 20 * 1024 * 1024; // 20MB
        if (imageFile.size > maxFileSize) {
          console.error(`File too large: ${imageFile.size} bytes`);
          return NextResponse.json(
            {
              error: `Image file too large. Maximum size is 20MB. Current size: ${(
                imageFile.size /
                1024 /
                1024
              ).toFixed(2)}MB`,
            },
            { status: 400 },
          );
        }

        // Validate MIME type
        const supportedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',
        ];
        if (!supportedTypes.includes(imageFile.type)) {
          console.error(`Unsupported file type: ${imageFile.type}`);
          return NextResponse.json(
            {
              error: `Unsupported image format: ${imageFile.type}. Supported formats: JPEG, PNG, WebP, GIF`,
            },
            { status: 400 },
          );
        }

        try {
          const buf = await imageFile.arrayBuffer();
          const b64 = Buffer.from(buf).toString('base64');

          // Validate base64 conversion
          if (!b64 || b64.length === 0) {
            throw new Error('Failed to convert image to base64');
          }

          contents.push({
            inlineData: {
              mimeType: imageFile.type,
              data: b64,
            },
          });

          console.log(
            `Successfully processed: ${imageFile.name}, base64 length: ${b64.length}`,
          );
        } catch (conversionError) {
          console.error(
            `Error processing file ${imageFile.name}:`,
            conversionError,
          );
          return NextResponse.json(
            { error: `Failed to process image file: ${imageFile.name}` },
            { status: 400 },
          );
        }
      }
    }
    console.log('Total contents after processing:', contents.length);

    // Handle single image (backward compatibility)
    const singleImageFile = form.get('imageFile');
    if (
      singleImageFile &&
      singleImageFile instanceof File &&
      contents.length === 1
    ) {
      const buf = await singleImageFile.arrayBuffer();
      const b64 = Buffer.from(buf).toString('base64');
      contents.push({
        inlineData: {
          mimeType: singleImageFile.type || 'image/png',
          data: b64,
        },
      });
    }

    // Handle base64 image (for generated images)
    const imageBase64 = (form.get('imageBase64') as string) || undefined;
    const imageMimeType = (form.get('imageMimeType') as string) || undefined;

    console.log('Base64 image handling:', {
      hasImageBase64: !!imageBase64,
      imageMimeType,
      contentsLength: contents.length,
      base64Length: imageBase64?.length || 0,
    });

    if (imageBase64) {
      // Clean and validate base64 data
      let cleaned = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;

      // Remove any whitespace or invalid characters
      cleaned = cleaned.replace(/\s/g, '');

      // Validate base64 format
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(cleaned)) {
        console.error('Invalid base64 format detected');
        return NextResponse.json(
          { error: 'Invalid base64 image data format' },
          { status: 400 },
        );
      }

      // Check if base64 data is too large (Gemini has limits)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes (base64 is ~33% larger)
      const estimatedSize = (cleaned.length * 3) / 4;
      if (estimatedSize > maxSize) {
        console.error('Base64 image too large:', estimatedSize);
        return NextResponse.json(
          {
            error:
              'Image too large for processing. Please use a smaller image.',
          },
          { status: 400 },
        );
      }

      console.log('Base64 validation passed:', {
        cleanedLength: cleaned.length,
        estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2),
      });

      contents.push({
        inlineData: {
          mimeType: imageMimeType || 'image/png',
          data: cleaned,
        },
      });
      console.log(
        'Added base64 image to contents, new length:',
        contents.length,
      );
    }

    if (contents.length < 2) {
      return NextResponse.json(
        { error: 'No images provided for editing' },
        { status: 400 },
      );
    }

    // Try different approaches if we encounter issues
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    let lastError;
    let originalContents = [...contents]; // Keep a copy of original contents

    // First, try with the standard model
    while (retryCount < maxRetries) {
      try {
        console.log(
          `Attempt ${retryCount + 1} with gemini-2.5-flash-image-preview`,
        );
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: contents,
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          },
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.error('Gemini API error:', {
          status: error.status,
          message: error.message,
          retryCount,
          contentsLength: contents.length,
          imageCount: contents.filter((c) => 'inlineData' in c).length,
        });

        if (error.status === 429 && retryCount < maxRetries - 1) {
          // Rate limited, wait and retry
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(
            `Rate limited, waiting ${waitTime}ms before retry ${
              retryCount + 1
            }`,
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          retryCount++;
        } else if (error.status === 500 && retryCount < maxRetries - 1) {
          // Internal server error - try with a simpler approach
          console.log('Trying with simplified prompt and approach...');

          // Try different strategies on each retry
          if (retryCount === 0) {
            // First retry: Simplify the prompt
            const imageContents = originalContents.filter(
              (c) => 'inlineData' in c,
            );
            if (imageContents.length > 0) {
              contents = [
                {
                  text: `Edit this image based on the following request: ${prompt}`,
                },
                imageContents[0], // Only use the first image
              ];
            }
          } else if (retryCount === 1) {
            // Second retry: Even simpler prompt
            const imageContents = originalContents.filter(
              (c) => 'inlineData' in c,
            );
            if (imageContents.length > 0) {
              contents = [
                { text: `Modify this image: ${prompt.substring(0, 100)}` }, // Truncate prompt
                imageContents[0],
              ];
            }
          }

          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
        } else if (error.status === 400) {
          // Bad request - likely invalid input
          console.error('Gemini bad request error:', error.message);
          return NextResponse.json(
            {
              error:
                'Invalid request. Please check your image format and prompt.',
            },
            { status: 400 },
          );
        } else {
          break; // Exit retry loop for other errors
        }
      }
    }

    // If all retries failed, return appropriate error
    if (!response && lastError) {
      if (lastError.status === 500) {
        console.error('Gemini internal error after all retries', {
          errorMessage: lastError.message,
          contentsLength: contents.length,
          imageCount: contents.filter((c) => 'inlineData' in c).length,
        });
        return NextResponse.json(
          {
            error:
              'Image processing failed after multiple attempts. This could be due to image complexity, format issues, or temporary service problems. Please try with a different image or try again later.',
          },
          { status: 500 },
        );
      } else {
        throw lastError; // Re-throw if not a 500 error
      }
    }

    // Process the response to extract the image
    let imageData = null;
    let responseMimeType = 'image/png';

    console.log('Gemini API response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      hasContent: !!response.candidates?.[0]?.content,
      hasParts: !!response.candidates?.[0]?.content?.parts,
      partsLength: response.candidates?.[0]?.content?.parts?.length || 0,
    });

    if (
      !response.candidates ||
      !response.candidates[0] ||
      !response.candidates[0].content ||
      !response.candidates[0].content.parts
    ) {
      console.error('Invalid Gemini API response structure:', response);
      return NextResponse.json(
        { error: 'Invalid response from Gemini API' },
        { status: 500 },
      );
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        console.log('Generated text:', part.text);
      } else if (part.inlineData) {
        imageData = part.inlineData.data;
        responseMimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: responseMimeType,
      },
    });
  } catch (error) {
    console.error('Error editing image with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to edit image' },
      { status: 500 },
    );
  }
}
