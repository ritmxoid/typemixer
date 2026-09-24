// Audio Mixer & Player for synchronous preview and video recording integration
import { AudioState } from '../types';
import { generateProceduralTrack } from './audioGenerator';

function decodeAudioDataSafely(ctx: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const bufCopy = buffer.slice(0);
      const res = ctx.decodeAudioData(
        bufCopy,
        (decoded) => resolve(decoded),
        (err) => reject(err)
      );
      if (res && typeof res.then === 'function') {
        res.then(resolve).catch(reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

class AudioMixer {
  private audioCtx: AudioContext | null = null;
  private currentSourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private recordDestination: MediaStreamAudioDestinationNode | null = null;
  private cachedBuffer: AudioBuffer | null = null;
  private cachedPresetId: string | null = null;
  private cachedSeed: number | undefined = undefined;
  private cachedAudioUrl: string | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pausedOffset = 0;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public resume(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  private cachedVideoUrl: string | null = null;
  private cachedVideoBuffer: AudioBuffer | null = null;
  private inFlightAudioUrl: string | null = null;
  private inFlightAudioPromise: Promise<AudioBuffer | null> | null = null;

  public getAudioContext(): AudioContext {
    return this.getContext();
  }

  /**
   * Pre-loads and decodes the audio track from a video URL (e.g. uploaded video background)
   */
  public async prepareBackgroundVideoAudioBuffer(videoUrl: string): Promise<AudioBuffer | null> {
    if (!videoUrl) return null;
    if (this.cachedVideoBuffer && this.cachedVideoUrl === videoUrl) {
      return this.cachedVideoBuffer;
    }
    try {
      const response = await fetch(videoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.getContext();
      const decoded = await decodeAudioDataSafely(ctx, arrayBuffer);
      this.cachedVideoBuffer = decoded;
      this.cachedVideoUrl = videoUrl;
      return decoded;
    } catch (err) {
      console.warn('Video background has no decodable audio track or audio decoding failed:', err);
      return null;
    }
  }

  /**
   * Pre-load or generate AudioBuffer for state
   */
  public async prepareAudioBuffer(
    audioState: AudioState,
    totalDuration: number,
    bgVideoUrl?: string
  ): Promise<AudioBuffer | null> {
    if (!audioState.enabled || audioState.sourceType === 'none') {
      this.cachedBuffer = null;
      return null;
    }

    this.resume();

    // If custom uploaded audio
    if (audioState.sourceType === 'file' && audioState.audioUrl) {
      if (this.cachedBuffer && this.cachedAudioUrl === audioState.audioUrl) {
        return this.cachedBuffer;
      }
      if (this.inFlightAudioPromise && this.inFlightAudioUrl === audioState.audioUrl) {
        return this.inFlightAudioPromise;
      }

      this.inFlightAudioUrl = audioState.audioUrl;
      this.inFlightAudioPromise = (async () => {
        try {
          const response = await fetch(audioState.audioUrl!);
          if (!response.ok) {
            throw new Error(`HTTP error fetching audio: ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const ctx = this.getContext();
          const decoded = await decodeAudioDataSafely(ctx, arrayBuffer);
          this.cachedBuffer = decoded;
          this.cachedAudioUrl = audioState.audioUrl;
          return decoded;
        } catch (err) {
          console.error('Error decoding audio file:', err);
          return null;
        } finally {
          this.inFlightAudioPromise = null;
          this.inFlightAudioUrl = null;
        }
      })();

      return this.inFlightAudioPromise;
    }

    // If video sound source, decode audio from video background URL
    if (audioState.sourceType === 'video') {
      const targetUrl = audioState.audioUrl || bgVideoUrl;
      if (targetUrl) {
        const decoded = await this.prepareBackgroundVideoAudioBuffer(targetUrl);
        if (decoded) {
          this.cachedBuffer = decoded;
          this.cachedAudioUrl = targetUrl;
          return decoded;
        }
      }
      this.cachedBuffer = null;
      return null;
    }

    // If procedural generator preset
    if (audioState.sourceType === 'generator') {
      const currentSeed = audioState.seed ?? 1337;
      if (
        this.cachedBuffer &&
        this.cachedPresetId === audioState.presetId &&
        this.cachedSeed === currentSeed
      ) {
        return this.cachedBuffer;
      }
      try {
        const buffer = await generateProceduralTrack(
          audioState.presetId,
          Math.max(10, totalDuration + 2),
          currentSeed
        );
        this.cachedBuffer = buffer;
        this.cachedPresetId = audioState.presetId;
        this.cachedSeed = currentSeed;
        return buffer;
      } catch (err) {
        console.error('Error generating procedural track:', err);
        return null;
      }
    }

    return null;
  }

  private fileAudioElement: HTMLAudioElement | null = null;

  private ensureFileAudioElement(): HTMLAudioElement {
    if (!this.fileAudioElement) {
      let el = document.getElementById('typemixer-audio-el') as HTMLAudioElement | null;
      if (!el) {
        el = document.createElement('audio');
        el.id = 'typemixer-audio-el';
        el.preload = 'auto';
        el.setAttribute('playsinline', '');
        el.setAttribute('webkit-playsinline', '');
        document.body.appendChild(el);
      }
      this.fileAudioElement = el;
    }
    return this.fileAudioElement;
  }

  /**
   * Start or resume playback in sync with video preview
   */
  public async play(
    audioState: AudioState,
    totalDuration: number,
    offsetSeconds = 0,
    bgVideoUrl?: string
  ) {
    const effVolume = typeof audioState.musicVolume === 'number'
      ? audioState.musicVolume
      : typeof audioState.volume === 'number'
      ? audioState.volume
      : 0.7;

    if (
      !audioState.enabled ||
      audioState.sourceType === 'none' ||
      effVolume <= 0 ||
      (audioState.sourceType === 'file' && !audioState.audioUrl)
    ) {
      this.stop();
      return;
    }

    const safeVolume = Number.isFinite(effVolume)
      ? Math.max(0.01, Math.min(1, effVolume))
      : 0.7;

    // Handle custom user uploaded audio with native HTMLAudioElement streaming
    // to avoid heap memory explosion, decoding latencies, and browser tab reloads on mobile
    if (audioState.sourceType === 'file' && audioState.audioUrl) {
      if (this.currentSourceNode) {
        try {
          this.currentSourceNode.stop();
          this.currentSourceNode.disconnect();
        } catch {}
        this.currentSourceNode = null;
      }

      const audioEl = this.ensureFileAudioElement();
      audioEl.volume = safeVolume;
      audioEl.loop = audioState.loop ?? true;

      const isCurrentSrc = audioEl.src === audioState.audioUrl;
      if (!isCurrentSrc) {
        audioEl.src = audioState.audioUrl;
        audioEl.load();
      }

      const dur = audioEl.duration || audioState.audioDuration || totalDuration;
      if (Number.isFinite(offsetSeconds) && offsetSeconds >= 0) {
        const safeOffset = Number.isFinite(dur) && dur > 0 ? offsetSeconds % dur : 0;
        if (Math.abs(audioEl.currentTime - safeOffset) > 0.3) {
          try {
            audioEl.currentTime = safeOffset;
          } catch {}
        }
      }

      if (audioEl.paused) {
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }
      this.isPlaying = true;
      return;
    }

    // Stop HTML audio element if playing when switching to synth generator
    if (this.fileAudioElement && !this.fileAudioElement.paused) {
      try {
        this.fileAudioElement.pause();
      } catch {}
    }

    const buffer = await this.prepareAudioBuffer(audioState, totalDuration, bgVideoUrl);
    if (!buffer) {
      this.stop();
      return;
    }

    this.stop();

    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {}
    }
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(safeVolume, ctx.currentTime);
    this.gainNode.connect(ctx.destination);
    if (this.recordDestination) {
      try {
        this.gainNode.connect(this.recordDestination);
      } catch (err) {
        console.warn('Error connecting gain to recordDestination:', err);
      }
    }

    this.currentSourceNode = ctx.createBufferSource();
    this.currentSourceNode.buffer = buffer;
    this.currentSourceNode.loop = audioState.loop;
    this.currentSourceNode.connect(this.gainNode);

    const safeOffset = buffer.duration > 0 ? offsetSeconds % buffer.duration : 0;
    this.currentSourceNode.start(0, safeOffset);
    this.startTime = ctx.currentTime - safeOffset;
    this.isPlaying = true;
  }

  /**
   * Attach/detach a MediaStreamAudioDestinationNode for live video capture recording
   */
  public setRecordingDestination(dest: MediaStreamAudioDestinationNode | null) {
    if (this.recordDestination && this.gainNode) {
      try {
        this.gainNode.disconnect(this.recordDestination);
      } catch {}
    }
    this.recordDestination = dest;
    if (this.recordDestination && this.gainNode) {
      try {
        this.gainNode.connect(this.recordDestination);
      } catch {}
    }
  }

  public getRecordingDestination(): MediaStreamAudioDestinationNode | null {
    return this.recordDestination;
  }

  /**
   * Stop preview audio and clear cached buffers
   */
  public clearCache() {
    this.stop();
    if (this.fileAudioElement) {
      try {
        this.fileAudioElement.pause();
        this.fileAudioElement.src = '';
      } catch {}
    }
    this.cachedBuffer = null;
    this.cachedAudioUrl = null;
    this.cachedPresetId = null;
    this.cachedSeed = undefined;
    this.cachedVideoBuffer = null;
    this.cachedVideoUrl = null;
  }

  /**
   * Stop preview audio
   */
  public stop() {
    if (this.fileAudioElement && !this.fileAudioElement.paused) {
      try {
        this.fileAudioElement.pause();
      } catch {}
    }
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop();
        this.currentSourceNode.disconnect();
      } catch {
        // already stopped
      }
      this.currentSourceNode = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
    this.isPlaying = false;
  }

  /**
   * Update live preview volume
   */
  public setVolume(volume: number) {
    const safeVol = Math.max(0, Math.min(1, volume));
    if (this.fileAudioElement) {
      this.fileAudioElement.volume = safeVol;
    }
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(safeVol, this.audioCtx.currentTime);
    }
  }

  /**
   * Create an Audio MediaStreamDestination for mixing during video export
   */
  public createExportAudioNode(
    audioState: AudioState,
    buffer: AudioBuffer,
    ctx: AudioContext | OfflineAudioContext
  ): { sourceNode: AudioBufferSourceNode; gainNode: GainNode } {
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = audioState.loop;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(audioState.volume, 0);

    sourceNode.connect(gainNode);
    return { sourceNode, gainNode };
  }
}

export const audioMixer = new AudioMixer();

/**
 * Mixes two AudioBuffers together with individual volumes using OfflineAudioContext.
 * Loops sources to targetDuration if needed.
 */
export async function mixAudioBuffers(
  buffer1: AudioBuffer | null,
  vol1: number,
  buffer2: AudioBuffer | null,
  vol2: number,
  durationSeconds: number
): Promise<AudioBuffer | null> {
  if (!buffer1 && !buffer2) return null;

  const validVol1 = Math.max(0, Math.min(1, Number.isFinite(vol1) ? vol1 : 1));
  const validVol2 = Math.max(0, Math.min(1, Number.isFinite(vol2) ? vol2 : 1));

  if (buffer1 && !buffer2) {
    if (validVol1 <= 0.001) return null;
    return renderBufferWithGain(buffer1, validVol1, durationSeconds);
  }
  if (!buffer1 && buffer2) {
    if (validVol2 <= 0.001) return null;
    return renderBufferWithGain(buffer2, validVol2, durationSeconds);
  }

  const sampleRate = buffer1!.sampleRate || buffer2!.sampleRate || 44100;
  const numberOfChannels = Math.min(2, Math.max(buffer1!.numberOfChannels, buffer2!.numberOfChannels));
  const totalLength = Math.max(1, Math.ceil(durationSeconds * sampleRate));

  const OfflineCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtxClass(numberOfChannels, totalLength, sampleRate);

  if (buffer1 && validVol1 > 0) {
    const src1 = offlineCtx.createBufferSource();
    src1.buffer = buffer1;
    src1.loop = true;
    const gain1 = offlineCtx.createGain();
    gain1.gain.setValueAtTime(validVol1, 0);
    src1.connect(gain1);
    gain1.connect(offlineCtx.destination);
    src1.start(0);
  }

  if (buffer2 && validVol2 > 0) {
    const src2 = offlineCtx.createBufferSource();
    src2.buffer = buffer2;
    src2.loop = true;
    const gain2 = offlineCtx.createGain();
    gain2.gain.setValueAtTime(validVol2, 0);
    src2.connect(gain2);
    gain2.connect(offlineCtx.destination);
    src2.start(0);
  }

  return await offlineCtx.startRendering();
}

async function renderBufferWithGain(
  buffer: AudioBuffer,
  volume: number,
  durationSeconds: number
): Promise<AudioBuffer> {
  const sampleRate = buffer.sampleRate;
  const numberOfChannels = Math.min(2, buffer.numberOfChannels);
  const totalLength = Math.max(1, Math.ceil(durationSeconds * sampleRate));

  const OfflineCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  const offlineCtx = new OfflineCtxClass(numberOfChannels, totalLength, sampleRate);

  const src = offlineCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const gain = offlineCtx.createGain();
  gain.gain.setValueAtTime(volume, 0);
  src.connect(gain);
  gain.connect(offlineCtx.destination);
  src.start(0);
  return await offlineCtx.startRendering();
}

/**
 * Prepares a mixed AudioBuffer combining background video audio (if present and enabled)
 * and background music (if present and enabled) for synchronous capture or export.
 */
export async function prepareDualAudioTrack(
  audioState: AudioState,
  bgMediaUrl: string | null | undefined,
  isBgVideo: boolean,
  durationSeconds: number
): Promise<AudioBuffer | null> {
  const isVideoAudioActive =
    isBgVideo &&
    !!bgMediaUrl &&
    audioState.videoAudioEnabled !== false &&
    (audioState.videoVolume ?? 0.8) > 0;

  const isMusicActive =
    audioState.enabled &&
    (audioState.sourceType === 'generator' || audioState.sourceType === 'file') &&
    (audioState.volume ?? 0.7) > 0 &&
    (audioState.sourceType !== 'file' || !!audioState.audioUrl);

  let videoBuffer: AudioBuffer | null = null;
  if (isVideoAudioActive && bgMediaUrl) {
    try {
      videoBuffer = await audioMixer.prepareBackgroundVideoAudioBuffer(bgMediaUrl);
    } catch (err) {
      console.warn('Could not extract video audio:', err);
    }
  }

  let musicBuffer: AudioBuffer | null = null;
  if (isMusicActive) {
    try {
      musicBuffer = await audioMixer.prepareAudioBuffer(audioState, durationSeconds, bgMediaUrl || undefined);
    } catch (err) {
      console.warn('Could not prepare music buffer:', err);
    }
  }

  const vidVol = audioState.videoVolume ?? 0.8;
  const musVol = audioState.volume ?? 0.7;

  if (videoBuffer && musicBuffer) {
    return await mixAudioBuffers(videoBuffer, vidVol, musicBuffer, musVol, durationSeconds);
  } else if (videoBuffer) {
    return await mixAudioBuffers(videoBuffer, vidVol, null, 0, durationSeconds);
  } else if (musicBuffer) {
    return await mixAudioBuffers(null, 0, musicBuffer, musVol, durationSeconds);
  }

  return null;
}

