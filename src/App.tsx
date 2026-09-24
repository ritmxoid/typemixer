import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, Download } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { VideoPreview } from './components/VideoPreview';
import { BackgroundSection } from './components/BackgroundSection';
import { TextInputSection, EditingFocusInfo } from './components/TextInputSection';
import { AudioSection } from './components/AudioSection';
import { FontSection } from './components/FontSection';
import { TextModeSection } from './components/TextModeSection';
import { AnimationStyleSection } from './components/AnimationStyleSection';
import { EffectsSection } from './components/EffectsSection';
import { SpeedSection } from './components/SpeedSection';
import { ExportModal } from './components/ExportModal';
import { UploadModal } from './components/UploadModal';
import { SAMPLE_TEXTS } from './data/presets';
import { VideoProjectState } from './types';
import { ExportProgress, exportVideo } from './utils/videoRecorder';
import { splitTextIntoSegments } from './utils/textSplitter';
import { audioMixer } from './utils/audioMixer';
import { mediaManager } from './utils/mediaManager';
import {
  saveProjectState,
  loadProjectState,
  loadMediaFile,
  clearAllProjectData,
} from './utils/projectStorage';

const DEFAULT_STATE: VideoProjectState = {
  // Background
  bgType: 'preset',
  bgMediaUrl: null,
  bgMediaType: null,
  bgPresetId: 'ai-procedural-cosmic',
  proceduralMood: 'cosmic',
  proceduralSeed: 1337,
  bgOverlayOpacity: 0.20,

  // Audio / Music
  audio: {
    enabled: false,
    sourceType: 'generator',
    audioUrl: null,
    audioFileName: null,
    presetId: 'lofi-chill',
    volume: 0.7,
    loop: true,
    audioDuration: 0,
  },

  // Text
  rawText: SAMPLE_TEXTS[0].text,
  authorText: '',
  textMode: 'sentence',
  fontFamily: "'Montserrat', sans-serif",
  fontSize: 72,
  textColor: '#ffffff',
  strokeEnabled: false,
  strokeColor: '#000000',
  strokeWidth: 6,
  textAlign: 'center',
  textPosition: 'center',
  textPositionY: 50,
  textPositionX: 50,
  isUppercase: false,

  // Animation & Effects
  animationStyle: 'typewriter',
  effects: {
    glow: false,
    sparkle: true,
    fire: false,
    neon: false,
    shadow: true,
    particles: false,
  },
  neonColor: '#a855f7',
  speedMultiplier: 1.0,
  pauseBetweenSeconds: 0.8,

  // Canvas
  aspectRatio: '9:16',
};

