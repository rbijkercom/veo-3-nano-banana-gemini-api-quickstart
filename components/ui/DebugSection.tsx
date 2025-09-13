'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Trash2, Download } from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

interface DebugSectionProps {
  // Props to track current state
  mode?: string;
  selectedModel?: string;
  isGenerating?: boolean;
  operationName?: string | null;
  generatedImage?: string | null;
  videoUrl?: string | null;
  imageFile?: File | null;
  multipleImageFiles?: File[];
  prompt?: string;
  imagePrompt?: string;
  editPrompt?: string;
  composePrompt?: string;
}

const DebugSection: React.FC<DebugSectionProps> = ({
  mode,
  selectedModel,
  isGenerating,
  operationName,
  generatedImage,
  videoUrl,
  imageFile,
  multipleImageFiles = [],
  prompt,
  imagePrompt,
  editPrompt,
  composePrompt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const originalConsole = useRef<{
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
  }>();

  // Initialize console interception
  useEffect(() => {
    // Store original console methods
    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn,
    };

    // Override console methods to capture logs
    const addLog = (
      level: DebugLog['level'],
      category: string,
      message: string,
      data?: any,
    ) => {
      const log: DebugLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level,
        category,
        message,
        data,
      };
      setLogs((prev) => [...prev, log].slice(-200)); // Keep last 200 logs
    };

    const categorizeMessage = (message: string): string => {
      if (message.startsWith('[API]')) return 'API';
      if (message.startsWith('[ERROR]')) return 'Error';
      if (message.startsWith('[SUCCESS]')) return 'Success';
      if (message.startsWith('[DEBUG]')) return 'Debug';
      if (message.startsWith('[POLLING]')) return 'Polling';
      return 'Console';
    };

    console.log = (...args: any[]) => {
      originalConsole.current?.log(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(' ');
      const category = categorizeMessage(message);
      const level = message.startsWith('[ERROR]')
        ? 'error'
        : message.startsWith('[SUCCESS]')
        ? 'info'
        : 'debug';
      addLog(level, category, message, args.length > 1 ? args : undefined);
    };

    console.error = (...args: any[]) => {
      originalConsole.current?.error(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(' ');
      const category = categorizeMessage(message);
      addLog('error', category, message, args.length > 1 ? args : undefined);
    };

    console.warn = (...args: any[]) => {
      originalConsole.current?.warn(...args);
      const message = args
        .map((arg) =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(' ');
      const category = categorizeMessage(message);
      addLog('warn', category, message, args.length > 1 ? args : undefined);
    };

    // Cleanup on unmount
    return () => {
      if (originalConsole.current) {
        console.log = originalConsole.current.log;
        console.error = originalConsole.current.error;
        console.warn = originalConsole.current.warn;
      }
    };
  }, []);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Log state changes
  useEffect(() => {
    const addStateLog = (message: string, data?: any) => {
      const log: DebugLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level: 'debug',
        category: 'State',
        message,
        data,
      };
      setLogs((prev) => [...prev, log].slice(-100));
    };

    if (mode) addStateLog(`Mode changed to: ${mode}`);
  }, [mode]);

  useEffect(() => {
    if (selectedModel) {
      const log: DebugLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level: 'debug',
        category: 'State',
        message: `Model selected: ${selectedModel}`,
      };
      setLogs((prev) => [...prev, log].slice(-100));
    }
  }, [selectedModel]);

  useEffect(() => {
    const log: DebugLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level: isGenerating ? 'info' : 'debug',
      category: 'Generation',
      message: isGenerating ? 'Generation started' : 'Generation stopped',
    };
    setLogs((prev) => [...prev, log].slice(-100));
  }, [isGenerating]);

  useEffect(() => {
    if (operationName) {
      const log: DebugLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level: 'info',
        category: 'Veo',
        message: `Operation created: ${operationName}`,
      };
      setLogs((prev) => [...prev, log].slice(-100));
    }
  }, [operationName]);

  useEffect(() => {
    if (generatedImage) {
      const log: DebugLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level: 'info',
        category: 'Image',
        message: 'Image generated successfully',
        data: {
          size: generatedImage.length,
          type: generatedImage.split(';')[0]?.replace('data:', '') || 'unknown',
        },
      };
      setLogs((prev) => [...prev, log].slice(-100));
    }
  }, [generatedImage]);

  useEffect(() => {
    if (videoUrl) {
      const log: DebugLog = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level: 'info',
        category: 'Video',
        message: 'Video generated successfully',
        data: { url: videoUrl },
      };
      setLogs((prev) => [...prev, log].slice(-100));
    }
  }, [videoUrl]);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${
            log.category
          }] ${log.message}${
            log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''
          }`,
      )
      .join('\n\n');

    navigator.clipboard.writeText(logText).then(() => {
      alert('Debug logs copied to clipboard');
    });
  };

  const downloadLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${
            log.category
          }] ${log.message}${
            log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''
          }`,
      )
      .join('\n\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'debug':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Console':
        return 'bg-purple-100 text-purple-800';
      case 'State':
        return 'bg-green-100 text-green-800';
      case 'Generation':
        return 'bg-blue-100 text-blue-800';
      case 'Veo':
        return 'bg-indigo-100 text-indigo-800';
      case 'Image':
        return 'bg-orange-100 text-orange-800';
      case 'Video':
        return 'bg-pink-100 text-pink-800';
      case 'API':
        return 'bg-cyan-100 text-cyan-800';
      case 'Error':
        return 'bg-red-100 text-red-800';
      case 'Success':
        return 'bg-emerald-100 text-emerald-800';
      case 'Debug':
        return 'bg-slate-100 text-slate-800';
      case 'Polling':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentState = {
    mode,
    selectedModel,
    isGenerating,
    operationName,
    hasGeneratedImage: !!generatedImage,
    hasVideoUrl: !!videoUrl,
    hasImageFile: !!imageFile,
    multipleImageFilesCount: multipleImageFiles.length,
    prompts: {
      main: prompt,
      image: imagePrompt,
      edit: editPrompt,
      compose: composePrompt,
    },
    imageFileInfo: imageFile
      ? {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type,
        }
      : null,
    multipleImageFilesInfo: multipleImageFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    })),
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Debug Info & Logs
          </span>
          <span className="text-xs text-gray-500">({logs.length} entries)</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="max-h-96 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-3 h-3"
                />
                Auto-scroll
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyLogs}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                title="Copy logs to clipboard"
              >
                <Copy className="w-3 h-3" />
                Copy
              </button>
              <button
                onClick={downloadLogs}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
                title="Download logs as file"
              >
                <Download className="w-3 h-3" />
                Download
              </button>
              <button
                onClick={clearLogs}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                title="Clear all logs"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Current State Panel */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Current State
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Mode:</span>
                    <span className="ml-1 text-gray-800">{mode || 'none'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Model:</span>
                    <span className="ml-1 text-gray-800 break-all">
                      {selectedModel || 'none'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Generating:
                    </span>
                    <span
                      className={`ml-1 ${
                        isGenerating ? 'text-green-600' : 'text-gray-800'
                      }`}
                    >
                      {isGenerating ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {operationName && (
                    <div>
                      <span className="font-medium text-gray-600">
                        Operation:
                      </span>
                      <span className="ml-1 text-gray-800 break-all">
                        {operationName}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-600">
                      Generated Image:
                    </span>
                    <span
                      className={`ml-1 ${
                        generatedImage ? 'text-green-600' : 'text-gray-800'
                      }`}
                    >
                      {generatedImage ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Video URL:
                    </span>
                    <span
                      className={`ml-1 ${
                        videoUrl ? 'text-green-600' : 'text-gray-800'
                      }`}
                    >
                      {videoUrl ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Image File:
                    </span>
                    <span
                      className={`ml-1 ${
                        imageFile ? 'text-green-600' : 'text-gray-800'
                      }`}
                    >
                      {imageFile ? imageFile.name : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">
                      Multiple Images:
                    </span>
                    <span className="ml-1 text-gray-800">
                      {multipleImageFiles.length}
                    </span>
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="text-xs font-medium text-gray-600 cursor-pointer">
                    Full State JSON
                  </summary>
                  <pre className="mt-1 text-xs text-gray-700 bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(currentState, null, 2)}
                  </pre>
                </details>
              </div>
            </div>

            {/* Logs Panel */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Debug Logs
                </h3>
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-xs text-gray-500 italic">
                      No logs yet...
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="text-xs border border-gray-200 rounded p-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500 font-mono">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                          <span
                            className={`px-1 py-0.5 rounded text-xs font-medium ${getLevelColor(
                              log.level,
                            )}`}
                          >
                            {log.level.toUpperCase()}
                          </span>
                          <span
                            className={`px-1 py-0.5 rounded text-xs font-medium ${getCategoryColor(
                              log.category,
                            )}`}
                          >
                            {log.category}
                          </span>
                        </div>
                        <div className="text-gray-800 whitespace-pre-wrap break-words">
                          {log.message}
                        </div>
                        {log.data && (
                          <details className="mt-1">
                            <summary className="text-gray-600 cursor-pointer">
                              Data
                            </summary>
                            <pre className="mt-1 text-gray-700 bg-gray-50 p-1 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugSection;
