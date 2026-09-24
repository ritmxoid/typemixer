import React, { useState, useEffect } from 'react';
import { X, BookmarkPlus, Download, Sparkles, Tag, User } from 'lucide-react';
import { VideoProjectState } from '../types';
import { SavedPreset } from '../data/presetLibrary';
import { BACKGROUND_PRESETS } from '../data/presets';
import { useLanguage } from '../context/LanguageContext';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: VideoProjectState;
  onSaveToCatalog: (preset: SavedPreset) => void;
  onExportFile: (preset: SavedPreset, fileName: string) => void;
}

const LOCAL_STORAGE_LAST_AUTHOR = 'vibe_preset_last_author';

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onSaveToCatalog,
  onExportFile,
}) => {
  const { t } = useLanguage();
  const [presetName, setPresetName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill author from localStorage if available
      const savedAuthor = localStorage.getItem(LOCAL_STORAGE_LAST_AUTHOR) || 'Автор';
      setAuthorName(savedAuthor);
      setPresetName(`Мой шаблон #${Math.floor(Math.random() * 900 + 100)}`);
      setSaveSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const buildPresetObject = (): SavedPreset => {
    const finalName = presetName.trim() || 'Новый шаблон';
    const finalAuthor = authorName.trim() || 'Аноним';
    const fontName = (currentState.fontFamily || 'sans-serif')
      .split(',')[0]
      .replace(/['"]/g, '')
      .trim();

    let previewBg =
      currentState.bgCustomColor ||
      'linear-gradient(135deg, #18002e 0%, #3b0066 50%, #120024 100%)';

    if (currentState.bgType === 'preset') {
      const match = BACKGROUND_PRESETS.find((b) => b.id === currentState.bgPresetId);
      if (match?.colors && match.colors.length > 0) {
        previewBg =
          match.colors.length > 1
            ? `linear-gradient(135deg, ${match.colors.join(', ')})`
            : match.colors[0];
      }
    }

    // Explicitly exclude rawText and authorText so user's personal content is never shared
    return {
      id: `user-preset-${Date.now()}`,
      name: finalName,
      author: finalAuthor,
      createdAt: Date.now(),
      isBuiltIn: false,
      category: 'Пользовательский',
      previewBg,
      previewFontFamily: currentState.fontFamily,
      previewFontName: fontName,
      previewTextColor: currentState.textColor,
      state: {
        bgType: currentState.bgType,
        bgMediaUrl: currentState.bgMediaUrl,
        bgMediaType: currentState.bgMediaType,
        bgPresetId: currentState.bgPresetId,
        bgCustomColor: currentState.bgCustomColor,
        proceduralMood: currentState.proceduralMood,
        proceduralSeed: currentState.proceduralSeed,
        bgOverlayOpacity: currentState.bgOverlayOpacity,
        fontFamily: currentState.fontFamily,
        fontSize: currentState.fontSize,
        textColor: currentState.textColor,
        neonColor: currentState.neonColor,
        strokeEnabled: currentState.strokeEnabled,
        strokeColor: currentState.strokeColor,
        strokeWidth: currentState.strokeWidth,
        isUppercase: currentState.isUppercase,
        textAlign: currentState.textAlign,
        textPosition: currentState.textPosition,
        textPositionY: currentState.textPositionY,
        animationStyle: currentState.animationStyle,
        speedMultiplier: currentState.speedMultiplier,
        pauseBetweenSeconds: currentState.pauseBetweenSeconds,
        effects: { ...currentState.effects },
        audio: { ...currentState.audio },
        aspectRatio: currentState.aspectRatio,
        // Excluded: rawText and authorText are omitted for privacy
      } as VideoProjectState,
    };
  };

  const getFormattedFileName = (preset: SavedPreset): string => {
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const safeName = (preset.name || 'preset').replace(/[^a-z0-9а-яë]/gi, '_');
    const safeAuthor = (preset.author || 'author').replace(/[^a-z0-9а-яë]/gi, '_');
    return `TypeMixer_preset__${safeName}__${safeAuthor}__${dateStr}.json`;
  };

  const handleSaveToCatalogClick = (e: React.FormEvent) => {
    e.preventDefault();
    const preset = buildPresetObject();
    localStorage.setItem(LOCAL_STORAGE_LAST_AUTHOR, preset.author || '');
    onSaveToCatalog(preset);
    setSaveSuccessMsg(t('presetSavedSuccess', 'Шаблон успешно сохранен в Каталог!'));
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleExportFileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const preset = buildPresetObject();
    localStorage.setItem(LOCAL_STORAGE_LAST_AUTHOR, preset.author || '');
    const fileName = getFormattedFileName(preset);
    onExportFile(preset, fileName);
    setSaveSuccessMsg(t('fileDownloadedSuccess', 'Файл скачан!'));
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-zinc-950 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/80 p-6 overflow-hidden flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-md">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {t('savePresetTitle', 'Сохранить шаблон')}
              </h3>
              <p className="text-xs text-zinc-400">
                {t('savePresetDesc', 'Введите название и автора для сохранения в ваш каталог или в файл')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title={t('close', 'Закрыть')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in zoom-in-95 duration-150">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Input Fields Form */}
        <form onSubmit={handleSaveToCatalogClick} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('presetNameLabel', 'Название шаблона')}:</span>
            </label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t('presetNamePlaceholder', 'Название шаблона...')}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 focus:border-purple-400 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-purple-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('presetAuthorLabel', 'Имя автора')}:</span>
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t('presetAuthorPlaceholder', 'Введите ваше имя или псевдоним...')}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 focus:border-purple-400 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all"
            />
          </div>

          {/* Action Choice Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <button
              type="submit"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/40 transition-all cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>{t('saveToCatalogBtn', 'Сохранить в каталог')}</span>
            </button>

            <button
              type="button"
              onClick={handleExportFileClick}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>{t('downloadFileBtn', 'Скачать в файл')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