export default function App() {
  const { t } = useLanguage();
  // Initialize with saved state from localStorage if available (never lose user's typed text or settings!)
  const [projectState, setProjectState] = useState<VideoProjectState>(() => {
    const saved = loadProjectState();
    if (saved) {
      const activePresetId =
        !saved.bgPresetId || saved.bgPresetId === 'midnight-violet'
          ? 'ai-procedural-cosmic'
          : saved.bgPresetId;
      return {
        ...DEFAULT_STATE,
        ...saved,
        bgPresetId: activePresetId,
        proceduralMood: saved.proceduralMood || 'cosmic',
        proceduralSeed: saved.proceduralSeed || 1337,
        audio: {
          ...DEFAULT_STATE.audio,
          ...(saved.audio || {}),
          // audioUrl is a temporary blob that will be restored from IndexedDB
          audioUrl: null,
        },
        // bgMediaUrl is a temporary blob that will be restored from IndexedDB
        bgMediaUrl: null,
      };
    }
    return DEFAULT_STATE;
  });

  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(() => {
    const saved = loadProjectState();
    return saved?.savedBgFileName || null;
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [editingInfo, setEditingInfo] = useState<EditingFocusInfo | null>(null);

  const [bgMediaElement, setBgMediaElement] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const bgMediaElementRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  bgMediaElementRef.current = bgMediaElement;
  const hasRestoredMediaRef = useRef<boolean>(false);
  const handleFileUploadRef = useRef<(file: File, isRestoration?: boolean) => void>(() => {});

  const mediaUrlRef = useRef<string | null>(null);
  const mediaSandboxRef = useRef<HTMLDivElement>(null);
  const lastUploadedFileRef = useRef<File | null>(null);

  // Compute total duration
  const { totalDuration } = splitTextIntoSegments(
    projectState.rawText,
    projectState.textMode,
    projectState.speedMultiplier,
    projectState.pauseBetweenSeconds,
    undefined,
    projectState.animationStyle
  );

  // Export State
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    statusText: '',
    downloadUrl: null,
    fileBlob: null,
    fileExtension: 'mp4',
    error: null,
  });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);

  const handleStateChange = useCallback((patch: Partial<VideoProjectState>) => {
    setProjectState((prev) => {
      const nextAudio = patch.audio
        ? { ...prev.audio, ...patch.audio }
        : prev.audio;
      return {
        ...prev,
        ...patch,
        audio: nextAudio,
      };
    });
  }, []);

  // Automatic debounced persistence of user's project settings & text
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProjectState(projectState, { fileName });
    }, 200);
    return () => clearTimeout(timer);
  }, [projectState, fileName]);

  // Handle media file upload (rock-solid, clean, instant video and audio loading)
  const handleFileUpload = useCallback(async (file: File, isRestoration = false) => {
    setUploadError(null);
    setUploadSuccess(false);
    setIsMediaLoading(true);
    lastUploadedFileRef.current = file;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isAudio =
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);

    const isVideo =
      !isAudio &&
      (file.type.startsWith('video/') ||
        /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(file.name));

    const isImage = !isAudio && !isVideo;

    // 1. Audio Track Attachment (Preserves existing background video/image)
    if (isAudio) {
      audioMixer.resume();
      audioMixer.stop();

      const blobUrl = mediaManager.createMediaUrl('audio', file);
      const probeAudio = new Audio();
      probeAudio.preload = 'metadata';

      let handled = false;
      const finishAudio = (dur: number) => {
        if (handled) return;
        handled = true;
        clearTimeout(timeoutId);

        try {
          probeAudio.onloadedmetadata = null;
          probeAudio.onerror = null;
          probeAudio.src = '';
        } catch {}

        if (!isRestoration) {
          mediaManager.persistMedia('audio', file, file.name, file.type || 'audio/mpeg', dur);
        }

        setUploadSuccess(true);
        setIsMediaLoading(false);
        setUploadError(null);
        setTimeout(() => setUploadSuccess(false), 2200);

        setProjectState((prev) => ({
          ...prev,
          audio: {
            ...prev.audio,
            enabled: true,
            sourceType: 'file',
            audioUrl: blobUrl,
            audioFileName: file.name,
            audioDuration: dur,
            volume: (prev.audio.volume ?? 0.8) > 0 ? (prev.audio.volume ?? 0.8) : 0.8,
            loop: prev.audio.loop ?? true,
          },
        }));
      };

      const timeoutId = setTimeout(() => {
        if (!handled) {
          handled = true;
          finishAudio(totalDuration);
        }
      }, 1500);

      probeAudio.onloadedmetadata = () => {
        if (!handled) {
          const dur =
            Number.isFinite(probeAudio.duration) && probeAudio.duration > 0
              ? probeAudio.duration
              : totalDuration;
          finishAudio(dur);
        }
      };

      probeAudio.onerror = () => {
        if (!handled) {
          finishAudio(totalDuration);
        }
      };

      probeAudio.src = blobUrl;
      return;
    }

    // Determine MIME type
    let resolvedMime = file.type;
    if (isVideo) {
      if (!resolvedMime || resolvedMime === 'application/octet-stream' || !resolvedMime.startsWith('video/')) {
        if (ext === 'webm') resolvedMime = 'video/webm';
        else if (ext === 'mov') resolvedMime = 'video/quicktime';
        else resolvedMime = 'video/mp4';
      }
    } else {
      if (!resolvedMime || resolvedMime === 'application/octet-stream' || !resolvedMime.startsWith('image/')) {
        if (ext === 'png') resolvedMime = 'image/png';
        else if (ext === 'webp') resolvedMime = 'image/webp';
        else resolvedMime = 'image/jpeg';
      }
    }

    const targetMime = resolvedMime || (isVideo ? 'video/mp4' : 'image/jpeg');

    // 2. Video Background Attachment
    if (isVideo) {
      // Release any previous video element safely and release hardware decoders
      if (bgMediaElementRef.current instanceof HTMLVideoElement) {
        mediaManager.teardownVideo(bgMediaElementRef.current);
      }
      if (mediaSandboxRef.current) {
        const existingVideos = mediaSandboxRef.current.querySelectorAll('video');
        existingVideos.forEach((v) => mediaManager.teardownVideo(v));
        mediaSandboxRef.current.innerHTML = '';
      }
      bgMediaElementRef.current = null;
      setBgMediaElement(null);

      const typedBlob =
        file.type && file.type.startsWith('video/')
          ? file
          : file.slice(0, file.size, targetMime);
      const blobUrl = mediaManager.createMediaUrl('background', typedBlob);
      mediaUrlRef.current = blobUrl;

      const loadVideoSource = (sourceUrl: string) => {
        const video = document.createElement('video');
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.preload = 'auto';

        if (!sourceUrl.startsWith('blob:') && !sourceUrl.startsWith('data:')) {
          video.crossOrigin = 'anonymous';
        }

        // Attach to DOM sandbox BEFORE setting source so Chromium never aborts pipeline on insertion
        if (mediaSandboxRef.current) {
          mediaSandboxRef.current.innerHTML = '';
          mediaSandboxRef.current.appendChild(video);
        }

        // Explicit source tag with MIME hint
        const sourceEl = document.createElement('source');
        sourceEl.src = sourceUrl;
        sourceEl.type = targetMime;
        video.appendChild(sourceEl);
        video.src = sourceUrl;

        let initialized = false;
        let pollTimer: NodeJS.Timeout | null = null;
        let safetyTimer: NodeJS.Timeout | null = null;

        const cleanup = () => {
          if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
          }
          if (safetyTimer) {
            clearTimeout(safetyTimer);
            safetyTimer = null;
          }
        };

        safetyTimer = setTimeout(() => {
          if (!initialized) {
            failWithError(
              undefined,
              'Загрузка видео заняла слишком много времени. Проверьте формат файла или нажмите «Повторить».'
            );
          }
        }, 12000);

        const onReady = () => {
          if (initialized) return;
          initialized = true;
          cleanup();

          setFileName(file.name);
          setIsMediaLoading(false);
          setUploadError(null);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 2000);

          video.play().catch(() => {});
          bgMediaElementRef.current = video;
          setBgMediaElement(video);

          handleStateChange({
            bgType: 'video',
            bgMediaUrl: sourceUrl,
            bgMediaType: 'video',
            audio: {
              videoAudioEnabled: projectState.audio.videoAudioEnabled ?? true,
              videoVolume: projectState.audio.videoVolume ?? 0.8,
            },
          });

          // Cache video in IndexedDB so it persists across mobile browser tab reloads
          if (!isRestoration) {
            mediaManager.persistMedia('background', file, file.name, targetMime);
          }
        };

        const failWithError = (errCode?: number, customMsg?: string) => {
          if (initialized) return;
          initialized = true;
          cleanup();
          mediaManager.teardownVideo(video);
          setIsMediaLoading(false);
          let msg = customMsg || 'Браузер вашего устройства не смог открыть этот видеофайл.';
          if (!customMsg) {
            if (errCode === 4) {
              msg = 'Браузер устройства временно не смог запустить видеокодек (код 4). Попробуйте нажать кнопку «Повторить» ниже или выберите видео снова.';
            } else if (errCode === 3) {
              msg = 'Ошибка декодирования видео (код 3). Возможно, файл поврежден или использует несовместимый видеокодек.';
            }
          }
          setUploadError(msg);
        };

        video.onloadedmetadata = onReady;
        video.onloadeddata = onReady;
        video.oncanplay = onReady;
        video.oncanplaythrough = onReady;
        video.onplay = onReady;
        video.onended = () => {
          video.currentTime = 0;
          video.play().catch(() => {});
        };
        video.ontimeupdate = () => {
          if (video.currentTime > 0) onReady();
        };

        video.onerror = () => {
          // Ignore aborted request code 1
          if (video.error && video.error.code === 1) {
            return;
          }
          if (video.readyState >= 1 && video.videoWidth > 0) {
            onReady();
            return;
          }

          cleanup();
          mediaManager.teardownVideo(video);
          failWithError(video.error?.code);
        };

        video.load();

        if (video.readyState >= 1 && video.videoWidth > 0) {
          onReady();
          return;
        }

        pollTimer = setInterval(() => {
          if (initialized) {
            cleanup();
            return;
          }
          if (video.readyState >= 1 && video.videoWidth > 0) {
            onReady();
          }
        }, 100);

        setTimeout(() => {
          if (pollTimer) clearInterval(pollTimer);
        }, 6000);
      };

      loadVideoSource(blobUrl);
      return;
    }

    // 3. Image Background Attachment
    if (isImage) {
      if (bgMediaElementRef.current instanceof HTMLVideoElement) {
        mediaManager.teardownVideo(bgMediaElementRef.current);
      }
      if (mediaSandboxRef.current) {
        const existingVideos = mediaSandboxRef.current.querySelectorAll('video');
        existingVideos.forEach((v) => mediaManager.teardownVideo(v));
        mediaSandboxRef.current.innerHTML = '';
      }
      bgMediaElementRef.current = null;
      setBgMediaElement(null);

      const blobUrl = mediaManager.createMediaUrl('background', file);
      mediaUrlRef.current = blobUrl;

      const img = new Image();
      if (!blobUrl.startsWith('blob:') && !blobUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      let initialized = false;

      img.onload = () => {
        if (initialized) return;
        initialized = true;
        setFileName(file.name);
        setIsMediaLoading(false);
        setUploadError(null);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);

        if (!isRestoration) {
          mediaManager.persistMedia('background', file, file.name, targetMime);
        }

        bgMediaElementRef.current = img;
        setBgMediaElement(img);
        handleStateChange({
          bgType: 'image',
          bgMediaUrl: blobUrl,
          bgMediaType: 'image',
        });
      };

      img.onerror = () => {
        if (initialized) return;
        initialized = true;
        setIsMediaLoading(false);
        setUploadError(
          'Не удалось открыть изображение. Проверьте формат файла (поддерживаются JPG, PNG, WEBP).'
        );
      };

      img.src = blobUrl;
      if (img.complete && img.naturalWidth > 0) {
        img.onload(new Event('load'));
      }
    }
  }, [handleStateChange, totalDuration, projectState.audio.videoAudioEnabled, projectState.audio.videoVolume]);

  useEffect(() => {
    handleFileUploadRef.current = handleFileUpload;
  }, [handleFileUpload]);

  // Restore cached media files from IndexedDB ONCE on initial startup
  useEffect(() => {
    if (hasRestoredMediaRef.current) return;
    hasRestoredMediaRef.current = true;
    let isMounted = true;

    async function restoreCachedMedia() {
      // 1. Restore background media
      try {
        const bgRecord = await loadMediaFile('background');
        if (isMounted) {
          if (bgRecord && bgRecord.blob) {
            const restoredName = bgRecord.fileName || 'custom-background';
            setFileName(restoredName);
            const restoredFile = new File([bgRecord.blob], restoredName, {
              type: bgRecord.mimeType || bgRecord.blob.type,
            });
            handleFileUpload(restoredFile, true);
          } else {
            // If background was saved as video/image but no blob exists in IndexedDB, clear stale state
            setFileName(null);
            setProjectState((prev) => {
              if ((prev.bgType === 'video' || prev.bgType === 'image') && !prev.bgMediaUrl) {
                return {
                  ...prev,
                  bgType: 'preset',
                  bgPresetId: prev.bgPresetId || 'cyberpunk',
                };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Could not restore background media:', err);
      }

      // 2. Restore custom audio file
      try {
        const audioRecord = await loadMediaFile('audio');
        if (isMounted && audioRecord && audioRecord.blob) {
          const restoredAudioFile = new File([audioRecord.blob], audioRecord.fileName || 'custom-audio.mp3', {
            type: audioRecord.mimeType || audioRecord.blob.type || 'audio/mpeg',
          });
          handleFileUpload(restoredAudioFile, true);
        } else if (isMounted) {
          // If state had sourceType === 'file' but no blob in IndexedDB, fall back to generator
          setProjectState((prev) => {
            if (prev.audio.sourceType === 'file' && !prev.audio.audioUrl) {
              return {
                ...prev,
                audio: {
                  ...prev.audio,
                  sourceType: 'generator',
                  audioUrl: null,
                  audioFileName: null,
                },
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('Could not restore audio media:', err);
      }
    }

    restoreCachedMedia();

    return () => {
      isMounted = false;
    };
  }, [handleFileUpload]);

  const handleRetryUpload = () => {
    if (lastUploadedFileRef.current) {
      handleFileUpload(lastUploadedFileRef.current);
    }
  };

  const handleClearBackgroundMedia = () => {
    if (bgMediaElementRef.current instanceof HTMLVideoElement) {
      mediaManager.teardownVideo(bgMediaElementRef.current);
    }
    if (mediaSandboxRef.current) {
      const existingVideos = mediaSandboxRef.current.querySelectorAll('video');
      existingVideos.forEach((v) => mediaManager.teardownVideo(v));
      mediaSandboxRef.current.innerHTML = '';
    }
    bgMediaElementRef.current = null;
    mediaUrlRef.current = null;
    lastUploadedFileRef.current = null;
    mediaManager.releaseMedia('background');
    setBgMediaElement(null);
    setFileName(null);
    setUploadError(null);
    setUploadSuccess(false);
    setIsMediaLoading(false);
    handleStateChange({
      bgType: 'preset',
      bgMediaUrl: null,
      bgMediaType: null,
    });
  };

  const handleResetAll = async () => {
    handleClearBackgroundMedia();
    mediaManager.releaseMedia('audio');
    await clearAllProjectData();
    setProjectState(DEFAULT_STATE);
  };

  const handleNavigateToTool = useCallback((toolNumber: number) => {
    setIsPinned(false);
    setIsFullscreenOpen(false);

    const scrollToSection = () => {
      let el = document.getElementById(`tool-section-${toolNumber}`);
      if (toolNumber === 2) {
        const fontGrid = document.getElementById('font-picker-block');
        if (fontGrid) el = fontGrid;
      }
      if (!el) return;

      const isMobile = window.innerWidth < 1024;
      const previewDock = document.getElementById('preview-sticky-dock');
      const headerEl = document.querySelector('header');

      let topOffset = 70; // Desktop offset
      if (isMobile && previewDock) {
        const dockHeight = previewDock.offsetHeight || previewDock.getBoundingClientRect().height || 360;
        const headerHeight = headerEl ? headerEl.offsetHeight : 44;
        // The top header of the section should sit cleanly 12px below the sticky preview
        topOffset = dockHeight + headerHeight + 12;
      }

      const elementTop = el.getBoundingClientRect().top + window.scrollY;
      const targetScrollY = Math.max(0, elementTop - topOffset);

      window.scrollTo({
        top: targetScrollY,
        behavior: 'smooth',
      });

      // Visual highlight with glowing ring
      el.classList.add('ring-4', 'ring-purple-500/80', 'shadow-2xl', 'shadow-purple-500/40');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-purple-500/80', 'shadow-2xl', 'shadow-purple-500/40');
      }, 2000);
    };

    // Staged scroll execution to guarantee exact pixel positioning across layout transitions
    setTimeout(scrollToSection, 100);
    setTimeout(scrollToSection, 300);
  }, []);

  const handleTogglePin = useCallback(() => {
    if (isPinned) {
      // Unpinning preview: switch to compact mode and smoothly anchor to Section 1 (Text Input)
      handleNavigateToTool(1);
    } else {
      setIsPinned(true);
    }
  }, [isPinned, handleNavigateToTool]);

  const handleExportMp4 = async () => {
    try {
      setExportProgress({
        isExporting: true,
        progress: 0,
        statusText: t('renderingMp4', 'Рендеринг видео MP4...'),
        downloadUrl: null,
        fileBlob: null,
        fileExtension: 'mp4',
        error: null,
      });

      const hasVideo = bgMediaElement instanceof HTMLVideoElement && bgMediaElement.duration > 0;
      const vidDuration =
        hasVideo && projectState.syncWithVideo ? (bgMediaElement as HTMLVideoElement).duration : undefined;

      const result = await exportVideo({
        state: projectState,
        bgMediaElement,
        targetFormat: 'mp4',
        durationOverride: vidDuration,
        textTimingMode: projectState.textLoopMode || 'stretch',
        onProgress: (progress) => {
          setExportProgress(progress);
        },
      });

      if (result && result.downloadUrl) {
        // Automatically trigger file download
        const ext = result.fileExtension || 'mp4';
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = `TexTic-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      setExportProgress({
        isExporting: false,
        progress: 0,
        statusText: 'Ошибка экспорта / Export error',
        downloadUrl: null,
        fileBlob: null,
        fileExtension: 'mp4',
        error: String(err),
      });
    }
  };

  const handleExport = async () => {
    return handleExportMp4();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current);
      }
    };
  }, []);

  const activeBgFileName =
    (projectState.bgType === 'video' || projectState.bgType === 'image')
      ? (fileName || (projectState.bgType === 'video' ? 'video.mp4' : 'image.jpg'))
      : null;

  return (
    <div className="min-h-screen bg-[#0F0F12] text-zinc-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-purple-200 overflow-x-clip w-full max-w-[100vw]">
      {/* Top Header with File Upload Action - Hidden in Fullscreen or Pinned Fullscreen */}
      {!isPinned && !isFullscreenOpen && (
        <Header
          onFileUpload={handleFileUpload}
          fileName={activeBgFileName}
          onClearFile={handleClearBackgroundMedia}
          onResetProject={handleResetAll}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      )}

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-0 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Preview Column (First on Mobile, Left on Desktop - Sticky full height) */}
        <div
          id="preview-sticky-dock"
          className={
            isPinned
              ? 'fixed inset-0 z-[9999] w-full h-full bg-black'
              : 'order-1 lg:order-1 lg:col-span-5 sticky top-11 sm:top-12 lg:top-14 lg:self-start z-30 w-full bg-[#0F0F12]'
          }
        >
          <VideoPreview
            state={projectState}
            onChange={handleStateChange}
            bgMediaElement={bgMediaElement}
            onExportClick={handleExport}
            isExporting={exportProgress.isExporting}
            onFileUpload={handleFileUpload}
            isMediaLoading={isMediaLoading}
            uploadSuccess={uploadSuccess}
            uploadError={uploadError}
            onDismissError={() => setUploadError(null)}
            onRetryUpload={handleRetryUpload}
            isFullscreenOpen={isFullscreenOpen}
            onOpenFullscreen={() => setIsFullscreenOpen(true)}
            onCloseFullscreen={() => setIsFullscreenOpen(false)}
            editingInfo={editingInfo}
            isPinnedProp={isPinned}
            onTogglePinProp={handleTogglePin}
            onNavigateToTool={handleNavigateToTool}
          />
        </div>

        {/* Detailed Controls Column (Below Preview on Mobile, Right on Desktop) */}
        <div className="order-2 lg:order-2 lg:col-span-7 space-y-4 sm:space-y-5 px-3 sm:px-0 pb-8">
          {/* Step 1: Text Input */}
          <div id="tool-section-1" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <TextInputSection
              state={projectState}
              onChange={handleStateChange}
              onEditingFocus={setEditingInfo}
            />
          </div>

          {/* Step 2: Fonts & Formatting */}
          <div id="tool-section-2" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <FontSection
              state={projectState}
              onChange={handleStateChange}
            />
          </div>

          {/* Step 3: Background Selector & Presets */}
          <div id="tool-section-3" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <BackgroundSection
              state={projectState}
              onChange={handleStateChange}
              onClearBackgroundMedia={handleClearBackgroundMedia}
              fileName={activeBgFileName}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          </div>

          {/* Step 4: Music & Soundtrack */}
          <div id="tool-section-4" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <AudioSection
              state={projectState}
              onChange={handleStateChange}
              totalDuration={totalDuration}
            />
          </div>

          {/* Step 5: Text Mode */}
          <div id="tool-section-5" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <TextModeSection
              state={projectState}
              onChange={handleStateChange}
            />
          </div>

          {/* Step 6: Animation Style */}
          <div id="tool-section-6" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <AnimationStyleSection
              state={projectState}
              onChange={handleStateChange}
            />
          </div>

          {/* Step 7: Extra Effects */}
          <div id="tool-section-7" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <EffectsSection
              state={projectState}
              onChange={handleStateChange}
            />
          </div>

          {/* Step 8: Timing & Speed */}
          <div id="tool-section-8" className="scroll-mt-16 transition-all duration-300 rounded-2xl">
            <SpeedSection
              state={projectState}
              onChange={handleStateChange}
            />
          </div>

          {/* Final Step: Video Capture Button at the very bottom */}
          <div className="pt-2 pb-4 space-y-3">
            {/* Capture Video (Opens Fullscreen Player) */}
            <button
              onClick={() => {
                audioMixer.stop();
                if (bgMediaElement instanceof HTMLVideoElement) {
                  bgMediaElement.pause();
                  bgMediaElement.muted = true;
                }
                setIsFullscreenOpen(true);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-98 border border-white/10 group"
            >
              <Video className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{t('captureVideoBtn', 'Захват видео')}</span>
            </button>
            <p className="text-center text-[11px] sm:text-xs text-zinc-400">
              {t('captureVideoDesc', 'Открывает развернутое превью с функциями захвата Fix Txt, Fix Vid и скачивания')}
            </p>
          </div>

          {/* TypeMixer Description Card */}
          <div className="bg-[#16161D]/85 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg shadow-black/25 text-center space-y-2.5 mb-6">
            <div className="flex items-center justify-center gap-2">
              <img
                src="./favicon.svg"
                alt="TypeMixer"
                className="w-5 h-5 rounded-md object-contain shadow-sm"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                TypeMixer • {t('appSubtitle', 'Аниматор Текста')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl mx-auto font-normal">
              {t('appDescription', 'Приложение для наложения анимированного текста на короткие видео или анимированные фоны, с генератором фоновых мелодий и возможностью добавить свою. Отлично подойдет для создания красивых субтитров, цитат и динамических инструкций.')}
            </p>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        progress={exportProgress}
        onClose={() =>
          setExportProgress((p) => ({ ...p, downloadUrl: null, error: null }))
        }
        onRestart={() => {
          setExportProgress({
            isExporting: false,
            progress: 0,
            statusText: '',
            downloadUrl: null,
            fileBlob: null,
            fileExtension: 'webm',
            error: null,
          });
        }}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
        currentFileName={activeBgFileName}
      />

      {/* Media sandbox kept in viewport to preserve active hardware video decoding in mobile Chrome without GPU overflow */}
      <div
        ref={mediaSandboxRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          opacity: 0.001,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: -1,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
