// Web Audio procedural music and soundtrack generator
// Generates high-quality ambient, synthwave, lofi, phonk, and acoustic musical tracks without external network requests
// Supports procedural re-generation with unique harmonic progressions, melodic motifs, and rhythms per seed

import { MusicPresetId } from '../types';

export interface MusicPresetInfo {
  id: MusicPresetId;
  name: string;
  genre: string;
  bpm: number;
  description: string;
  emoji: string;
  key: string;
}

export const MUSIC_PRESETS: MusicPresetInfo[] = [
  {
    id: 'neo-classical-piano',
    name: 'Neo-Classical Piano',
    genre: 'Neoclassical & Emotional',
    bpm: 72,
    description: 'Мягкие арпеджио и аккорды без резких скачков, плавная динамика velocity (50-75) для льющейся мелодии.',
    emoji: '🎹',
    key: 'C Minor / Eb Major',
  },
  {
    id: 'atmospheric-ambient',
    name: 'Atmospheric Ambient',
    genre: 'Atmospheric & Pad',
    bpm: 56,
    description: 'Длинные устойчивые пэд-аккорды на 2-4 такта с минимальной сменой гармоний для невидимого звукового фона.',
    emoji: '🌌',
    key: 'Dsus2 / Gmaj7 / Bm7',
  },
  {
    id: 'deep-chillout',
    name: 'Deep Chillout',
    genre: 'Downtempo & Chill',
    bpm: 80,
    description: 'Пульсирующий бас на низких октавах, плавные переливы синтезаторных аккордов с длинным сустейном (смена реже 2 тактов).',
    emoji: '🌊',
    key: 'D Minor / Bb / Gm',
  },
  {
    id: 'minimalist-harp-strings',
    name: 'Minimalist Harp & Strings',
    genre: 'Cinematic & Minimal',
    bpm: 64,
    description: 'Прозрачные воздушные переборы арфы в высоком регистре с протяжными скрипичными интервалами и паузами между нотами.',
    emoji: '✨',
    key: 'A Minor / C Major',
  },
  {
    id: 'lofi-chill',
    name: 'Lo-Fi Chill Hop',
    genre: 'Lo-Fi & Study',
    bpm: 78,
    description: 'Мягкий бит, тёплый родес-пианино и уютный виниловый шум для атмосферных видео.',
    emoji: '☕',
    key: 'Cmaj7 / Am9 / Fmaj9',
  },
  {
    id: 'synthwave-retro',
    name: 'Cyber Synthwave',
    genre: 'Electronic & Retro',
    bpm: 115,
    description: 'Пульсирующий 80s бас, арпеджио и космические пэды в стиле ретрофутуризма.',
    emoji: '🌌',
    key: 'Fm / D# / C# / Am',
  },
  {
    id: 'deep-ambient',
    name: 'Deep Ambient Calm',
    genre: 'Atmospheric & Zen',
    bpm: 60,
    description: 'Глубокий медитативный фон, мягкие переливы и кинематографичный простор.',
    emoji: '🕊️',
    key: 'Dmin9 / Fmaj7 / Gsus',
  },
  {
    id: 'epic-drive',
    name: 'Motivational Drive',
    genre: 'Cinema & Energy',
    bpm: 125,
    description: 'Нарастающий драйв с динамичными аккордами для экспертных рилсов и мотивации.',
    emoji: '🔥',
    key: 'A Minor / D Minor',
  },
  {
    id: 'phonk-energy',
    name: 'Drift Phonk Beat',
    genre: 'Phonk & Bass',
    bpm: 136,
    description: 'Плотный 808 бас, каубелл и агрессивный ритм для трендовых Reels и Shorts.',
    emoji: '⚡',
    key: 'C# Minor / D# Minor',
  },
  {
    id: 'acoustic-warmth',
    name: 'Acoustic Warmth',
    genre: 'Indie & Warm',
    bpm: 85,
    description: 'Тёплая акустическая гармония, звонкие ноты и вдохновляющее настроение.',
    emoji: '🌿',
    key: 'G Major / C Major',
  },
  {
    id: 'funny',
    name: 'Смешной',
    genre: 'Comedy & Cartoon',
    bpm: 124,
    description: 'Комичный мультяшный стиль: озорной стаккато бас, забавные глиссандо и прыгающая мелодия.',
    emoji: '🤡',
    key: 'C Major / F Major',
  },
  {
    id: 'heroic',
    name: 'Героический',
    genre: 'Epic & Fanfare',
    bpm: 130,
    description: 'Эпический кинематографичный саундтрек: победные медные духовые, маршевый пульс и триумфальные аккорды.',
    emoji: '⚔️',
    key: 'D Minor / F Major',
  },
  {
    id: 'notes',
    name: 'Ноты',
    genre: 'Minimal & Tones',
    bpm: 60,
    description: 'Отдельные звуки разной тональности с интервалом тишины ровно 1 секунда между ними.',
    emoji: '🎹',
    key: 'Chromatic Tones',
  },
  {
    id: 'lightning',
    name: 'Молния',
    genre: 'Hi-Speed Synth',
    bpm: 165,
    description: 'Сверхбыстрые стремительные арпеджио, электрическая энергия и высокая скорость.',
    emoji: '⚡',
    key: 'E Minor / A Minor',
  },
];

// Complete 12-TET Note Frequency Map (C1 to B7)
const NOTE_BASE_INDEX: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
};

/**
 * Returns exact finite frequency in Hz for standard note notation (e.g., 'C4', 'F#5', 'Ab3')
 */
export function getNoteFreq(note: string, fallback = 440): number {
  if (!note || typeof note !== 'string') return fallback;
  const match = note.trim().match(/^([A-Ga-g][#b]?)([0-8])$/);
  if (!match) return fallback;

  const noteName = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const semitoneOffset = NOTE_BASE_INDEX[noteName];

  if (semitoneOffset === undefined) return fallback;

  // MIDI Note Number: C4 is 60, A4 is 69 (440Hz)
  const midi = (octave + 1) * 12 + semitoneOffset;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  return Number.isFinite(freq) && freq > 0 ? Number(freq.toFixed(2)) : fallback;
}

/**
 * Deterministic pseudo-random number generator class
 */
export class RandomGenerator {
  private s: number;

  constructor(seed = 1337) {
    this.s = Math.abs(Math.floor(seed)) % 2147483647;
    if (this.s <= 0) this.s = 123456789;
  }

  // Returns float in [0, 1)
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }

  // Returns float between min and max
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Returns integer in [min, max]
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Pick random element from array
  choice<T>(arr: T[]): T {
    if (!arr.length) throw new Error('Cannot pick from empty array');
    const idx = Math.floor(this.next() * arr.length);
    return arr[Math.min(arr.length - 1, Math.max(0, idx))];
  }
}

/**
 * Procedurally generates an AudioBuffer of specified duration for a given preset and random seed
 */
export async function generateProceduralTrack(
  presetId: MusicPresetId,
  durationSeconds: number,
  seed = 1337,
  sampleRate = 44100
): Promise<AudioBuffer> {
  // Compositions strictly between 10 seconds and 60 seconds as required
  const safeDuration = Math.max(10, Math.min(60, Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 24));
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(safeDuration * sampleRate), sampleRate);
  const rng = new RandomGenerator(seed);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.75, 0);
  masterGain.connect(offlineCtx.destination);

  // Reverb & Stereo Delay Bus
  const delay = offlineCtx.createDelay();
  delay.delayTime.setValueAtTime(rng.range(0.25, 0.38), 0);
  const delayFeedback = offlineCtx.createGain();
  delayFeedback.gain.setValueAtTime(rng.range(0.2, 0.32), 0);
  const delayFilter = offlineCtx.createBiquadFilter();
  delayFilter.type = 'lowpass';
  delayFilter.frequency.setValueAtTime(2600, 0);

  delay.connect(delayFilter);
  delayFilter.connect(delayFeedback);
  delayFeedback.connect(delay);
  delayFilter.connect(masterGain);

  const now = 0;

  switch (presetId) {
    case 'neo-classical-piano':
      renderNeoClassicalPianoTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'atmospheric-ambient':
      renderAtmosphericAmbientTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'deep-chillout':
      renderDeepChilloutTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'minimalist-harp-strings':
      renderMinimalistHarpStringsTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'lofi-chill':
      renderLofiTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'synthwave-retro':
      renderSynthwaveTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'deep-ambient':
      renderAmbientTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'epic-drive':
      renderEpicDriveTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'phonk-energy':
      renderPhonkTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'acoustic-warmth':
      renderAcousticTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'funny':
      renderFunnyTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'heroic':
      renderHeroicTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'notes':
      renderNotesTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    case 'lightning':
      renderLightningTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
    default:
      renderNeoClassicalPianoTrack(offlineCtx, masterGain, delay, safeDuration, now, rng);
      break;
  }

  return await offlineCtx.startRendering();
}

