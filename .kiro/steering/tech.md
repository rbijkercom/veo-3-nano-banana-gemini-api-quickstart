# Technology Stack & Dependencies

## Core Framework

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React version with concurrent features
- **TypeScript 5**: Type-safe development

## Styling & UI

- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library
- **CSS Variables**: Custom properties for theming

## AI & API Integration

- **@google/genai**: Official Google Gemini API client
- **Gemini 2.5 Flash**: Fast image generation and editing
- **Imagen 4**: High-quality image generation
- **Veo 3**: Video generation capabilities

## Media Handling

- **react-player**: Video playback component
- **rc-slider**: Range slider for video trimming
- **react-dropzone**: Drag-and-drop file uploads
- **Canvas API**: Client-side image processing and compression

## Development Tools

- **ESLint**: Code linting with modern config
- **PostCSS**: CSS processing
- **TypeScript Config**: Strict type checking enabled

## Runtime Requirements

- **Node.js**: Latest LTS version recommended
- **Environment Variables**: GEMINI_API_KEY required
- **Paid Tier**: Required for Veo 3, Imagen 4, and Gemini 2.5 Flash Image

## Performance Optimizations

- **Image Compression**: Client-side optimization before API calls
- **Progressive Loading**: Streaming responses for better UX
- **Error Boundaries**: Graceful error handling
- **Retry Logic**: Automatic fallbacks for API failures

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Canvas Support**: Required for image processing
- **File API**: Required for drag-and-drop functionality
- **Fetch API**: Required for API communications
