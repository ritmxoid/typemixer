import React from 'react';
import { BookmarkPlus, Sparkles, X } from 'lucide-react';
import { SavedPreset } from '../data/presetLibrary';
import { useLanguage } from '../context/LanguageContext';

interface LoadPresetPromptModalProps {
  isOpen: boolean;
  preset: SavedPreset | null;
  onSaveToCatalog: () => void;
  onDismiss: () => void;
}

export const LoadPresetPromptModal: React.FC<LoadPresetPromptModalProps> = ({
  isOpen,
  preset,
  onSaveToCatalog,
  onDismiss,
}) => {
  const { t } = useLanguage();
  if (!isOpen || !preset) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
      <div className="relative w-full max-w-sm bg-zinc-950/95 border border-purple-500/50 rounded-3xl shadow-2xl shadow-purple-950/90 p-5 flex flex-col items-center text-center gap-4">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title={t('close', 'Закрыть')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/40 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white mb-1">
            {t('importedPresetTitle', 'Шаблон загружен!')} &quot;{preset.name}&quot;
          </h3>
          {preset.author && (
            <p className="text-xs text-purple-300 mb-2 font-medium">
              {t('authorLabel', 'Автор')}: <span className="text-white font-bold">{preset.author}</span>
            </p>
          )}
          <p className="text-xs text-zinc-300">
            {t('importedPresetQuestion', 'Хотите сохранить этот шаблон в ваш каталог?')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-1">
          <button
            type="button"
            onClick={() => {
              onSaveToCatalog();
              onDismiss();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>{t('yesSaveToCatalog', 'Да, сохранить в каталог')}</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-medium transition-all cursor-pointer shrink-0"
          >
            {t('dismiss', 'Пропустить')}
          </button>
        </div>
      </div>
    </div>
  );
};