/**
 * 1. Neo-Classical Piano:
 * - Мягкие арпеджио и аккорды без резких скачков по октавам (гладкое голосоведение в октавах 3-5).
 * - Динамика Velocity нот плавная в пределах 50-75 (без резких ударов).
 * - Теплый акустический звук фортепиано с мягкой атакой (0.04s) и естественным спадом.
 * - Уникальные гармонии, типы арпеджио и мелодические фразы per seed.
 */
function renderNeoClassicalPianoTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(68, 76);
  const beatLen = 60 / bpm;
  const barLen = beatLen * 4;

  // 6 distinct harmonically coherent, emotional neo-classical progressions
  const progressions = [
    // Progression A: Cm(add9) -> Abmaj7 -> Ebmaj9 -> Bb(sus4)
    [
      ['C3', 'G3', 'Eb4', 'G4', 'D5'],
      ['Ab2', 'Eb3', 'C4', 'Eb4', 'G4'],
      ['Eb3', 'Bb3', 'G4', 'Bb4', 'F5'],
      ['Bb2', 'F3', 'D4', 'F4', 'C5'],
    ],
    // Progression B: Am9 -> Fmaj7 -> C(add9) -> Em7/G
    [
      ['A2', 'E3', 'C4', 'E4', 'B4'],
      ['F2', 'C3', 'A3', 'C4', 'E4'],
      ['C3', 'G3', 'E4', 'G4', 'D5'],
      ['G2', 'D3', 'B3', 'D4', 'G4'],
    ],
    // Progression C: Dm9 -> Bbmaj7 -> Fmaj9 -> Asus4
    [
      ['D3', 'A3', 'F4', 'A4', 'E5'],
      ['Bb2', 'F3', 'D4', 'F4', 'A4'],
      ['F3', 'C4', 'A4', 'C5', 'G5'],
      ['A2', 'E3', 'A3', 'D4', 'E4'],
    ],
    // Progression D: Em9 -> Cmaj7 -> G(add9) -> Dsus4
    [
      ['E2', 'B2', 'G3', 'B3', 'F#4'],
      ['C3', 'G3', 'E4', 'G4', 'B4'],
      ['G2', 'D3', 'B3', 'D4', 'A4'],
      ['D3', 'A3', 'F#4', 'A4', 'E5'],
    ],
    // Progression E: Fmaj9 -> Dm7 -> Am9 -> Gsus4
    [
      ['F2', 'C3', 'A3', 'C4', 'G4'],
      ['D3', 'A3', 'F4', 'A4', 'C5'],
      ['A2', 'E3', 'C4', 'E4', 'B4'],
      ['G2', 'D3', 'B3', 'D4', 'F4'],
    ],
    // Progression F: Gm9 -> Ebmaj7 -> Bbmaj9 -> Fsus4
    [
      ['G2', 'D3', 'Bb3', 'D4', 'A4'],
      ['Eb2', 'Bb2', 'G3', 'Bb3', 'D4'],
      ['Bb2', 'F3', 'D4', 'F4', 'C5'],
      ['F2', 'C3', 'A3', 'C4', 'G4'],
    ],
  ];

  const chosenProg = rng.choice(progressions);

  // 4 distinct arpeggio wave patterns per seed
  const arpPatterns = [
    [0, 1, 2, 3, 2, 1, 0, 1], // Smooth wave
    [0, 2, 1, 3, 2, 3, 1, 0], // Broken cascade
    [0, 1, 3, 2, 1, 2, 3, 1], // Rising flutter
    [0, 3, 2, 1, 0, 2, 1, 3], // Wide sweeping
  ];
  const chosenArpPattern = rng.choice(arpPatterns);

  // Soft master filter for warm felt piano tone
  const feltFilter = ctx.createBiquadFilter();
  feltFilter.type = 'lowpass';
  feltFilter.frequency.setValueAtTime(2200 + rng.range(-150, 150), 0);
  feltFilter.Q.setValueAtTime(0.7, 0);
  feltFilter.connect(dest);

  const pianoGain = ctx.createGain();
  pianoGain.gain.setValueAtTime(0.85, 0);
  pianoGain.connect(feltFilter);

  // Play a soft piano note with velocity strictly in 50-75
  const playPianoNote = (noteName: string, t: number, length: number, isAccented = false) => {
    if (t >= startTime + duration) return;
    const freq = getNoteFreq(noteName);
    if (!Number.isFinite(freq) || freq <= 0) return;

    // Velocity strictly in [50, 75] range as requested
    const velocity = isAccented ? rng.range(64, 75) : rng.range(50, 63);
    const amp = (velocity / 127) * 0.32;

    // Dual detuned oscillators for realistic acoustic piano resonance
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq, t);
    osc1.detune.setValueAtTime(-2.5, t);
    osc2.detune.setValueAtTime(3.0, t);

    // Warm, non-percussive, flowing attack (0.04s - 0.055s)
    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.linearRampToValueAtTime(amp, t + 0.045);
    noteGain.gain.exponentialRampToValueAtTime(amp * 0.45, t + Math.min(length, 1.2));
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.35);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(pianoGain);

    // Subtle send to stereo delay bus
    const delaySend = ctx.createGain();
    delaySend.gain.setValueAtTime(amp * 0.22, t);
    noteGain.connect(delaySend);
    delaySend.connect(delayBus);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + length + 0.4);
    osc2.stop(t + length + 0.4);
  };

  let t = startTime;
  let barIdx = 0;

  while (t < startTime + duration) {
    const chordNotes = chosenProg[barIdx % chosenProg.length];
    const bassNote = chordNotes[0];
    const upperNotes = chordNotes.slice(1);

    // 1. Sustained Bass Note on beat 1 with gentle velocity
    playPianoNote(bassNote, t, barLen * 0.95, true);

    // 2. Flowing, gentle arpeggios (8th notes) through the chord notes without octave leaps
    const step8th = beatLen / 2;

    for (let step = 0; step < 8; step++) {
      const noteTime = t + step * step8th;
      if (noteTime >= startTime + duration) break;

      const idx = chosenArpPattern[step] % upperNotes.length;
      const note = upperNotes[idx];
      playPianoNote(note, noteTime, step8th * 1.8, step === 0 || step === 4);
    }

    // 3. Subtle emotional melodic embellishment on higher register (bar 2, 4, 6...)
    if (barIdx % 2 === 1 && rng.next() > 0.3) {
      const highNote = upperNotes[upperNotes.length - 1];
      const melodyTime = t + beatLen * 2.5;
      playPianoNote(highNote, melodyTime, beatLen * 1.5, true);
    }

    t += barLen;
    barIdx++;
  }
}

/**
 * 2. Atmospheric Ambient:
 * - Длинные устойчивые пэд-аккорды (целые ноты на 2-4 такта) с минимальной сменой гармоний.
 * - Невидимый звуковой фон: медленная плавная атака (1.8s - 2.5s) и спад.
 * - Мягкая модуляция тембра без резких выбросов.
 * - Разнообразные гармонические пространства и хрустальные микро-отзвуки per seed.
 */
function renderAtmosphericAmbientTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(52, 60);
  const beatLen = 60 / bpm;
  const barsPerChord = rng.choice([3, 4]);
  const chordDuration = beatLen * 4 * barsPerChord;

  // 6 distinct spacious ambient harmonic spaces
  const progressions = [
    // Space 1: Dsus2(add#11) <-> Gmaj7/D
    [
      ['D2', 'A2', 'E3', 'A3', 'D4', 'F#4'],
      ['G2', 'D3', 'G3', 'B3', 'D4', 'F#4'],
    ],
    // Space 2: Cmaj9 <-> Fmaj7(#11)
    [
      ['C2', 'G2', 'E3', 'G3', 'B3', 'D4'],
      ['F2', 'C3', 'A3', 'C4', 'E4', 'B4'],
    ],
    // Space 3: Bm7(11) <-> Em9
    [
      ['B1', 'F#2', 'D3', 'A3', 'D4', 'F#4'],
      ['E2', 'B2', 'G3', 'D4', 'F#4', 'A4'],
    ],
    // Space 4: A(add9) <-> F#m7(11)
    [
      ['A1', 'E2', 'C#3', 'G#3', 'B3', 'E4'],
      ['F#1', 'C#2', 'A2', 'E3', 'G#3', 'C#4'],
    ],
    // Space 5: Ebsus2 <-> Abmaj7(9)
    [
      ['Eb2', 'Bb2', 'F3', 'Bb3', 'Eb4', 'G4'],
      ['Ab1', 'Eb2', 'C3', 'G3', 'Bb3', 'Eb4'],
    ],
    // Space 6: Gm9 <-> Ebmaj7(#11)
    [
      ['G1', 'D2', 'Bb2', 'F3', 'A3', 'D4'],
      ['Eb2', 'Bb2', 'G3', 'D4', 'F4', 'A4'],
    ],
  ];

  const chosenProg = rng.choice(progressions);

  // Slow sweeping resonant filter for breathing atmospheric texture
  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.setValueAtTime(950 + rng.range(-100, 150), 0);
  padFilter.Q.setValueAtTime(rng.range(1.0, 1.4), 0);
  padFilter.connect(dest);

  // Filter LFO modulation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(rng.range(0.06, 0.11), 0);
  lfoGain.gain.setValueAtTime(rng.range(280, 360), 0);
  lfo.connect(lfoGain);
  lfoGain.connect(padFilter.frequency);
  lfo.start(startTime);
  lfo.stop(startTime + duration + 4);

  const padMasterGain = ctx.createGain();
  padMasterGain.gain.setValueAtTime(0.65, 0);
  padMasterGain.connect(padFilter);

  let t = startTime;
  let chordIdx = 0;

  while (t < startTime + duration) {
    const chord = chosenProg[chordIdx % chosenProg.length];
    const actualLen = chordDuration;

    chord.forEach((noteName, i) => {
      const freq = getNoteFreq(noteName);
      if (!Number.isFinite(freq) || freq <= 0) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Warm detuned saw + warm sine/triangle
      osc1.type = i === 0 ? 'triangle' : 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq, t);

      // Micro-detuning for lush cinematic width
      const detuneCents = (i - 2) * rng.range(3, 7);
      osc1.detune.setValueAtTime(-detuneCents, t);
      osc2.detune.setValueAtTime(detuneCents, t);

      // Ethereal long envelope: slow fade-in (2.2s), sustained hold, long fade-out (3.0s)
      const attackTime = 2.2;
      const releaseTime = 3.2;
      const targetAmp = (i === 0 ? 0.22 : 0.085);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(targetAmp, t + attackTime);
      gain.gain.setValueAtTime(targetAmp, t + actualLen - releaseTime);
      gain.gain.linearRampToValueAtTime(0.0001, t + actualLen);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(padMasterGain);

      // Connect higher harmonics to delay bus for air
      if (i >= 2) {
        const delaySend = ctx.createGain();
        delaySend.gain.setValueAtTime(0.18, t);
        gain.connect(delaySend);
        delaySend.connect(delayBus);
      }

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + actualLen + 0.1);
      osc2.stop(t + actualLen + 0.1);
    });

    // High-register celestial chime twinkle on long sustained bars per seed
    if (rng.next() > 0.35) {
      const highChime = chord[chord.length - 1];
      const chimeFreq = getNoteFreq(highChime) * 2;
      const chimeTime = t + rng.range(3.0, actualLen - 3.0);
      if (chimeTime < startTime + duration && Number.isFinite(chimeFreq)) {
        const cOsc = ctx.createOscillator();
        const cGain = ctx.createGain();
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(chimeFreq, chimeTime);
        cGain.gain.setValueAtTime(0.0001, chimeTime);
        cGain.gain.linearRampToValueAtTime(0.045, chimeTime + 0.05);
        cGain.gain.exponentialRampToValueAtTime(0.0001, chimeTime + 2.4);
        cOsc.connect(cGain);
        cGain.connect(delayBus);
        cGain.connect(dest);
        cOsc.start(chimeTime);
        cOsc.stop(chimeTime + 2.5);
      }
    }

    // Sub-bass warm drone foundation
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFreq = getNoteFreq(chord[0]) / 2;
    if (subFreq >= 28 && subFreq <= 80) {
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(subFreq, t);
      subGain.gain.setValueAtTime(0.0001, t);
      subGain.gain.linearRampToValueAtTime(0.24, t + 2.0);
      subGain.gain.linearRampToValueAtTime(0.0001, t + actualLen);
      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(t);
      subOsc.stop(t + actualLen + 0.1);
    }

    t += actualLen;
    chordIdx++;
  }
}

/**
 * 3. Deep Chillout:
 * - Глубокий пульсирующий басовый паттерн на низких октавах (C1-A1).
 * - Плавные переливы синтезаторных аккордов с длинным сустейном (sustain).
 * - Скорость смены аккордов — не чаще одного раза в 2 такта (4/4).
 * - Разнообразные гармонии, басовые грувы и мелодические пэды per seed.
 */
function renderDeepChilloutTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(76, 84);
  const beatLen = 60 / bpm;
  const barLen = beatLen * 4;
  const chordLen = barLen * 2;

  // 6 rich chillout progressions in different keys
  const chillProgressions = [
    // Prog 1: Dm9 -> Bbmaj7 -> Gm9 -> Asus4 (D Minor)
    [
      { bass: 'D1', chord: ['D3', 'F3', 'A3', 'C4', 'E4'] },
      { bass: 'Bb0', chord: ['Bb2', 'D3', 'F3', 'A3', 'D4'] },
      { bass: 'G0', chord: ['G2', 'Bb2', 'D3', 'F3', 'A3'] },
      { bass: 'A0', chord: ['A2', 'C#3', 'E3', 'G3', 'D4'] },
    ],
    // Prog 2: F#m9 -> Dmaj7 -> Bm9 -> C#sus4 (F# Minor)
    [
      { bass: 'F#0', chord: ['F#2', 'A2', 'C#3', 'E3', 'G#3'] },
      { bass: 'D1', chord: ['D3', 'F#3', 'A3', 'C#4', 'F#4'] },
      { bass: 'B0', chord: ['B2', 'D3', 'F#3', 'A3', 'C#4'] },
      { bass: 'C#1', chord: ['C#3', 'F3', 'G#3', 'B3', 'F#4'] },
    ],
    // Prog 3: C#m9 -> Amaj7 -> F#m9 -> G#sus4 (C# Minor)
    [
      { bass: 'C#1', chord: ['C#3', 'E3', 'G#3', 'B3', 'D#4'] },
      { bass: 'A0', chord: ['A2', 'C#3', 'E3', 'G#3', 'C#4'] },
      { bass: 'F#0', chord: ['F#2', 'A2', 'C#3', 'E3', 'G#3'] },
      { bass: 'G#0', chord: ['G#2', 'C3', 'D#3', 'F#3', 'C#4'] },
    ],
    // Prog 4: Am9 -> Fmaj7 -> Dm9 -> E7sus4 (A Minor)
    [
      { bass: 'A0', chord: ['A2', 'C3', 'E3', 'G3', 'B3'] },
      { bass: 'F0', chord: ['F2', 'A2', 'C3', 'E3', 'A3'] },
      { bass: 'D1', chord: ['D3', 'F3', 'A3', 'C4', 'E4'] },
      { bass: 'E0', chord: ['E2', 'G#2', 'B2', 'D3', 'A3'] },
    ],
    // Prog 5: Em9 -> Cmaj7 -> Am9 -> Bsus4 (E Minor)
    [
      { bass: 'E0', chord: ['E2', 'G2', 'B2', 'D3', 'F#3'] },
      { bass: 'C1', chord: ['C3', 'E3', 'G3', 'B3', 'E4'] },
      { bass: 'A0', chord: ['A2', 'C3', 'E3', 'G3', 'B3'] },
      { bass: 'B0', chord: ['B2', 'D#3', 'F#3', 'A3', 'E4'] },
    ],
    // Prog 6: Gm9 -> Ebmaj7 -> Cm9 -> Dsus4 (G Minor)
    [
      { bass: 'G0', chord: ['G2', 'Bb2', 'D3', 'F3', 'A3'] },
      { bass: 'Eb0', chord: ['Eb2', 'G2', 'Bb2', 'D3', 'G3'] },
      { bass: 'C1', chord: ['C3', 'Eb3', 'G3', 'Bb3', 'D4'] },
      { bass: 'D1', chord: ['D3', 'F#3', 'A3', 'C4', 'G4'] },
    ],
  ];

  const chosenProg = rng.choice(chillProgressions);

  // 3 distinct chillout bass pulse grooves per seed
  const bassGrooves = [
    [0, 1.5, 2.5, 3.5, 4, 5.5, 6.5, 7], // Syncopated 8th pulse
    [0, 2, 3.5, 4, 6, 7.5],             // Deep laidback groove
    [0, 1, 2.5, 4, 5, 6.5],             // Downtempo slow drive
  ];
  const pulseSteps = rng.choice(bassGrooves);

  let t = startTime;
  let chordIdx = 0;

  while (t < startTime + duration) {
    const item = chosenProg[chordIdx % chosenProg.length];
    const bassFreq = getNoteFreq(item.bass, 36.7);

    // 1. Deep Pulsing Bass Pattern on low octaves
    pulseSteps.forEach((beatOffset) => {
      const pulseTime = t + beatOffset * beatLen;
      if (pulseTime >= startTime + duration) return;

      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      sub.type = 'sine';
      osc.frequency.setValueAtTime(bassFreq, pulseTime);
      sub.frequency.setValueAtTime(bassFreq, pulseTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160 + rng.range(-20, 30), pulseTime);
      filter.Q.setValueAtTime(1.5, pulseTime);

      const pulseDuration = beatLen * 0.85;
      gain.gain.setValueAtTime(0.001, pulseTime);
      gain.gain.linearRampToValueAtTime(0.42, pulseTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + pulseDuration);

      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(pulseTime);
      sub.start(pulseTime);
      osc.stop(pulseTime + pulseDuration + 0.05);
      sub.stop(pulseTime + pulseDuration + 0.05);
    });

    // 2. Smooth synth chords with long sustain (held for 2 full bars)
    item.chord.forEach((noteName, i) => {
      const freq = getNoteFreq(noteName);
      if (!Number.isFinite(freq) || freq <= 0) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const chordFilter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq, t);
      osc1.detune.setValueAtTime((i - 2) * 5, t);
      osc2.detune.setValueAtTime(-(i - 2) * 4, t);

      chordFilter.type = 'lowpass';
      chordFilter.frequency.setValueAtTime(1400 + rng.range(-150, 200), t);
      chordFilter.frequency.linearRampToValueAtTime(800, t + chordLen * 0.7);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.075, t + 0.6);
      gain.gain.setValueAtTime(0.075, t + chordLen - 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + chordLen);

      osc1.connect(chordFilter);
      osc2.connect(chordFilter);
      chordFilter.connect(gain);
      gain.connect(dest);

      const delayGain = ctx.createGain();
      delayGain.gain.setValueAtTime(0.15, t);
      gain.connect(delayGain);
      delayGain.connect(delayBus);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + chordLen);
      osc2.stop(t + chordLen);
    });

    // 3. Subtle chillout percussion: soft shaker / hihat on offbeats
    for (let beat = 0; beat < 8; beat++) {
      const hatTime = t + beat * beatLen + beatLen * 0.5;
      if (hatTime < startTime + duration) {
        playHihat(ctx, dest, hatTime, 0.025);
      }
    }

    t += chordLen;
    chordIdx++;
  }
}

/**
 * 4. Minimalist Harp & Strings:
 * - Прозрачные, воздушные переборы нот в высоком регистре (арфа в октавах 4-6).
 * - Аккомпанемент из протяжных скрипичных интервалов (терции/квинты).
 * - Избегание плотных гармоний, много "воздуха" и пауз между нотами.
 * - Уникальные звуковые узоры и мелодические переборы per seed.
 */
function renderMinimalistHarpStringsTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(60, 68);
  const beatLen = 60 / bpm;
  const barLen = beatLen * 4;

  // 6 distinct open string themes (drawn-out thirds and fifths for spacious acoustic depth)
  const acousticThemes = [
    // Theme A (A Minor / C Major)
    {
      strings: [
        { root: 'A3', interval: 'E4' },
        { root: 'C4', interval: 'G4' },
        { root: 'F3', interval: 'C4' },
        { root: 'D4', interval: 'A4' },
      ],
      harpScales: [
        ['A4', 'C5', 'E5', 'B5', 'C6', 'E6'],
        ['C5', 'E5', 'G5', 'D6', 'E6', 'G6'],
        ['F4', 'A4', 'C5', 'E5', 'A5', 'C6'],
        ['D5', 'F5', 'A5', 'E6', 'F6', 'A6'],
      ],
    },
    // Theme B (D Minor / F Major)
    {
      strings: [
        { root: 'D3', interval: 'A3' },
        { root: 'Bb3', interval: 'F4' },
        { root: 'F3', interval: 'C4' },
        { root: 'C4', interval: 'G4' },
      ],
      harpScales: [
        ['D4', 'F4', 'A4', 'D5', 'E5', 'F5'],
        ['Bb4', 'D5', 'F5', 'A5', 'Bb5', 'D6'],
        ['F4', 'A4', 'C5', 'E5', 'F5', 'A5'],
        ['C5', 'E5', 'G5', 'B5', 'C6', 'E6'],
      ],
    },
    // Theme C (E Minor / G Major)
    {
      strings: [
        { root: 'E3', interval: 'B3' },
        { root: 'C4', interval: 'G4' },
        { root: 'G3', interval: 'D4' },
        { root: 'D4', interval: 'A4' },
      ],
      harpScales: [
        ['E4', 'G4', 'B4', 'E5', 'F#5', 'G5'],
        ['C5', 'E5', 'G5', 'B5', 'C6', 'E6'],
        ['G4', 'B4', 'D5', 'F#5', 'G5', 'B5'],
        ['D5', 'F#5', 'A5', 'C#6', 'D6', 'F#6'],
      ],
    },
    // Theme D (B Minor / D Major)
    {
      strings: [
        { root: 'B3', interval: 'F#4' },
        { root: 'G3', interval: 'D4' },
        { root: 'D4', interval: 'A4' },
        { root: 'A3', interval: 'E4' },
      ],
      harpScales: [
        ['B4', 'D5', 'F#5', 'A5', 'B5', 'D6'],
        ['G4', 'B4', 'D5', 'F#5', 'G5', 'B5'],
        ['D5', 'F#5', 'A5', 'C#6', 'D6', 'F#6'],
        ['A4', 'C#5', 'E5', 'G#5', 'A5', 'C#6'],
      ],
    },
  ];

  const currentTheme = rng.choice(acousticThemes);
  const { strings: stringIntervals, harpScales } = currentTheme;

  // Plucked Harp Note Synthesizer
  const playHarpNote = (noteName: string, t: number, vol = 0.28) => {
    if (t >= startTime + duration) return;
    const freq = getNoteFreq(noteName);
    if (!Number.isFinite(freq) || freq <= 0) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 2, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4500, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.8);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    const delaySend = ctx.createGain();
    delaySend.gain.setValueAtTime(vol * 0.35, t);
    gain.connect(delaySend);
    delaySend.connect(delayBus);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1.7);
    osc2.stop(t + 1.7);
  };

  // Sustained Violin / String Interval (open third or fifth)
  const playStringInterval = (n1: string, n2: string, t: number, intervalDuration: number) => {
    [n1, n2].forEach((noteName) => {
      const freq = getNoteFreq(noteName);
      if (!Number.isFinite(freq) || freq <= 0) return;

      const osc = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      vibrato.frequency.setValueAtTime(5.2, t);
      vibratoGain.gain.setValueAtTime(3.5, t);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.detune);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, t);
      filter.Q.setValueAtTime(1.0, t);

      const attack = 0.9;
      const release = 1.4;
      const vol = 0.085;

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + attack);
      gain.gain.setValueAtTime(vol, t + intervalDuration - release);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + intervalDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      vibrato.start(t);
      osc.start(t);
      vibrato.stop(t + intervalDuration + 0.1);
      osc.stop(t + intervalDuration + 0.1);
    });
  };

  let t = startTime;
  let phraseIdx = 0;

  while (t < startTime + duration) {
    const currentStrings = stringIntervals[phraseIdx % stringIntervals.length];
    const harpNotes = harpScales[phraseIdx % harpScales.length];

    // 1. Sustained Violin Open Interval for the full 2 bars
    const phraseLen = barLen * 2;
    playStringInterval(currentStrings.root, currentStrings.interval, t, phraseLen * 0.98);

    // 2. Dynamic Procedural Harp Picking with Air and Pauses per seed
    const step16th = beatLen / 4;

    // Bar 1: 3-4 delicate notes placed procedurally
    const bar1Offsets = rng.choice([
      [2, 5, 8],
      [1, 4, 7, 10],
      [0, 3, 6],
      [2, 6, 9],
    ]);

    bar1Offsets.forEach((off, idx) => {
      const mTime = t + step16th * off;
      const note = harpNotes[(phraseIdx + idx) % harpNotes.length];
      playHarpNote(note, mTime, rng.range(0.22, 0.28));
    });

    // Bar 2: An answering delicate high flutter per seed
    const bar2Offsets = rng.choice([
      [3, 6],
      [2, 5, 8],
      [4, 7],
      [1, 5],
    ]);

    bar2Offsets.forEach((off, idx) => {
      const aTime = t + barLen + step16th * off;
      const note = harpNotes[(harpNotes.length - 1 - idx) % harpNotes.length];
      playHarpNote(note, aTime, rng.range(0.2, 0.25));
    });

    t += phraseLen;
    phraseIdx++;
  }
}

