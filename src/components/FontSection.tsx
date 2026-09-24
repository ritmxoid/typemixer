import React, { useState } from 'react';
import { AlignCenter, AlignLeft, AlignRight, MoveVertical, MoveHorizontal, Type, Palette, Check } from 'lucide-react';
import { FONT_OPTIONS } from '../data/presets';
import { VideoProjectState } from '../types';
import { ColorPickerModal } from './ColorPickerModal';
import { useLanguage } from '../context/LanguageContext';

const COLOR_SWATCHES = [
  { label: 'Белый', value: '#ffffff' },
  { label: 'Желтый', value: '#facc15' },
  { label: 'Неон циан', value: '#06b6d4' },
  { label: 'Розовый', value: '#f43f5e' },
  { label: 'Фиолетовый', value: '#c084fc' },
  { label: 'Мятный', value: '#34d399' },
  { label: 'Оранжевый', value: '#fb923c' },
  { label: 'Черный', value: '#09090b' },
];

interface FontSectionProps {
  state: VideoProjectState;
  onChange: (patch: Partial<VideoProjectState>) => void;
}

export const FontSection: React.FC<FontSectionProps> = ({ state, onChange }) => {
  const { t } = useLanguage();
  const [isTextColorPickerOpen, setIsTextColorPickerOpen] = useState(false);
  const [isStrokeColorPickerOpen, setIsStrokeColorPickerOpen] = useState(false);

  return (
    <div className="bg-[#16161D] border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/20 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center border border-purple-500/30">
            2
          </span>
          {t('fontSectionTitle', 'Шрифт и оформление')}
        </h2>
        <span className="text-xs text-zinc-400 font-medium">20+ {t('fonts', 'шрифтов')}</span>
      </div>

      {/* Primary Position, Size & Color Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#0F0F12]/90 border border-white/10 rounded-xl p-3.5 shadow-sm">
        {/* Height Position (Положение по вертикали Y) */}
        <div className="flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <MoveVertical className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('verticalY', 'Высота (Y)')}</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {typeof state.textPositionY === 'number' ? state.textPositionY : 50}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-medium">{t('posTop', 'Верх')}</span>
            <input
              type="range"
              min="15"
              max="85"
              step="1"
              value={typeof state.textPositionY === 'number' ? state.textPositionY : 50}
              onChange={(e) =>
                onChange({ textPositionY: parseInt(e.target.value, 10) })
              }
              className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              title={t('verticalY', 'Положение текста по высоте')}
            />
            <span className="text-[10px] text-zinc-500 font-medium">{t('posBottom', 'Низ')}</span>
          </div>
        </div>

        {/* Horizontal Position (Положение по горизонтали X) */}
        <div className="flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <MoveHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('horizontalX', 'Позиция (X)')}</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              {typeof state.textPositionX === 'number' ? state.textPositionX : 50}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-medium">←</span>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={typeof state.textPositionX === 'number' ? state.textPositionX : 50}
              onChange={(e) =>
                onChange({ textPositionX: parseInt(e.target.value, 10) })
              }
              className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              title="Положение текста по горизонтали"
            />
            <span className="text-[10px] text-zinc-500 font-medium">→</span>
          </div>
        </div>

        {/* Font Size (Размер шрифта) */}
        <div className="flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('fontSize', 'Размер шрифта')}</span>
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="18"
                max="1000"
                value={state.fontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) onChange({ fontSize: Math.max(10, Math.min(1000, val)) });
                }}
                className="w-14 bg-zinc-800 border border-white/10 rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-purple-300 font-bold focus:outline-none focus:border-purple-400"
              />
              <span className="text-[11px] text-zinc-400 font-mono">px</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-medium">A-</span>
            <input
              type="range"
              min="18"
              max="500"
              step="2"
              value={state.fontSize}
              onChange={(e) =>
                onChange({ fontSize: parseInt(e.target.value, 10) })
              }
              className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
              title={t('fontSize', 'Размер шрифта')}
            />
            <span className="text-[10px] text-zinc-500 font-medium">A+</span>
          </div>
        </div>

        {/* Text Color (Цвет шрифта) */}
        <div className="flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('fontColor', 'Цвет шрифта')}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsTextColorPickerOpen(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/20 bg-zinc-800/80 hover:bg-zinc-700 transition-all cursor-pointer shadow-sm active:scale-95"
                title={t('colorPicker', 'Выбрать свой цвет шрифта')}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner shrink-0"
                  style={{ backgroundColor: state.textColor }}
                />
                <span className="text-[10px] font-mono text-zinc-300 font-semibold uppercase">
                  {state.textColor}
                </span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLOR_SWATCHES.map((swatch) => {
              const isSelected =
                state.textColor.toLowerCase() === swatch.value.toLowerCase();
              return (
                <button
                  key={swatch.value}
                  onClick={() => onChange({ textColor: swatch.value })}
                  className={`w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-purple-400 scale-110 border-white z-10'
                      : 'border-white/20 hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatch.value }}
                  title={t('swatch_' + swatch.value, swatch.label)}
                >
                  {isSelected && (
                    <Check
                      className={`w-3 h-3 ${
                        swatch.value === '#ffffff' || swatch.value === '#facc15'
                          ? 'text-black'
                          : 'text-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Font Cards Grid - 1.5 rows visible with scroll */}
      <div
        id="font-picker-block"
        className="scroll-mt-20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[160px] sm:max-h-[170px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent rounded-xl transition-all duration-300"
      >
        {FONT_OPTIONS.map((font) => {
          const isSelected = state.fontFamily === font.family;
          const fontKey = font.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
          return (
            <button
              key={font.id}
              onClick={() => onChange({ fontFamily: font.family })}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1 group cursor-pointer ${
                isSelected
                  ? 'border-purple-400 bg-purple-500/15 shadow-sm ring-1 ring-purple-400/50'
                  : 'border-white/10 bg-[#0F0F12]/60 hover:bg-[#0F0F12] hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white">
                  {t('font_name_' + fontKey, font.name)}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5">
                  {t('font_cat_' + fontKey, font.category)}
                </span>
              </div>
              <div
                className="text-base sm:text-lg text-white font-bold truncate mt-1 drop-shadow-sm"
                style={{ fontFamily: font.family }}
              >
                {t('font_sample_' + fontKey, font.sampleText)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Stroke & Formatting Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
        {/* Stroke Checkbox */}
        <div className="bg-[#0F0F12]/80 border border-white/10 rounded-xl p-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200">
            <input
              type="checkbox"
              checked={state.strokeEnabled}
              onChange={(e) => onChange({ strokeEnabled: e.target.checked })}
              className="w-4 h-4 rounded accent-purple-500 bg-zinc-800 border-zinc-700 cursor-pointer"
            />
            <span>{t('stroke', 'Контурная обводка текста')}</span>
          </label>

          {state.strokeEnabled && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsStrokeColorPickerOpen(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/20 bg-zinc-800/80 hover:bg-zinc-700 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                title={t('strokeColor', 'Цвет обводки')}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner shrink-0"
                  style={{ backgroundColor: state.strokeColor }}
                />
                <span className="text-[10px] font-mono text-zinc-300 font-semibold uppercase">
                  {state.strokeColor}
                </span>
              </button>
              <div className="flex-1">
                <input
                  type="range"
                  min="2"
                  max="16"
                  value={state.strokeWidth}
                  onChange={(e) =>
                    onChange({ strokeWidth: parseInt(e.target.value) })
                  }
                  className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {state.strokeWidth}px
              </span>
            </div>
          )}
        </div>

        {/* Uppercase & Alignment */}
        <div className="bg-[#0F0F12]/80 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200">
            <input
              type="checkbox"
              checked={state.isUppercase}
              onChange={(e) => onChange({ isUppercase: e.target.checked })}
              className="w-4 h-4 rounded accent-purple-500 bg-zinc-800 border-zinc-700 cursor-pointer"
            />
            <span>{t('uppercase', 'ЗАГЛАВНЫЕ')}</span>
          </label>

          <div className="flex items-center gap-1 bg-[#16161D] border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => onChange({ textAlign: 'left' })}
              className={`p-1.5 rounded ${
                state.textAlign === 'left'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={t('alignLeft', 'По левому краю')}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChange({ textAlign: 'center' })}
              className={`p-1.5 rounded ${
                state.textAlign === 'center'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={t('alignCenter', 'По центру')}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChange({ textAlign: 'right' })}
              className={`p-1.5 rounded ${
                state.textAlign === 'right'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={t('alignRight', 'По правому краю')}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Picker Modals */}
      <ColorPickerModal
        isOpen={isTextColorPickerOpen}
        onClose={() => setIsTextColorPickerOpen(false)}
        color={state.textColor}
        onChange={(newColor) => onChange({ textColor: newColor })}
        title={t('textColorPicker', 'Микшер цвета текста')}
      />

      <ColorPickerModal
        isOpen={isStrokeColorPickerOpen}
        onClose={() => setIsStrokeColorPickerOpen(false)}
        color={state.strokeColor}
        onChange={(newColor) => onChange({ strokeColor: newColor })}
        title={t('strokeColorPicker', 'Микшер цвета обводки')}
      />
    </div>
  );
};
