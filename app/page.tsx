'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { Upload, Film, Image as ImageIcon } from 'lucide-react';
import { Composer } from '@/components/composer';
import { VideoPlayer } from '@/components/video-player';
import DebugSection from '@/components/ui/DebugSection';

type VeoOperationName = string | null;

type StudioMode =
  | 'create-image'
  | 'edit-image'
  | 'compose-image'
  | 'create-video';

const POLL_INTERVAL_MS = 5000;

const VeoStudio: React.FC = () => {
  const [mode, setMode] = useState<StudioMode>('create-image');
  const [prompt, setPrompt] = useState(''); // Video or image prompt
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [selectedModel, setSelectedModel] = useState('veo-3.0-generate-001');

  // Update selected model when mode changes
  useEffect(() => {
    if (mode === 'create-video') {
      setSelectedModel('veo-3.0-generate-001');
    } else if (mode === 'edit-image' || mode === 'compose-image') {
      setSelectedModel('gemini-2.5-flash-image-preview');
    } else if (mode === 'create-image') {
      if (
        !selectedModel.includes('gemini') &&
        !selectedModel.includes('imagen')
      ) {
        setSelectedModel('gemini-2.5-flash-image-preview');
      }
    }
  }, [mode, selectedModel]);

  // Image generation prompts
  const [imagePrompt, setImagePrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [composePrompt, setComposePrompt] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [multipleImageFiles, setMultipleImageFiles] = useState<File[]>([]);
  const [imagenBusy, setImagenBusy] = useState(false);
  const [geminiBusy, setGeminiBusy] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // data URL

  // Debug multipleImageFiles state
  useEffect(() => {
    console.log(
      '[DEBUG] multipleImageFiles state changed:',
      multipleImageFiles.length,
      multipleImageFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    );
  }, [multipleImageFiles]);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (imageFile) {
      objectUrl = URL.createObjectURL(imageFile);
      setUploadedImageUrl(objectUrl);
    } else {
      setUploadedImageUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageFile]);

  const [operationName, setOperationName] = useState<VeoOperationName>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoBlobRef = useRef<Blob | null>(null);
  const trimmedBlobRef = useRef<Blob | null>(null);

  const trimmedUrlRef = useRef<string | null>(null);
  const originalVideoUrlRef = useRef<string | null>(null);

  // Friendly model label for UI
  const modelLabel = useMemo(() => {
    const cleaned = selectedModel
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/preview/gi, '')
      .trim();
    return cleaned || selectedModel;
  }, [selectedModel]);

  // Rotating loading messages containing model name
  const loadingMessages = useMemo(() => {
    if (mode === 'create-video') {
      return [
        `${modelLabel} is crafting your idea...`,
        'Generating keyframes and motion...',
        'Enhancing detail and lighting...',
        'Color grading and encoding...',
        'Almost there...',
        'One more step...',
        'Kidding, this takes a while...',
        'Haha sorry',
        'Did you know? That Trees are the second most photographed object in the world after the Sun.',
        "That's why we need to make sure your video is perfect.",
        "We're working on it...",
        'Hang on a sec...',
        'Almost done...',
        'One more step...',
        'Kidding, this takes a while...',
        'Haha sorry',
        'So How are you doing?',
        'Crazy what progress can be made in a few seconds?',
        'Let me check on it...',
        'Okay almost done...',
      ];
    }
    return [
      `${modelLabel} is crafting your image...`,
      'Composing layout and subject...',
      'Applying style and color...',
      'Refining edges and textures...',
      'Almost there...',
      'One more step...',
      'Kidding, this takes a while...',
      'Haha sorry',
      'So How are you doing?',
      'Crazy what progress can be made in a few seconds?',
      'Let me check on it...',
      'Okay almost done...',
      "I promise I'm working on it...",
    ];
  }, [mode, modelLabel]);

  const [loadingIndex, setLoadingIndex] = useState(0);

  // Single flag for whether we are actively generating
  const isLoadingUI = useMemo(
    () => isGenerating || imagenBusy || geminiBusy,
    [isGenerating, imagenBusy, geminiBusy],
  );

  // Advance loading message while any generation is happening
  useEffect(() => {
    if (!isLoadingUI) {
      setLoadingIndex(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingIndex((i) => (i + 1) % loadingMessages.length);
    }, 2200);
    return () => clearInterval(id);
  }, [isLoadingUI, loadingMessages]);

  const canStart = useMemo(() => {
    if (mode === 'create-video') {
      if (!prompt.trim()) return false;
      // For create-video, image is optional (can be text-to-video or image-to-video)
      return true;
    } else if (mode === 'create-image') {
      return imagePrompt.trim() && !imagenBusy && !geminiBusy;
    } else if (mode === 'edit-image') {
      return editPrompt.trim() && (imageFile || generatedImage) && !geminiBusy;
    } else if (mode === 'compose-image') {
      // Allow composition with existing image + new images, or just new images
      const hasExistingImage = imageFile || generatedImage;
      const hasNewImages = multipleImageFiles.length > 0;
      return (
        composePrompt.trim() &&
        (hasExistingImage || hasNewImages) &&
        !geminiBusy
      );
    }
    return false;
  }, [
    mode,
    prompt,
    imageFile,
    generatedImage,
    imagePrompt,
    editPrompt,
    composePrompt,
    multipleImageFiles,
    imagenBusy,
    geminiBusy,
  ]);

  const resetAll = () => {
    setPrompt('');
    setNegativePrompt('');
    setAspectRatio('16:9');
    setImagePrompt('');
    setEditPrompt('');
    setComposePrompt('');
    setImageFile(null);
    setMultipleImageFiles([]);
    setGeneratedImage(null);
    setOperationName(null);
    setIsGenerating(false);
    setVideoUrl(null);
    setImagenBusy(false);
    setGeminiBusy(false);
    if (videoBlobRef.current) {
      URL.revokeObjectURL(URL.createObjectURL(videoBlobRef.current));
      videoBlobRef.current = null;
    }
    if (trimmedUrlRef.current) {
      URL.revokeObjectURL(trimmedUrlRef.current);
      trimmedUrlRef.current = null;
    }
    trimmedBlobRef.current = null;
  };

  // Imagen helper
  const generateWithImagen = useCallback(async () => {
    console.log(
      '[API] Starting Imagen generation with prompt:',
      imagePrompt.substring(0, 100) + '...',
    );
    setImagenBusy(true);
    setGeneratedImage(null);

    const startTime = Date.now();
    try {
      console.log('[API] Sending request to /api/imagen/generate');
      const resp = await fetch('/api/imagen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      const duration = Date.now() - startTime;
      console.log(
        `[API] Imagen API response received in ${duration}ms, status: ${resp.status}`,
      );

      if (!resp.ok) {
        console.error('[API] Imagen API error:', resp.status, resp.statusText);
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('[API] Imagen API response data:', {
        hasImage: !!json?.image?.imageBytes,
        mimeType: json?.image?.mimeType,
        imageSize: json?.image?.imageBytes?.length || 0,
        error: json?.error,
      });

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setGeneratedImage(dataUrl);
        console.log('[SUCCESS] Imagen image generated successfully');
      } else if (json?.error) {
        console.error('[API] Imagen API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e) {
      console.error('[ERROR] Error in generateWithImagen:', e.message);
      alert(`Failed to generate image: ${e.message}`);
    } finally {
      console.log('[DEBUG] Resetting Imagen busy state');
      setImagenBusy(false);
    }
  }, [imagePrompt]);

  // Gemini image generation helper
  const generateWithGemini = useCallback(async () => {
    console.log(
      '[API] Starting Gemini image generation with prompt:',
      imagePrompt.substring(0, 100) + '...',
    );
    setGeminiBusy(true);
    setGeneratedImage(null);

    const startTime = Date.now();
    try {
      console.log('[API] Sending request to /api/gemini/generate');
      const resp = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      const duration = Date.now() - startTime;
      console.log(
        `[API] Gemini generate API response received in ${duration}ms, status: ${resp.status}`,
      );

      if (!resp.ok) {
        console.error('[API] Gemini API error:', resp.status, resp.statusText);
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('[API] Gemini generate API response data:', {
        hasImage: !!json?.image?.imageBytes,
        mimeType: json?.image?.mimeType,
        imageSize: json?.image?.imageBytes?.length || 0,
        error: json?.error,
      });

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setGeneratedImage(dataUrl);
        console.log('[SUCCESS] Gemini image generated successfully');
      } else if (json?.error) {
        console.error('[API] Gemini API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e) {
      console.error('[ERROR] Error in generateWithGemini:', e.message);
      alert(`Failed to generate image: ${e.message}`);
    } finally {
      console.log('[DEBUG] Resetting Gemini busy state');
      setGeminiBusy(false);
    }
  }, [imagePrompt]);

  // Gemini image edit helper
  const editWithGemini = useCallback(async () => {
    console.log(
      '[API] Starting Gemini image edit with prompt:',
      editPrompt.substring(0, 100) + '...',
    );
    console.log('[DEBUG] Edit context:', {
      hasImageFile: !!imageFile,
      hasGeneratedImage: !!generatedImage,
      imageFileName: imageFile?.name,
      imageFileSize: imageFile?.size,
      imageFileType: imageFile?.type,
    });

    setGeminiBusy(true);
    setGeneratedImage(null);

    const startTime = Date.now();
    try {
      const form = new FormData();
      form.append('prompt', editPrompt);

      if (imageFile) {
        form.append('imageFile', imageFile);
        console.log('[DEBUG] Added image file to form data:', imageFile.name);
      } else if (generatedImage) {
        const [meta, b64] = generatedImage.split(',');
        const mime = meta?.split(';')?.[0]?.replace('data:', '') || 'image/png';
        form.append('imageBase64', b64);
        form.append('imageMimeType', mime);
        console.log('[DEBUG] Added base64 image to form data, mime:', mime);
      }

      console.log('[API] Sending request to /api/gemini/edit');
      const resp = await fetch('/api/gemini/edit', {
        method: 'POST',
        body: form,
      });

      const duration = Date.now() - startTime;
      console.log(
        `[API] Gemini edit API response received in ${duration}ms, status: ${resp.status}`,
      );

      if (!resp.ok) {
        console.error(
          '[API] Gemini edit API error:',
          resp.status,
          resp.statusText,
        );
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('[API] Gemini edit API response data:', {
        hasImage: !!json?.image?.imageBytes,
        mimeType: json?.image?.mimeType,
        imageSize: json?.image?.imageBytes?.length || 0,
        error: json?.error,
      });

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setGeneratedImage(dataUrl);
        console.log('[SUCCESS] Gemini image edited successfully');
      } else if (json?.error) {
        console.error('[API] Gemini edit API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e) {
      console.error('[ERROR] Error in editWithGemini:', e.message);
      alert(`Failed to edit image: ${e.message}`);
    } finally {
      console.log('[DEBUG] Resetting Gemini busy state after edit');
      setGeminiBusy(false);
    }
  }, [editPrompt, imageFile, generatedImage]);

  // Gemini image compose helper
  const composeWithGemini = useCallback(async () => {
    console.log(
      '[API] Starting Gemini image compose with prompt:',
      composePrompt.substring(0, 100) + '...',
    );
    console.log('[DEBUG] Compose context:', {
      multipleImageFilesCount: multipleImageFiles.length,
      hasImageFile: !!imageFile,
      hasGeneratedImage: !!generatedImage,
      imageFileNames: multipleImageFiles.map((f) => f.name),
      totalImageSize: multipleImageFiles.reduce((sum, f) => sum + f.size, 0),
    });

    setGeminiBusy(true);
    setGeneratedImage(null);

    const startTime = Date.now();
    try {
      const form = new FormData();
      form.append('prompt', composePrompt);

      // Add newly uploaded images first
      for (const file of multipleImageFiles) {
        form.append('imageFiles', file);
        console.log(
          '[DEBUG] Added image file to compose:',
          file.name,
          file.size,
          'bytes',
        );
      }

      // Include existing image last (if any)
      if (imageFile) {
        form.append('imageFiles', imageFile);
        console.log(
          '[DEBUG] Added existing image file to compose:',
          imageFile.name,
        );
      } else if (generatedImage) {
        // Convert base64 to blob and add as file
        const [meta, b64] = generatedImage.split(',');
        const mime = meta?.split(';')?.[0]?.replace('data:', '') || 'image/png';
        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });

        // Create a File object from the blob
        const existingImageFile = new File([blob], 'existing-image.png', {
          type: mime,
        });
        form.append('imageFiles', existingImageFile);
        console.log(
          '[DEBUG] Added generated image to compose as file, mime:',
          mime,
        );
      }

      console.log('[API] Sending request to /api/gemini/edit for compose');
      const resp = await fetch('/api/gemini/edit', {
        method: 'POST',
        body: form,
      });

      const duration = Date.now() - startTime;
      console.log(
        `[API] Gemini compose API response received in ${duration}ms, status: ${resp.status}`,
      );

      if (!resp.ok) {
        console.error(
          '[API] Gemini compose API error:',
          resp.status,
          resp.statusText,
        );
        throw new Error(`API error: ${resp.status}`);
      }

      const json = await resp.json();
      console.log('[API] Gemini compose API response data:', {
        hasImage: !!json?.image?.imageBytes,
        mimeType: json?.image?.mimeType,
        imageSize: json?.image?.imageBytes?.length || 0,
        error: json?.error,
      });

      if (json?.image?.imageBytes) {
        const dataUrl = `data:${json.image.mimeType};base64,${json.image.imageBytes}`;
        setGeneratedImage(dataUrl);
        console.log('[SUCCESS] Gemini images composed successfully');
      } else if (json?.error) {
        console.error('[API] Gemini compose API returned error:', json.error);
        throw new Error(json.error);
      }
    } catch (e) {
      console.error('[ERROR] Error in composeWithGemini:', e.message);
      alert(`Failed to compose images: ${e.message}`);
    } finally {
      console.log('[DEBUG] Resetting Gemini busy state after compose');
      setGeminiBusy(false);
    }
  }, [composePrompt, multipleImageFiles, imageFile, generatedImage]);

  // Start generation based on current mode
  const startGeneration = useCallback(async () => {
    if (!canStart) return;

    if (mode === 'create-video') {
      console.log('[API] Starting Veo video generation');
      console.log('[DEBUG] Video generation context:', {
        prompt: prompt.substring(0, 100) + '...',
        model: selectedModel,
        negativePrompt: negativePrompt?.substring(0, 50) + '...' || 'none',
        aspectRatio,
        hasImageFile: !!imageFile,
        hasGeneratedImage: !!generatedImage,
        imageFileName: imageFile?.name,
        imageFileSize: imageFile?.size,
      });

      setIsGenerating(true);
      setVideoUrl(null);

      const form = new FormData();
      form.append('prompt', prompt);
      form.append('model', selectedModel);
      if (negativePrompt) form.append('negativePrompt', negativePrompt);
      if (aspectRatio) form.append('aspectRatio', aspectRatio);

      if (imageFile || generatedImage) {
        if (imageFile) {
          form.append('imageFile', imageFile);
          console.log(
            '[DEBUG] Added image file to video generation:',
            imageFile.name,
          );
        } else if (generatedImage) {
          const [meta, b64] = generatedImage.split(',');
          const mime =
            meta?.split(';')?.[0]?.replace('data:', '') || 'image/png';
          form.append('imageBase64', b64);
          form.append('imageMimeType', mime);
          console.log(
            '[DEBUG] Added generated image to video generation, mime:',
            mime,
          );
        }
      }

      const startTime = Date.now();
      try {
        console.log('[API] Sending request to /api/veo/generate');
        const resp = await fetch('/api/veo/generate', {
          method: 'POST',
          body: form,
        });

        const duration = Date.now() - startTime;
        console.log(
          `[API] Veo generate API response received in ${duration}ms, status: ${resp.status}`,
        );

        const json = await resp.json();
        console.log('[API] Veo generate API response data:', {
          hasName: !!json?.name,
          operationName: json?.name,
          error: json?.error,
        });

        setOperationName(json?.name || null);
        if (json?.name) {
          console.log('[SUCCESS] Veo operation started:', json.name);
        }
      } catch (e) {
        console.error('[ERROR] Error in video generation:', e.message);
        setIsGenerating(false);
      }
    } else if (mode === 'create-image') {
      // Use selected model (Imagen or Gemini)
      if (selectedModel.includes('imagen')) {
        await generateWithImagen();
      } else {
        await generateWithGemini();
      }
    } else if (mode === 'edit-image') {
      await editWithGemini();
    } else if (mode === 'compose-image') {
      await composeWithGemini();
    }
  }, [
    canStart,
    mode,
    prompt,
    selectedModel,
    negativePrompt,
    aspectRatio,
    imageFile,
    generatedImage,
    generateWithImagen,
    generateWithGemini,
    editWithGemini,
    composeWithGemini,
  ]);

  // Poll operation until done then download
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pollCount = 0;

    async function poll() {
      if (!operationName || videoUrl) return;

      pollCount++;
      console.log(
        `[POLLING] Checking Veo operation status (attempt ${pollCount}):`,
        operationName,
      );

      try {
        const startTime = Date.now();
        const resp = await fetch('/api/veo/operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: operationName }),
        });

        const duration = Date.now() - startTime;
        console.log(
          `[API] Veo operation status response received in ${duration}ms, status: ${resp.status}`,
        );

        const fresh = await resp.json();
        console.log('[API] Veo operation status data:', {
          done: fresh?.done,
          hasResponse: !!fresh?.response,
          hasGeneratedVideos: !!fresh?.response?.generatedVideos,
          videoCount: fresh?.response?.generatedVideos?.length || 0,
          error: fresh?.error,
        });

        if (fresh?.done) {
          const fileUri = fresh?.response?.generatedVideos?.[0]?.video?.uri;
          console.log(
            '[DEBUG] Video generation completed, fileUri:',
            fileUri ? 'present' : 'missing',
          );

          if (fileUri) {
            console.log('[API] Starting video download from:', fileUri);
            const downloadStartTime = Date.now();

            const dl = await fetch('/api/veo/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uri: fileUri }),
            });

            const downloadDuration = Date.now() - downloadStartTime;
            console.log(
              `[API] Video download response received in ${downloadDuration}ms, status: ${dl.status}`,
            );

            const blob = await dl.blob();
            console.log(
              '[DEBUG] Video blob created, size:',
              blob.size,
              'bytes, type:',
              blob.type,
            );

            videoBlobRef.current = blob;
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            originalVideoUrlRef.current = url;
            console.log(
              '[SUCCESS] Video generation and download completed successfully',
            );
          }
          setIsGenerating(false);
          return;
        } else {
          console.log(
            `[POLLING] Operation not done yet, will retry in ${POLL_INTERVAL_MS}ms`,
          );
        }
      } catch (e) {
        console.error('[ERROR] Error polling Veo operation:', e.message);
        setIsGenerating(false);
      } finally {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    if (operationName && !videoUrl) {
      console.log('[POLLING] Starting to poll operation:', operationName);
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    return () => {
      if (timer) {
        console.log('[POLLING] Cleaning up polling timer');
        clearTimeout(timer);
      }
    };
  }, [operationName, videoUrl]);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setGeneratedImage(null);
    }
  };

  const onPickMultipleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      const limitedFiles = imageFiles.slice(0, 10);
      setMultipleImageFiles((prevFiles) =>
        [...prevFiles, ...limitedFiles].slice(0, 10),
      );
    }
  };

  const handleTrimmedOutput = (blob: Blob) => {
    trimmedBlobRef.current = blob; // likely webm
    if (trimmedUrlRef.current) {
      URL.revokeObjectURL(trimmedUrlRef.current);
    }
    trimmedUrlRef.current = URL.createObjectURL(blob);
    setVideoUrl(trimmedUrlRef.current);
  };

  const handleResetTrimState = () => {
    if (trimmedUrlRef.current) {
      URL.revokeObjectURL(trimmedUrlRef.current);
      trimmedUrlRef.current = null;
    }
    trimmedBlobRef.current = null;
    if (originalVideoUrlRef.current) {
      setVideoUrl(originalVideoUrlRef.current);
    }
  };

  const downloadVideo = async () => {
    const blob = trimmedBlobRef.current || videoBlobRef.current;
    if (!blob) return;
    const isTrimmed = !!trimmedBlobRef.current;
    const filename = isTrimmed ? 'veo3_video_trimmed.webm' : 'veo3_video.mp4';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', filename);
    link.setAttribute('rel', 'noopener');
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      // Convert base64 data URL to blob
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Determine file extension from MIME type
      const mimeType = blob.type || 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      const safeModelName = selectedModel.replace(/[^a-zA-Z0-9-]/g, '_');
      const filename = `${safeModelName}.${extension}`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', filename);
      link.setAttribute('rel', 'noopener');
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Drag and drop handlers for compose mode
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    const limitedFiles = imageFiles.slice(0, 10);

    if (limitedFiles.length > 0) {
      if (mode === 'compose-image') {
        setMultipleImageFiles((prevFiles) =>
          [...prevFiles, ...limitedFiles].slice(0, 10),
        );
      } else if (mode === 'edit-image') {
        setImageFile(limitedFiles[0]);
      }
    }
  };

  return (
    <div
      className="relative min-h-screen w-full text-stone-900"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Main content area */}
      <div className="flex flex-col items-center justify-center min-h-screen pb-40 px-4">
        {!videoUrl &&
          (isLoadingUI ? (
            <div className="w-full max-w-3xl">
              <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
                {mode === 'create-video' ? (
                  <Film className="w-16 h-16 text-gray-400 animate-pulse" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-gray-400 animate-pulse" />
                )}
                <div className="inline-flex items-center rounded-full bg-gray-200/70 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700/60 dark:text-gray-200">
                  {modelLabel}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  {loadingMessages[loadingIndex % loadingMessages.length]}
                </div>
                <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-full w-full animate-[shimmer_1.6s_infinite] -translate-x-full rounded-full bg-gray-400/70 dark:bg-gray-500/70" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl">
              {/* Always show upload area when no image is available */}
              {!imageFile && !generatedImage && (
                <div
                  className={`rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${'bg-white/10 border-gray-300/70 hover:bg-white/30'}`}
                  onClick={() => {
                    // Trigger single file input
                    const input = document.getElementById(
                      'single-image-input',
                    ) as HTMLInputElement;
                    input?.click();
                  }}
                >
                  <div className="flex flex-col items-center gap-3 text-slate-800/80">
                    <Upload className="w-8 h-8" />
                    <div className="text-center">
                      <div className="font-medium text-lg">
                        Drop an image here, or click to upload
                      </div>
                      <div className="text-sm opacity-80 mt-1">
                        PNG, JPG, WEBP up to 10MB
                      </div>
                      {mode === 'create-image' && (
                        <div className="text-sm mt-2 text-blue-600">
                          Upload an image or just use text prompts to create
                        </div>
                      )}
                      {mode === 'edit-image' && (
                        <div className="text-sm mt-2 text-orange-600">
                          <strong>Required:</strong> Upload an image to edit
                        </div>
                      )}
                      {mode === 'compose-image' && (
                        <div className="text-sm mt-2 text-green-600">
                          <strong>Required:</strong> Upload images to compose
                          together
                        </div>
                      )}
                      {mode === 'create-video' && (
                        <div className="text-sm mt-2 text-purple-600">
                          Upload an image for video generation (optional)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'edit-image' && imageFile && uploadedImageUrl && (
                <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-lg border relative mx-auto">
                  <Image
                    src={uploadedImageUrl}
                    alt="Uploaded for editing"
                    className="w-full h-full object-contain"
                    width={800}
                    height={450}
                  />
                </div>
              )}

              {mode === 'create-image' && !imageFile && !generatedImage && (
                <div className="text-stone-600 select-none text-center w-full mt-8">
                  <div className="text-lg font-medium mb-2">
                    Create Images with AI
                  </div>
                  <div className="text-sm opacity-80">
                    Use text prompts to generate images, or upload an image as
                    reference
                  </div>
                </div>
              )}

              {/* Hidden file inputs - always available */}
              <input
                id="single-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />
              <input
                id="multiple-image-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickMultipleImages}
              />

              {/* Compose mode initial state when no generated image */}
              {mode === 'compose-image' && !generatedImage && (
                <div className="w-full mt-8 flex justify-center">
                  <div className="max-w-3xl">
                    <div className="text-center text-slate-600 mb-6">
                      <div className="text-lg font-medium mb-2">
                        Compose Multiple Images
                      </div>
                      <div className="text-sm opacity-80">
                        Upload multiple images to combine them into a single
                        composition
                      </div>
                    </div>

                    {/* Upload area for compose mode */}
                    <div
                      className={`rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${'bg-white/10 border-gray-300/70 hover:bg-white/30'}`}
                      onClick={() => {
                        const input = document.getElementById(
                          'multiple-image-input',
                        ) as HTMLInputElement;
                        input?.click();
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center gap-3 text-slate-800/80">
                        <Upload className="w-8 h-8" />
                        <div className="text-center">
                          <div className="font-medium text-lg">
                            Drop multiple images here, or click to upload
                          </div>
                          <div className="text-sm opacity-80 mt-1">
                            PNG, JPG, WEBP up to 10MB each (max 10 images)
                          </div>
                          {multipleImageFiles.length > 0 && (
                            <div className="text-sm mt-2 text-green-600">
                              ✓ {multipleImageFiles.length} image
                              {multipleImageFiles.length > 1 ? 's' : ''}{' '}
                              selected{' '}
                              {multipleImageFiles.length >= 10
                                ? '(max reached)'
                                : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Thumbnails below dropzone */}
                    {multipleImageFiles.length > 0 && (
                      <div className="mt-6">
                        <div className="flex flex-wrap gap-4 justify-center">
                          {multipleImageFiles.map((file, index) => (
                            <div
                              key={index}
                              className="w-28 h-28 rounded-lg overflow-hidden border-2 border-white/30 shadow-md"
                              title={file.name}
                            >
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                                width={112}
                                height={112}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

        {generatedImage &&
          !videoUrl &&
          !(mode === 'create-video' && isLoadingUI) && (
            <div className="w-full max-w-5xl mx-auto">
              {mode === 'compose-image' ? (
                /* Compose mode: Image on top, upload area below */
                <div className="flex flex-col gap-6 items-center">
                  <div className="w-full max-w-2xl relative">
                    <div className="aspect-video overflow-hidden rounded-lg border">
                      <Image
                        src={generatedImage}
                        alt="Generated"
                        className="w-full h-full object-contain"
                        width={800}
                        height={450}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 w-full max-w-md">
                    <h4 className="text-sm font-medium text-slate-700 text-center">
                      Add More Images to Compose
                    </h4>
                    {/* Status indicator */}
                    <div className="text-xs text-center -mt-2 mb-2">
                      {(imageFile || generatedImage) && (
                        <div className="text-blue-600">
                          ✓ Existing image will be included
                        </div>
                      )}
                    </div>
                    <div
                      className="rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors bg-white/10 border-gray-300/70 hover:bg-white/30"
                      onClick={() => {
                        const input = document.getElementById(
                          'multiple-image-input',
                        ) as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 text-slate-800/80">
                        <Upload className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-medium text-sm">
                            Drop images here or click to add
                          </div>
                          <div className="text-xs opacity-80">
                            PNG, JPG, WEBP up to 10MB each
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Show thumbnails of additional images */}
                    {multipleImageFiles.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2 justify-center max-w-xs mx-auto">
                          {multipleImageFiles.map((file, index) => (
                            <div
                              key={index}
                              className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white/30 shadow-sm"
                              title={file.name}
                            >
                              <Image
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                                width={80}
                                height={80}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Other modes: Image centered */
                <div className="flex flex-col items-center gap-6">
                  <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-lg border relative">
                    <Image
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-full object-contain"
                      width={800}
                      height={450}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        {videoUrl && (
          <div className="w-full max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-6">
              {/* Video in center */}
              <VideoPlayer
                src={videoUrl}
                onOutputChanged={handleTrimmedOutput}
                onDownload={downloadVideo}
                onResetTrim={handleResetTrimState}
              />
            </div>
          </div>
        )}
      </div>

      <Composer
        mode={mode}
        setMode={setMode}
        hasGeneratedImage={!!generatedImage}
        hasVideoUrl={!!videoUrl}
        prompt={prompt}
        setPrompt={setPrompt}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        canStart={canStart}
        isGenerating={isGenerating}
        startGeneration={startGeneration}
        imagePrompt={imagePrompt}
        setImagePrompt={setImagePrompt}
        editPrompt={editPrompt}
        setEditPrompt={setEditPrompt}
        composePrompt={composePrompt}
        setComposePrompt={setComposePrompt}
        geminiBusy={geminiBusy}
        resetAll={resetAll}
        downloadImage={downloadImage}
      />

      <DebugSection
        mode={mode}
        selectedModel={selectedModel}
        isGenerating={isGenerating || imagenBusy || geminiBusy}
        operationName={operationName}
        generatedImage={generatedImage}
        videoUrl={videoUrl}
        imageFile={imageFile}
        multipleImageFiles={multipleImageFiles}
        prompt={prompt}
        imagePrompt={imagePrompt}
        editPrompt={editPrompt}
        composePrompt={composePrompt}
      />
    </div>
  );
};

export default VeoStudio;