/**
 * 5. Lo-Fi Chill Hop (Rich jazz chord progressions, rhodes detune, melody licks, vinyl noise)
 */
function renderLofiTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(74, 84);
  const beatLen = 60 / bpm;

  // Multiple jazz chord progressions
  const progressionOptions = [
    // Cmaj7 -> Am9 -> Dm9 -> G13
    [
      ['C4', 'E4', 'G4', 'B4'],
      ['A3', 'C4', 'E4', 'G4', 'B4'],
      ['D4', 'F4', 'A4', 'C5', 'E5'],
      ['G3', 'F4', 'B4', 'E5'],
    ],
    // Fmaj9 -> Em7 -> Dm9 -> Cmaj7
    [
      ['F3', 'A3', 'C4', 'E4', 'G4'],
      ['E3', 'G3', 'B3', 'D4'],
      ['D3', 'F3', 'A3', 'C4', 'E4'],
      ['C4', 'E4', 'G4', 'B4'],
    ],
    // Ebmaj7 -> Cm7 -> Fm7 -> Bb7
    [
      ['Eb3', 'G3', 'Bb3', 'D4'],
      ['C4', 'Eb4', 'G4', 'Bb4'],
      ['F3', 'Ab3', 'C4', 'Eb4'],
      ['Bb3', 'D4', 'F4', 'Ab4'],
    ],
    // Abmaj7 -> Dbmaj7 -> Bbm7 -> Eb7
    [
      ['Ab3', 'C4', 'Eb4', 'G4'],
      ['Db4', 'F4', 'Ab4', 'C5'],
      ['Bb3', 'Db4', 'F4', 'Ab4'],
      ['Eb3', 'G3', 'Bb3', 'Db4'],
    ],
  ];

  const chosenProgression = rng.choice(progressionOptions);
  const chords = chosenProgression.map((chord) => chord.map((n) => getNoteFreq(n)));

  // Vinyl Crackle Noise
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * (Math.random() > 0.98 ? 0.35 : 0.025);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1200, 0);
  noiseFilter.Q.setValueAtTime(1.5, 0);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.06, 0);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);
  noise.start(startTime);
  noise.stop(startTime + duration);

  let t = startTime;
  let chordIdx = 0;
  while (t < startTime + duration) {
    const chord = chords[chordIdx % chords.length];

    // Rhodes / E-Piano Chord
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime((i - 1.5) * rng.range(2.5, 5.5), t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.11, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 3.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(rng.range(1200, 1800), t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      gain.connect(delayBus);

      osc.start(t);
      osc.stop(t + beatLen * 4);
    });

    // Melodic decorative bells / notes
    if (rng.next() > 0.3) {
      const bellNote = chord[rng.int(1, chord.length - 1)] * 2;
      const bellTime = t + beatLen * rng.choice([1.5, 2.5, 3.25]);
      if (bellTime < startTime + duration) {
        const bellOsc = ctx.createOscillator();
        bellOsc.type = 'triangle';
        bellOsc.frequency.setValueAtTime(bellNote, bellTime);
        const bellGain = ctx.createGain();
        bellGain.gain.setValueAtTime(0, bellTime);
        bellGain.gain.linearRampToValueAtTime(0.06, bellTime + 0.02);
        bellGain.gain.exponentialRampToValueAtTime(0.001, bellTime + 1.2);
        bellOsc.connect(bellGain);
        bellGain.connect(delayBus);
        bellGain.connect(dest);
        bellOsc.start(bellTime);
        bellOsc.stop(bellTime + 1.3);
      }
    }

    // Lo-Fi Beat
    playKick(ctx, dest, t, 0.38);
    playSnare(ctx, dest, t + beatLen * 2, 0.22);
    if (rng.next() > 0.35) {
      playKick(ctx, dest, t + beatLen * 2.75, 0.28);
    }

    // Hi-Hats
    for (let b = 0; b < 4; b += 0.5) {
      const swing = b % 1 === 0.5 ? 0.03 : 0;
      playHihat(ctx, dest, t + (b * beatLen) + swing, 0.025);
    }

    t += beatLen * 4;
    chordIdx++;
  }
}

/**
 * 2. Cyber Synthwave (Rolling 80s bass, retro arpeggios, punchy gated kick & snare)
 */
function renderSynthwaveTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(112, 124);
  const beatLen = 60 / bpm;

  const keySets = [
    ['F3', 'D#3', 'C#3', 'D#3'],
    ['A3', 'F3', 'G3', 'E3'],
    ['D3', 'Bb2', 'C3', 'A2'],
    ['G3', 'Eb3', 'F3', 'D3'],
    ['C#3', 'A2', 'B2', 'G#2'],
  ];
  const chosenKey = rng.choice(keySets);
  const bassNotes = chosenKey.map((n) => getNoteFreq(n));

  let t = startTime;
  let bar = 0;
  while (t < startTime + duration) {
    const root = bassNotes[bar % bassNotes.length];

    // 16th note rolling synth bass
    for (let s = 0; s < 16; s++) {
      const noteTime = t + (s * beatLen) / 4;
      if (noteTime >= startTime + duration) break;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const octaveMultiplier = s % 4 === 0 ? 0.5 : (s % 2 === 0 ? 0.5 : 1.0);
      osc.frequency.setValueAtTime(root * octaveMultiplier, noteTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(rng.range(750, 1100), noteTime);
      filter.frequency.exponentialRampToValueAtTime(180, noteTime + 0.12);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.19, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    }

    // Arp Lead Line
    const scaleMultipliers = [1, 1.2, 1.334, 1.5, 1.6, 2.0];
    for (let s = 0; s < 8; s++) {
      const noteTime = t + (s * beatLen) / 2;
      if (noteTime >= startTime + duration) break;
      const mult = scaleMultipliers[(s + bar * 2) % scaleMultipliers.length];
      const note = root * mult;

      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.06, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(delayBus);
      gain.connect(dest);

      osc.start(noteTime);
      osc.stop(noteTime + 0.24);
    }

    // Drums: 4 on the floor
    playKick(ctx, dest, t, 0.42);
    playSnare(ctx, dest, t + beatLen, 0.26);
    playKick(ctx, dest, t + beatLen * 2, 0.42);
    playSnare(ctx, dest, t + beatLen * 3, 0.26);

    for (let s = 0; s < 8; s++) {
      playHihat(ctx, dest, t + (s * beatLen) / 2, 0.035);
    }

    t += beatLen * 4;
    bar++;
  }
}

