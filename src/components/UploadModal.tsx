import React, { useRef } from 'react';
import {
  Upload,
  Film,
  Image as ImageIcon,
  X,
  HardDrive,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  currentFileName?: string | null;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  currentFileName,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileUpload(file);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#16161D] border border-white/15 rounded-2xl w-full max-w-sm p-4 shadow-2xl shadow-purple-950/40 text-zinc-100 relative space-y-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*,audio/*,.mp4,.webm,.mov,.m4v,.mkv,.jpg,.jpeg,.png,.webp,.mp3,.wav,.ogg,.m4a,.aac,.flac"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {t('uploadModalTitle', 'Загрузить видео или фото')}
              </h3>
              <p className="text-[11px] text-zinc-400">
                MP4, WebM, MOV • JPG, PNG
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={t('back', 'Закрыть')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current background name if present */}
        {currentFileName && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/5 text-[11px] text-zinc-300">
            <HardDrive className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">{t('currentBg', 'Фон:')} {currentFileName}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={handleSelectClick}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-98"
          >
            <Upload className="w-4 h-4" />
            <span>{t('selectFileBtn', 'Выбрать файл')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs border border-white/10 transition-colors cursor-pointer"
          >
            {t('back', 'Отмена')}
          </button>
        </div>
      </div>
    </div>
  );
};
