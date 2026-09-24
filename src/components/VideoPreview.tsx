import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Square,
  Maximize2,
  Upload,
  Film,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Music,
  X,
  Sliders,
  Eye,
  Video,
  MoveVertical,
  Move,
  Type,
  Minus,
  Plus,
  Palette,
  Check,
  FolderHeart,
  BookmarkPlus,
  Download,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { AnimationStyle, ExtraEffects, TextMode, VideoProjectState } from '../types';
import { FONT_OPTIONS } from '../data/presets';
import { BUILTIN_PRESETS, SavedPreset } from '../data/presetLibrary';
import { SavePresetModal } from './SavePresetModal';
import { PresetsCatalogModal } from './PresetsCatalogModal';
import { LoadPresetPromptModal } from './LoadPresetPromptModal';
import {
  getDimensionsForAspect,
  renderCanvasFrame,
} from '../utils/canvasRenderer';
import { splitTextIntoSegments } from '../utils/textSplitter';
import { audioMixer } from '../utils/audioMixer';
import { FullscreenPlayer } from './FullscreenPlayer';
import { ColorPickerModal } from './ColorPickerModal';
import { useLanguage } from '../context/LanguageContext';

import { EditingFocusInfo } from './TextInputSection';

const TextSparkleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Capital T */}
    <path
      d="M7 6.5h10M12 6.5v12M9.5 18.5h5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Top-Right 4-point sparkle star */}
    <path
      d="M19.5 1.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6.6-1.8z"
      fill="currentColor"
    />
    {/* Bottom-Left 4-point sparkle star */}
    <path
      d="M4.5 14.5l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5.5-1.4z"
      fill="currentColor"
    />
    {/* Top-Left mini star */}
    <path
      d="M4 4l.3.9.9.3-.9.3-.3.9-.3-.9-.9-.3.9-.3.3-.9z"
      fill="currentColor"
    />
  </svg>
);

const POPULAR_TEXT_COLORS = [
  '#FFFFFF', // White
  '#FDE047', // Yellow / Gold
  '#F43F5E', // Rose / Red
  '#06B6D4', // Cyan
  '#A855F7', // Violet
  '#4ADE80', // Emerald Green
  '#18181B', // Dark / Black
];

const FULLSCREEN_TOOLS = [
  { num: 1, labelKey: 'tool_btn_1', defaultLabel: 'Текст' },
  { num: 2, labelKey: 'tool_btn_2', defaultLabel: 'Шрифт' },
  { num: 3, labelKey: 'tool_btn_3', defaultLabel: 'Фон' },
  { num: 4, labelKey: 'tool_btn_4', defaultLabel: 'Звук' },
  { num: 5, labelKey: 'tool_btn_5', defaultLabel: 'Режим' },
  { num: 6, labelKey: 'tool_btn_6', defaultLabel: 'Анимация' },
  { num: 7, labelKey: 'tool_btn_7', defaultLabel: 'Эффекты' },
  { num: 8, labelKey: 'tool_btn_8', defaultLabel: 'Скорость' },
];

