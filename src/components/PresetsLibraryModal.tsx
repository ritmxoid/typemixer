import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Download,
  Upload,
  Sparkles,
  Trash2,
  Check,
  FolderHeart,
  BookmarkPlus,
  Play,
  Layers,
  Music,
  Type,
  Eye,
} from 'lucide-react';
import { BUILTIN_PRESETS, SavedPreset } from '../data/presetLibrary';
import { VideoProjectState } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PresetsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: VideoProjectState;
  onApplyPreset: (newPartialState: Partial<VideoProjectState>) => void;
  onSaveCurrentAsPreset: (customName?: string) => void;
}

const LOCAL_STORAGE_KEY = 'vibe_quote_user_presets';

export const PresetsLibraryModal: React.FC<PresetsLibraryModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onApplyPreset,
  onSaveCurrentAsPreset,
}) => {
  const { t } = useLanguage();
  const [userPresets, setUserPresets] = useState<SavedPreset[]>([]);
  const [saveName, setSaveName] = useState<string>('');
  const [isSavingMode, setIsSavingMode] = useState<boolean>(false);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user custom saved presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserPresets(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading saved presets from localStorage:', e);
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveCurrent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = saveName.trim() || `Мой шаблон №${userPresets.length + 1}`;

    // Extract font name for display
    const fontName = currentState.fontFamily.split(',')[0].replace(/['"]/g, '').trim();

    // Create thumbnail background gradient from state or default
    const previewBg =
      currentState.bgCustomColor ||
      'linear-gradient(135deg, #18002e 0%, #3b0066 50%, #120024 100%)';

    const newPreset: SavedPreset = {
      id: `user-preset-${Date.now()}`,
      name: finalName,
      createdAt: Date.now(),
      isBuiltIn: false,
      category: 'Пользовательский',
      previewBg,
      previewFontFamily: currentState.fontFamily,
      previewFontName: fontName,
      previewTextColor: currentState.textColor,
      state: {
        bgType: currentState.bgType,
        bgPresetId: currentState.bgPresetId,
        bgCustomColor: currentState.bgCustomColor,
        proceduralMood: currentState.proceduralMood,
        fontFamily: currentState.fontFamily,
        textColor: currentState.textColor,
        neonColor: currentState.neonColor,
        effects: { ...currentState.effects },
        animationStyle: currentState.animationStyle,
        speedMultiplier: currentState.speedMultiplier,
        audio: { ...currentState.audio },
      },
    };

    const updated = [newPreset, ...userPresets];
    setUserPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }

    onSaveCurrentAsPreset(finalName);
    setSaveName('');
    setIsSavingMode(false);
    showToast(t('templateSavedToast', 'Шаблон сохранен в Библиотеку!'));
  };

  const handleDeleteUserPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = userPresets.filter((p) => p.id !== id);
    setUserPresets(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update localStorage:', err);
    }
    showToast('Шаблон удалениз Библиотеки');
  };

  const handleExportJson = (preset: SavedPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(preset, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${preset.name.replace(/[^a-z0-9а-я]/gi, '_').toLowerCase()}_preset.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(t('templateSavedToast', 'Шаблон сохранен в файл!'));
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content);

        // Validate structure
        if (imported && (imported.state || imported.fontFamily || imported.textColor)) {
          const presetState = imported.state || imported;
          const importedName = imported.name || file.name.replace(/\.json$/i, '');
          const fontName = (presetState.fontFamily || currentState.fontFamily)
            .split(',')[0]
            .replace(/['"]/g, '')
            .trim();

          const newPreset: SavedPreset = {
            id: `imported-${Date.now()}`,
            name: `📥 ${importedName}`,
            createdAt: Date.now(),
            isBuiltIn: false,
            category: 'Импортированный',
            previewBg: imported.previewBg || 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            previewFontFamily: presetState.fontFamily || currentState.fontFamily,
            previewFontName: fontName,
            previewTextColor: presetState.textColor || currentState.textColor,
            state: presetState,
          };

          const updated = [newPreset, ...userPresets];
          setUserPresets(updated);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

          // Auto apply imported preset
          onApplyPreset(presetState);
          setAppliedId(newPreset.id);
          showToast(t('templateLoadedToast', 'Шаблон успешно импортирован и применен!'));
        } else {
          showToast(t('templateErrorToast', 'Не удалось прочитать файл шаблона'));
        }
      } catch (err) {
        console.error('JSON import error:', err);
        showToast(t('templateErrorToast', 'Ошибка формата файла JSON'));
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApply = (preset: SavedPreset) => {
    onApplyPreset(preset.state);
    setAppliedId(preset.id);
    showToast(`Применен шаблон "${preset.name}"`);
    setTimeout(() => {
      setAppliedId(null);
    }, 2000);
  };

  if (!isOpen) return null;

  const allPresets = [...userPresets, ...BUILTIN_PRESETS];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-zinc-950/95 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-950/50 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast alert banner */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-2xl shadow-purple-900/80 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-600/30 shrink-0 flex items-center justify-center">
              <FolderHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{t('templatesPanelTitle', 'Библиотека шаблонов')}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  {allPresets.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {t('saveTemplateDesc', 'Сохраняйте свои анимации или выбирайте из каталога')}
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsSavingMode(!isSavingMode)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>{t('saveTemplateBtn', 'Сохранить текущий')}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Загрузить из файла JSON"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">{t('loadTemplateBtn', 'Загрузить файл')}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJsonFile}
              accept=".json"
              className="hidden"
            />

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
              title="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Quick Save Form */}
        {isSavingMode && (
          <form
            onSubmit={handleSaveCurrent}
            className="p-4 bg-purple-950/30 border-b border-purple-500/30 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-medium text-purple-300 mb-1">
                Название вашего нового шаблона:
              </label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={`Мой шаблон №${userPresets.length + 1}`}
                autoFocus
                className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-purple-500/40 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-4">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30"
              >
                <Check className="w-4 h-4" />
                <span>Сохранить в Библиотеку</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSavingMode(false)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 text-xs font-medium cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* Catalog Grid Container: Starts at 3x4 layout, scales up to 4x5, scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-transparent">
          {/* Catalog items grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4.5">
            {allPresets.map((preset) => {
              const isApplied = appliedId === preset.id;
              const isUser = !preset.isBuiltIn;

              return (
                <div
                  key={preset.id}
                  onClick={() => handleApply(preset)}
                  className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-3.5 h-44 sm:h-48 select-none ${
                    isApplied
                      ? 'border-purple-400 bg-purple-950/80 ring-2 ring-purple-400 shadow-xl shadow-purple-600/40 scale-[1.02]'
                      : 'border-white/10 hover:border-purple-500/50 bg-zinc-900/80 hover:bg-zinc-900 hover:shadow-lg hover:shadow-purple-950/50 hover:scale-[1.01]'
                  }`}
                  style={{
                    background: preset.previewBg,
                  }}
                >
                  {/* Subtle glass dark overlay for text legibility */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors pointer-events-none" />

                  {/* Top Badge Row */}
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                        isUser
                          ? 'bg-purple-600/70 border-purple-400/50 text-purple-100'
                          : 'bg-black/60 border-white/20 text-zinc-300'
                      }`}
                    >
                      {preset.category || (isUser ? 'Свой' : 'Встроенный')}
                    </span>

                    {/* Action icons on card top right */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleExportJson(preset, e)}
                        className="w-6 h-6 rounded-lg bg-black/50 hover:bg-purple-600 text-zinc-300 hover:text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                        title="Скачать .json файл"
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      {isUser && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteUserPreset(preset.id, e)}
                          className="w-6 h-6 rounded-lg bg-black/50 hover:bg-rose-600 text-zinc-300 hover:text-white flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                          title="Удалить из Библиотеки"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle Sample Text Preview */}
                  <div className="relative z-10 flex flex-col items-center justify-center my-auto py-1 text-center">
                    <span
                      style={{
                        fontFamily: preset.previewFontFamily,
                        color: preset.previewTextColor,
                      }}
                      className="text-base sm:text-lg font-bold tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] truncate max-w-full px-1"
                    >
                      {preset.name.replace(/^[^\s]+\s/, '') || 'Вайб СТИЛЬ'}
                    </span>
                    <span className="text-[10px] text-zinc-300 font-mono opacity-80 mt-0.5">
                      {preset.previewFontName}
                    </span>
                  </div>

                  {/* Bottom Card Action Footer */}
                  <div className="relative z-10 flex items-center justify-between gap-1.5 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-300 truncate">
                      <Layers className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="capitalize text-[10px]">
                        {preset.state.animationStyle || 'typewriter'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(preset);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-md ${
                        isApplied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Применен</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Применить</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer info */}
        <div className="px-4 py-3 bg-black/60 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>
              Кликните на любой шаблон, чтобы мгновенно применить его ко всему проекту.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
