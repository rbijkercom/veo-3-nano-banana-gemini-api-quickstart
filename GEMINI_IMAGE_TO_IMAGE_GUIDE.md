# Gemini API Image-to-Image Implementation Guide

Quick setup guide for implementing Gemini 2.5 Flash Image (nano banana) for image editing and generation.

## Prerequisites

1. **Gemini API Key**: Get from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Paid Tier Required**: These models require Gemini API paid tier (not free)
3. **Node.js Project** with TypeScript support

## Installation

```bash
npm install @google/genai
```

## Environment Setup

Create `.env` file:

```
GEMINI_API_KEY=your_api_key_here
```

## Basic Implementation

### 1. API Client Setup

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

### 2. Image-to-Image Editing Function

```typescript
export async function editImageWithGemini(
  imageFile: File,
  prompt: string,
): Promise<{ imageBytes: string; mimeType: string }> {
  // Convert image to base64
  const buffer = await imageFile.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // Prepare content for API
  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: imageFile.type || 'image/png',
        data: base64,
      },
    },
  ];

  // Generate with retry logic for rate limits
  let response;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: contents,
      });
      break;
    } catch (error: any) {
      if (error.status === 429 && retryCount < maxRetries - 1) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        retryCount++;
      } else {
        throw error;
      }
    }
  }

  // Extract image from response
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        imageBytes: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }

  throw new Error('No image generated');
}
```

### 3. Next.js API Route Example

```typescript
// app/api/edit-image/route.ts
import { NextResponse } from 'next/server';
import { editImageWithGemini } from './gemini-client';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const prompt = form.get('prompt') as string;
    const imageFile = form.get('image') as File;

    if (!prompt || !imageFile) {
      return NextResponse.json(
        { error: 'Missing prompt or image' },
        { status: 400 },
      );
    }

    const result = await editImageWithGemini(imageFile, prompt);

    return NextResponse.json({ image: result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to edit image' },
      { status: 500 },
    );
  }
}
```

### 4. Frontend Usage

```typescript
// React component example
const handleImageEdit = async (imageFile: File, prompt: string) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('prompt', prompt);

  const response = await fetch('/api/edit-image', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (data.image) {
    // Display the edited image
    const imageUrl = `data:${data.image.mimeType};base64,${data.image.imageBytes}`;
    // Use imageUrl in <img src={imageUrl} />
  }
};
```

## Key Models Available

- **Image Editing**: `gemini-2.5-flash-image-preview` (nano banana)
- **Image Generation**: `imagen-4.0-fast-generate-001` (use `generateImages` method)

## Important Notes

1. **Rate Limits**: Implement exponential backoff for 429 errors
2. **File Size**: Keep images under 20MB
3. **Supported Formats**: PNG, JPEG, WebP, HEIC, HEIF
4. **Billing**: Monitor usage - paid tier required
5. **Error Handling**: Always handle API errors gracefully

## Common Issues

- **429 Rate Limit**: Upgrade to paid tier or implement delays
- **No Image Generated**: Check model name and content format
- **Large Files**: Resize images before sending to API

## Resources

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Image Generation Guide](https://ai.google.dev/gemini-api/docs/imagen)
- [Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