/**
 * 3. Deep Ambient Calm (Meditative warm pads, shimmering crystal bells, space reverb)
 */
function renderAmbientTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const rootOptions = [
    ['D3', 'F3', 'A3', 'C4', 'E4'], // Dm9
    ['F3', 'A3', 'C4', 'E4', 'G4'], // Fmaj9
    ['A2', 'C3', 'E3', 'G3', 'B3'], // Am9
    ['G2', 'B2', 'D3', 'F#3', 'A3'], // Gmaj9
  ];
  const chosenSet = rng.choice(rootOptions);
  const rootFreqs = chosenSet.map((n) => getNoteFreq(n));

  rootFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(rng.range(0.08, 0.22), startTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(freq * 0.012, startTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(startTime);
    lfo.stop(startTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + 2.5);
    gain.gain.setValueAtTime(0.08, startTime + Math.max(2.5, duration - 2.5));
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(rng.range(650, 1100), startTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    gain.connect(delayBus);

    osc.start(startTime);
    osc.stop(startTime + duration);
  });

  // Random crystal bells throughout duration
  let bellTime = startTime + rng.range(0.8, 2.0);
  while (bellTime < startTime + duration - 1) {
    const bellFreq = rng.choice(rootFreqs) * rng.choice([2, 3, 4]);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(bellFreq, bellTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, bellTime);
    gain.gain.linearRampToValueAtTime(0.05, bellTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, bellTime + 2.5);

    osc.connect(gain);
    gain.connect(delayBus);
    gain.connect(dest);

    osc.start(bellTime);
    osc.stop(bellTime + 2.6);

    bellTime += rng.range(1.6, 3.4);
  }
}

/**
 * 4. Motivational Drive (Driving cinematic energy, rhythmic synth pulses, rising percussion)
 */
function renderEpicDriveTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(120, 130);
  const beatLen = 60 / bpm;

  const progOptions = [
    ['A3', 'F3', 'C4', 'G3'],
    ['D3', 'Bb2', 'F3', 'C3'],
    ['E3', 'C3', 'G3', 'D3'],
  ];
  const chosenProg = rng.choice(progOptions);
  const roots = chosenProg.map((n) => getNoteFreq(n));

  let t = startTime;
  let bar = 0;
  while (t < startTime + duration) {
    const root = roots[bar % roots.length];

    // Driving 8th staccato string/synth pulses
    for (let s = 0; s < 8; s++) {
      const noteTime = t + (s * beatLen) / 2;
      if (noteTime >= startTime + duration) break;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(root, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.14, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, noteTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      if (s % 2 === 1) gain.connect(delayBus);

      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
    }

    // Heavy Drive Drums
    playKick(ctx, dest, t, 0.44);
    playKick(ctx, dest, t + beatLen * 1.5, 0.35);
    playSnare(ctx, dest, t + beatLen, 0.28);
    playKick(ctx, dest, t + beatLen * 2, 0.44);
    playSnare(ctx, dest, t + beatLen * 3, 0.28);

    for (let h = 0; h < 8; h++) {
      playHihat(ctx, dest, t + (h * beatLen) / 2, 0.04);
    }

    t += beatLen * 4;
    bar++;
  }
}

/**
 * 5. Drift Phonk Beat (Dirty 808 bass, cowbell melodic hooks, aggressive trap hats)
 */
function renderPhonkTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(132, 142);
  const beatLen = 60 / bpm;

  const keySets = [
    ['C#3', 'E3', 'F#3', 'G#3', 'B3'],
    ['D#3', 'F#3', 'G#3', 'A#3', 'C#4'],
    ['F3', 'Ab3', 'Bb3', 'C4', 'Eb4'],
  ];
  const chosenScale = rng.choice(keySets).map((n) => getNoteFreq(n));
  const root = chosenScale[0];

  let t = startTime;
  let bar = 0;
  while (t < startTime + duration) {
    // Heavy 808 Sub Bass
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(root * 0.5, t);
    if (rng.next() > 0.5) {
      subOsc.frequency.exponentialRampToValueAtTime(root * 0.4, t + beatLen * 2);
    }

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.32, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 3.8);

    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start(t);
    subOsc.stop(t + beatLen * 3.9);

    // Iconic Cowbell Riff
    for (let s = 0; s < 8; s++) {
      const noteTime = t + (s * beatLen) / 2;
      if (noteTime >= startTime + duration) break;
      const cowNote = chosenScale[(s * 2 + bar) % chosenScale.length] * 2;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(cowNote, noteTime);
      osc2.frequency.setValueAtTime(cowNote * 1.5, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.14);

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(cowNote * 1.2, noteTime);
      bandpass.Q.setValueAtTime(4.0, noteTime);

      osc1.connect(bandpass);
      osc2.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(dest);
      gain.connect(delayBus);

      osc1.start(noteTime);
      osc2.start(noteTime);
      osc1.stop(noteTime + 0.16);
      osc2.stop(noteTime + 0.16);
    }

    // Phonk Drums
    playKick(ctx, dest, t, 0.46);
    playSnare(ctx, dest, t + beatLen, 0.32);
    playKick(ctx, dest, t + beatLen * 2.25, 0.42);
    playSnare(ctx, dest, t + beatLen * 3, 0.32);

    // Fast 16th Phonk Trap Hats
    for (let h = 0; h < 16; h++) {
      playHihat(ctx, dest, t + (h * beatLen) / 4, 0.03);
    }

    t += beatLen * 4;
    bar++;
  }
}

/**
 * 6. Acoustic Warmth (Fingerpicking acoustic arpeggios, warm indie chords, soft shaker)
 */
function renderAcousticTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(80, 90);
  const beatLen = 60 / bpm;

  const progOptions = [
    // G -> D -> Em -> C
    [
      ['G3', 'B3', 'D4', 'G4'],
      ['D3', 'F#3', 'A3', 'D4'],
      ['E3', 'G3', 'B3', 'E4'],
      ['C3', 'E3', 'G3', 'C4'],
    ],
    // C -> G -> Am -> F
    [
      ['C3', 'E3', 'G3', 'C4'],
      ['G3', 'B3', 'D4', 'G4'],
      ['A3', 'C4', 'E4', 'A4'],
      ['F3', 'A3', 'C4', 'F4'],
    ],
    // D -> A -> Bm -> G
    [
      ['D3', 'F#3', 'A3', 'D4'],
      ['A3', 'C#4', 'E4', 'A4'],
      ['B3', 'D4', 'F#4', 'B4'],
      ['G3', 'B3', 'D4', 'G4'],
    ],
  ];

  const chosenProg = rng.choice(progOptions);
  const chords = chosenProg.map((chord) => chord.map((n) => getNoteFreq(n)));

  let t = startTime;
  let chordIdx = 0;
  while (t < startTime + duration) {
    const chord = chords[chordIdx % chords.length];

    // Acoustic fingerpicking arpeggio (4 notes per beat)
    for (let i = 0; i < 8; i++) {
      const noteTime = t + (i * beatLen) / 2;
      if (noteTime >= startTime + duration) break;
      const noteFreq = chord[i % chord.length];

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq, noteTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + beatLen * 1.6);

      osc.connect(gain);
      gain.connect(dest);
      gain.connect(delayBus);

      osc.start(noteTime);
      osc.stop(noteTime + beatLen * 1.7);
    }

    // Soft organic percussion
    playKick(ctx, dest, t, 0.28);
    playSnare(ctx, dest, t + beatLen * 2, 0.16);

    for (let s = 0; s < 4; s++) {
      playHihat(ctx, dest, t + s * beatLen, 0.02);
    }

    t += beatLen * 4;
    chordIdx++;
  }
}

