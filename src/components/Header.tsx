import React, { useRef, useState, useEffect } from 'react';
import { Upload, Film, RotateCcw } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';

interface HeaderProps {
  onFileUpload?: (file: File) => void;
  fileName?: string | null;
  onClearFile?: () => void;
  onResetProject?: () => void;
  isSaved?: boolean;
  onOpenUploadModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onFileUpload,
  fileName,
  onClearFile,
  onResetProject,
  onOpenUploadModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const handleUploadTrigger = () => {
    if (onOpenUploadModal) {
      onOpenUploadModal();
    } else if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangMenuOpen]);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="border-b border-white/10 bg-[#16161D]/95 backdrop-blur-md sticky top-0 z-40 px-2.5 sm:px-4 lg:px-8 py-2 sm:py-2.5 w-full overflow-x-clip">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          <img
            src="./favicon.svg"
            alt="TypeMixer Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shadow-md shadow-purple-600/30 ring-1 ring-white/20 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 truncate leading-tight">
              <span className="truncate bg-gradient-to-r from-white via-zinc-100 to-purple-200 bg-clip-text text-transparent">
                {t('appName', 'TypeMixer')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 hidden md:inline shrink-0">
                {t('appTagline', 'Reels & Stories')}
              </span>
            </h1>
            <div className="text-[10px] sm:text-[11px] font-medium text-purple-300/90 truncate leading-none mt-0.5">
              {t('appSubtitle', 'Аниматор Текста')}
            </div>
          </div>
        </div>

        {/* Top Actions: Language, Reset & File Upload */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Selector */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="text-xs text-zinc-300 hover:text-white px-2 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="Выбрать язык / Select language"
            >
              <span className="text-[11px] font-semibold uppercase">{currentLangObj.code}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-[#1a1a24] border border-white/15 rounded-xl shadow-xl shadow-black/50 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLanguage(l.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      language === l.code
                        ? 'bg-purple-600/30 text-purple-200 font-semibold'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {onResetProject && (
            <button
              type="button"
              onClick={onResetProject}
              className="text-xs text-zinc-400 hover:text-zinc-200 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title={t('resetAllTitle', 'Сбросить проект к исходным настройкам')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('resetAll', 'Сбросить всё')}</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,image/*,audio/*,.mp4,.webm,.mov,.m4v,.mkv,.jpg,.jpeg,.png,.webp,.mp3,.wav,.ogg,.m4a,.aac,.flac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0] && onFileUpload) {
                onFileUpload(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          {fileName ? (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-purple-500/15 border border-purple-500/30 rounded-xl px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs text-purple-200 shrink-0">
              <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">
                {fileName.length > 5 ? `${fileName.slice(0, 5)}…` : fileName}
              </span>
              <button
                type="button"
                onClick={handleUploadTrigger}
                className="shrink-0 hover:text-white px-1 sm:px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] sm:text-[11px] font-semibold transition-colors cursor-pointer text-purple-300 ml-0.5"
                title="Выбрать другое видео или фото"
              >
                {t('replace', 'Заменить')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUploadTrigger}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shrink-0"
              title="Загрузить собственное фоновое видео или фото (до 35 МБ)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('uploadVideoPhoto', 'Загрузить видео / фото')}</span>
              <span className="sm:hidden inline">{t('uploadShort', 'Загрузить')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};




