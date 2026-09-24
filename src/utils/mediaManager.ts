/**
 * Unified Media Lifecycle & Blob URL Manager
 * Handles stable Object URL generation, revocation, and IndexedDB persistence
 * without component re-initialization or page reloads.
 */

import { saveMediaFile, clearMediaFile } from './projectStorage';

class MediaManager {
  private activeUrls: Map<string, string> = new Map();

  /**
   * Create or update a managed Blob URL for a given media slot ('background' | 'audio')
   */
  createMediaUrl(slot: 'background' | 'audio', blob: Blob | File): string {
    const prevUrl = this.activeUrls.get(slot);
    if (prevUrl && prevUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(prevUrl);
      } catch {}
    }

    const newUrl = URL.createObjectURL(blob);
    this.activeUrls.set(slot, newUrl);
    return newUrl;
  }

  /**
   * Get currently active Blob URL for a slot
   */
  getMediaUrl(slot: 'background' | 'audio'): string | null {
    return this.activeUrls.get(slot) || null;
  }

  /**
   * Release media slot and revoke URL safely
   */
  releaseMedia(slot: 'background' | 'audio'): void {
    const prevUrl = this.activeUrls.get(slot);
    if (prevUrl && prevUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(prevUrl);
      } catch {}
    }
    this.activeUrls.delete(slot);
    clearMediaFile(slot).catch(() => {});
  }

  /**
   * Safely teardown a HTMLVideoElement releasing hardware video decoders
   */
  teardownVideo(video: HTMLVideoElement | null): void {
    if (!video) return;
    try {
      video.pause();
      video.removeAttribute('src');
      while (video.firstChild) {
        video.removeChild(video.firstChild);
      }
      video.load();
    } catch (err) {
      console.warn('Error releasing video element decoders:', err);
    }
  }

  /**
   * Persist media file to IndexedDB in the background without blocking UI
   */
  persistMedia(
    slot: 'background' | 'audio',
    file: Blob | File,
    fileName: string,
    mimeType: string,
    duration?: number
  ): void {
    saveMediaFile(slot, file, fileName, mimeType, duration).catch((err) => {
      console.warn(`Non-blocking: Failed to cache ${slot} to IndexedDB:`, err);
    });
  }
}

export const mediaManager = new MediaManager();