// Drum synthesizer helpers
function playKick(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.35) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(130, time);
  osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.15);
}

function playSnare(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.2) {
  const bufferSize = Math.floor(ctx.sampleRate * 0.12);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
  noise.connect(gain);
  gain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.13);
}

function playHihat(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol = 0.05) {
  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(7000, time);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(time);
  noise.stop(time + 0.05);
}

/**
 * 7. Смешной (Comical & Cartoon: bouncy staccato bass, playful slides, whimsical synth motifs)
 */
/**
 * 7. Смешной (Funny / Comedy / Cartoon / Slapstick):
 * Озорной стаккато бас, забавные мультяшные глиссандо, прыгающая мелодия и комичные звуковые эффекты.
 * Разнообразные гармонии, ритмические рисунки и мелодические темы per seed.
 */
function renderFunnyTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(118, 132);
  const beatLen = 60 / bpm;

  // 4 distinct comedic chord progressions
  const progressions = [
    // Classic Cartoon Ragtime / Polka in C
    {
      scale: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'].map((n) => getNoteFreq(n)),
      bassline: ['C3', 'G2', 'C3', 'G2', 'F2', 'A2', 'G2', 'B2'].map((n) => getNoteFreq(n)),
      swing: 0.04,
    },
    // Quirky Circus in F
    {
      scale: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5'].map((n) => getNoteFreq(n)),
      bassline: ['F2', 'C3', 'D3', 'A2', 'G2', 'C3', 'F2', 'C3'].map((n) => getNoteFreq(n)),
      swing: 0.06,
    },
    // Bouncy Comedy March in G
    {
      scale: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5', 'A5'].map((n) => getNoteFreq(n)),
      bassline: ['G2', 'D3', 'B2', 'D3', 'E2', 'B2', 'A2', 'D3'].map((n) => getNoteFreq(n)),
      swing: 0.03,
    },
    // Playful Cartoon Chase in D
    {
      scale: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5', 'E5'].map((n) => getNoteFreq(n)),
      bassline: ['D3', 'A2', 'B2', 'F#2', 'G2', 'D3', 'A2', 'C#3'].map((n) => getNoteFreq(n)),
      swing: 0.05,
    },
  ];

  const currentTheme = rng.choice(progressions);
  const { scale, bassline, swing } = currentTheme;

  // Generate a procedural 8-step melodic hook for this seed
  const melodyPattern = Array.from({ length: 8 }, () => ({
    note: rng.choice(scale),
    play: rng.next() > 0.22,
    slide: rng.next() > 0.65,
    wave: rng.choice<'square' | 'triangle' | 'sine'>(['square', 'triangle', 'sine']),
  }));

  let t = startTime;
  let step = 0;

  while (t < duration) {
    const isOdd = step % 2 === 1;
    const swingOffset = isOdd ? swing : 0;
    const currentStepTime = t + swingOffset;

    // Упругий мультяшный бас "boing" на каждую долю с чередованием нот
    const bassFreq = bassline[step % bassline.length];
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = step % 4 === 0 ? 'triangle' : 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq * (1.1 + rng.range(-0.05, 0.08)), currentStepTime);
    bassOsc.frequency.exponentialRampToValueAtTime(bassFreq, currentStepTime + 0.06);
    bassGain.gain.setValueAtTime(0.28, currentStepTime);
    bassGain.gain.exponentialRampToValueAtTime(0.001, currentStepTime + beatLen * 0.6);
    bassOsc.connect(bassGain);
    bassGain.connect(dest);
    bassOsc.start(currentStepTime);
    bassOsc.stop(currentStepTime + beatLen * 0.65);

    // Забавная прыгающая мелодия (восьмыми долями)
    for (let sub = 0; sub < 2; sub++) {
      const subTime = currentStepTime + sub * (beatLen / 2);
      const motif = melodyPattern[(step * 2 + sub) % melodyPattern.length];

      if (motif.play) {
        const melOsc = ctx.createOscillator();
        const melGain = ctx.createGain();
        melOsc.type = motif.wave;

        // Забавный комичный глиссандо-слайд
        if (motif.slide) {
          const startMult = rng.choice([0.7, 0.8, 1.3, 1.4]);
          melOsc.frequency.setValueAtTime(motif.note * startMult, subTime);
          melOsc.frequency.exponentialRampToValueAtTime(motif.note, subTime + beatLen * 0.25);
        } else {
          melOsc.frequency.setValueAtTime(motif.note, subTime);
        }

        melGain.gain.setValueAtTime(0.13, subTime);
        melGain.gain.exponentialRampToValueAtTime(0.001, subTime + beatLen * 0.38);
        melOsc.connect(melGain);
        melGain.connect(dest);
        melGain.connect(delayBus);
        melOsc.start(subTime);
        melOsc.stop(subTime + beatLen * 0.42);
      }
    }

    // Перкуссия с комичными акцентами
    if (step % 2 === 0) {
      playKick(ctx, dest, currentStepTime, 0.22);
    } else {
      playSnare(ctx, dest, currentStepTime, 0.16);
    }
    playHihat(ctx, dest, currentStepTime + beatLen * 0.5, 0.035);

    t += beatLen;
    step++;
  }
}

/**
 * 8. Героический (Heroic / Epic & Fanfare: triumphant brass synth, martial pulse, majestic chord progressions)
 */
function renderHeroicTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(124, 136);
  const beatLen = 60 / bpm;

  // 5 distinct epic cinematic chord progressions
  const progressions = [
    // Regal Victory in D Minor
    {
      chords: [
        ['D3', 'F3', 'A3', 'D4'],
        ['Bb2', 'D3', 'F3', 'Bb3'],
        ['C3', 'E3', 'G3', 'C4'],
        ['F3', 'A3', 'C4', 'F4'],
        ['G2', 'D3', 'G3', 'Bb3'],
        ['A2', 'E3', 'A3', 'C#4'],
      ],
      leadNotes: ['D4', 'F4', 'A4', 'D5', 'E5', 'F5', 'G5', 'A5'],
    },
    // Cinematic Anthem in A Minor
    {
      chords: [
        ['A2', 'E3', 'A3', 'C4'],
        ['F2', 'C3', 'F3', 'A3'],
        ['C3', 'G3', 'C4', 'E4'],
        ['G2', 'D3', 'G3', 'B3'],
        ['D3', 'A3', 'D4', 'F4'],
        ['E3', 'B3', 'E4', 'G#4'],
      ],
      leadNotes: ['A4', 'C5', 'E5', 'G5', 'A5', 'B5', 'C6'],
    },
    // Majestic Brass in E Minor
    {
      chords: [
        ['E2', 'B2', 'E3', 'G3'],
        ['C3', 'G3', 'C4', 'E4'],
        ['D3', 'A3', 'D4', 'F#4'],
        ['G2', 'D3', 'G3', 'B3'],
        ['A2', 'E3', 'A3', 'C4'],
        ['B2', 'F#3', 'B3', 'D#4'],
      ],
      leadNotes: ['E4', 'G4', 'B4', 'E5', 'F#5', 'G5', 'A5'],
    },
    // Triumphant Glory in C Major
    {
      chords: [
        ['C3', 'G3', 'C4', 'E4'],
        ['G2', 'D3', 'G3', 'B3'],
        ['A2', 'E3', 'A3', 'C4'],
        ['F2', 'C3', 'F3', 'A3'],
        ['D3', 'A3', 'D4', 'F4'],
        ['G2', 'D3', 'G3', 'D4'],
      ],
      leadNotes: ['C4', 'E4', 'G4', 'C5', 'D5', 'E5', 'G5'],
    },
    // Titan Battle in G Minor
    {
      chords: [
        ['G2', 'D3', 'G3', 'Bb3'],
        ['Eb2', 'Bb2', 'Eb3', 'G3'],
        ['F2', 'C3', 'F3', 'A3'],
        ['Bb2', 'F3', 'Bb3', 'D4'],
        ['C3', 'G3', 'C4', 'Eb4'],
        ['D3', 'A3', 'D4', 'F#4'],
      ],
      leadNotes: ['G4', 'Bb4', 'D5', 'G5', 'A5', 'Bb5', 'C6'],
    },
  ];

  const currentTheme = rng.choice(progressions);
  const chordPool = currentTheme.chords;
  const leadScale = currentTheme.leadNotes.map((n) => getNoteFreq(n));

  // Generate a procedural fanfare lead motif for this seed
  const fanfareMotif = Array.from({ length: 8 }, () => ({
    note: rng.choice(leadScale),
    play: rng.next() > 0.2,
    octaveUp: rng.next() > 0.6,
  }));

  let t = startTime;
  let chordIdx = 0;

  while (t < duration) {
    const chordNotes = chordPool[chordIdx % chordPool.length];
    const chordFreqs = chordNotes.map((n) => getNoteFreq(n));

    // Мощные кинематографичные медные аккорды (Brass synth)
    chordFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700 + rng.range(-50, 100), t);
      filter.frequency.exponentialRampToValueAtTime(2600 + rng.range(-200, 300), t + 0.2);
      filter.frequency.exponentialRampToValueAtTime(900, t + beatLen * 3.8);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 3.85);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      gain.connect(delayBus);

      osc.start(t);
      osc.stop(t + beatLen * 3.9);
    });

    // Маршевый ритм и героическая фанфарная тема
    for (let b = 0; b < 4; b++) {
      const bt = t + b * beatLen;
      playKick(ctx, dest, bt, 0.42);
      playHihat(ctx, dest, bt, 0.04);
      playHihat(ctx, dest, bt + beatLen * 0.5, 0.045);
      if (b === 1 || b === 3) {
        playSnare(ctx, dest, bt, 0.26);
      }

      // Фанфарная мелодическая линия в высоком регистре per seed
      const leadStep = fanfareMotif[(chordIdx * 4 + b) % fanfareMotif.length];
      if (leadStep.play) {
        const leadFreq = leadStep.note * (leadStep.octaveUp ? 1.5 : 1.0);
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        leadOsc.type = 'sawtooth';
        leadOsc.frequency.setValueAtTime(leadFreq, bt);
        leadGain.gain.setValueAtTime(0.14, bt);
        leadGain.gain.exponentialRampToValueAtTime(0.001, bt + beatLen * 0.78);
        leadOsc.connect(leadGain);
        leadGain.connect(dest);
        leadGain.connect(delayBus);
        leadOsc.start(bt);
        leadOsc.stop(bt + beatLen * 0.82);
      }
    }

    t += beatLen * 4;
    chordIdx++;
  }
}

