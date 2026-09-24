import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  EyeOff,
  Eye,
  Video,
  Download,
  Square,
  ArrowLeft,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  Sparkles,
  Type,
  Minus,
  Plus,
  MoveVertical,
  Move,
  Palette,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { VideoProjectState } from '../types';
import { getDimensionsForAspect, renderCanvasFrame } from '../utils/canvasRenderer';
import { splitTextIntoSegments } from '../utils/textSplitter';
import { audioMixer, prepareDualAudioTrack } from '../utils/audioMixer';
import { safeFixWebm } from '../utils/safeWebmFix';
import { ColorPickerModal } from './ColorPickerModal';
import { useLanguage } from '../context/LanguageContext';

const POPULAR_TEXT_COLORS = [
  '#FFFFFF', // White
  '#FDE047', // Yellow / Gold
  '#F43F5E', // Rose / Red
  '#06B6D4', // Cyan
  '#A855F7', // Violet
  '#4ADE80', // Emerald Green
  '#18181B', // Dark / Black
];

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  state: VideoProjectState;
  onChange: (patch: Partial<VideoProjectState>) => void;
  bgMediaElement: HTMLImageElement | HTMLVideoElement | null;
  onExport?: () => void;
  isExporting?: boolean;
  onApplyPreset?: () => void;
  isAppliedPreset?: boolean;
  onBackToCatalog?: () => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
  state,
  onChange,
  bgMediaElement,
  onApplyPreset,
  isAppliedPreset,
  onBackToCatalog,
}) => {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hideControls, setHideControls] = useState<boolean>(false);

  // Live WebM recording states
  const [isRecordingScreen, setIsRecordingScreen] = useState<boolean>(false);
  const [recordingProgressSec, setRecordingProgressSec] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [recordingNotice, setRecordingNotice] = useState<string | null>(null);
  const [recordingSuccessMsg, setRecordingSuccessMsg] = useState<string | null>(null);

  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Gesture state: Drag text 2D (adjust textPositionX and textPositionY) & Long-press for Font Size popup
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [showFontSizePopup, setShowFontSizePopup] = useState(false);
  const [isTextColorPickerOpen, setIsTextColorPickerOpen] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const pointerDownInfoRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const initialTextPosXRef = useRef<number>(50);
  const initialTextPosYRef = useRef<number>(50);
  const fontSizeLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMovedGestureRef = useRef<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, input, select, textarea, [data-dock="true"], [role="button"]')) {
      return;
    }
    if (e.currentTarget) {
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    }
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    pointerDownInfoRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    initialTextPosXRef.current = state.textPositionX ?? 50;
    initialTextPosYRef.current = state.textPositionY ?? 50;
    hasMovedGestureRef.current = false;

    if (fontSizeLongPressTimerRef.current) {
      clearTimeout(fontSizeLongPressTimerRef.current);
    }

    fontSizeLongPressTimerRef.current = setTimeout(() => {
      if (!hasMovedGestureRef.current) {
        setShowFontSizePopup(true);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(45);
          } catch {}
        }
      }
    }, 450);
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (dragStartYRef.current === 0 && !isDraggingText) return;
    const dx = e.clientX - dragStartXRef.current;
    const dy = e.clientY - dragStartYRef.current;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      hasMovedGestureRef.current = true;
      if (fontSizeLongPressTimerRef.current) {
        clearTimeout(fontSizeLongPressTimerRef.current);
        fontSizeLongPressTimerRef.current = null;
      }

      if (!isDraggingText && dist > 5) {
        setIsDraggingText(true);
      }

      if (isDraggingText || dist > 5) {
        const viewportEl = viewportRef.current;
        if (viewportEl) {
          const rect = viewportEl.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const deltaPercentX = (dx / rect.width) * 100;
            const deltaPercentY = (dy / rect.height) * 100;
            const newX = Math.min(90, Math.max(10, initialTextPosXRef.current + deltaPercentX));
            const newY = Math.min(88, Math.max(12, initialTextPosYRef.current + deltaPercentY));
            if (
              Math.abs(newX - (state.textPositionX ?? 50)) > 0.05 ||
              Math.abs(newY - (state.textPositionY ?? 50)) > 0.05
            ) {
              onChange({ textPositionX: Number(newX.toFixed(1)), textPositionY: Number(newY.toFixed(1)) });
            }
          }
        }
      }
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (fontSizeLongPressTimerRef.current) {
      clearTimeout(fontSizeLongPressTimerRef.current);
      fontSizeLongPressTimerRef.current = null;
    }
    if (isDraggingText) {
      setIsDraggingText(false);
    }
    const hadDrag = dragStartYRef.current !== 0;
    dragStartXRef.current = 0;
    dragStartYRef.current = 0;

    if (!hasMovedGestureRef.current && !isDraggingText) {
      const duration = pointerDownInfoRef.current.time > 0 ? Date.now() - pointerDownInfoRef.current.time : 0;
      pointerDownInfoRef.current.time = 0;
      if (duration < 400 || duration === 0) {
        const viewportEl = viewportRef.current;
        let isTextTap = false;
        if (viewportEl) {
          const rect = viewportEl.getBoundingClientRect();
          if (rect.height > 0) {
            const relativeYPercent = ((e.clientY - rect.top) / rect.height) * 100;
            const textY = state.textPositionY ?? 50;
            if (Math.abs(relativeYPercent - textY) <= 18) {
              setShowFontSizePopup(true);
              isTextTap = true;
            }
          }
        }

        // Tap on screen toggles controls visibility everywhere
        if (!isTextTap) {
          setHideControls((prev) => !prev);
        }
      }
    }
  };

  const currentTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const isPlayingRef = useRef<boolean>(true);
  const isRecordingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const recordingElapsedRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);
  const targetCycleDurationRef = useRef<number>(0);
  const recordedBlobRef = useRef<Blob | null>(null);
  const captureAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const captureAudioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const handleResetRecording = useCallback(() => {
    // Never reset while recording or processing is actively ongoing
    if (isRecordingRef.current || isProcessingRef.current) {
      return;
    }
    if (recordedVideoUrl) {
      try {
        URL.revokeObjectURL(recordedVideoUrl);
      } catch {}
    }
    setRecordedVideoUrl(null);
    recordedBlobRef.current = null;
    recordedChunksRef.current = [];
    setRecordingSuccessMsg(null);
    setRecordingNotice(null);
    setIsRecordingScreen(false);
    isRecordingRef.current = false;
  }, [recordedVideoUrl]);

  // Automatically reset previous recording ONLY when background media URL actually changes
  const prevBgUrlRef = useRef<string | null>(state.bgMediaUrl || null);
  useEffect(() => {
    if (state.bgMediaUrl !== prevBgUrlRef.current) {
      prevBgUrlRef.current = state.bgMediaUrl || null;
      if (!isRecordingRef.current && !isProcessingRef.current) {
        handleResetRecording();
      }
    }
  }, [state.bgMediaUrl, handleResetRecording]);

  // Ensure player always starts playing immediately on open
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      isPlayingRef.current = true;
      currentTimeRef.current = 0;
      if (bgMediaElement instanceof HTMLVideoElement) {
        try {
          bgMediaElement.currentTime = 0;
          bgMediaElement.play().catch(() => {});
        } catch (e) {
          console.warn('Video auto-play deferred:', e);
        }
      }
    }
  }, [isOpen, bgMediaElement]);

  // Clean up recording state whenever fullscreen modal closes so next session starts fresh
  useEffect(() => {
    if (!isOpen) {
      if (isRecordingRef.current) {
        stopLiveScreenRecord();
      }
      if (!isProcessingRef.current) {
        handleResetRecording();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    isRecordingRef.current = isRecordingScreen;
  }, [isRecordingScreen]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Keep track of background video duration
  useEffect(() => {
    if (bgMediaElement instanceof HTMLVideoElement) {
      if (bgMediaElement.duration && !isNaN(bgMediaElement.duration) && isFinite(bgMediaElement.duration)) {
        setVideoDuration(bgMediaElement.duration);
      }
      const handleMeta = () => {
        if (bgMediaElement.duration && !isNaN(bgMediaElement.duration) && isFinite(bgMediaElement.duration)) {
          setVideoDuration(bgMediaElement.duration);
        }
      };
      bgMediaElement.addEventListener('loadedmetadata', handleMeta);
      bgMediaElement.addEventListener('durationchange', handleMeta);
      return () => {
        bgMediaElement.removeEventListener('loadedmetadata', handleMeta);
        bgMediaElement.removeEventListener('durationchange', handleMeta);
      };
    } else {
      setVideoDuration(0);
    }
  }, [bgMediaElement]);

  const hasVideoBg =
    bgMediaElement instanceof HTMLVideoElement &&
    !!videoDuration &&
    videoDuration > 0 &&
    isFinite(videoDuration);

  // Natural text duration
  const { totalDuration: naturalTextDuration } = splitTextIntoSegments(
    state.rawText,
    state.textMode,
    state.speedMultiplier,
    state.pauseBetweenSeconds,
    undefined,
    state.animationStyle
  );

  // Synchronized with video duration if has video background and syncWithVideo is on
  const isSyncWithVideo = Boolean(state.syncWithVideo) && hasVideoBg;
  const effectiveDuration = isSyncWithVideo ? videoDuration : Math.max(1.0, naturalTextDuration);

  // Update target cycle duration ref
  useEffect(() => {
    targetCycleDurationRef.current = effectiveDuration;
  }, [effectiveDuration]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (recordingSuccessMsg) {
      const timer = setTimeout(() => setRecordingSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [recordingSuccessMsg]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (hideControls) {
          setHideControls(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hideControls, onClose]);

  // Sync background video element playback
  useEffect(() => {
    if (!isOpen) {
      if (bgMediaElement instanceof HTMLVideoElement) {
        bgMediaElement.pause();
      }
      return;
    }
    if (bgMediaElement instanceof HTMLVideoElement) {
      const isVideoAudioActive =
        !isMuted &&
        state.audio.videoAudioEnabled !== false &&
        (state.audio.videoVolume ?? 0.8) > 0;

      bgMediaElement.muted = !isVideoAudioActive;
      bgMediaElement.volume = Number.isFinite(state.audio.videoVolume)
        ? Math.max(0, Math.min(1, state.audio.videoVolume ?? 0.8))
        : 0.8;

      if (isPlaying) {
        bgMediaElement.play().catch(() => {});
      } else {
        bgMediaElement.pause();
      }
    }
    return () => {
      if (bgMediaElement instanceof HTMLVideoElement) {
        bgMediaElement.pause();
      }
    };
  }, [
    isOpen,
    isPlaying,
    isMuted,
    bgMediaElement,
    state.audio.videoAudioEnabled,
    state.audio.videoVolume,
  ]);

  // Sync audio mixer playback
  useEffect(() => {
    if (!isOpen) {
      audioMixer.stop();
      return;
    }

    if (isRecordingScreen) {
      audioMixer.stop();
      return;
    }

    if (
      isPlaying &&
      !isMuted &&
      state.audio.enabled &&
      state.audio.sourceType !== 'none' &&
      state.audio.sourceType !== 'video' &&
      (state.audio.volume ?? 0.7) > 0
    ) {
      audioMixer.play(state.audio, effectiveDuration, currentTimeRef.current, state.bgMediaUrl || undefined);
    } else {
      audioMixer.stop();
    }

    return () => {
      if (!isRecordingScreen) {
        audioMixer.stop();
      }
    };
  }, [
    isOpen,
    isPlaying,
    isMuted,
    isRecordingScreen,
    state.audio.enabled,
    state.audio.sourceType,
    state.audio.presetId,
    state.audio.seed,
    state.audio.audioUrl,
    state.audio.volume,
    effectiveDuration,
  ]);

  // Always keep stateRef up to date for smooth 60fps rendering without animation loop teardown
  const stateRef = useRef<VideoProjectState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const dimensions = getDimensionsForAspect(state.aspectRatio);

  // Canvas drawing callback using stateRef for zero jitter
  const drawFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const currentSt = stateRef.current;
      const dims = getDimensionsForAspect(currentSt.aspectRatio);
      if (canvas.width !== dims.width || canvas.height !== dims.height) {
        canvas.width = dims.width;
        canvas.height = dims.height;
      }

      if (bgMediaElement instanceof HTMLVideoElement && bgMediaElement.duration) {
        if (!isPlayingRef.current) {
          const targetTime = time % bgMediaElement.duration;
          if (Math.abs(bgMediaElement.currentTime - targetTime) > 0.05) {
            bgMediaElement.currentTime = targetTime;
          }
        }
      }

      const hasVideo = bgMediaElement instanceof HTMLVideoElement && bgMediaElement.duration > 0;
      const vidDur = hasVideo ? (bgMediaElement as HTMLVideoElement).duration : 0;
      const isSync = Boolean(currentSt.syncWithVideo) && vidDur > 0;
      const renderTargetDur = isSync ? vidDur : undefined;

      renderCanvasFrame({
        ctx,
        state: currentSt,
        currentTime: time,
        bgMediaElement,
        dimensions: dims,
        targetDuration: renderTargetDur,
      });
    },
    [bgMediaElement]
  );

  // Stop live recording cleanly
  const stopLiveScreenRecord = useCallback((cycleDuration?: number) => {
    if (cycleDuration) {
      targetCycleDurationRef.current = cycleDuration;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      isProcessingRef.current = true;
      setIsProcessingVideo(true);
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping media recorder:', err);
        isProcessingRef.current = false;
        setIsProcessingVideo(false);
      }
    }
    setIsRecordingScreen(false);
    isRecordingRef.current = false;
    setHideControls(false);
  }, []);

  // Continuous animation and capture loop
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    currentTimeRef.current = 0;
    lastTimeRef.current = performance.now();

    if (bgMediaElement instanceof HTMLVideoElement) {
      bgMediaElement.muted = isMuted;
      bgMediaElement.loop = true;
      bgMediaElement.currentTime = 0;
      bgMediaElement.play().catch(() => {});
    }
    if (state.audio.enabled && state.audio.sourceType !== 'none') {
      audioMixer.play(state.audio, effectiveDuration, 0, state.bgMediaUrl || undefined);
    }

    const loop = (now: number) => {
      if (isPlayingRef.current) {
        const isRecording = isRecordingRef.current;

        if (isRecording) {
          const nowMs = performance.now();
          const elapsed = (nowMs - recordingStartTimeRef.current) / 1000;
          recordingElapsedRef.current = elapsed;

          if (nowMs - lastProgressUpdateRef.current > 80) {
            lastProgressUpdateRef.current = nowMs;
            setRecordingProgressSec(Math.min(effectiveDuration, elapsed));
          }

          if (elapsed >= effectiveDuration) {
            // Reached exactly 1 full cycle
            currentTimeRef.current = effectiveDuration;
            drawFrame(effectiveDuration);
            stopLiveScreenRecord(effectiveDuration);

            // Seamlessly loop and keep playback running smoothly without freezing
            currentTimeRef.current = 0;
            lastTimeRef.current = now;
            if (bgMediaElement instanceof HTMLVideoElement) {
              bgMediaElement.currentTime = 0;
              bgMediaElement.play().catch(() => {});
            }
            if (state.audio.enabled && state.audio.sourceType !== 'none') {
              audioMixer.play(state.audio, effectiveDuration, 0, state.bgMediaUrl || undefined);
            }
          } else {
            currentTimeRef.current = elapsed;
            drawFrame(elapsed);
          }
        } else {
          // Standard playback (not recording)
          const delta = Math.min(0.1, (now - lastTimeRef.current) / 1000);
          lastTimeRef.current = now;

          let nextTime = currentTimeRef.current + delta;
          if (nextTime >= effectiveDuration) {
            nextTime = 0;
            if (bgMediaElement instanceof HTMLVideoElement) {
              bgMediaElement.currentTime = 0;
              bgMediaElement.play().catch(() => {});
            }
            if (state.audio.enabled && state.audio.sourceType !== 'none') {
              audioMixer.play(state.audio, effectiveDuration, 0, state.bgMediaUrl || undefined);
            }
          }
          currentTimeRef.current = nextTime;
          drawFrame(nextTime);
        }

        // Ensure background video plays smoothly
        if (bgMediaElement instanceof HTMLVideoElement) {
          if (bgMediaElement.ended) {
            bgMediaElement.currentTime = 0;
            bgMediaElement.play().catch(() => {});
          } else if (bgMediaElement.paused && !bgMediaElement.seeking) {
            bgMediaElement.play().catch(() => {});
          }
        }
      } else {
        lastTimeRef.current = now;
        drawFrame(currentTimeRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, effectiveDuration, drawFrame, bgMediaElement, state.audio, stopLiveScreenRecord]);

  // Ensure recorder stops if modal closes
  useEffect(() => {
    if (!isOpen) {
      audioMixer.setRecordingDestination(null);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      setIsRecordingScreen(false);
      isRecordingRef.current = false;
      setRecordingNotice(null);
      setRecordingSuccessMsg(null);
    }
  }, [isOpen]);

  // Direct Live Screen Capture from Canvas in WebM format
  const toggleLiveScreenRecord = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isRecordingScreen) {
      stopLiveScreenRecord();
      return;
    }

    setRecordingNotice(null);
    setRecordingSuccessMsg(null);
    setRecordedVideoUrl(null);
    recordedBlobRef.current = null;
    recordedChunksRef.current = [];
    recordingElapsedRef.current = 0;
    setRecordingProgressSec(0);
    targetCycleDurationRef.current = effectiveDuration;

    // Pre-flight check: ensure canvas.captureStream exists
    if (typeof canvas.captureStream !== 'function') {
      setRecordingNotice(
        'Функция захвата видеопотока не поддерживается данным браузером.'
      );
      return;
    }

    // Ensure canvas dimensions are set and frame 0 is drawn before capturing stream
    const dims = getDimensionsForAspect(state.aspectRatio);
    if (canvas.width !== dims.width || canvas.height !== dims.height) {
      canvas.width = dims.width;
      canvas.height = dims.height;
    }
    currentTimeRef.current = 0;
    drawFrame(0);

    let canvasStream: MediaStream;
    try {
      canvasStream = canvas.captureStream(30);
    } catch (captureErr) {
      console.warn('Live screen capture unavailable on canvas:', captureErr);
      setRecordingNotice('Не удалось захватить видеопоток с холста.');
      return;
    }

    // Prepare audio track (video audio + music generator/file)
    const isBgVideo =
      (state.bgType === 'video' || state.bgMediaType === 'video' || bgMediaElement instanceof HTMLVideoElement) &&
      Boolean(state.bgMediaUrl);

    let mixedAudioBuffer: AudioBuffer | null = null;
    try {
      mixedAudioBuffer = await prepareDualAudioTrack(
        state.audio,
        state.bgMediaUrl,
        isBgVideo,
        effectiveDuration
      );
    } catch (audioPrepErr) {
      console.warn('Could not prepare dual audio track:', audioPrepErr);
    }

    const combinedStream = new MediaStream();
    canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));

    if (mixedAudioBuffer) {
      try {
        const audioCtx = audioMixer.getAudioContext();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        const audioDest = audioCtx.createMediaStreamDestination();
        captureAudioDestRef.current = audioDest;

        const sourceNode = audioCtx.createBufferSource();
        sourceNode.buffer = mixedAudioBuffer;
        sourceNode.loop = true;
        captureAudioSourceRef.current = sourceNode;

        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);

        sourceNode.connect(gainNode);
        gainNode.connect(audioDest);
        if (!isMuted) {
          gainNode.connect(audioCtx.destination);
        }

        const tracks = audioDest.stream.getAudioTracks();
        if (tracks.length > 0) {
          combinedStream.addTrack(tracks[0]);
        }
      } catch (audioSetupErr) {
        console.warn('Audio setup error during capture:', audioSetupErr);
      }
    }

    try {
      const hasAudioTrack = combinedStream.getAudioTracks().length > 0;
      let mimeType = 'video/webm';
      if (hasAudioTrack) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        }
      } else {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        }
      }

      const recorderOptions: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond: 4_500_000,
      };
      if (hasAudioTrack) {
        recorderOptions.audioBitsPerSecond = 192_000;
      }

      const recorder = new MediaRecorder(combinedStream, recorderOptions);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        isProcessingRef.current = true;
        setIsProcessingVideo(true);

        // Stop & disconnect recording audio source
        if (captureAudioSourceRef.current) {
          try {
            captureAudioSourceRef.current.stop();
            captureAudioSourceRef.current.disconnect();
          } catch {}
          captureAudioSourceRef.current = null;
        }
        if (captureAudioDestRef.current) {
          try {
            captureAudioDestRef.current.disconnect();
          } catch {}
          captureAudioDestRef.current = null;
        }

        // Restore video element audio mute state
        if (bgMediaElement instanceof HTMLVideoElement) {
          bgMediaElement.muted = isMuted;
        }

        try {
          if (!recordedChunksRef.current || recordedChunksRef.current.length === 0) {
            throw new Error('Файл записи не содержит данных (0 фрагментов).');
          }

          const rawBlob = new Blob(recordedChunksRef.current, { type: mimeType });
          if (rawBlob.size === 0) {
            throw new Error('Записанный файл пуст (0 байт).');
          }

          const durSec = targetCycleDurationRef.current || effectiveDuration;
          let finalBlob = rawBlob;

          try {
            finalBlob = await safeFixWebm(rawBlob, durSec);
          } catch (fixErr) {
            console.warn('Could not remux WebM duration, using raw blob:', fixErr);
            finalBlob = rawBlob;
          }

          if (!finalBlob || finalBlob.size === 0) {
            finalBlob = rawBlob;
          }

          const url = URL.createObjectURL(finalBlob);
          recordedBlobRef.current = finalBlob;
          setRecordedVideoUrl(url);
          setRecordingSuccessMsg(`Готово! Видео WebM (${durSec.toFixed(1)}с) готово к скачиванию`);
        } catch (err) {
          console.error('Error in onstop:', err);
          setRecordingNotice('Не удалось сохранить видео WebM. Попробуйте еще раз.');
        } finally {
          isProcessingRef.current = false;
          setIsProcessingVideo(false);
          setIsRecordingScreen(false);
          isRecordingRef.current = false;
        }
      };

      recorder.onerror = (e) => {
        console.warn('MediaRecorder error during capture:', e);
        if (captureAudioSourceRef.current) {
          try {
            captureAudioSourceRef.current.stop();
            captureAudioSourceRef.current.disconnect();
          } catch {}
          captureAudioSourceRef.current = null;
        }
        if (bgMediaElement instanceof HTMLVideoElement) {
          bgMediaElement.muted = isMuted;
        }
        isProcessingRef.current = false;
        setIsProcessingVideo(false);
        setIsRecordingScreen(false);
        isRecordingRef.current = false;
        setRecordingNotice('Ошибка при записи видео.');
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      // Ensure normal audioMixer is stopped so only captureAudioSource plays to destination
      audioMixer.stop();

      if (captureAudioSourceRef.current) {
        try {
          captureAudioSourceRef.current.start(0);
        } catch {}
      }

      if (bgMediaElement instanceof HTMLVideoElement) {
        bgMediaElement.muted = true;
        bgMediaElement.currentTime = 0;
        bgMediaElement.play().catch(() => {});
      }

      // Start timing exactly with recorder start
      recordingStartTimeRef.current = performance.now();
      lastTimeRef.current = performance.now();
      setIsPlaying(true);
      isPlayingRef.current = true;
      setIsRecordingScreen(true);
      isRecordingRef.current = true;
    } catch (err) {
      console.error('Error starting live screen recording:', err);
      if (captureAudioSourceRef.current) {
        try {
          captureAudioSourceRef.current.stop();
          captureAudioSourceRef.current.disconnect();
        } catch {}
        captureAudioSourceRef.current = null;
      }
      setIsRecordingScreen(false);
      isRecordingRef.current = false;
      setRecordingNotice('Не удалось начать запись экрана. Попробуйте еще раз.');
    }
  };

  const handleSaveRecordedVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const durSec = targetCycleDurationRef.current || effectiveDuration;
    const filename = `animator-quote-${Math.round(durSec)}s-${Date.now()}.webm`;

    const blob = recordedBlobRef.current;
    if (!blob || blob.size === 0) {
      setRecordingNotice('Файл записи еще не сформирован или пуст. Повторите захват.');
      return;
    }

    const url = URL.createObjectURL(blob);

    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      a.target = '_self';
      document.body.appendChild(a);
      a.click();
      setRecordingSuccessMsg('Скачивание WebM начато!');

      setTimeout(() => {
        try {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch {}
      }, 60000);
    } catch (dlErr) {
      console.error('Download error:', dlErr);
      setRecordingNotice('Не удалось начать скачивание. Попробуйте нажать кнопку еще раз.');
    }
  };

  const handleRestart = () => {
    currentTimeRef.current = 0;
    lastTimeRef.current = performance.now();
    if (bgMediaElement instanceof HTMLVideoElement) {
      bgMediaElement.currentTime = 0;
      bgMediaElement.play().catch(() => {});
    }
    if (state.audio.enabled && state.audio.sourceType !== 'none') {
      audioMixer.play(state.audio, effectiveDuration, 0, state.bgMediaUrl || undefined);
    }
    drawFrame(0);
    setIsPlaying(true);
    isPlayingRef.current = true;
  };

  const togglePlay = () => {
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);
    isPlayingRef.current = nextPlay;
    if (nextPlay) {
      lastTimeRef.current = performance.now();
      if (bgMediaElement instanceof HTMLVideoElement) {
        bgMediaElement.play().catch(() => {});
      }
      if (state.audio.enabled && state.audio.sourceType !== 'none') {
        audioMixer.play(state.audio, effectiveDuration, currentTimeRef.current, state.bgMediaUrl || undefined);
      }
    } else {
      if (bgMediaElement instanceof HTMLVideoElement) {
        bgMediaElement.pause();
      }
      audioMixer.stop();
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (bgMediaElement instanceof HTMLVideoElement) {
      bgMediaElement.muted = nextMute;
    }
    if (nextMute) {
      audioMixer.stop();
    } else if (isPlaying && state.audio.enabled && state.audio.sourceType !== 'none') {
      audioMixer.play(state.audio, effectiveDuration, currentTimeRef.current, state.bgMediaUrl || undefined);
    }
  };

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[9999999] w-screen h-screen bg-black flex flex-col items-center justify-center select-none overflow-hidden pointer-events-auto"
    >
      {/* Active Recording Floating Status Pill */}
      {isRecordingScreen && (
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-black/90 backdrop-blur-md border border-rose-500/60 px-3.5 py-1.5 rounded-full shadow-2xl animate-fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="text-white text-xs font-semibold select-none whitespace-nowrap">
            {t('recordingWebm', 'Запись WebM:')} {recordingProgressSec.toFixed(1)} / {effectiveDuration.toFixed(1)}{t('sec', 'с')}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              stopLiveScreenRecord();
            }}
            className="px-2.5 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-sm active:scale-95 shrink-0"
            title={t('stopRecording', 'Остановить запись')}
          >
            ⏹ {t('stopBtn', 'Стоп')}
          </button>
        </div>
      )}

      {/* Recording Finished Success Notification Banner */}
      {recordingSuccessMsg && !isRecordingScreen && (
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 max-w-sm w-11/12 bg-zinc-900/90 border border-emerald-500/50 text-emerald-200 px-3 py-1.5 rounded-xl text-xs z-50 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-100 truncate text-[11px] sm:text-xs">
              {recordingSuccessMsg}
            </span>
          </div>
          <button
            onClick={() => setRecordingSuccessMsg(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-emerald-400 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Eye Overlay Button without circular border, aligned in same row as orientation panel */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setHideControls((prev) => !prev);
        }}
        className="absolute top-2 sm:top-3 right-3 sm:right-4 z-50 p-1 text-purple-300 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95 pointer-events-auto filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
        title={hideControls ? t('showMenu', 'Показать меню') : t('cleanScreen', 'Чистый экран')}
      >
        {hideControls ? (
          <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300 hover:text-white" />
        ) : (
          <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300 hover:text-white" />
        )}
      </button>

      {/* Top Floating Centered Aspect Ratio Switcher */}
      <div
        className={`absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
          hideControls ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 bg-black/75 backdrop-blur-md border border-white/20 rounded-xl p-0.5 sm:p-1 shadow-2xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ aspectRatio: '9:16' });
            }}
            className={`px-2 py-0.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              state.aspectRatio === '9:16'
                ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                : 'bg-transparent border-transparent text-white/70 hover:text-white'
            }`}
            title="9:16 (Reels / Shorts / TikTok)"
          >
            9:16
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ aspectRatio: '16:9' });
            }}
            className={`px-2 py-0.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              state.aspectRatio === '16:9'
                ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                : 'bg-transparent border-transparent text-white/70 hover:text-white'
            }`}
            title="16:9 (YouTube)"
          >
            16:9
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ aspectRatio: '1:1' });
            }}
            className={`px-2 py-0.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              state.aspectRatio === '1:1'
                ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                : 'bg-transparent border-transparent text-white/70 hover:text-white'
            }`}
            title="1:1 (Post)"
          >
            1:1
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {recordingNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 max-w-md w-11/12 bg-amber-500/15 border border-amber-500/40 text-amber-200 px-3.5 py-2 rounded-xl text-xs z-40 shadow-2xl backdrop-blur-md flex items-center justify-between gap-2 animate-fade-in">
          <span>{recordingNotice}</span>
          <button
            onClick={() => setRecordingNotice(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-amber-300 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div
        ref={viewportRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full flex items-center justify-center overflow-hidden p-1 sm:p-4 select-none touch-none relative"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="max-h-full max-w-full object-contain shadow-2xl rounded-none sm:rounded-lg cursor-pointer transition-transform"
          style={{
            aspectRatio: `${dimensions.width} / ${dimensions.height}`,
          }}
        />

        {/* Live 2D Drag Guideline and Badge */}
        {isDraggingText && (
          <div
            className="absolute inset-x-4 sm:inset-x-12 z-40 pointer-events-none flex flex-col items-center transition-all duration-75"
            style={{ top: `${state.textPositionY ?? 50}%` }}
          >
            <div className="w-full border-t-2 border-dashed border-purple-400 shadow-sm" />
            <div className="-mt-3 px-3.5 py-1 rounded-full bg-purple-600 text-white text-xs font-bold shadow-2xl border border-purple-300 flex items-center gap-1.5 animate-in fade-in zoom-in-95">
              <Move className="w-3.5 h-3.5 animate-pulse" />
              <span>X: {state.textPositionX ?? 50}%, Y: {state.textPositionY ?? 50}%</span>
            </div>
          </div>
        )}

        {/* Floating Font Size & Color Adjustment Popup */}
        {showFontSizePopup && (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setShowFontSizePopup(false);
              }}
            />
            <div
              data-dock="true"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-72 p-3 rounded-2xl bg-[#161622]/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl shadow-black z-50 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            >
              {/* Top: TT Icon + Range Slider */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center text-purple-300 font-serif font-bold text-sm select-none shrink-0 w-5">
                  <span className="tracking-tighter text-sm">Тт</span>
                </div>

                <input
                  type="range"
                  min="18"
                  max="500"
                  step="2"
                  value={state.fontSize || 42}
                  onChange={(e) =>
                    onChange({ fontSize: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-purple-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                />

                <div className="flex items-center shrink-0">
                  <input
                    type="number"
                    min="18"
                    max="1000"
                    value={state.fontSize || 42}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) onChange({ fontSize: Math.max(10, Math.min(1000, val)) });
                    }}
                    className="w-11 bg-zinc-800/90 border border-white/20 rounded px-1 py-0.5 text-center font-mono text-[10px] text-purple-300 font-bold focus:outline-none focus:border-purple-400"
                  />
                  <span className="text-[9px] font-mono text-purple-300 ml-0.5">px</span>
                </div>
              </div>

              {/* Bottom: Main Color Palette row + Last square for Full Color Picker / Mixer */}
              <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/10">
                {POPULAR_TEXT_COLORS.map((color) => {
                  const isSelected = (state.textColor || '#ffffff').toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onChange({ textColor: color })}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-transform flex items-center justify-center cursor-pointer shadow-sm ${
                        isSelected
                          ? 'scale-110 ring-2 ring-purple-400 ring-offset-1 ring-offset-black'
                          : 'hover:scale-105 opacity-90 hover:opacity-100 border border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            color === '#FFFFFF' || color === '#FDE047' ? 'text-black' : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}

                {/* Last square: rainbow gradient icon launcher for ColorPickerModal / mixer */}
                <button
                  type="button"
                  onClick={() => setIsTextColorPickerOpen(true)}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-400 p-0.5 shadow-md flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform border border-white/30"
                  title={t('colorPaletteMixer', 'Палитра цветов и микшер')}
                >
                  <Palette className="w-3.5 h-3.5 text-white drop-shadow" />
                </button>
              </div>

              {/* Formatting: Checkbox "Заглавные" (Uppercase) & 3 Alignment Buttons (Left, Center, Right) */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 select-none">
                {/* Checkbox Заглавные */}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-200 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(state.isUppercase)}
                    onChange={(e) => onChange({ isUppercase: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-500"
                  />
                  <span className="text-[11px] sm:text-xs font-semibold">{t('uppercase', 'Заглавные')}</span>
                </label>

                {/* 3 Alignment Buttons */}
                <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/10 gap-0.5">
                  <button
                    type="button"
                    onClick={() => onChange({ textAlign: 'left' })}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                      state.textAlign === 'left'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t('alignLeft', 'По левому краю')}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ textAlign: 'center' })}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                      state.textAlign === 'center' || !state.textAlign
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t('alignCenter', 'По центру')}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ textAlign: 'right' })}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                      state.textAlign === 'right'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                    title={t('alignRight', 'По правому краю')}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Full Color Picker & Mixer Modal */}
        <ColorPickerModal
          isOpen={isTextColorPickerOpen}
          onClose={() => setIsTextColorPickerOpen(false)}
          color={state.textColor || '#ffffff'}
          onChange={(newColor) => onChange({ textColor: newColor })}
          title={t('textColor', 'Цвет текста')}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <div
        data-dock="true"
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className={`absolute bottom-2 sm:bottom-4 inset-x-0 flex justify-center items-center z-30 transition-all duration-300 px-1 sm:px-2 ${
          hideControls ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-black/90 backdrop-blur-xl border border-white/15 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-2xl overflow-x-auto no-scrollbar flex-nowrap shrink-0 max-w-[98vw]">
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-600/40 cursor-pointer transition-all active:scale-95 shrink-0"
            title={isPlaying ? t('pause', 'Пауза') : t('play', 'Воспроизведение')}
            aria-label={isPlaying ? t('pause', 'Пауза') : t('play', 'Воспроизведение')}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />}
          </button>

          {/* Restart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRestart();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
            title={t('fromStart', 'С начала')}
            aria-label={t('fromStart', 'С начала')}
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Mute / Unmute Sound Toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 backdrop-blur-md shadow-md ${
              isMuted
                ? 'bg-zinc-800/90 hover:bg-zinc-700 text-rose-400 border-rose-500/30'
                : 'bg-zinc-800/90 hover:bg-zinc-700 text-emerald-400 border-emerald-500/30'
            }`}
            title={isMuted ? t('unmute', 'Включить звук') : t('mute', 'Выключить звук')}
            aria-label={isMuted ? t('unmute', 'Включить звук') : t('mute', 'Выключить звук')}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          {/* ФиксТхт & ФиксВид Buttons (Only in main editor mode) */}
          {!onApplyPreset && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ syncWithVideo: false });
                }}
                className={`px-1.5 sm:px-2 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-semibold flex items-center gap-0.5 sm:gap-1 transition-all cursor-pointer select-none whitespace-nowrap shrink-0 ${
                  !isSyncWithVideo
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40 border border-purple-400/40'
                    : 'bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/10'
                }`}
                title={`${t('fixTxt', 'ФиксТхт')}: ${naturalTextDuration.toFixed(1)}${t('sec', 'с')}`}
              >
                <span><span className="hidden xs:inline">{t('fixTxt', 'ФиксТхт')}</span><span className="xs:hidden">Тхт</span> ({naturalTextDuration.toFixed(1)}{t('sec', 'с')})</span>
              </button>

              {hasVideoBg && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ syncWithVideo: true });
                    }}
                    className={`px-1.5 sm:px-2 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-semibold flex items-center gap-0.5 sm:gap-1 transition-all cursor-pointer select-none whitespace-nowrap shrink-0 ${
                      isSyncWithVideo
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40 border border-purple-400/40'
                        : 'bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/10'
                    }`}
                    title={`${t('fixVid', 'ФиксВид')}: ${videoDuration.toFixed(1)}${t('sec', 'с')}`}
                  >
                    <span><span className="hidden xs:inline">{t('fixVid', 'ФиксВид')}</span><span className="xs:hidden">Вид</span> ({videoDuration.toFixed(1)}{t('sec', 'с')})</span>
                  </button>

                  {isSyncWithVideo && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange({ textLoopMode: state.textLoopMode === 'loop' ? 'stretch' : 'loop' });
                      }}
                      className="px-1.5 py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 transition-all cursor-pointer select-none whitespace-nowrap shrink-0"
                      title={state.textLoopMode === 'loop' ? t('loop', 'Цикл') : t('smooth', 'Плавная')}
                    >
                      {state.textLoopMode === 'loop' ? t('loop', 'Цикл') : t('smooth', 'Плавная')}
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Separator */}
          <div className="w-px h-3.5 sm:h-4 bg-white/20 shrink-0 my-auto" />

          {/* Record / Processing / Download WebM Button */}
          {recordedVideoUrl && !isRecordingScreen && !isProcessingVideo ? (
            <button
              type="button"
              onClick={handleSaveRecordedVideo}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-teal-500 hover:bg-teal-400 text-white flex items-center justify-center shadow-md shadow-teal-500/40 transition-all cursor-pointer select-none active:scale-95 animate-bounce shrink-0"
              title={t('downloadWebm', 'Скачать видео WebM')}
              aria-label={t('downloadWebm', 'Скачать видео WebM')}
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.5]" />
            </button>
          ) : isProcessingVideo ? (
            <button
              type="button"
              disabled
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700/60 flex items-center justify-center cursor-not-allowed opacity-80 shrink-0 select-none"
              title={t('processing', 'Обработка...')}
              aria-label={t('processing', 'Обработка...')}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 animate-spin" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleLiveScreenRecord();
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 shrink-0 border-2 ${
                isRecordingScreen
                  ? 'bg-rose-600 text-white animate-pulse border-rose-300 shadow-lg shadow-rose-600/50'
                  : 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 hover:text-white border-rose-500/90 hover:border-rose-400 shadow-md shadow-rose-950/40'
              }`}
              title={
                isRecordingScreen
                  ? t('stopRecording', 'Остановить запись')
                  : `${t('captureScreen', 'Захват видео')} WebM (${effectiveDuration.toFixed(1)}${t('sec', 'с')})`
              }
              aria-label={
                isRecordingScreen ? t('stopRecording', 'Остановить запись') : t('captureScreen', 'Захват видео')
              }
            >
              {isRecordingScreen ? (
                <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white text-white" />
              ) : (
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              )}
            </button>
          )}

          {/* Apply Preset & Back to Catalog Buttons in Dock (Catalog Preview Mode) */}
          {onApplyPreset && (
            <>
              <div className="w-px h-3.5 sm:h-4 bg-white/20 shrink-0 my-auto" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyPreset();
                }}
                className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer select-none shrink-0 shadow-lg active:scale-95 ${
                  isAppliedPreset
                    ? 'bg-emerald-500 text-white shadow-emerald-900/50'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/60 border border-purple-300/40'
                }`}
                title={isAppliedPreset ? t('applied', 'Применен') : t('apply', 'Применить')}
              >
                {isAppliedPreset ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('applied', 'Применен')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                    <span>{t('apply', 'Применить')}</span>
                  </>
                )}
              </button>

              {onBackToCatalog && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBackToCatalog();
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer select-none shrink-0 shadow-lg active:scale-95 group"
                  title={t('backToCatalog', 'Назад в каталог')}
                  aria-label={t('backToCatalog', 'Назад в каталог')}
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}
            </>
          )}

          {/* Separator */}
          <div className="w-px h-3.5 sm:h-4 bg-white/20 shrink-0 my-auto" />

          {/* Close X Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 shadow-md"
            title={t('closeFullscreen', 'Закрыть')}
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