interface VideoPreviewProps {
  state: VideoProjectState;
  onChange: (patch: Partial<VideoProjectState>) => void;
  bgMediaElement: HTMLImageElement | HTMLVideoElement | null;
  onExportClick?: () => void;
  isExporting?: boolean;
  onFileUpload?: (file: File) => void;
  isMediaLoading?: boolean;
  uploadSuccess?: boolean;
  uploadError?: string | null;
  onDismissError?: () => void;
  onRetryUpload?: () => void;
  isFullscreenOpen?: boolean;
  onOpenFullscreen?: () => void;
  onCloseFullscreen?: () => void;
  editingInfo?: EditingFocusInfo | null;
  isPinnedProp?: boolean;
  onTogglePinProp?: () => void;
  onNavigateToTool?: (toolNumber: number) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  state,
  onChange,
  bgMediaElement,
  onExportClick,
  isExporting,
  onFileUpload,
  isMediaLoading,
  uploadSuccess,
  uploadError,
  onDismissError,
  onRetryUpload,
  isFullscreenOpen,
  onOpenFullscreen,
  onCloseFullscreen,
  editingInfo,
  isPinnedProp,
  onTogglePinProp,
  onNavigateToTool,
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isVolumePopupOpen, setIsVolumePopupOpen] = useState<boolean>(false);
  const [pinToast, setPinToast] = useState<string | null>(null);
  const [showRightTools, setShowRightTools] = useState<boolean>(false);
  const [showLeftPresets, setShowLeftPresets] = useState<boolean>(false);
  const [hideControls, setHideControls] = useState<boolean>(false);
  const [isTextColorPickerOpen, setIsTextColorPickerOpen] = useState<boolean>(false);

  // New Presets State (Catalog, Save Modal, Load Prompt Modal)
  const LOCAL_PRESETS_KEY = 'vibe_quote_user_presets';
  const [userPresets, setUserPresets] = useState<SavedPreset[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [loadPromptPreset, setLoadPromptPreset] = useState<SavedPreset | null>(null);
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [catalogFullscreenPreset, setCatalogFullscreenPreset] = useState<SavedPreset | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleFullscreenChange = useCallback((patch: Partial<VideoProjectState>) => {
    onChange(patch);
    if (catalogFullscreenPreset) {
      setCatalogFullscreenPreset((prev) =>
        prev
          ? {
              ...prev,
              state: {
                ...prev.state,
                ...patch,
              },
            }
          : null
      );
    }
  }, [onChange, catalogFullscreenPreset]);

  // Load user custom saved presets on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_PRESETS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserPresets(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading user presets:', e);
    }
  }, []);

  const handleSaveToCatalog = (preset: SavedPreset) => {
    const updated = [preset, ...userPresets];
    setUserPresets(updated);
    try {
      localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving preset:', e);
    }
    setPinToast('Шаблон сохранен в Каталог!');
    setTimeout(() => setPinToast(null), 3000);
  };

  const handleExportPreset = (preset: SavedPreset, fileNameOverride?: string) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = (preset.name || 'preset').replace(/[^a-z0-9а-яë]/gi, '_');
    const safeAuthor = (preset.author || 'author').replace(/[^a-z0-9а-яë]/gi, '_');
    const fileName =
      fileNameOverride || `TypeMixer_preset__${safeName}__${safeAuthor}__${dateStr}.json`;

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(preset, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setPinToast('Файл скачан!');
    setTimeout(() => setPinToast(null), 3000);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);

        if (imported && (imported.state || imported.fontFamily || imported.textColor)) {
          const presetState = imported.state || imported;
          const importedName = imported.name || file.name.replace(/\.json$/i, '');
          const importedAuthor = imported.author || 'Импортирован';
          const fontName = (presetState.fontFamily || state.fontFamily || 'sans-serif')
            .split(',')[0]
            .replace(/['"]/g, '')
            .trim();

          const newPreset: SavedPreset = {
            id: `imported-${Date.now()}`,
            name: importedName,
            author: importedAuthor,
            createdAt: Date.now(),
            isBuiltIn: false,
            category: 'Импортированный',
            previewBg:
              imported.previewBg ||
              presetState.bgCustomColor ||
              'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            previewFontFamily: presetState.fontFamily || state.fontFamily,
            previewFontName: fontName,
            previewTextColor: presetState.textColor || state.textColor,
            state: presetState,
          };

          // Apply state while strictly preserving user's current rawText and authorText
          const finalAppliedState: VideoProjectState = {
            ...state,
            ...presetState,
            rawText: state.rawText,
            authorText: state.authorText,
            textMode: state.textMode,
          };
          onChange(finalAppliedState);

          // Open Fullscreen player right away!
          openFullscreen();

          // Show prompt modal asking if user wants to save to catalog
          setLoadPromptPreset(newPreset);
        } else {
          alert('Не удалось распознать структуру шаблона JSON.');
        }
      } catch (err) {
        console.error('JSON import error:', err);
        alert('Ошибка при чтении файла JSON.');
      }
    };
    reader.readAsText(file);

    if (jsonFileInputRef.current) {
      jsonFileInputRef.current.value = '';
    }
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = userPresets.filter((p) => p.id !== presetId);
    setUserPresets(updated);
    try {
      localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed deleting preset:', e);
    }
    setPinToast('Шаблон удален из каталога');
    setTimeout(() => setPinToast(null), 3000);
  };

  const handleApplyPreset = (preset: SavedPreset) => {
    // Preserve user's active rawText and authorText so applying preset NEVER wipes out what user typed
    const finalState: VideoProjectState = {
      ...state,
      ...preset.state,
      rawText: state.rawText,
      authorText: state.authorText,
      textMode: state.textMode,
    };
    onChange(finalState);
    setAppliedPresetId(preset.id);
    setPinToast(`Применен шаблон "${preset.name}"`);
    setTimeout(() => {
      setAppliedPresetId(null);
      setPinToast(null);
    }, 2000);
  };
  const pointerDownInfoRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  // Pin state: expands preview to fullscreen overlay with scroll-lock, unpin shrinks to compact 1/3 view
  const [internalIsPinned, setInternalIsPinned] = useState<boolean>(false);
  const isPinned = isPinnedProp !== undefined ? isPinnedProp : internalIsPinned;

  const isFullscreenActive = Boolean(
    isFullscreenOpen || isFullscreenModalOpen || catalogFullscreenPreset
  );

  // When Fullscreen, Template Fullscreen, Recording Studio, or Export is active, immediately halt all preview playback
  useEffect(() => {
    if (isFullscreenActive || isExporting) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      audioMixer.stop();
      if (bgMediaElement instanceof HTMLVideoElement) {
        bgMediaElement.pause();
        bgMediaElement.muted = true;
      }
    }
  }, [isFullscreenActive, isExporting, bgMediaElement]);

  const currentTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const isPlayingRef = useRef<boolean>(true);

  // Prevent background scroll when pinned to fullscreen
  useEffect(() => {
    if (isPinned) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPinned]);

  // Escape key to unpin back to compact 1/3 view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPinned) {
        togglePin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinned]);

  // Long press timer for Volume slider popup on the preview sound button
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  // Gesture state: Drag text 2D (adjust textPositionX and textPositionY) & Long-press on canvas for Font Size popup
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [showFontSizePopup, setShowFontSizePopup] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const initialTextPosXRef = useRef<number>(50);
  const initialTextPosYRef = useRef<number>(50);
  const fontSizeLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasMovedGestureRef = useRef<boolean>(false);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const handleStagePointerDown = (e: React.PointerEvent) => {
    // Ignore right click
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement | null;
    if (target && target.closest('button, input, select, textarea, [data-dock="true"], [role="button"]')) {
      return;
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

    if (dist > 5) {
      hasMovedGestureRef.current = true;
      if (fontSizeLongPressTimerRef.current) {
        clearTimeout(fontSizeLongPressTimerRef.current);
        fontSizeLongPressTimerRef.current = null;
      }

      if (!isDraggingText && dist > 8) {
        setIsDraggingText(true);
      }

      if (isDraggingText || dist > 8) {
        const containerEl = stageContainerRef.current;
        if (containerEl) {
          const rect = containerEl.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const deltaPercentX = (dx / rect.width) * 100;
            const deltaPercentY = (dy / rect.height) * 100;
            const newX = Math.round(Math.min(90, Math.max(10, initialTextPosXRef.current + deltaPercentX)));
            const newY = Math.round(Math.min(88, Math.max(12, initialTextPosYRef.current + deltaPercentY)));
            if (newX !== state.textPositionX || newY !== state.textPositionY) {
              onChange({ textPositionX: newX, textPositionY: newY });
            }
          }
        }
      }
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
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

    if (!hasMovedGestureRef.current && !isDraggingText && hadDrag) {
      const duration = Date.now() - pointerDownInfoRef.current.time;
      if (duration < 400) {
        // If controls are hidden, tapping anywhere on screen restores them
        if (hideControls) {
          setHideControls(false);
          return;
        }

        const containerEl = stageContainerRef.current;
        const rect = containerEl ? containerEl.getBoundingClientRect() : null;

        // 1. If right tools or left presets were open, tapping anywhere else dismisses them
        if (showRightTools || showLeftPresets) {
          setShowRightTools(false);
          setShowLeftPresets(false);
          return;
        }

        // 2. Tap on or near text vertically opens font size & color adjustment panel
        let isTextTap = false;
        if (rect && rect.height > 0) {
          const relativeYPercent = ((e.clientY - rect.top) / rect.height) * 100;
          const textY = state.textPositionY ?? 50;
          if (Math.abs(relativeYPercent - textY) <= 24) {
            setShowFontSizePopup(true);
            isTextTap = true;
            return;
          }
        }

        // 3. Tap on video canvas background toggles controls visibility
        if (!isTextTap) {
          setHideControls((prev) => !prev);
        }
      }
    }
  };

  const handleSoundTouchStart = () => {
    // Ensure stage font size timer is cancelled immediately when touching sound button
    if (fontSizeLongPressTimerRef.current) {
      clearTimeout(fontSizeLongPressTimerRef.current);
      fontSizeLongPressTimerRef.current = null;
    }
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setIsVolumePopupOpen(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch {}
      }
    }, 300);
  };

  const handleSoundTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const isEffectivelyMuted = isMuted || (state.audio.volume ?? 0) === 0;

  const handleSoundClick = (e: React.MouseEvent) => {
    if (isLongPressActiveRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressActiveRef.current = false;
      return;
    }
    if (isEffectivelyMuted) {
      setIsMuted(false);
      if ((state.audio.volume ?? 0) === 0) {
        audioMixer.setVolume(0.5);
        onChange({
          audio: {
            ...state.audio,
            volume: 0.5,
            enabled: true,
          },
        });
      }
    } else {
      setIsMuted(true);
    }
  };

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const togglePin = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isPinned) {
      if (onTogglePinProp) {
        onTogglePinProp();
      } else {
        setInternalIsPinned(false);
      }
    } else {
      if (onTogglePinProp) {
        onTogglePinProp();
      } else {
        setInternalIsPinned(true);
      }
    }
    const next = !isPinned;
    setPinToast(
      next
        ? t('pinnedToast', 'Полноэкранный режим')
        : t('unpinnedToast', 'Обычный режим (2/3 экрана)')
    );
    setTimeout(() => setPinToast(null), 1600);
  };

  // Compute total duration
  const { totalDuration } = splitTextIntoSegments(
    state.rawText,
    state.textMode,
    state.speedMultiplier,
    state.pauseBetweenSeconds,
    undefined,
    state.animationStyle
  );

  // Sync background video element state & playback (only when fullscreen and export are NOT active)
  useEffect(() => {
    if (isFullscreenActive || isExporting) {
      if (bgMediaElement instanceof HTMLVideoElement) {
        bgMediaElement.pause();
        bgMediaElement.muted = true;
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
        const playPromise = bgMediaElement.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay with sound might be blocked; fallback to muted playback
            bgMediaElement.muted = true;
            bgMediaElement.play().catch(() => {});
          });
        }
      } else {
        bgMediaElement.pause();
      }
    }
  }, [
    isPlaying,
    isMuted,
    bgMediaElement,
    isFullscreenActive,
    isExporting,
    state.audio.videoAudioEnabled,
    state.audio.videoVolume,
  ]);

  // Sync audio mixer playback (music track / uploaded MP3 / generator)
  useEffect(() => {
    if (isFullscreenActive || isExporting) {
      audioMixer.stop();
      return;
    }
    const isAudioActive =
      isPlaying &&
      !isMuted &&
      state.audio.enabled &&
      (state.audio.volume ?? 0.7) > 0 &&
      (state.audio.sourceType === 'generator' ||
        (state.audio.sourceType === 'file' && Boolean(state.audio.audioUrl)));

    if (isAudioActive) {
      audioMixer.play(state.audio, totalDuration, currentTimeRef.current, state.bgMediaUrl || undefined);
    } else {
      audioMixer.stop();
    }

    return () => {
      audioMixer.stop();
    };
  }, [
    isPlaying,
    isMuted,
    isFullscreenActive,
    isExporting,
    state.audio.enabled,
    state.audio.sourceType,
    state.audio.presetId,
    state.audio.seed,
    state.audio.audioUrl,
    state.audio.volume,
    state.audio.loop,
    state.bgMediaUrl,
    totalDuration,
  ]);

  const getEditingDisplayTime = useCallback(() => {
    if (!editingInfo || !editingInfo.isEditing) return null;
    const { segments: allSegments } = splitTextIntoSegments(
      state.rawText,
      state.textMode,
      state.speedMultiplier,
      state.pauseBetweenSeconds,
      undefined,
      state.animationStyle
    );
    if (!allSegments || allSegments.length === 0) return 0;
    if (editingInfo.isAuthor) {
      const last = allSegments[allSegments.length - 1];
      return last.startTime + last.duration * 0.95;
    }
    const cursor = editingInfo.cursorIndex || 0;
    if (state.textMode === 'full' || allSegments.length === 1) {
      const seg = allSegments[0];
      return seg.startTime + seg.duration * 0.95;
    }
    let charAcc = 0;
    let targetSeg = allSegments[0];
    for (const seg of allSegments) {
      const segLen = seg.text.length;
      if (cursor <= charAcc + segLen) {
        targetSeg = seg;
        break;
      }
      charAcc += segLen + 1;
    }
    return targetSeg ? targetSeg.startTime + targetSeg.duration * 0.95 : 0;
  }, [
    editingInfo,
    state.rawText,
    state.textMode,
    state.speedMultiplier,
    state.pauseBetweenSeconds,
    state.animationStyle,
  ]);

  // Main Render Loop
  const drawFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dimensions = getDimensionsForAspect(state.aspectRatio);

      // Keep internal canvas resolution sharp
      if (canvas.width !== dimensions.width || canvas.height !== dimensions.height) {
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
      }

      // Keep video background in sync without continuously triggering seek locks
      if (bgMediaElement instanceof HTMLVideoElement && bgMediaElement.duration) {
        if (!isPlayingRef.current || editingInfo?.isEditing) {
          const targetTime = time % bgMediaElement.duration;
          if (Math.abs(bgMediaElement.currentTime - targetTime) > 0.05) {
            bgMediaElement.currentTime = targetTime;
          }
        }
      }

      const hasVideo = bgMediaElement instanceof HTMLVideoElement && bgMediaElement.duration > 0;
      const vidDur = hasVideo ? (bgMediaElement as HTMLVideoElement).duration : 0;
      const isSyncWithVideo = Boolean(state.syncWithVideo) && vidDur > 0;
      const renderTargetDur = isSyncWithVideo ? vidDur : undefined;

      renderCanvasFrame({
        ctx,
        state,
        currentTime: time,
        bgMediaElement,
        dimensions,
        targetDuration: renderTargetDur,
      });
    },
    [state, bgMediaElement, editingInfo]
  );

  // Animation frame loop (halted while Fullscreen is open to prevent resource contention and video stutter)
  useEffect(() => {
    if (isFullscreenActive) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const activeEditTime = getEditingDisplayTime();
      if (activeEditTime !== null) {
        lastTimeRef.current = now;
        currentTimeRef.current = activeEditTime;
        drawFrame(activeEditTime);
      } else if (isPlayingRef.current) {
        const delta = Math.min(0.1, (now - lastTimeRef.current) / 1000);
        lastTimeRef.current = now;

        const hasVideo = bgMediaElement instanceof HTMLVideoElement && bgMediaElement.duration > 0;
        const vidDur = hasVideo ? (bgMediaElement as HTMLVideoElement).duration : 0;
        const effectiveDuration = Boolean(state.syncWithVideo) && vidDur > 0 ? vidDur : totalDuration;

        let nextTime = currentTimeRef.current + delta;
        if (nextTime >= effectiveDuration) {
          // Loop back to start
          nextTime = 0;
          if (bgMediaElement instanceof HTMLVideoElement) {
            bgMediaElement.currentTime = 0;
            bgMediaElement.play().catch(() => {});
          }
          if (
            state.audio.enabled &&
            (state.audio.sourceType === 'generator' ||
              (state.audio.sourceType === 'file' && Boolean(state.audio.audioUrl)))
          ) {
            audioMixer.play(state.audio, effectiveDuration, 0, state.bgMediaUrl || undefined);
          }
        } else if (bgMediaElement instanceof HTMLVideoElement) {
          // If video ended or paused unexpectedly while preview is playing, resume it
          if (bgMediaElement.ended) {
            bgMediaElement.currentTime = 0;
            bgMediaElement.play().catch(() => {});
          } else if (bgMediaElement.paused && !bgMediaElement.seeking) {
            bgMediaElement.play().catch(() => {});
          }
        }
        currentTimeRef.current = nextTime;
        drawFrame(nextTime);
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
  }, [
    isPlaying,
    isFullscreenActive,
    totalDuration,
    drawFrame,
    bgMediaElement,
    state.audio,
    getEditingDisplayTime,
  ]);

  const openFullscreen = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    audioMixer.stop();
    if (bgMediaElement instanceof HTMLVideoElement) {
      bgMediaElement.pause();
      bgMediaElement.muted = true;
    }
    setIsFullscreenModalOpen(true);
    if (onOpenFullscreen) {
      onOpenFullscreen();
    }
  };

  const closeFullscreen = () => {
    setIsFullscreenModalOpen(false);
    if (onCloseFullscreen) {
      onCloseFullscreen();
    }
  };

  const handleRestart = () => {
    currentTimeRef.current = 0;
    lastTimeRef.current = performance.now();
    if (bgMediaElement instanceof HTMLVideoElement) {
      bgMediaElement.currentTime = 0;
    }
    if (
      isPlaying &&
      state.audio.enabled &&
      (state.audio.sourceType === 'generator' ||
        (state.audio.sourceType === 'file' && Boolean(state.audio.audioUrl)))
    ) {
      audioMixer.play(state.audio, totalDuration, 0, state.bgMediaUrl || undefined);
    }
    drawFrame(0);
  };

  const handleRegenerateBackground = () => {
    const newSeed = Math.floor(Math.random() * 1000000) + 1;
    const currentMood = state.proceduralMood || 'cosmic';
    onChange({
      bgType: 'procedural',
      bgMediaType: null,
      bgMediaUrl: null,
      proceduralMood: currentMood,
      proceduralSeed: newSeed,
    });
  };

  const handleRegenerateMusic = () => {
    const newSeed = Math.floor(Math.random() * 1000000) + 1;
    const presetId = state.audio.presetId || 'lofi-chill';
    const newAudioConfig = {
      ...state.audio,
      enabled: true,
      sourceType: 'generator' as const,
      presetId,
      seed: newSeed,
    };
    onChange({
      audio: newAudioConfig,
    });

    if (isPlaying) {
      audioMixer.play(newAudioConfig, totalDuration, currentTimeRef.current, state.bgMediaUrl || undefined);
    }
  };

  const handleRegenerateTypography = () => {
    // 1. Random Font
    const randomFont = FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)];

    // 2. Random Animation Style
    const animStyles: AnimationStyle[] = ['typewriter', 'words', 'fade', 'slide', 'zoom', 'glitch'];
    const randomAnim = animStyles[Math.floor(Math.random() * animStyles.length)];

    // 3. Random Text Mode
    const textModes: TextMode[] = ['word', 'sentence', 'full'];
    const randomMode = textModes[Math.floor(Math.random() * textModes.length)];

    // 4. Random Text Color Palette
    const colorSwatches = [
      '#ffffff',
      '#facc15',
      '#06b6d4',
      '#f43f5e',
      '#c084fc',
      '#34d399',
      '#fb923c',
      '#38bdf8',
      '#fed7aa',
      '#fef08a',
      '#f472b6',
      '#a7f3d0',
      '#e0e7ff',
    ];
    const randomTextColor = colorSwatches[Math.floor(Math.random() * colorSwatches.length)];

    // 5. Random Neon Color
    const neonColors = [
      '#ec4899',
      '#06b6d4',
      '#a855f7',
      '#22c55e',
      '#f59e0b',
      '#f43f5e',
      '#38bdf8',
      '#e11d48',
      '#8b5cf6',
    ];
    const randomNeonColor = neonColors[Math.floor(Math.random() * neonColors.length)];

    // 6. Curated Harmonious Effect Combinations
    const effectSets: ExtraEffects[] = [
      { glow: true, sparkle: false, fire: false, neon: true, shadow: true, particles: false },
      { glow: false, sparkle: true, fire: false, neon: false, shadow: true, particles: true },
      { glow: false, sparkle: false, fire: true, neon: false, shadow: true, particles: false },
      { glow: true, sparkle: true, fire: false, neon: false, shadow: true, particles: false },
      { glow: false, sparkle: false, fire: false, neon: true, shadow: true, particles: false },
      { glow: false, sparkle: false, fire: false, neon: false, shadow: true, particles: true },
      { glow: true, sparkle: false, fire: false, neon: false, shadow: true, particles: false },
      { glow: false, sparkle: false, fire: false, neon: false, shadow: true, particles: false },
      { glow: true, sparkle: true, fire: false, neon: true, shadow: true, particles: false },
    ];
    const randomEffects = effectSets[Math.floor(Math.random() * effectSets.length)];

    // 7. Dynamic Font Sizing based on text display mode
    let calculatedFontSize = 72;
    if (randomMode === 'word') {
      calculatedFontSize = Math.floor(Math.random() * 30) + 72; // 72 - 102px
    } else if (randomMode === 'sentence') {
      calculatedFontSize = Math.floor(Math.random() * 24) + 54; // 54 - 78px
    } else {
      calculatedFontSize = Math.floor(Math.random() * 18) + 44; // 44 - 62px
    }

    // 8. Stroke settings
    const strokeEnabled = Math.random() > 0.45;
    const strokeColor = randomTextColor === '#ffffff' ? '#000000' : '#09090b';
    const strokeWidth = strokeEnabled ? Math.floor(Math.random() * 4) + 3 : state.strokeWidth;

    // 9. Uppercase & Vertical positioning
    const isUppercase = Math.random() > 0.6;
    const textPositionY = Math.floor(Math.random() * 26) + 38; // 38% - 64%

    onChange({
      fontFamily: randomFont.family,
      animationStyle: randomAnim,
      textMode: randomMode,
      textColor: randomTextColor,
      neonColor: randomNeonColor,
      effects: randomEffects,
      strokeEnabled,
      strokeColor,
      strokeWidth,
      fontSize: calculatedFontSize,
      isUppercase,
      textPositionY,
    });
  };

  return (
    <>
      <div ref={anchorRef} className="w-full relative">
        <div
          ref={containerRef}
          className={`w-full transition-all duration-300 ${
            isPinned
              ? 'fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-0 sm:p-2 overflow-hidden w-full h-full'
              : 'bg-[#16161D] border-b sm:border border-white/10 rounded-none sm:rounded-2xl p-0 sm:p-1.5 shadow-2xl shadow-black/50 flex flex-col items-center justify-center w-full min-h-[350px] max-h-[60vh] sm:max-h-[64vh] lg:h-[calc(100vh-4.75rem)] lg:max-h-[calc(100vh-4.75rem)] lg:min-h-0'
          }`}
        >
          {/* 1. Canvas Viewport Stage (MAIN PREVIEW AT TOP) */}
          <div
            ref={stageContainerRef}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerUp}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0] && onFileUpload) {
                onFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`w-full justify-center items-center relative overflow-hidden transition-all duration-300 flex select-none touch-none ${
              isPinned
                ? 'flex-1 min-h-0 w-full h-full bg-black rounded-none border-0'
                : 'flex-1 min-h-0 w-full h-full rounded-none sm:rounded-xl bg-[#0B0B0E] sm:border sm:border-white/10 shadow-2xl'
            }`}
          >
            {/* Drag & Drop Feedback Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 z-30 bg-purple-950/85 backdrop-blur-sm border-2 border-dashed border-purple-400 rounded-xl flex flex-col items-center justify-center gap-2.5 text-white pointer-events-none p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center animate-bounce">
                  <Upload className="w-6 h-6 text-purple-300" />
                </div>
                <p className="font-bold text-sm text-purple-100">
                  {t('dropFileHere', 'Отпустите видео или фото сюда')}
                </p>
                <p className="text-xs text-purple-200/80">
                  {t('dropFileDesc', 'Оно моментально станет фоном вашей цитаты')}
                </p>
              </div>
            )}

            {/* Floating Aspect Ratio Switcher - CENTERED at the top of preview */}
            <div
              className={`absolute top-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/45 backdrop-blur-md border border-white/20 rounded-xl p-0.5 sm:p-1 shadow-lg transition-all duration-300 ${
                hideControls ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
              }`}
            >
                <button
                  onClick={() => onChange({ aspectRatio: '9:16' })}
                  className={`px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                    state.aspectRatio === '9:16'
                      ? 'bg-purple-600/90 border-purple-400 text-white shadow-sm'
                      : 'bg-transparent border-transparent text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                  title="9:16 (Reels / Shorts / TikTok)"
                >
                  9:16
                </button>
                <button
                  onClick={() => onChange({ aspectRatio: '16:9' })}
                  className={`px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                    state.aspectRatio === '16:9'
                      ? 'bg-purple-600/90 border-purple-400 text-white shadow-sm'
                      : 'bg-transparent border-transparent text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                  title="16:9 (YouTube)"
                >
                  16:9
                </button>
                <button
                  onClick={() => onChange({ aspectRatio: '1:1' })}
                  className={`px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                    state.aspectRatio === '1:1'
                      ? 'bg-purple-600/90 border-purple-400 text-white shadow-sm'
                      : 'bg-transparent border-transparent text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                  title="1:1 (Post)"
                >
                  1:1
                </button>
              </div>

            {/* Top-Left Active Media Indicator */}
            {state.bgType === 'video' && !isPinned && (
              <div
                className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-purple-400/30 text-[10px] font-bold text-purple-300 shadow-lg pointer-events-none transition-all duration-300 ${
                  hideControls ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'
                }`}
              >
                <Film className="w-3 h-3 text-purple-400" />
                <span className="hidden xs:inline">{t('videoBgActive', 'Видеофон')}</span>
              </div>
            )}



            {/* Pin / Unpin notification toast */}
            {pinToast && (
              <div className="absolute top-12 right-3 z-40 px-2.5 py-1 rounded-lg bg-black/90 backdrop-blur-md border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-xl pointer-events-none animate-in fade-in duration-150">
                {pinToast}
              </div>
            )}

            {/* Live 2D Drag Guideline and Badge */}
            {isDraggingText && (
              <div
                className="absolute inset-x-2 sm:inset-x-6 z-30 pointer-events-none flex flex-col items-center transition-all duration-75"
                style={{ top: `${state.textPositionY ?? 50}%` }}
              >
                <div className="w-full border-t-2 border-dashed border-purple-400/80 shadow-sm" />
                <div className="-mt-3 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold shadow-xl border border-purple-300 flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                  <Move className="w-3.5 h-3.5 animate-pulse" />
                  <span>X: {state.textPositionX ?? 50}%, Y: {state.textPositionY ?? 50}%</span>
                </div>
              </div>
            )}

            {/* On-Screen Notification: Loading file */}
            {isMediaLoading && (
              <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-[#161622]/95 border border-purple-500/50 shadow-2xl shadow-black text-white">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                  <span className="text-sm font-semibold text-purple-100">
                    {t('fileUploading', 'Идет загрузка вашего файла...')}
                  </span>
                </div>
              </div>
            )}

            {/* On-Screen Notification: File upload success */}
            {uploadSuccess && (
              <div className="absolute top-4 inset-x-0 z-40 flex justify-center pointer-events-none transition-all">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 shadow-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t('fileUploadSuccess', 'Файл успешно загружен!')}</span>
                </div>
              </div>
            )}

            {/* On-Screen Notification: Upload error */}
            {uploadError && (
              <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
                <div className="max-w-sm w-full p-4 rounded-2xl bg-[#1A1420] border border-rose-500/40 text-rose-100 shadow-2xl space-y-2.5 text-center">
                  <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-white">{t('fileOpenError', 'Не удалось открыть файл')}</p>
                  <p className="text-xs text-rose-200/85 leading-relaxed">{uploadError}</p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {onRetryUpload && (
                      <button
                        onClick={onRetryUpload}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/25"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t('retry', 'Повторить')}</span>
                      </button>
                    )}
                    {onDismissError && (
                      <button
                        onClick={onDismissError}
                        className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t('back', 'Закрыть')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Canvas Stage */}
            <div
              className="relative transition-all duration-300 flex items-center justify-center p-0 sm:p-1 w-full h-full max-h-full max-w-full"
              style={{
                aspectRatio:
                  state.aspectRatio === '9:16'
                    ? '9/16'
                    : state.aspectRatio === '16:9'
                    ? '16/9'
                    : '1/1',
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full max-h-full max-w-full object-contain rounded-none sm:rounded-lg shadow-2xl sm:border sm:border-white/10"
                style={{
                  aspectRatio:
                    state.aspectRatio === '9:16'
                      ? '9/16'
                      : state.aspectRatio === '16:9'
                      ? '16/9'
                      : '1/1',
                }}
              />

              {/* Live Editing Focus Badge */}
              {editingInfo?.isEditing && (
                <div className="absolute top-3 left-3 bg-purple-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm border border-purple-400/40 flex items-center gap-1.5 pointer-events-none animate-pulse z-20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{t('editingLive', 'Редактирование (Live)')}</span>
                </div>
              )}

              {/* Quick Play Overlay on Click */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(!isPlaying);
                }}
                className={`absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transition-all duration-200 cursor-pointer pointer-events-auto ${
                  isPlaying
                    ? 'opacity-0 hover:opacity-100'
                    : 'opacity-100 scale-105 shadow-xl'
                }`}
                title={isPlaying ? t('pause', 'Пауза') : t('play', 'Воспроизведение')}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>
            </div>

            {/* Right Side Floating Navigation Buttons (Tools top, Templates middle, Pin bottom) */}
            {!isFullscreenActive && (
              <>
                {/* 1. When neither panel is open: Stacked translucent buttons on the RIGHT edge */}
                {!showRightTools && !showLeftPresets && (
                  <div
                    className={`absolute right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2.5 transition-all duration-300 ${
                      hideControls ? 'opacity-0 translate-x-12 pointer-events-none' : 'opacity-100 translate-x-0 pointer-events-auto'
                    }`}
                  >
                  {/* Top Button: Tools */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPinned) togglePin();
                      setShowRightTools(true);
                    }}
                    className="p-3 rounded-l-2xl bg-black/35 hover:bg-black/65 active:scale-95 text-white/90 backdrop-blur-md border-y border-l border-white/20 shadow-xl transition-all cursor-pointer group hover:pl-4"
                    title={t('toolsPanelTitle', 'Инструменты')}
                  >
                    <Sliders className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Middle Button: Templates */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPinned) togglePin();
                      setShowLeftPresets(true);
                    }}
                    className="p-3 rounded-l-2xl bg-black/35 hover:bg-black/65 active:scale-95 text-white/90 backdrop-blur-md border-y border-l border-white/20 shadow-xl transition-all cursor-pointer group hover:pl-4"
                    title={t('templatesTab', 'Шаблоны')}
                  >
                    <FolderHeart className="w-5 h-5 text-purple-300 group-hover:scale-110 transition-transform" />
                  </button>

                  {/* Bottom Button: Pin / Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin();
                    }}
                    className="p-3 rounded-l-2xl bg-black/35 hover:bg-black/65 active:scale-95 text-white/90 backdrop-blur-md border-y border-l border-white/20 shadow-xl transition-all cursor-pointer group hover:pl-4"
                    title={isPinned ? t('unpinPreview', 'Открепить превью') : t('pinPreview', 'Закрепить превью')}
                  >
                    <Pin
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        isPinned ? 'fill-current text-purple-300 scale-105' : 'text-purple-300'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Floating Restore Controls Button when controls are hidden */}
              {hideControls && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHideControls(false);
                  }}
                  className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/80 hover:bg-black/95 text-purple-300 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-2xl transition-all animate-fade-in hover:scale-110 active:scale-95 pointer-events-auto"
                  title={t('showMenu', 'Показать меню')}
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

                {/* 2. Templates Popout Panel Backdrop */}
                {showLeftPresets && (
                  <div
                    className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLeftPresets(false);
                    }}
                  />
                )}

                {/* 2. Templates Popout Panel Stack (Right Edge) */}
                {showLeftPresets && (
                  <div
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-4 duration-200 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header bar */}
                    <div className="flex items-center justify-between w-36 sm:w-40 px-1.5 pb-0.5 select-none">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                        <FolderHeart className="w-3.5 h-3.5 text-purple-400" />
                        <span>{t('templatesTab', 'Шаблоны')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLeftPresets(false)}
                        className="w-5 h-5 rounded-md hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Закрыть"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Button 1: Сохранить */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLeftPresets(false);
                        setIsSaveModalOpen(true);
                      }}
                      className="w-36 sm:w-40 h-10 flex items-center justify-start gap-2.5 px-3 rounded-xl bg-black/80 hover:bg-purple-600/85 active:bg-purple-700 active:scale-95 text-white backdrop-blur-md border border-white/20 hover:border-purple-400/50 shadow-xl shadow-black/40 transition-all cursor-pointer group"
                      title={t('savePresetTitle', 'Сохранить шаблон')}
                    >
                      <span className="w-6 h-6 rounded-lg bg-purple-500/25 border border-purple-400/40 text-[11px] font-bold text-purple-200 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-purple-700 transition-colors">
                        <BookmarkPlus className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-semibold tracking-wide text-white truncate">
                        {t('savePresetShort', 'Сохранить')}
                      </span>
                    </button>

                    {/* Button 2: Загрузить */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLeftPresets(false);
                        jsonFileInputRef.current?.click();
                      }}
                      className="w-36 sm:w-40 h-10 flex items-center justify-start gap-2.5 px-3 rounded-xl bg-black/80 hover:bg-purple-600/85 active:bg-purple-700 active:scale-95 text-white backdrop-blur-md border border-white/20 hover:border-purple-400/50 shadow-xl shadow-black/40 transition-all cursor-pointer group"
                      title={t('loadPresetShort', 'Загрузить')}
                    >
                      <span className="w-6 h-6 rounded-lg bg-purple-500/25 border border-purple-400/40 text-[11px] font-bold text-purple-200 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-purple-700 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-semibold tracking-wide text-white truncate">
                        {t('loadPresetShort', 'Загрузить')}
                      </span>
                    </button>

                    {/* Button 3: Каталог */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLeftPresets(false);
                        setIsCatalogOpen(true);
                      }}
                      className="w-36 sm:w-40 h-10 flex items-center justify-start gap-2.5 px-3 rounded-xl bg-black/80 hover:bg-purple-600/85 active:bg-purple-700 active:scale-95 text-white backdrop-blur-md border border-white/20 hover:border-purple-400/50 shadow-xl shadow-black/40 transition-all cursor-pointer group"
                      title={t('catalogTitle', 'Каталог шаблонов')}
                    >
                      <span className="w-6 h-6 rounded-lg bg-purple-500/25 border border-purple-400/40 text-[11px] font-bold text-purple-200 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-purple-700 transition-colors">
                        <FolderHeart className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-semibold tracking-wide text-white truncate">
                        {t('catalog', 'Каталог')}
                      </span>
                    </button>
                  </div>
                )}

                {/* 3. Tools Popout Panel Backdrop */}
                {showRightTools && (
                  <div
                    className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRightTools(false);
                    }}
                  />
                )}

                {/* 3. When tools panel is open: Identical stack of Tool Buttons 3 to 8 */}
                {showRightTools && (
                  <div
                    className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-right-4 duration-200 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header bar */}
                    <div className="flex items-center justify-between w-32 sm:w-36 px-1.5 pb-0.5 select-none">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <span>{t('toolsPanelTitle', 'Инструменты')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowRightTools(false)}
                        className="w-5 h-5 rounded-md hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Закрыть"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {FULLSCREEN_TOOLS.map((tool) => (
                      <button
                        key={tool.num}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRightTools(false);
                          if (onNavigateToTool) {
                            onNavigateToTool(tool.num);
                          } else {
                            togglePin();
                          }
                        }}
                        className="w-32 sm:w-36 h-10 flex items-center justify-start gap-2 px-3.5 rounded-xl bg-black/80 hover:bg-purple-600/85 active:bg-purple-700 active:scale-95 text-white/95 hover:text-white backdrop-blur-md border border-white/20 hover:border-purple-400/50 shadow-xl shadow-black/40 transition-all cursor-pointer group"
                        title={t(tool.labelKey, tool.defaultLabel)}
                      >
                        <span className="text-xs font-semibold tracking-wide text-white drop-shadow-sm truncate">
                          {t(tool.labelKey, tool.defaultLabel)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Floating Font Size & Color Adjustment Popup upon Text Tap or Long Press */}
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

            {/* Unified Bottom Controls Dock: Play, Restart, Sound (with Long-Tap Volume Slider), Bg, Music, Text, Capture Studio */}
            <div
              data-dock="true"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className={`absolute bottom-2 sm:bottom-3 inset-x-2 sm:inset-x-3 flex items-center justify-center z-20 transition-all duration-300 ${
                hideControls ? 'opacity-0 translate-y-full pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
              }`}
            >
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="flex items-center justify-between sm:justify-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl pointer-events-auto max-w-full"
              >
                {/* 1. Play / Pause */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                  title={isPlaying ? t('pause', 'Пауза') : t('play', 'Воспроизведение')}
                  aria-label={isPlaying ? t('pause', 'Пауза') : t('play', 'Воспроизведение')}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </button>

                {/* 2. Restart from beginning */}
                <button
                  onClick={handleRestart}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                  title={t('fromStart', 'Запустить снова (с начала)')}
                  aria-label={t('fromStart', 'Запустить снова')}
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* 3. Sound / Volume with Long-Tap Slider Popup */}
                <div className="relative shrink-0">
                  <button
                    onTouchStart={handleSoundTouchStart}
                    onTouchEnd={handleSoundTouchEnd}
                    onTouchCancel={handleSoundTouchEnd}
                    onMouseDown={handleSoundTouchStart}
                    onMouseUp={handleSoundTouchEnd}
                    onMouseLeave={handleSoundTouchEnd}
                    onClick={handleSoundClick}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setIsVolumePopupOpen(true);
                    }}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 border ${
                      isEffectivelyMuted
                        ? 'bg-rose-950/50 text-rose-400 border-rose-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-emerald-400 border-white/10'
                    }`}
                    title={
                      isEffectivelyMuted
                        ? t('unmute', 'Включить звук (долгий тап для громкости)')
                        : t('mute', 'Выключить звук (долгий тап для громкости)')
                    }
                    aria-label={t('soundControl', 'Звук')}
                  >
                    {isEffectivelyMuted ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>

                  {/* Clean Centered Minimalist Volume Slider (Speaker Icon + Slider ONLY) */}
                  {isVolumePopupOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsVolumePopupOpen(false)}
                      />
                      <div className="absolute bottom-11 sm:bottom-12 left-1/2 -translate-x-1/2 w-44 sm:w-48 px-3 py-2 rounded-xl bg-[#161622]/95 backdrop-blur-xl border border-white/20 shadow-2xl z-50 flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                        {/* Speaker Icon */}
                        <button
                          onClick={() => {
                            if (isEffectivelyMuted) {
                              setIsMuted(false);
                              if ((state.audio.volume ?? 0) === 0) {
                                audioMixer.setVolume(0.5);
                                onChange({
                                  audio: {
                                    ...state.audio,
                                    volume: 0.5,
                                    enabled: true,
                                  },
                                });
                              }
                            } else {
                              setIsMuted(true);
                            }
                          }}
                          className={`shrink-0 cursor-pointer p-0.5 hover:scale-105 transition-transform ${
                            isEffectivelyMuted
                              ? 'text-rose-400'
                              : 'text-emerald-400 hover:text-emerald-300'
                          }`}
                          title={isEffectivelyMuted ? t('unmute', 'Включить звук') : t('mute', 'Выключить звук')}
                        >
                          {isEffectivelyMuted ? (
                            <VolumeX className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </button>

                        {/* Minimal Slider */}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : (state.audio.volume ?? 0)}
                          onChange={(e) => {
                            const vol = parseFloat(e.target.value);
                            if (vol === 0) {
                              setIsMuted(true);
                            } else if (isMuted) {
                              setIsMuted(false);
                            }
                            audioMixer.setVolume(vol);
                            onChange({
                              audio: {
                                ...state.audio,
                                volume: vol,
                                enabled: vol > 0,
                              },
                            });
                          }}
                          className="w-full accent-purple-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Subtle Divider */}
                <div className="w-px h-5 bg-white/20 shrink-0 mx-0.5" />

                {/* 4. Quick Regenerate Procedural Background */}
                <button
                  onClick={handleRegenerateBackground}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 hover:text-purple-100 border border-purple-500/40 hover:border-purple-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 group"
                  title={t('regenerateBg', 'Сгенерировать другой фон')}
                  aria-label={t('regenerateBg', 'Сгенерировать другой фон')}
                >
                  <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                </button>

                {/* 5. Quick Regenerate Procedural Music */}
                <button
                  onClick={handleRegenerateMusic}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-300 hover:text-indigo-100 border border-indigo-500/40 hover:border-indigo-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 group"
                  title={t('regenerateMusic', 'Сгенерировать другую музыку')}
                  aria-label={t('regenerateMusic', 'Сгенерировать другую музыку')}
                >
                  <Music className="w-4 h-4 transition-transform group-hover:scale-110" />
                </button>

                {/* 6. Quick Regenerate Typography, Font & Animations (T with Stars) */}
                <button
                  onClick={handleRegenerateTypography}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-fuchsia-950/70 hover:bg-fuchsia-900/90 text-fuchsia-300 hover:text-fuchsia-100 border border-fuchsia-500/40 hover:border-fuchsia-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 group"
                  title={t('regenerateTypography', 'Случайный шрифт, анимация и стиль текста')}
                  aria-label={t('regenerateTypography', 'Случайный шрифт, анимация и стиль текста')}
                >
                  <TextSparkleIcon className="w-4 h-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                </button>

                {/* 7. Presets & Templates Library */}
                <button
                  onClick={() => setIsCatalogOpen(true)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 hover:text-white border border-purple-500/50 hover:border-purple-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 group"
                  title={t('templatesPanelTitle', 'Каталог шаблонов')}
                  aria-label={t('templatesPanelTitle', 'Каталог шаблонов')}
                >
                  <FolderHeart className="w-4 h-4 text-purple-300 group-hover:scale-110" />
                </button>

                {/* Subtle Divider */}
                <div className="w-px h-5 bg-white/20 shrink-0 mx-0.5" />

                {/* 8. Capture & Fullscreen Recording Studio Button */}
                <button
                  onClick={openFullscreen}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 hover:text-white border-2 border-rose-500/90 hover:border-rose-400 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 shadow-md shadow-rose-950/40"
                  title={t('captureStudioTitle', 'Окно захвата и записи видео')}
                  aria-label={t('captureStudioTitle', 'Окно захвата')}
                >
                  <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Save Preset Modal */}
      <SavePresetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentState={state}
        onSaveToCatalog={handleSaveToCatalog}
        onExportFile={handleExportPreset}
      />

      {/* 2. Presets Catalog Modal */}
      <PresetsCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        allPresets={[...userPresets, ...BUILTIN_PRESETS]}
        appliedId={appliedPresetId}
        onApplyPreset={handleApplyPreset}
        onExportPreset={handleExportPreset}
        onDeletePreset={handleDeletePreset}
        onSelectPresetForFullscreen={(preset) => {
          setIsPlaying(false);
          isPlayingRef.current = false;
          audioMixer.stop();
          if (bgMediaElement instanceof HTMLVideoElement) {
            bgMediaElement.pause();
            bgMediaElement.muted = true;
          }
          setCatalogFullscreenPreset(preset);
          setIsCatalogOpen(false);
          setIsFullscreenModalOpen(true);
          if (onOpenFullscreen) {
            onOpenFullscreen();
          }
        }}
      />

      {/* 3. Load Preset Prompt Modal (fullscreen center prompt after file load) */}
      <LoadPresetPromptModal
        isOpen={!!loadPromptPreset}
        preset={loadPromptPreset}
        onSaveToCatalog={() => {
          if (loadPromptPreset) {
            handleSaveToCatalog(loadPromptPreset);
          }
        }}
        onDismiss={() => setLoadPromptPreset(null)}
      />

      {/* Hidden File Input for JSON preset import */}
      <input
        type="file"
        ref={jsonFileInputRef}
        onChange={handleImportJsonFile}
        accept=".json"
        className="hidden"
      />

      {/* Fullscreen Player Modal */}
      <FullscreenPlayer
        isOpen={isFullscreenActive || !!catalogFullscreenPreset}
        onClose={() => {
          closeFullscreen();
          setCatalogFullscreenPreset(null);
        }}
        state={
          catalogFullscreenPreset
            ? {
                ...state,
                ...catalogFullscreenPreset.state,
                rawText: state.rawText,
                authorText: state.authorText,
                textMode: state.textMode,
              }
            : state
        }
        onChange={handleFullscreenChange}
        bgMediaElement={bgMediaElement}
        onExport={onExportClick}
        isExporting={isExporting}
        onApplyPreset={
          catalogFullscreenPreset
            ? () => {
                handleApplyPreset(catalogFullscreenPreset);
                setCatalogFullscreenPreset(null);
                closeFullscreen();
              }
            : undefined
        }
        isAppliedPreset={
          catalogFullscreenPreset
            ? appliedPresetId === catalogFullscreenPreset.id
            : undefined
        }
        onBackToCatalog={
          catalogFullscreenPreset
            ? () => {
                setCatalogFullscreenPreset(null);
                closeFullscreen();
                setIsCatalogOpen(true);
              }
            : undefined
        }
      />
    </>
  );
};

