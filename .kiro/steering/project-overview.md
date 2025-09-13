# Gemini API Veo 3 & Nano Banana Quickstart - Project Overview

## Application Purpose

This is a Next.js application that serves as a unified studio for creating and editing images and videos using Google's latest Gemini API models including Veo 3, Imagen 4, and Gemini 2.5 Flash Image (nano banana).

## Core Features

### Content Creation Modes

- **Create Image**: Generate images from text prompts using Imagen 4 or Gemini 2.5 Flash Image
- **Edit Image**: Edit existing images based on text prompts using Gemini 2.5 Flash Image
- **Compose Image**: Combine multiple images with text prompts using Gemini 2.5 Flash Image
- **Create Video**: Generate videos from text prompts or initial images using Veo 3

### Key Capabilities

- Seamless navigation between modes after generating content
- Download generated images & videos
- Video trimming directly in the browser
- Drag-and-drop file uploads
- Real-time generation status with rotating loading messages
- Model selection based on current mode
- Iterative editing workflow

## Technical Architecture

### Frontend (Next.js 15 + React 19)

- **Main Page**: `app/page.tsx` - Unified composer interface with mode switching
- **Review Page**: `app/review/page.tsx` - Brand identity showcase with AI-powered editing
- **Layout**: `app/layout.tsx` - Uses Manrope and Source Code Pro fonts

### API Routes

- **Imagen**: `/api/imagen/generate` - Image generation with Imagen 4
- **Gemini**:
  - `/api/gemini/generate` - Image generation with Gemini 2.5 Flash
  - `/api/gemini/edit` - Image editing and composition
- **Veo**:
  - `/api/veo/generate` - Video generation
  - `/api/veo/operation` - Check generation status
  - `/api/veo/download` - Download generated videos

### Key Components

- **Composer**: `components/ui/Composer.tsx` - Main interface for all generation modes
- **VideoPlayer**: `components/ui/VideoPlayer.tsx` - Custom video player with trimming
- **ModelSelector**: `components/ui/ModelSelector.tsx` - Dynamic model selection
- **StarRating**: `components/StarRating.tsx` - User feedback component
- **CommentSection**: `components/CommentSection.tsx` - Community feedback

## Dependencies & Tech Stack

- **Core**: Next.js 15, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI components
- **AI Integration**: @google/genai for Gemini API
- **Media**: react-player, rc-slider for video controls
- **File Handling**: react-dropzone for uploads
- **Icons**: lucide-react

## Environment Requirements

- **GEMINI_API_KEY**: Required for all AI model interactions
- **Paid Tier**: Veo 3, Imagen 4, and Gemini 2.5 Flash Image require Gemini API paid tier

## User Experience Flow

1. User selects creation mode (image/video)
2. Provides text prompt and optional image input
3. Selects appropriate AI model
4. Generates content with real-time status updates
5. Can iterate with editing/composition modes
6. Downloads final results

## Current State

- Fully functional unified studio interface
- Support for all major Gemini API models
- Advanced video player with trimming capabilities
- Brand identity showcase demo with iterative AI editing
- Comprehensive error handling and user feedback
