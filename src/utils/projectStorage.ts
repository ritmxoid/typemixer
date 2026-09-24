/**
 * Persistent Storage Engine for Quote Animator
 * Combines localStorage (for text, typography, animation settings)
 * and IndexedDB (for persistent storage of user video, image, and audio files).
 */

import { VideoProjectState } from '../types';

const STORAGE_KEY = 'quote_animator_project_state_v2';
const DB_NAME = 'QuoteAnimatorMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

interface StoredMediaRecord {
  id: 'background' | 'audio';
  blob: Blob;
  fileName: string;
  mimeType: string;
  duration?: number;
  timestamp: number;
}

// Open IndexedDB safely with fallback
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        } catch {
          resolve(null);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save project text, typography, and settings to localStorage.
 */
export function saveProjectState(state: VideoProjectState, extra?: { fileName?: string | null }): void {
  try {
    const serializable = {
      ...state,
      savedBgFileName:
        state.bgType === 'video' || state.bgType === 'image'
          ? extra?.fileName || (state as any).savedBgFileName || null
          : null,
      bgMediaUrl: state.bgMediaUrl?.startsWith('blob:') ? null : state.bgMediaUrl,
      audio: {
        ...state.audio,
        audioUrl: state.audio.audioUrl?.startsWith('blob:') ? null : state.audio.audioUrl,
        audioFileName: state.audio.audioFileName || null,
        audioDuration: state.audio.audioDuration || 0,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (err) {
    // Silently ignore localStorage quota errors
  }
}

/**
 * Load project state from localStorage
 */
export function loadProjectState(): (Partial<VideoProjectState> & { savedBgFileName?: string | null }) | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (err) {
    // Silently ignore
  }
  return null;
}

/**
 * Store user uploaded media file safely in IndexedDB
 */
export async function saveMediaFile(
  id: 'background' | 'audio',
  file: Blob | File,
  fileName: string,
  mimeType: string,
  duration?: number
): Promise<void> {
  try {
    // Safety guard: only cache files up to 25MB to prevent mobile memory exhaustion
    if (!file || file.size > 25 * 1024 * 1024) {
      return;
    }

    const db = await openDB();
    if (!db) return;

    const effectiveMime = mimeType || file.type || (id === 'background' ? 'video/mp4' : 'audio/mpeg');
    const defaultName = id === 'background' ? 'custom-background.mp4' : 'custom-audio.mp3';
    const effectiveName = fileName || defaultName;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const record: StoredMediaRecord = {
          id,
          blob: file,
          fileName: effectiveName,
          mimeType: effectiveMime,
          duration,
          timestamp: Date.now(),
        };
        store.put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Never crash
  }
}

/**
 * Retrieve user uploaded media file from IndexedDB
 */
export async function loadMediaFile(
  id: 'background' | 'audio'
): Promise<StoredMediaRecord | null> {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = () => {
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Clear media file from IndexedDB
 */
export async function clearMediaFile(id: 'background' | 'audio'): Promise<void> {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Never crash
  }
}

/**
 * Clear all stored project data
 */
export async function clearAllProjectData(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {}
}
