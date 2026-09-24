import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Trash2,
  Check,
  FolderHeart,
  Play,
  Pause,
  Sparkles,
  AlertTriangle,
  Maximize2,
  ArrowLeft,
} from 'lucide-react';
import { SavedPreset } from '../data/presetLibrary';
import { useLanguage } from '../context/LanguageContext';
import { renderCanvasFrame } from '../utils/canvasRenderer';
import { VideoProjectState } from '../types';
import { BACKGROUND_PRESETS } from '../data/presets';

interface PresetsCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPresets: SavedPreset[];
  appliedId: string | null;
  onApplyPreset: (preset: SavedPreset) => void;
  onExportPreset: (preset: SavedPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onSelectPresetForFullscreen: (preset: SavedPreset) => void;
}

interface CatalogPresetCardProps {
  preset: SavedPreset;
  isApplied: boolean;
  onApplyPreset: (preset: SavedPreset) => void;
  onExportPreset: (preset: SavedPreset) => void;
  onDeleteRequest: (preset: SavedPreset) => void;
  onOpenFullscreen: (preset: SavedPreset) => void;
}

const CatalogPresetCard: React.FC<CatalogPresetCardProps> = ({
  preset,
  isApplied,
  onApplyPreset,
  onExportPreset,
  onDeleteRequest,
  onOpenFullscreen,
}) => {
  const { t } = useLanguage();
  const [isLivePlaying, setIsLivePlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      onOpenFullscreen(preset);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(50); } catch {}
      }
    }, 400);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dist = Math.hypot(e.clientX - touchStartPosRef.current.x, e.clientY - touchStartPosRef.current.y);
    if (dist > 8 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const isUser = !preset.isBuiltIn;
  const presetState = preset.state || {};

  // Build full project state for canvas renderer
  const fullState: VideoProjectState = {
    bgType: presetState.bgType || 'preset',
    bgMediaUrl: presetState.bgMediaUrl || null,
    bgMediaType: presetState.bgMediaType || null,
    bgPresetId: presetState.bgPresetId || 'cyberpunk',
    bgCustomColor: presetState.bgCustomColor,
    proceduralMood: presetState.proceduralMood,
    proceduralSeed: presetState.proceduralSeed || 42,
    bgOverlayOpacity: presetState.bgOverlayOpacity ?? 0.2,
    audio: presetState.audio || {
      enabled: false,
      sourceType: 'none',
      presetId: 'synthwave-retro',
      volume: 0.8,
      loop: true,
      audioDuration: 30,
      audioUrl: null,
      audioFileName: null,
    },
    rawText: presetState.rawText || preset.name || 'TypeMixer',
    authorText: presetState.authorText || preset.author || '',
    textMode: presetState.textMode || 'sentence',
    fontFamily: presetState.fontFamily || preset.previewFontFamily || "'Montserrat', sans-serif",
    fontSize: presetState.fontSize || 80,
    textColor: presetState.textColor || preset.previewTextColor || '#ffffff',
    neonColor: presetState.neonColor || '#a855f7',
    strokeEnabled: presetState.strokeEnabled ?? false,
    strokeColor: presetState.strokeColor || '#000000',
    strokeWidth: presetState.strokeWidth || 4,
    isUppercase: presetState.isUppercase ?? false,
    textAlign: presetState.textAlign || 'center',
    textPosition: presetState.textPosition || 'center',
    textPositionY: presetState.textPositionY ?? 50,
    animationStyle: presetState.animationStyle || 'typewriter',
    speedMultiplier: presetState.speedMultiplier || 1,
    pauseBetweenSeconds: presetState.pauseBetweenSeconds || 0.5,
    effects: presetState.effects || {
      glow: true,
      sparkle: false,
      fire: false,
      neon: false,
      shadow: true,
      particles: false,
    },
    aspectRatio: presetState.aspectRatio || '9:16',
  };

  // Live animation loop
  useEffect(() => {
    if (!isLivePlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const startTime = Date.now();

    const renderLoop = () => {
      const currentTime = (Date.now() - startTime) / 1000;
      renderCanvasFrame({
        ctx,
        state: fullState,
        currentTime,
        bgMediaElement: null,
        dimensions: { width: 360, height: 640 },
      });
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isLivePlaying, preset]);

  // Compute background gradient / style for static preview mode
  let staticBg = preset.previewBg;
  if (!staticBg && presetState.bgCustomColor) {
    staticBg = presetState.bgCustomColor;
  }
  if (!staticBg && presetState.bgPresetId) {
    const bgMatch = BACKGROUND_PRESETS.find((p) => p.id === presetState.bgPresetId);
    if (bgMatch && bgMatch.colors) {
      staticBg = `linear-gradient(135deg, ${bgMatch.colors.join(', ')})`;
    }
  }
  if (!staticBg) {
    staticBg = 'linear-gradient(135deg, #0f0c20 0%, #2b1055 50%, #000000 100%)';
  }

  const fontFamily = presetState.fontFamily || preset.previewFontFamily || 'sans-serif';
  const textColor = presetState.textColor || preset.previewTextColor || '#ffffff';
  const neonColor = presetState.neonColor || '#ff00ff';
  const effects = presetState.effects || {};

  let textShadowStyle = '0 2px 8px rgba(0,0,0,0.9)';
  if (effects.neon || effects.glow) {
    textShadowStyle = `0 0 8px ${neonColor}, 0 0 16px ${neonColor}, 0 2px 8px rgba(0,0,0,0.95)`;
  }

  return (
    <div
      onClick={() => setIsLivePlaying(!isLivePlaying)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-3 h-52 sm:h-56 select-none ${
        isApplied
          ? 'border-purple-400 ring-2 ring-purple-400 shadow-xl shadow-purple-600/50 scale-[1.02]'
          : 'border-white/15 hover:border-purple-400/60 hover:shadow-xl hover:shadow-purple-950/60 hover:scale-[1.01]'
      }`}
      style={{ background: staticBg }}
    >
      {/* Dynamic Miniature Canvas Preview on Tap/Click */}
      {isLivePlaying ? (
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
          <canvas
            ref={canvasRef}
            width={360}
            height={640}
            className="w-full h-full object-cover rounded-2xl"
          />
          {/* Live Badge */}
          <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-[10px] font-bold shadow-md border border-purple-300/40 flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>LIVE</span>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 group-hover:from-black/20 group-hover:to-black/50 transition-colors pointer-events-none" />
      )}

      {/* Top Row: Download, Fullscreen Zoom, Delete */}
      <div className="relative z-10 flex items-center justify-between w-full gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExportPreset(preset);
          }}
          className="w-7 h-7 rounded-lg bg-black/60 hover:bg-purple-600 text-zinc-200 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-md shrink-0"
          title={t('download', 'Скачать')}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Player Preview Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFullscreen(preset);
          }}
          className="w-7 h-7 rounded-lg bg-black/60 hover:bg-purple-600 text-zinc-200 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-md shrink-0"
          title={t('fullscreenZoom', 'Открыть в фулскрин')}
        >
          <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
        </button>

        {isUser ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRequest(preset);
            }}
            className="w-7 h-7 rounded-lg bg-black/60 hover:bg-rose-600 text-zinc-200 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-md shrink-0"
            title={t('delete', 'Удалить')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="w-7 h-7 shrink-0" />
        )}
      </div>

      {/* Middle Main Text & Author Display (Static Mode) or Tap hint */}
      {!isLivePlaying && (
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 text-center">
          <span
            style={{
              fontFamily,
              color: textColor,
              textShadow: textShadowStyle,
            }}
            className="text-base sm:text-lg font-bold tracking-wide truncate max-w-full px-1"
          >
            {preset.name}
          </span>

          {/* Direct Author Name ONLY */}
          <span className="text-[11px] font-semibold text-white/90 drop-shadow-md mt-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            {preset.author || 'TypeMixer'}
          </span>
        </div>
      )}

      {/* Play/Pause Live Animation Trigger Indicator */}
      <div className="relative z-10 flex items-center justify-between pt-2 gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLivePlaying(!isLivePlaying);
          }}
          className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-purple-300 backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
          title={isLivePlaying ? t('pausePreview', 'Пауза превью') : t('playPreview', 'Посмотреть анимированное превью')}
        >
          {isLivePlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onApplyPreset(preset);
          }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
            isApplied
              ? 'bg-emerald-500 text-white'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/40'
          }`}
        >
          {isApplied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{t('applied', 'Применен')}</span>
            </>
          ) : (
            <span>{t('apply', 'Применить')}</span>
          )}
        </button>
      </div>
    </div>
  );
};

interface PresetZoomModalProps {
  preset: SavedPreset | null;
  isApplied: boolean;
  onClose: () => void;
  onApply: (preset: SavedPreset) => void;
}

const PresetZoomModal: React.FC<PresetZoomModalProps> = ({
  preset,
  isApplied,
  onClose,
  onApply,
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!preset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const presetState = preset.state || {};
    const fullState: VideoProjectState = {
      bgType: presetState.bgType || 'preset',
      bgMediaUrl: presetState.bgMediaUrl || null,
      bgMediaType: presetState.bgMediaType || null,
      bgPresetId: presetState.bgPresetId || 'cyberpunk',
      bgCustomColor: presetState.bgCustomColor,
      proceduralMood: presetState.proceduralMood,
      proceduralSeed: presetState.proceduralSeed || 42,
      bgOverlayOpacity: presetState.bgOverlayOpacity ?? 0.2,
      audio: presetState.audio || {
        enabled: false,
        sourceType: 'none',
        presetId: 'synthwave-retro',
        volume: 0.8,
        loop: true,
        audioDuration: 30,
        audioUrl: null,
        audioFileName: null,
      },
      rawText: presetState.rawText || preset.name || 'TypeMixer',
      authorText: presetState.authorText || preset.author || '',
      textMode: presetState.textMode || 'sentence',
      fontFamily: presetState.fontFamily || preset.previewFontFamily || "'Montserrat', sans-serif",
      fontSize: presetState.fontSize || 80,
      textColor: presetState.textColor || preset.previewTextColor || '#ffffff',
      neonColor: presetState.neonColor || '#a855f7',
      strokeEnabled: presetState.strokeEnabled ?? false,
      strokeColor: presetState.strokeColor || '#000000',
      strokeWidth: presetState.strokeWidth || 4,
      isUppercase: presetState.isUppercase ?? false,
      textAlign: presetState.textAlign || 'center',
      textPosition: presetState.textPosition || 'center',
      textPositionY: presetState.textPositionY ?? 50,
      animationStyle: presetState.animationStyle || 'typewriter',
      speedMultiplier: presetState.speedMultiplier || 1,
      pauseBetweenSeconds: presetState.pauseBetweenSeconds || 0.5,
      effects: presetState.effects || {
        glow: true,
        sparkle: false,
        fire: false,
        neon: false,
        shadow: true,
        particles: false,
      },
      aspectRatio: presetState.aspectRatio || '9:16',
    };

    let animId: number;
    const startTime = Date.now();

    const renderLoop = () => {
      const currentTime = (Date.now() - startTime) / 1000;
      renderCanvasFrame({
        ctx,
        state: fullState,
        currentTime,
        bgMediaElement: null,
        dimensions: { width: 360, height: 640 },
      });
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [preset]);

  if (!preset) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto select-none"
      onClick={onClose}
    >
      {/* Top Header */}
      <div
        className="w-full max-w-md flex items-center justify-between px-2 py-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 border border-white/15 shadow-lg cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400" />
          <span>{t('back', 'Назад')}</span>
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-bold text-white tracking-wide">{preset.name}</span>
          <span className="text-[10px] text-purple-300 font-semibold">{preset.author || 'TypeMixer'}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Fullscreen Canvas Preview */}
      <div
        className="relative flex-1 w-full max-w-md my-2 flex items-center justify-center overflow-hidden rounded-2xl border border-purple-500/40 shadow-2xl shadow-purple-950/80"
        onClick={(e) => e.stopPropagation()}
      >
        <canvas
          ref={canvasRef}
          width={360}
          height={640}
          className="w-full h-full object-contain rounded-2xl"
        />

        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-[11px] font-bold shadow-lg border border-purple-300/40 flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>FULLSCREEN PREVIEW</span>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="w-full max-w-md pt-2 flex items-center gap-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            onApply(preset);
            onClose();
          }}
          className={`w-full py-3.5 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl active:scale-98 ${
            isApplied
              ? 'bg-emerald-500 text-white shadow-emerald-900/50'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/60 ring-2 ring-purple-400/50'
          }`}
        >
          {isApplied ? (
            <>
              <Check className="w-5 h-5 text-white" />
              <span>{t('applied', 'Шаблон применен')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-purple-200 animate-pulse" />
              <span>{t('applyTemplateBtn', 'Применить этот шаблон')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const PresetsCatalogModal: React.FC<PresetsCatalogModalProps> = ({
  isOpen,
  onClose,
  allPresets,
  appliedId,
  onApplyPreset,
  onExportPreset,
  onDeletePreset,
  onSelectPresetForFullscreen,
}) => {
  const { t } = useLanguage();
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<SavedPreset | null>(null);

  if (!isOpen) return null;

  const handleDeleteConfirm = () => {
    if (deleteConfirmTarget) {
      onDeletePreset(deleteConfirmTarget.id);
      setDeleteConfirmTarget(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-zinc-950 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/60 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Compact Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-zinc-900/90 select-none">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t('catalogTitle', 'Каталог шаблонов')}{' '}
              <span className="text-purple-400">({allPresets.length})</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t('close', 'Закрыть')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delete Confirmation Overlay Dialog */}
        {deleteConfirmTarget && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-zinc-900 border border-rose-500/40 rounded-2xl p-5 shadow-2xl flex flex-col items-center text-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {t('deleteConfirmTitle', 'Удаление шаблона')}
                </h4>
                <p className="text-xs text-zinc-300">
                  {t('deleteConfirmDesc', 'Вы уверены, что хотите удалить этот шаблон из каталога?')}{' '}
                  <span className="font-bold text-rose-300">
                    &quot;{deleteConfirmTarget.name}&quot;
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-rose-900/50"
                >
                  {t('yesDelete', 'Да, удалить')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {t('cancel', 'Отмена')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Items Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-transparent">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {allPresets.map((preset) => (
              <CatalogPresetCard
                key={preset.id}
                preset={preset}
                isApplied={appliedId === preset.id}
                onApplyPreset={onApplyPreset}
                onExportPreset={onExportPreset}
                onDeleteRequest={(target) => setDeleteConfirmTarget(target)}
                onOpenFullscreen={(target) => onSelectPresetForFullscreen(target)}
              />
            ))}
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="px-4 py-2.5 bg-black/70 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('livePreviewFooter', 'Нажмите на шаблон для просмотра анимации и применения')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            {t('close', 'Закрыть')}
          </button>
        </div>
      </div>
    </div>
  );
};