/**
 * 9. Ноты (Minimal Tones: отдельные чистые звуки разной тональности с интервалом тишины ~1 сек)
 */
function renderNotesTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  // 4 distinct atmospheric musical scales
  const scales = [
    // Zen Pentatonic
    ['E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5', 'A5', 'B5', 'D6', 'E6'],
    // Celestial Lydian
    ['C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'],
    // Deep Mystic Minor
    ['A3', 'C4', 'D4', 'E4', 'F4', 'G#4', 'A4', 'B4', 'C5', 'E5', 'A5'],
    // Warm Acoustic Major
    ['D4', 'F#4', 'A4', 'B4', 'C#5', 'D5', 'E5', 'F#5', 'A5', 'D6'],
  ];

  const activeScale = rng.choice(scales).map((n) => getNoteFreq(n));
  const timbreType = rng.choice<'sine' | 'triangle'>(['sine', 'triangle']);

  let t = startTime + 0.15;
  const notePlayDuration = rng.range(0.4, 0.55); // Звучание ноты
  const silenceInterval = rng.range(0.95, 1.15); // Около 1 секунды тишины между звуками

  while (t < duration) {
    const freq = rng.choice(activeScale);

    // Кристальный чистый звук с гармоническими обертонами
    [1, 2, 3].forEach((harmonic, hIdx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = hIdx === 0 ? timbreType : 'sine';
      osc.frequency.setValueAtTime(freq * harmonic, t);

      const hVol = hIdx === 0 ? 0.33 : hIdx === 1 ? 0.11 : 0.04;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(hVol, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + notePlayDuration);

      osc.connect(gain);
      gain.connect(dest);
      gain.connect(delayBus);

      osc.start(t);
      osc.stop(t + notePlayDuration + 0.05);
    });

    // Шаг: звучание ноты + интервал тишины
    t += notePlayDuration + silenceInterval;
  }
}

/**
 * 10. Молния (Lightning / High-Speed Synth: сверхбыстрые стремительные 16-е арпеджио и электрический драйв)
 */
function renderLightningTrack(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  delayBus: AudioNode,
  duration: number,
  startTime: number,
  rng: RandomGenerator
) {
  const bpm = rng.int(160, 175);
  const beatLen = 60 / bpm;
  const step16th = beatLen / 4;

  // 4 distinct high-velocity electronic scales & chord anchors
  const themes = [
    // Cyberpunk Overdrive in E Minor
    {
      scale: ['E3', 'G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'G5'].map((n) => getNoteFreq(n)),
      rootProg: ['E2', 'C2', 'A2', 'D2'].map((n) => getNoteFreq(n)),
      arpeggioType: 0, // Pendular
    },
    // Electric Surge in A Minor
    {
      scale: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'].map((n) => getNoteFreq(n)),
      rootProg: ['A2', 'F2', 'D2', 'E2'].map((n) => getNoteFreq(n)),
      arpeggioType: 1, // Rolling Gallop
    },
    // Hyperdrive in D Minor
    {
      scale: ['D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'G4', 'A4', 'C5', 'D5'].map((n) => getNoteFreq(n)),
      rootProg: ['D2', 'Bb1', 'F2', 'C2'].map((n) => getNoteFreq(n)),
      arpeggioType: 2, // Polyrhythmic Jump
    },
    // Neon Accelerator in B Minor
    {
      scale: ['B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5', 'B5'].map((n) => getNoteFreq(n)),
      rootProg: ['B2', 'G2', 'E2', 'F#2'].map((n) => getNoteFreq(n)),
      arpeggioType: 3, // Cascade Waterfall
    },
  ];

  const currentTheme = rng.choice(themes);
  const { scale, rootProg, arpeggioType } = currentTheme;

  // Generate 16-step arpeggio pattern for this seed
  const pattern16 = Array.from({ length: 16 }, (_, i) => {
    switch (arpeggioType) {
      case 0: // Pendular
        return i < 8 ? i % scale.length : scale.length - 1 - (i % scale.length);
      case 1: // Rolling Gallop
        return (i * 3 + rng.int(0, 2)) % scale.length;
      case 2: // Polyrhythmic Jump
        return i % 4 === 0 ? 0 : (i * 2 + 1) % scale.length;
      default: // Cascade Waterfall
        return scale.length - 1 - (i % scale.length);
    }
  });

  let t = startTime;
  let step = 0;

  while (t < duration) {
    const barIdx = Math.floor(step / 16);
    const rootFreq = rootProg[barIdx % rootProg.length];

    // Плотный скоростной басовый импульс на сильные доли
    if (step % 4 === 0) {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(rootFreq, t);
      bassGain.gain.setValueAtTime(0.25, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + step16th * 3.5);
      bassOsc.connect(bassGain);
      bassGain.connect(dest);
      bassOsc.start(t);
      bassOsc.stop(t + step16th * 3.8);
    }

    // Стремительное 16-е арпеджио на высокой скорости per seed
    const noteIdx = pattern16[step % pattern16.length];
    const freq = scale[Math.min(scale.length - 1, Math.max(0, noteIdx))];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200 + Math.sin(t * 6 + step) * 1400, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + step16th * 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    if (step % 2 === 0) {
      gain.connect(delayBus);
    }

    osc.start(t);
    osc.stop(t + step16th);

    // Плотный скоростной ритм
    if (step % 4 === 0) {
      playKick(ctx, dest, t, 0.38);
    }
    if (step % 8 === 4) {
      playSnare(ctx, dest, t, 0.22);
    }
    playHihat(ctx, dest, t, 0.035);

    t += step16th;
    step++;
  }
}
