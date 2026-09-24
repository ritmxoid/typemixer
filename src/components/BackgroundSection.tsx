import React, { useState } from 'react';
import {
  Film,
  X,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  Upload,
  Sparkles,
  RefreshCw,
  Dices,
  Infinity,
} from 'lucide-react';
import { BACKGROUND_PRESETS } from '../data/presets';
import { VideoProjectState } from '../types';
import { ColorPickerModal } from './ColorPickerModal';
import { useLanguage } from '../context/LanguageContext';

interface BackgroundSectionProps {
  state: VideoProjectState;
  onChange: (patch: Partial<VideoProjectState>) => void;
  onClearBackgroundMedia: () => void;
  fileName: string | null;
  onOpenUploadModal?: () => void;
}

export const BackgroundSection: React.FC<BackgroundSectionProps> = ({
  state,
  onChange,
  onClearBackgroundMedia,
  fileName,
  onOpenUploadModal,
}) => {
  const { t } = useLanguage();
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const isCustomMediaActive =
    (state.bgType === 'video' || state.bgType === 'image') && Boolean(state.bgMediaUrl);

  return (
    <div className="bg-[#16161D] border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center border border-purple-500/30">
            3
          </span>
          {t('bgSectionTitle', 'Фон видео')}
        </h2>

        {fileName && (
          <button
            type="button"
            onClick={onClearBackgroundMedia}
            className="text-xs text-zinc-400 hover:text-rose-300 flex items-center gap-1 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            title={t('deleteFile', 'Сбросить прикрепленный файл')}
          >
            <X className="w-3.5 h-3.5" /> {t('deleteFile', 'Сбросить фон')}
          </button>
        )}
      </div>

      {/* Active User Media Status or Quick Upload Prompt */}
      {fileName ? (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {state.bgMediaType === 'image' ? (
              <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
            ) : (
              <Film className="w-4 h-4 text-purple-400 shrink-0" />
            )}
            <span className="text-zinc-200 font-medium truncate max-w-[150px] sm:max-w-[220px]">
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenUploadModal && (
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="text-[11px] font-semibold text-purple-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 transition-colors cursor-pointer"
                title={t('replace', 'Заменить текущий фон другим файлом')}
              >
                {t('replace', 'Заменить')}
              </button>
            )}

            {isCustomMediaActive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> {t('active', 'Активен')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    bgType: state.bgMediaType === 'image' ? 'image' : 'video',
                  })
                }
                className="text-[11px] font-bold text-purple-300 hover:text-purple-200 bg-purple-500/20 hover:bg-purple-500/30 px-2.5 py-1 rounded-lg border border-purple-500/30 transition-colors cursor-pointer"
              >
                {t('enable', 'Включить')}
              </button>
            )}
          </div>
        </div>
      ) : onOpenUploadModal ? (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-950/25 via-purple-900/15 to-indigo-950/20 border border-purple-500/25 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Upload className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-zinc-200 font-semibold block text-[11px] sm:text-xs truncate">
                {t('uploadVideoPhoto', 'Свой видеоролик или фото')}
              </span>
              <span className="text-[10px] text-zinc-400 block">
                {t('maxUploadSizeDesc', 'Рекомендуемый размер видео — до 35 МБ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="text-[11px] font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-md shadow-purple-600/20 shrink-0 hover:scale-[1.02] active:scale-95"
          >
            {t('uploadShort', 'Загрузить')}
          </button>
        </div>
      ) : null}

      {/* Preset Background Gradients */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            {fileName ? t('gradientThemes', 'Градиентные и анимированные темы:') : t('colorThemes', 'Цветовые и анимированные темы:')}
          </label>
        </div>

        <div className="max-h-[92px] sm:max-h-[92px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent rounded-xl">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {BACKGROUND_PRESETS.map((preset) => {
              const isSelected =
                state.bgType === 'preset' && state.bgPresetId === preset.id;
              const isBrightTheme =
                preset.id === 'clean-white' ||
                preset.id === 'notebook-grid' ||
                preset.id === 'notebook-flip';
              const isRegenerable = preset.id.startsWith('ai-procedural-');
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => {
                    onChange({
                      bgType: 'preset',
                      bgPresetId: preset.id,
                    });
                  }}
                  className={`h-14 rounded-xl border relative overflow-hidden transition-all text-left p-2 flex flex-col justify-end cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-purple-400 ring-2 ring-purple-500/50 scale-[1.02]'
                      : 'border-white/15 hover:border-zinc-400 opacity-85 hover:opacity-100'
                  }`}
                  style={{
                    background:
                      preset.id === 'clean-white'
                        ? (state.bgCustomColor || '#ffffff')
                        : preset.id === 'notebook-flip'
                        ? 'linear-gradient(90deg, #64748b 0%, #64748b 12%, #f8fafc 13%, #ffffff 100%)'
                        : preset.id === 'notebook-grid'
                        ? `repeating-linear-gradient(0deg, ${state.bgCustomColor || '#ffffff'}, ${state.bgCustomColor || '#ffffff'} 11px, #bfdbfe 12px), repeating-linear-gradient(90deg, ${state.bgCustomColor || '#ffffff'}, ${state.bgCustomColor || '#ffffff'} 11px, #bfdbfe 12px)`
                        : preset.id === 'anecdote'
                        ? 'linear-gradient(135deg, #1e0538, #581c87)'
                        : preset.id === 'autumn'
                        ? 'linear-gradient(135deg, #451a03, #b45309)'
                        : preset.id === 'winter'
                        ? 'linear-gradient(135deg, #082f49, #38bdf8)'
                        : preset.id === 'music'
                        ? 'linear-gradient(135deg, #090a1a, #a855f7)'
                        : preset.id === 'disco'
                        ? 'linear-gradient(135deg, #09090f, #ec4899)'
                        : preset.id === 'lasers'
                        ? 'linear-gradient(135deg, #03050a, #06b6d4)'
                        : preset.id === 'old-parchment'
                        ? 'linear-gradient(135deg, #e8d3a7, #c99b5b)'
                        : preset.id === 'flying-questions'
                        ? 'radial-gradient(circle at center, #1e1b4b 0%, #090a1a 100%)'
                        : preset.id === 'flying-exclamations'
                        ? 'linear-gradient(135deg, #450a0a, #7f1d1d)'
                        : preset.id === 'flying-kisses'
                        ? 'linear-gradient(135deg, #500724, #18020a)'
                        : preset.id === 'flying-currency'
                        ? 'linear-gradient(135deg, #022115, #064e3b)'
                        : preset.id === 'cosmic-dark' || preset.id === 'stary-sky'
                        ? 'radial-gradient(circle at center, #1e1b4b 0%, #030712 100%)'
                        : preset.id === 'flying-hearts'
                        ? 'linear-gradient(135deg, #881337, #e11d48)'
                        : preset.id === 'flying-balloons'
                        ? 'linear-gradient(135deg, #0f172a, #38bdf8)'
                        : `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                  }}
                  title={t('bgPreset_desc_' + preset.id, preset.description)}
                >
                  {isRegenerable && (
                    <span
                      className="absolute top-1 right-1 px-1 py-0.5 rounded bg-black/65 backdrop-blur-xs text-purple-300 border border-white/10 flex items-center justify-center pointer-events-none shadow-xs"
                      title={t('proceduralBadge', 'Бесконечные варианты генерации')}
                    >
                      <Infinity className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <span
                    className={`text-[10px] sm:text-[10.5px] font-bold leading-tight line-clamp-1 ${
                      isBrightTheme && (!state.bgCustomColor || state.bgCustomColor === '#ffffff' || state.bgCustomColor.startsWith('#f')) ? 'text-zinc-900 font-extrabold' : 'text-white drop-shadow'
                    }`}
                  >
                    {t('bgPreset_name_' + preset.id, preset.name)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Color Selector for Лист and Gradient Backgrounds */}
      {(state.bgPresetId === 'clean-white' || state.bgPresetId === 'notebook-grid' || BACKGROUND_PRESETS.find(p => p.id === state.bgPresetId)?.type === 'gradient') && (
        <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-white">
                {state.bgPresetId === 'clean-white' ? t('paperColor', 'Цвет листа:') : state.bgPresetId === 'notebook-grid' ? t('notebookGridColor', 'Цвет бумаги в клетку:') : t('bgColorTint', 'Цвет оттенка фона:')}
              </span>
            </div>
            {state.bgCustomColor && (
              <button
                type="button"
                onClick={() => onChange({ bgCustomColor: undefined })}
                className="text-[10px] text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                {t('reset', 'По умолчанию')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'Белый', color: '#ffffff' },
              { label: 'Слоновая кость', color: '#fefce8' },
              { label: 'Бежевый', color: '#f5efe6' },
              { label: 'Мятный', color: '#ecfdf5' },
              { label: 'Розовый', color: '#fff1f2' },
              { label: 'Лаванда', color: '#f5f3ff' },
              { label: 'Небесный', color: '#f0f9ff' },
              { label: 'Лимонный', color: '#fef08a' },
              { label: 'Персик', color: '#ffedd5' },
              { label: 'Тёмный', color: '#18181b' },
            ].map((swatch) => {
              const isActive = (state.bgCustomColor || '#ffffff').toLowerCase() === swatch.color.toLowerCase();
              return (
                <button
                  type="button"
                  key={swatch.color}
                  onClick={() => onChange({ bgCustomColor: swatch.color })}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer relative shadow-sm ${
                    isActive
                      ? 'border-purple-500 ring-2 ring-purple-500/50 scale-110'
                      : 'border-white/30 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.color }}
                  title={t('swatch_' + swatch.color, swatch.label)}
                />
              );
            })}

            {/* Custom Color Mixer Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsColorPickerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-white/15 cursor-pointer text-[11px] text-zinc-200 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
              title={t('colorPicker', 'Открыть микшер цвета')}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner shrink-0"
                style={{ backgroundColor: state.bgCustomColor || '#ffffff' }}
              />
              <span className="font-mono text-[10px] uppercase font-semibold">
                {state.bgCustomColor || '#ffffff'}
              </span>
              <Palette className="w-3 h-3 text-purple-400 shrink-0" />
            </button>
          </div>

          <ColorPickerModal
            isOpen={isColorPickerOpen}
            onClose={() => setIsColorPickerOpen(false)}
            color={state.bgCustomColor || '#ffffff'}
            onChange={(newColor) => onChange({ bgCustomColor: newColor })}
            title={t('colorMixerTitle', 'Микшер цвета фона')}
          />
        </div>
      )}

      {/* Background Dimming Slider */}
      <div className="pt-2.5 border-t border-white/10 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-purple-400" /> {t('backgroundDimming', 'Затемнение фона')}
          </span>
        </div>
        <div className="flex items-center gap-3 px-1 py-0.5">
          <div className="flex-1 px-1 sm:px-2">
            <input
              type="range"
              min="0"
              max="0.85"
              step="0.05"
              value={state.bgOverlayOpacity}
              onChange={(e) =>
                onChange({ bgOverlayOpacity: parseFloat(e.target.value) })
              }
              className="w-full accent-purple-500 bg-zinc-800 h-2.5 rounded-lg cursor-pointer touch-pan-x"
            />
          </div>
          <span className="w-12 text-center py-1 px-1.5 rounded-lg bg-black/50 border border-white/10 text-xs font-mono font-bold text-purple-300 shrink-0 select-none">
            {Math.round(state.bgOverlayOpacity * 100)}%
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 px-1">
          {t('bgDimmingDesc', 'Затемните фон, чтобы белые буквы контрастно читались поверх видео')}
        </p>
      </div>
    </div>
  );
};
