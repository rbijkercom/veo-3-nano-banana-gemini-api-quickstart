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

    // Handle only the first image file for simplicity
    const imageFiles = form.getAll('imageFiles');
    let imageFile = null;

    if (imageFiles.length > 0 && imageFiles[0] instanceof File) {
      imageFile = imageFiles[0] as File;
    } else {
      const singleImageFile = form.get('imageFile');
      if (singleImageFile && singleImageFile instanceof File) {
        imageFile = singleImageFile;
      }
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 },
      );
    }

    console.log('Simple edit - Processing:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type,
    });

    // Validate file size (10MB limit for better reliability)
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxFileSize) {
      return NextResponse.json(
        {
          error: `Image file too large for simple processing. Maximum size is 10MB. Current size: ${(
            imageFile.size /
            1024 /
            1024
          ).toFixed(2)}MB`,
        },
        { status: 400 },
      );
    }

    // Convert image to base64
    const buf = await imageFile.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');

    // Create a very simple content structure
    const contents = [
      { text: `Please edit this image: ${prompt}` },
      {
        inlineData: {
          mimeType: imageFile.type,
          data: b64,
        },
      },
    ];

    console.log('Simple edit - Sending to Gemini with simplified approach');

    // Single attempt with conservative settings
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: contents,
      generationConfig: {
        temperature: 0.1, // Very low temperature for consistency
        topK: 16,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    });

    console.log('Simple edit - Gemini response received');

    // Process the response
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

    let imageData = null;
    let responseMimeType = 'image/png';

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

    console.log('Simple edit - Success!');

    return NextResponse.json({
      image: {
        imageBytes: imageData,
        mimeType: responseMimeType,
      },
    });
  } catch (error: any) {
    console.error('Simple edit error:', error);

    // Return more specific error messages
    if (error.status === 500) {
      return NextResponse.json(
        {
          error:
            'Gemini service temporarily unavailable. Please try again in a few moments.',
        },
        { status: 500 },
      );
    } else if (error.status === 429) {
      return NextResponse.json(
        {
          error:
            'Rate limit exceeded. Please wait a moment before trying again.',
        },
        { status: 429 },
      );
    } else if (error.status === 400) {
      return NextResponse.json(
        { error: 'Invalid image or prompt. Please check your inputs.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 },
    );
  }
}
