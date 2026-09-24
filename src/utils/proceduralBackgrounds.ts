// Procedural Canvas Background Generator Module
// Generates unique dynamic animated background scenes based on mood styles and seed variations

export type ProceduralMoodStyle =
  | 'cosmic'
  | 'cyberpunk'
  | 'ember'
  | 'nature'
  | 'gold'
  | 'fluid'
  | 'equalizer'
  | 'shapes'
  | 'emojis';

export interface ProceduralMoodDefinition {
  id: ProceduralMoodStyle;
  nameKey: string;
  defaultName: string;
  icon: string;
  descriptionKey: string;
  defaultDesc: string;
  accentColors: [string, string, string];
}

export const PROCEDURAL_MOODS: ProceduralMoodDefinition[] = [
  {
    id: 'cosmic',
    nameKey: 'moodCosmicName',
    defaultName: '✨ Космос и Магия',
    icon: '✨',
    descriptionKey: 'moodCosmicDesc',
    defaultDesc: 'Галактические туманности, парящие созвездия и падающие метеоры',
    accentColors: ['#1e1b4b', '#581c87', '#38bdf8'],
  },
  {
    id: 'cyberpunk',
    nameKey: 'moodCyberName',
    defaultName: '⚡ Неон и Киберпанк',
    icon: '⚡',
    descriptionKey: 'moodCyberDesc',
    defaultDesc: 'Неоновая 3D-сетка перспективы, цифровые потоки и свечение',
    accentColors: ['#09090b', '#ec4899', '#06b6d4'],
  },
  {
    id: 'ember',
    nameKey: 'moodEmberName',
    defaultName: '🔥 Огонь и Энергия',
    icon: '🔥',
    descriptionKey: 'moodEmberDesc',
    defaultDesc: 'Поднимающиеся раскаленные искры, угли и плазменные лучи',
    accentColors: ['#450a0a', '#7f1d1d', '#f59e0b'],
  },
  {
    id: 'nature',
    nameKey: 'moodNatureName',
    defaultName: '🌸 Сакура и Аврора',
    icon: '🌸',
    descriptionKey: 'moodNatureDesc',
    defaultDesc: 'Полярное сияние, парящие лепестки сакуры и световые блики',
    accentColors: ['#022c22', '#0f766e', '#f43f5e'],
  },
  {
    id: 'gold',
    nameKey: 'moodGoldName',
    defaultName: '✨ Золото и Люкс',
    icon: '🔱',
    descriptionKey: 'moodGoldDesc',
    defaultDesc: 'Мерцающий золотой боке, бриллиантовая пыль и винтажный шик',
    accentColors: ['#291e08', '#78350f', '#facc15'],
  },
  {
    id: 'fluid',
    nameKey: 'moodFluidName',
    defaultName: '💧 Жидкая Аура',
    icon: '💧',
    descriptionKey: 'moodFluidDesc',
    defaultDesc: 'Плавно переливающиеся градиентные метаболы и жидкий неоновый неолит',
    accentColors: ['#1e1b4b', '#a855f7', '#06b6d4'],
  },
  {
    id: 'equalizer',
    nameKey: 'moodEqualizerName',
    defaultName: '📊 Спектр и Эквалайзеры',
    icon: '📊',
    descriptionKey: 'moodEqualizerDesc',
    defaultDesc: 'Динамичные музыкальные эквалайзеры, кольцевые спектрограммы и звуковые волны',
    accentColors: ['#090a1a', '#701a75', '#06b6d4'],
  },
  {
    id: 'shapes',
    nameKey: 'moodShapesName',
    defaultName: '📐 Динамическая Геометрия',
    icon: '📐',
    descriptionKey: 'moodShapesDesc',
    defaultDesc: 'Разноцветные 3D и 2D фигуры разных размеров, вращающиеся на уникальных фонах',
    accentColors: ['#0f172a', '#a855f7', '#f43f5e'],
  },
  {
    id: 'emojis',
    nameKey: 'moodEmojisName',
    defaultName: '🥳 Эмодзи Вселенная',
    icon: '🥳',
    descriptionKey: 'moodEmojisDesc',
    defaultDesc: 'Разнообразные смайлики от мелкой пыльцы до гигантских объектов в сюрреалистичных мирах',
    accentColors: ['#1e1b4b', '#ec4899', '#facc15'],
  },
];

// Pseudo-random number generator driven by seed
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Renders a procedural animated background on canvas
 */
export function drawProceduralMoodBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  moodStyle: ProceduralMoodStyle = 'cosmic',
  seed: number = 42
) {
  const rng = seededRandom(seed);

  switch (moodStyle) {
    case 'cosmic':
      drawCosmic(ctx, width, height, time, rng, seed);
      break;
    case 'cyberpunk':
      drawCyberpunk(ctx, width, height, time, rng, seed);
      break;
    case 'ember':
      drawEmber(ctx, width, height, time, rng, seed);
      break;
    case 'nature':
      drawNature(ctx, width, height, time, rng, seed);
      break;
    case 'gold':
      drawGold(ctx, width, height, time, rng, seed);
      break;
    case 'fluid':
      drawFluid(ctx, width, height, time, rng, seed);
      break;
    case 'equalizer':
      drawEqualizer(ctx, width, height, time, rng, seed);
      break;
    case 'shapes':
      drawShapes(ctx, width, height, time, rng, seed);
      break;
    case 'emojis':
      drawEmojis(ctx, width, height, time, rng, seed);
      break;
    default:
      drawCosmic(ctx, width, height, time, rng, seed);
  }
}

/* ================= 1. COSMIC & MAGIC ================= */
function drawCosmic(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Cosmic palette selection based on seed
  const paletteMode = Math.floor(rng() * 5);
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.05, w * 0.5, h * 0.5, w * 0.85);

  if (paletteMode === 0) {
    // Deep Violet Void
    bg.addColorStop(0, '#2e1065');
    bg.addColorStop(0.45, '#0f0a2a');
    bg.addColorStop(1, '#030210');
  } else if (paletteMode === 1) {
    // Quasar Cyan & Indigo
    bg.addColorStop(0, '#0c4a6e');
    bg.addColorStop(0.5, '#082f49');
    bg.addColorStop(1, '#020617');
  } else if (paletteMode === 2) {
    // Ruby Nebula
    bg.addColorStop(0, '#4c0519');
    bg.addColorStop(0.5, '#1e050f');
    bg.addColorStop(1, '#050205');
  } else if (paletteMode === 3) {
    // Emerald Abyss
    bg.addColorStop(0, '#064e3b');
    bg.addColorStop(0.5, '#022c22');
    bg.addColorStop(1, '#020617');
  } else {
    // Obsidian Deep Space
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.5, '#0b0f19');
    bg.addColorStop(1, '#020408');
  }

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Swirling Pulsing Nebulae clouds
  const nebulaCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < nebulaCount; i++) {
    const cx = w * (0.15 + rng() * 0.7) + Math.sin(t * 0.35 + i * 2) * 50;
    const cy = h * (0.15 + rng() * 0.7) + Math.cos(t * 0.3 + i * 1.5) * 50;
    const rad = w * (0.28 + rng() * 0.35);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    const baseHue = Math.floor(180 + rng() * 160);
    grad.addColorStop(0, `hsla(${baseHue}, 85%, 60%, 0.22)`);
    grad.addColorStop(0.5, `hsla(${baseHue + 30}, 75%, 45%, 0.09)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Twinkling Starfield
  const starCount = 90 + Math.floor(rng() * 40);
  for (let i = 0; i < starCount; i++) {
    const sx = rng() * w;
    const sy = rng() * h;
    const baseSize = 0.8 + rng() * 2.5;
    const speed = 0.8 + rng() * 3.0;
    const twinkle = 0.25 + 0.75 * Math.sin(t * speed + i * 1.7);
    const size = baseSize * (0.65 + twinkle * 0.55);

    ctx.fillStyle =
      i % 6 === 0 ? '#38bdf8' : i % 8 === 0 ? '#f472b6' : i % 11 === 0 ? '#facc15' : '#ffffff';
    ctx.globalAlpha = Math.max(0.15, twinkle);
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();

    // 4-point cross diffraction flare for prominent stars
    if (baseSize > 2.3 && twinkle > 0.65) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(sx - size * 3.5, sy);
      ctx.lineTo(sx + size * 3.5, sy);
      ctx.moveTo(sx, sy - size * 3.5);
      ctx.lineTo(sx, sy + size * 3.5);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1.0;

  // Shooting Meteors with diverse directions and variable count (1 to 10!)
  const meteorCount = 1 + Math.floor(rng() * 10);
  const tailColors = ['#a855f7', '#38bdf8', '#ec4899', '#facc15', '#34d399', '#ffffff'];

  for (let m = 0; m < meteorCount; m++) {
    const meteorPeriod = 1.8 + rng() * 3.2; // Each meteor has its own period
    const meteorOffset = rng() * meteorPeriod;
    const meteorTime = (t + meteorOffset) % meteorPeriod;

    // Active meteor animation duration
    const mDuration = 0.65 + rng() * 0.45;
    if (meteorTime < mDuration) {
      const mProgress = meteorTime / mDuration;
      const angle = (rng() * Math.PI * 2); // Multi-directional angle!
      const travelDist = Math.min(w, h) * (0.45 + rng() * 0.4);

      // Starting point scattered across canvas edges
      const startX = rng() * w;
      const startY = rng() * h;
      const endX = startX + Math.cos(angle) * travelDist;
      const endY = startY + Math.sin(angle) * travelDist;

      const currX = startX + (endX - startX) * mProgress;
      const currY = startY + (endY - startY) * mProgress;

      const tailLenX = (endX - startX) * 0.3;
      const tailLenY = (endY - startY) * 0.3;

      const tailGrad = ctx.createLinearGradient(
        currX - tailLenX,
        currY - tailLenY,
        currX,
        currY
      );
      tailGrad.addColorStop(0, 'transparent');
      const chosenColor = tailColors[m % tailColors.length];
      tailGrad.addColorStop(0.7, chosenColor);
      tailGrad.addColorStop(1, '#ffffff');

      ctx.save();
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = 2.0 + rng() * 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(currX - tailLenX, currY - tailLenY);
      ctx.lineTo(currX, currY);
      ctx.stroke();

      // Bright head glow
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = chosenColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(currX, currY, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/* ================= 2. CYBERPUNK & NEON ================= */
function drawCyberpunk(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Theme parameters driven by seed
  const paletteType = Math.floor(rng() * 5);
  const orientation = Math.floor(rng() * 4); // 0: Floor, 1: Ceiling, 2: Wall Left/Right, 3: Dual Tunnel
  const moveDirection = Math.floor(rng() * 4); // 0: Forward, 1: Backward, 2: Left, 3: Right
  const gridDensity = 8 + Math.floor(rng() * 14); // Grid cell scale
  const curveAmp = rng() > 0.35 ? 12 + rng() * 30 : 0; // Wavy grid deformation
  const lineThickness = 1.0 + rng() * 2.2;

  let bgGrad1 = '#020617';
  let bgGrad2 = '#0f172a';
  let bgGrad3 = '#38023b';
  let gridColor = 'rgba(236, 72, 153, 0.45)';
  let glowColor = '#ec4899';
  let secondaryGrid = 'rgba(6, 182, 212, 0.4)';

  if (paletteType === 1) {
    // Matrix Cyber Emerald
    bgGrad1 = '#022c22';
    bgGrad2 = '#064e3b';
    bgGrad3 = '#020617';
    gridColor = 'rgba(34, 197, 94, 0.5)';
    glowColor = '#22c55e';
    secondaryGrid = 'rgba(163, 230, 53, 0.4)';
  } else if (paletteType === 2) {
    // Electric Ultra Cyan & Blue
    bgGrad1 = '#030712';
    bgGrad2 = '#082f49';
    bgGrad3 = '#0c4a6e';
    gridColor = 'rgba(56, 189, 248, 0.55)';
    glowColor = '#38bdf8';
    secondaryGrid = 'rgba(168, 85, 247, 0.4)';
  } else if (paletteType === 3) {
    // Outrun Gold & Crimson
    bgGrad1 = '#2a0808';
    bgGrad2 = '#450a0a';
    bgGrad3 = '#180828';
    gridColor = 'rgba(249, 115, 22, 0.55)';
    glowColor = '#f97316';
    secondaryGrid = 'rgba(250, 204, 21, 0.45)';
  } else if (paletteType === 4) {
    // Deep Violet Synth
    bgGrad1 = '#180828';
    bgGrad2 = '#2e1065';
    bgGrad3 = '#4c1d95';
    gridColor = 'rgba(168, 85, 247, 0.55)';
    glowColor = '#a855f7';
    secondaryGrid = 'rgba(236, 72, 153, 0.4)';
  }

  // Draw Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, bgGrad1);
  bg.addColorStop(0.5, bgGrad2);
  bg.addColorStop(1, bgGrad3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Moving Speed Offset
  const rawSpeed = t * (0.6 + rng() * 0.8);
  const animNorm =
    moveDirection === 1
      ? 1 - (rawSpeed % 1)
      : moveDirection === 2
      ? rawSpeed * 1.5
      : rawSpeed % 1;

  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = lineThickness;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8 + rng() * 10;

  if (orientation === 0 || orientation === 3) {
    // Floor Grid
    const horizonY = orientation === 3 ? h * 0.5 : h * 0.52;
    const vpX = w * 0.5;

    for (let i = -gridDensity; i <= gridDensity; i++) {
      const bottomX = vpX + i * (w / (gridDensity * 0.65));
      ctx.beginPath();
      ctx.moveTo(vpX, horizonY);
      for (let step = 0; step <= 10; step++) {
        const norm = step / 10;
        const curY = horizonY + norm * norm * (h - horizonY);
        const curX = vpX + (bottomX - vpX) * norm + Math.sin(norm * 5 + t * 2) * curveAmp;
        if (step === 0) ctx.moveTo(curX, curY);
        else ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }

    const horizLines = 10;
    for (let i = 0; i < horizLines; i++) {
      const norm = (i + animNorm) / horizLines;
      const y = horizonY + norm * norm * (h - horizonY);
      ctx.globalAlpha = Math.min(1, norm * 1.6);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  if (orientation === 1 || orientation === 3) {
    // Ceiling Grid
    const horizonY = orientation === 3 ? h * 0.5 : h * 0.48;
    const vpX = w * 0.5;
    ctx.strokeStyle = secondaryGrid;

    for (let i = -gridDensity; i <= gridDensity; i++) {
      const topX = vpX + i * (w / (gridDensity * 0.65));
      ctx.beginPath();
      ctx.moveTo(vpX, horizonY);
      for (let step = 0; step <= 10; step++) {
        const norm = step / 10;
        const curY = horizonY - norm * norm * horizonY;
        const curX = vpX + (topX - vpX) * norm + Math.sin(norm * 5 + t * 2) * curveAmp;
        if (step === 0) ctx.moveTo(curX, curY);
        else ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }

    const horizLines = 10;
    for (let i = 0; i < horizLines; i++) {
      const norm = (i + animNorm) / horizLines;
      const y = horizonY - norm * norm * horizonY;
      ctx.globalAlpha = Math.min(1, norm * 1.6);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  if (orientation === 2) {
    // Side Wall Grid (Left/Right)
    const vpY = h * 0.5;
    const vpX = w * 0.2;
    for (let i = -gridDensity; i <= gridDensity; i++) {
      const edgeY = vpY + i * (h / (gridDensity * 0.6));
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(w, edgeY);
      ctx.stroke();
    }

    for (let i = 0; i < 12; i++) {
      const norm = (i + animNorm) / 12;
      const x = vpX + norm * norm * (w - vpX);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Digital Rain / Byte Particles
  const pCount = 30 + Math.floor(rng() * 25);
  for (let i = 0; i < pCount; i++) {
    const px = (rng() * w + Math.sin(t * 1.2 + i) * 30 + w) % w;
    const py = (rng() * h + t * (50 + rng() * 80) + i * 30) % h;
    const pSize = 1.5 + rng() * 2.8;

    ctx.fillStyle = i % 2 === 0 ? glowColor : '#ffffff';
    ctx.globalAlpha = 0.35 + 0.65 * Math.sin(t * 3.5 + i);
    ctx.fillRect(px, py, pSize, pSize * (2 + rng() * 3));
  }
  ctx.globalAlpha = 1.0;

  // Glowing Cyber Sun / Horizon Core
  const sunCenterY = h * (orientation === 1 ? 0.48 : orientation === 3 ? 0.5 : 0.52);
  const sunGrad = ctx.createRadialGradient(w * 0.5, sunCenterY, 5, w * 0.5, sunCenterY, w * 0.38);
  sunGrad.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
  sunGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.18)');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(w * 0.5, sunCenterY, w * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= 3. EMBER & ENERGY ================= */
function drawEmber(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Wide range upper gradient palette: Charcoal, Ruby, Violet Plasma, Steel Dark Blue
  const topBgType = Math.floor(rng() * 5);
  let topColor = '#090302';
  let midColor = '#200505';
  let botColor = '#450a0a';
  let flameColor1 = '#f59e0b';
  let flameColor2 = '#ef4444';

  if (topBgType === 1) {
    // Deep Violet / Purple Plasma
    topColor = '#180828';
    midColor = '#2e1065';
    botColor = '#581c87';
    flameColor1 = '#ec4899';
    flameColor2 = '#f43f5e';
  } else if (topBgType === 2) {
    // Steel Blue & Electric Fire
    topColor = '#050d1a';
    midColor = '#0c4a6e';
    botColor = '#1e1b4b';
    flameColor1 = '#38bdf8';
    flameColor2 = '#f59e0b';
  } else if (topBgType === 3) {
    // Ruby & Crimson Inferno
    topColor = '#1e050f';
    midColor = '#4c0519';
    botColor = '#881337';
    flameColor1 = '#fb7185';
    flameColor2 = '#f97316';
  } else if (topBgType === 4) {
    // Toxic Electric Amber
    topColor = '#0c0a09';
    midColor = '#292524';
    botColor = '#78350f';
    flameColor1 = '#facc15';
    flameColor2 = '#ea580c';
  }

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, topColor);
  bg.addColorStop(0.55, midColor);
  bg.addColorStop(1, botColor);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Bottom explosive flashing flames reaching variable heights!
  const flameHeightBase = h * (0.22 + rng() * 0.28);
  const flameTongues = 8;
  ctx.save();
  for (let k = 0; k < flameTongues; k++) {
    const fx = (k / flameTongues) * w + (w / flameTongues) * 0.5;
    const fHeight = flameHeightBase * (0.7 + 0.6 * Math.sin(t * (3.0 + (k % 4)) + k * 1.5));

    const fGrad = ctx.createRadialGradient(fx, h, 10, fx, h - fHeight * 0.5, fHeight);
    fGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    fGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.35)');
    fGrad.addColorStop(0.8, 'rgba(239, 68, 68, 0.15)');
    fGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.arc(fx, h, fHeight, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Swirling Embers with Flow Patterns (Vortex, Jet Streams, Wind Storm, Eruption)
  const flowPattern = Math.floor(rng() * 4);
  const emberCount = 45 + Math.floor(rng() * 75); // Density variance
  const jetCount = 2 + Math.floor(rng() * 3);

  for (let i = 0; i < emberCount; i++) {
    const speed = 55 + rng() * 95;
    const initialX = rng() * w;
    const y = (h - ((t * speed + i * 32) % (h + 60))) + 20;

    let x = initialX;
    if (flowPattern === 0) {
      // Swirling Tornado Vortex
      const vortexCenter = w * 0.5;
      const radius = (initialX - vortexCenter) * 0.8;
      const angle = t * 2.5 + (y / h) * 6;
      x = vortexCenter + Math.cos(angle) * Math.abs(radius);
    } else if (flowPattern === 1) {
      // Multi-Stream Flame Jets
      const targetJetX = ((i % jetCount) + 0.5) * (w / jetCount);
      const sway = Math.sin(t * 3.0 + i) * 35;
      x = targetJetX + (initialX - targetJetX) * 0.3 + sway;
    } else if (flowPattern === 2) {
      // High Turbulence Wind Storm
      const windPush = (1 - y / h) * w * 0.4;
      x = (initialX + windPush + Math.sin(t * 2.5 + i) * 30 + w) % w;
    } else {
      // Erupting Fountain
      const spread = (1 - y / h) * (w * 0.45);
      const dir = i % 2 === 0 ? 1 : -1;
      x = w * 0.5 + dir * spread * (0.3 + rng() * 0.7) + Math.sin(t * 2 + i) * 20;
    }

    const size = 1.2 + rng() * 3.8;
    const alpha = Math.sin((y / h) * Math.PI) * (0.7 + 0.3 * Math.sin(t * 4 + i));
    if (alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha = Math.max(0.12, alpha);
    ctx.shadowColor = flameColor1;
    ctx.shadowBlur = size * 4;
    ctx.fillStyle =
      i % 4 === 0 ? '#ffffff' : i % 3 === 0 ? '#fef08a' : i % 2 === 0 ? flameColor1 : flameColor2;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ================= 4. NATURE & SAKURA & AURORA ================= */
function drawNature(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Soft, non-toxic, atmospheric color palettes
  const natureTheme = Math.floor(rng() * 5);
  let bgGrad1 = '#0f172a';
  let bgGrad2 = '#1e1b4b';
  let bgGrad3 = '#312e81';
  let auroraCol1 = 'rgba(52, 211, 153, 0.22)';
  let auroraCol2 = 'rgba(244, 63, 94, 0.18)';
  let petalCol1 = 'rgba(251, 113, 133, 0.85)';
  let petalCol2 = 'rgba(244, 114, 182, 0.75)';

  if (natureTheme === 1) {
    // Lavender Evening & Rose Dusk
    bgGrad1 = '#180828';
    bgGrad2 = '#2e1065';
    bgGrad3 = '#4c1d95';
    auroraCol1 = 'rgba(168, 85, 247, 0.22)';
    auroraCol2 = 'rgba(251, 113, 133, 0.18)';
    petalCol1 = 'rgba(244, 114, 182, 0.85)';
    petalCol2 = 'rgba(192, 132, 252, 0.75)';
  } else if (natureTheme === 2) {
    // Misty Jade & Forest Dawn
    bgGrad1 = '#022c22';
    bgGrad2 = '#064e3b';
    bgGrad3 = '#0f766e';
    auroraCol1 = 'rgba(45, 212, 191, 0.25)';
    auroraCol2 = 'rgba(56, 189, 248, 0.18)';
    petalCol1 = 'rgba(254, 205, 211, 0.85)';
    petalCol2 = 'rgba(253, 164, 175, 0.75)';
  } else if (natureTheme === 3) {
    // Warm Peach Sunset & Golden Dusk
    bgGrad1 = '#2a0d0a';
    bgGrad2 = '#431407';
    bgGrad3 = '#7c2d12';
    auroraCol1 = 'rgba(251, 146, 60, 0.22)';
    auroraCol2 = 'rgba(244, 63, 94, 0.16)';
    petalCol1 = 'rgba(254, 215, 170, 0.85)';
    petalCol2 = 'rgba(251, 113, 133, 0.75)';
  } else if (natureTheme === 4) {
    // Deep Ocean Night & Emerald Aurora
    bgGrad1 = '#031818';
    bgGrad2 = '#064e3b';
    bgGrad3 = '#0284c7';
    auroraCol1 = 'rgba(52, 211, 153, 0.25)';
    auroraCol2 = 'rgba(6, 182, 212, 0.2)';
    petalCol1 = 'rgba(255, 255, 255, 0.85)';
    petalCol2 = 'rgba(244, 114, 182, 0.7)';
  }

  // Draw smooth background gradient
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, bgGrad1);
  bg.addColorStop(0.5, bgGrad2);
  bg.addColorStop(1, bgGrad3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Flowing Aurora Waves
  ctx.save();
  const waveCount = 3;
  for (let wave = 0; wave < waveCount; wave++) {
    ctx.beginPath();
    ctx.moveTo(0, h * 0.18 + wave * 65);
    for (let x = 0; x <= w; x += 15) {
      const y =
        h * (0.18 + wave * 0.12) +
        Math.sin(x * 0.003 + t * 0.8 + wave) * 50 +
        Math.cos(x * 0.006 - t * 0.6 + wave) * 30;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    const aGrad = ctx.createLinearGradient(0, 0, 0, h);
    aGrad.addColorStop(0, wave % 2 === 0 ? auroraCol1 : auroraCol2);
    aGrad.addColorStop(0.5, 'transparent');
    aGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = aGrad;
    ctx.fill();
  }
  ctx.restore();

  // Floating Sakura Petals & Wind Vortex Swirls
  const petalCount = 45 + Math.floor(rng() * 30);
  const windVortexType = Math.floor(rng() * 3); // 0: Gentle Drift, 1: Spiral Swirl, 2: Gusty Crosswind

  for (let i = 0; i < petalCount; i++) {
    const pSpeed = 20 + rng() * 45;
    const initialX = rng() * w;
    const y = ((t * pSpeed + i * 40) % (h + 60)) - 30;

    let x = initialX;
    if (windVortexType === 1) {
      // Spiral Swirl
      const swirlFreq = 1.0 + rng() * 1.5;
      x = initialX + Math.sin(t * swirlFreq + (y / h) * 5 + i) * 65;
    } else if (windVortexType === 2) {
      // Gusty Crosswind
      const gust = Math.sin(t * 0.7 + i * 0.5) * 45 + (y / h) * w * 0.25;
      x = (initialX + gust + w) % w;
    } else {
      // Gentle Breeze
      x = initialX + Math.sin(t * 1.2 + i) * 35;
    }

    const rot = t * (1.2 + rng()) + i;
    const scale = 0.6 + rng() * 0.9;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);

    ctx.fillStyle = i % 2 === 0 ? petalCol1 : petalCol2;
    ctx.shadowColor = petalCol1;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Soft breathing golden fireflies
  const fireflyCount = 20;
  for (let f = 0; f < fireflyCount; f++) {
    const fx = (rng() * w + Math.sin(t * 0.8 + f * 2) * 40 + w) % w;
    const fy = (rng() * h + Math.cos(t * 0.7 + f * 3) * 40 + h) % h;
    const pulse = 0.3 + 0.7 * Math.sin(t * 2.5 + f * 1.5);

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ================= 5. GOLD LUXURY & BOKEH ================= */
function drawGold(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Rich golden dark brown gradient
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.1, w * 0.5, h * 0.5, w * 0.8);
  bg.addColorStop(0, '#451a03');
  bg.addColorStop(0.5, '#1e1005');
  bg.addColorStop(1, '#090502');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Soft Gold Bokeh Circles
  const bokehCount = 22;
  for (let i = 0; i < bokehCount; i++) {
    const bx = w * (0.1 + rng() * 0.8) + Math.sin(t * 0.4 + i) * 30;
    const by = h * (0.1 + rng() * 0.8) + Math.cos(t * 0.3 + i * 2) * 30;
    const bRad = w * (0.08 + rng() * 0.15);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + i);

    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, bRad);
    grad.addColorStop(0, `rgba(250, 204, 21, ${0.2 * pulse})`);
    grad.addColorStop(0.6, `rgba(217, 119, 6, ${0.08 * pulse})`);
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, bRad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sparkling Gold Diamond Dust
  const dustCount = 50;
  for (let i = 0; i < dustCount; i++) {
    const dx = rng() * w;
    const dy = (h - ((t * (20 + rng() * 30) + i * 30) % h));
    const dSize = 1.0 + rng() * 2.5;
    const twinkle = 0.3 + 0.7 * Math.sin(t * 3 + i * 2);

    ctx.save();
    ctx.globalAlpha = Math.max(0.1, twinkle);
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = dSize * 4;
    ctx.fillStyle = '#fef08a';

    ctx.beginPath();
    ctx.arc(dx, dy, dSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/* ================= 6. FLUID AURA ================= */
function drawFluid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Rich diverse color palettes for fluid & background
  const fluidTheme = Math.floor(rng() * 5);
  let bgBase = '#0f0728';
  let blobColors = [
    'rgba(168, 85, 247, 0.45)',
    'rgba(6, 182, 212, 0.4)',
    'rgba(236, 72, 153, 0.38)',
    'rgba(99, 102, 241, 0.4)',
    'rgba(250, 204, 21, 0.3)',
  ];

  if (fluidTheme === 1) {
    // Sunset Amber & Magenta
    bgBase = '#1a0614';
    blobColors = [
      'rgba(244, 63, 94, 0.45)',
      'rgba(249, 115, 22, 0.4)',
      'rgba(250, 204, 21, 0.35)',
      'rgba(168, 85, 247, 0.4)',
      'rgba(236, 72, 153, 0.35)',
    ];
  } else if (fluidTheme === 2) {
    // Electric Lime & Oceanic Teal
    bgBase = '#021e1e';
    blobColors = [
      'rgba(34, 197, 94, 0.42)',
      'rgba(6, 182, 212, 0.45)',
      'rgba(56, 189, 248, 0.38)',
      'rgba(163, 230, 53, 0.35)',
      'rgba(14, 165, 233, 0.4)',
    ];
  } else if (fluidTheme === 3) {
    // Royal Indigo & Deep Crimson
    bgBase = '#08051a';
    blobColors = [
      'rgba(99, 102, 241, 0.45)',
      'rgba(225, 29, 72, 0.4)',
      'rgba(168, 85, 247, 0.38)',
      'rgba(59, 130, 246, 0.42)',
      'rgba(244, 63, 94, 0.35)',
    ];
  } else if (fluidTheme === 4) {
    // Toxic Acid Violet & Cyan
    bgBase = '#0a0a14';
    blobColors = [
      'rgba(192, 132, 252, 0.5)',
      'rgba(34, 211, 238, 0.45)',
      'rgba(244, 114, 182, 0.4)',
      'rgba(129, 140, 248, 0.42)',
      'rgba(251, 146, 60, 0.32)',
    ];
  }

  // Fill background
  ctx.fillStyle = bgBase;
  ctx.fillRect(0, 0, w, h);

  // Fluid Lava Blobs with extreme size variation (from micro droplets to gigantic sweeping ambient auras)
  const blobCount = 6 + Math.floor(rng() * 4);

  for (let i = 0; i < blobCount; i++) {
    const isGiant = i === 0 || i === 1; // 2 gigantic ambient color zones
    const isMicro = i >= blobCount - 2; // micro droplets

    let baseRadius = w * 0.3;
    if (isGiant) {
      baseRadius = w * (0.65 + rng() * 0.35); // Gigantic up to w * 1.0!
    } else if (isMicro) {
      baseRadius = w * (0.06 + rng() * 0.08); // Micro droplets
    } else {
      baseRadius = w * (0.2 + rng() * 0.25);
    }

    const orbitSpeed = (0.2 + rng() * 0.35) * (i % 2 === 0 ? 1 : -1);
    const cx = w * (0.5 + Math.sin(t * orbitSpeed + i * 1.6) * 0.38);
    const cy = h * (0.5 + Math.cos(t * (orbitSpeed * 0.85) + i * 1.3) * 0.38);
    const radius = baseRadius * (0.85 + 0.25 * Math.sin(t * 0.5 + i));

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const mainCol = blobColors[i % blobColors.length];
    const secCol = blobColors[(i + 1) % blobColors.length];

    grad.addColorStop(0, mainCol);
    grad.addColorStop(0.65, secCol.replace(/[\d\.]+\)$/, '0.12)'));
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ================= 7. SPECTRUM & EQUALIZERS ================= */
function drawEqualizer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // 12 Distinct Equalizer Layouts and Morphologies!
  const layoutType = Math.floor(rng() * 12);
  const colorMode = Math.floor(rng() * 5); // 5 Color Palettes

  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  let neon1 = '#ec4899';
  let neon2 = '#a855f7';
  let neon3 = '#06b6d4';

  if (colorMode === 0) {
    // Cyber Synthwave
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#3b0764');
  } else if (colorMode === 1) {
    // Electric Ultra Cyan
    bgGrad.addColorStop(0, '#090514');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#082f49');
    neon1 = '#38bdf8';
    neon2 = '#818cf8';
    neon3 = '#c084fc';
  } else if (colorMode === 2) {
    // Matrix Emerald Bass
    bgGrad.addColorStop(0, '#022c22');
    bgGrad.addColorStop(0.5, '#064e3b');
    bgGrad.addColorStop(1, '#020617');
    neon1 = '#22c55e';
    neon2 = '#10b981';
    neon3 = '#a3e635';
  } else if (colorMode === 3) {
    // Deep Crimson Fire Bass
    bgGrad.addColorStop(0, '#450a0a');
    bgGrad.addColorStop(0.5, '#18020a');
    bgGrad.addColorStop(1, '#09090b');
    neon1 = '#ef4444';
    neon2 = '#f97316';
    neon3 = '#facc15';
  } else {
    // Hyper Acid Violet
    bgGrad.addColorStop(0, '#1e1b4b');
    bgGrad.addColorStop(0.5, '#4c1d95');
    bgGrad.addColorStop(1, '#0f172a');
    neon1 = '#facc15';
    neon2 = '#ec4899';
    neon3 = '#3b82f6';
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Background central aura glow
  const aura = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.65);
  aura.addColorStop(0, 'rgba(168, 85, 247, 0.28)');
  aura.addColorStop(0.6, 'rgba(6, 182, 212, 0.12)');
  aura.addColorStop(1, 'transparent');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, w, h);

  if (layoutType === 0) {
    // 0: Bottom classic spectrum bars (thickness varies from micro to huge)
    const barCount = 18 + Math.floor(rng() * 40);
    const padding = 3 + rng() * 4;
    const barWidth = (w - (barCount + 1) * padding) / barCount;
    const maxH = h * (0.35 + rng() * 0.25);

    for (let i = 0; i < barCount; i++) {
      const x = padding + i * (barWidth + padding);
      const freq = 1.8 + (i % 6) * 0.35 + rng() * 0.4;
      const heightVal =
        (Math.abs(Math.sin(t * freq + i * 0.3)) * 0.7 +
          Math.abs(Math.cos(t * 2.5 + i * 0.2)) * 0.3) *
        maxH;
      const y = h - heightVal - 20;

      ctx.save();
      const bGrad = ctx.createLinearGradient(x, h, x, y);
      bGrad.addColorStop(0, neon1);
      bGrad.addColorStop(0.5, neon2);
      bGrad.addColorStop(1, neon3);
      ctx.fillStyle = bGrad;
      ctx.shadowColor = neon2;
      ctx.shadowBlur = 12;
      ctx.fillRect(x, y, barWidth, heightVal);

      // Peak floating dot
      const peakY = y - 8 - Math.abs(Math.sin(t * 3.5 + i)) * 10;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, peakY, barWidth, 3.5);
      ctx.restore();
    }
  } else if (layoutType === 1) {
    // 1: Top hanging chandelier spectrum bars
    const barCount = 20 + Math.floor(rng() * 32);
    const padding = 4;
    const barWidth = (w - (barCount + 1) * padding) / barCount;
    const maxH = h * 0.42;

    for (let i = 0; i < barCount; i++) {
      const x = padding + i * (barWidth + padding);
      const heightVal =
        (Math.abs(Math.sin(t * 2.2 + i * 0.35)) * 0.7 +
          Math.abs(Math.cos(t * 1.8 + i * 0.2)) * 0.3) *
        maxH;

      ctx.save();
      const bGrad = ctx.createLinearGradient(x, 0, x, heightVal);
      bGrad.addColorStop(0, neon3);
      bGrad.addColorStop(0.6, neon2);
      bGrad.addColorStop(1, neon1);
      ctx.fillStyle = bGrad;
      ctx.shadowColor = neon3;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, 0, barWidth, heightVal);
      ctx.restore();
    }
  } else if (layoutType === 2) {
    // 2: Radial Ring Equalizer
    const cx = w * 0.5;
    const cy = h * 0.5;
    const baseRadius = Math.min(w, h) * (0.18 + rng() * 0.1);
    const rayCount = 36 + Math.floor(rng() * 36);

    ctx.save();
    ctx.shadowColor = neon3;
    ctx.shadowBlur = 15;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + t * 0.25;
      const rayLen =
        (Math.abs(Math.sin(t * 3.0 + i * 0.4)) * 0.7 +
          Math.abs(Math.cos(t * 2.0 + i * 0.2)) * 0.3) *
        (baseRadius * 0.95);

      const x1 = cx + Math.cos(angle) * baseRadius;
      const y1 = cy + Math.sin(angle) * baseRadius;
      const x2 = cx + Math.cos(angle) * (baseRadius + rayLen);
      const y2 = cy + Math.sin(angle) * (baseRadius + rayLen);

      const strokeGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      strokeGrad.addColorStop(0, neon3);
      strokeGrad.addColorStop(1, neon1);

      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = 3 + rng() * 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (layoutType === 3) {
    // 3: Mirrored Dual Horizon Waveform
    const barCount = 28 + Math.floor(rng() * 20);
    const barWidth = w / barCount;
    const centerY = h * 0.5;

    for (let i = 0; i < barCount; i++) {
      const x = i * barWidth;
      const amp =
        (Math.abs(Math.sin(t * 3.2 + i * 0.25)) * 0.65 +
          Math.abs(Math.sin(t * 1.8 + i * 0.4)) * 0.35) *
        (h * 0.32);

      ctx.save();
      const waveGrad = ctx.createLinearGradient(x, centerY - amp, x, centerY + amp);
      waveGrad.addColorStop(0, neon1);
      waveGrad.addColorStop(0.5, neon2);
      waveGrad.addColorStop(1, neon3);

      ctx.fillStyle = waveGrad;
      ctx.fillRect(x + 2, centerY - amp, barWidth - 4, amp * 2);
      ctx.restore();
    }
  } else if (layoutType === 4) {
    // 4: Stereo Sidebars Equalizers (Left and Right)
    const barCount = 20;
    const barH = (h * 0.7) / barCount;
    const startY = h * 0.15;
    const maxBarW = w * 0.35;

    for (let i = 0; i < barCount; i++) {
      const y = startY + i * barH;
      const curW =
        (Math.abs(Math.sin(t * 2.8 + i * 0.4)) * 0.7 +
          Math.abs(Math.cos(t * 1.6 + i * 0.25)) * 0.3) *
        maxBarW;

      ctx.save();
      ctx.fillStyle = neon1;
      ctx.shadowColor = neon1;
      ctx.shadowBlur = 10;
      // Left bar
      ctx.fillRect(0, y + 2, curW, barH - 4);
      // Right bar
      ctx.fillStyle = neon3;
      ctx.shadowColor = neon3;
      ctx.fillRect(w - curW, y + 2, curW, barH - 4);
      ctx.restore();
    }
  } else if (layoutType === 5) {
    // 5: Multi-layer Neon Liquid Sine Waves
    const waveLayers = 4;
    for (let l = 0; l < waveLayers; l++) {
      ctx.save();
      ctx.beginPath();
      const centerY = h * (0.45 + l * 0.08);
      ctx.moveTo(0, centerY);

      for (let x = 0; x <= w; x += 10) {
        const y =
          centerY +
          Math.sin(x * 0.008 + t * (2 + l * 0.5) + l) * (35 + l * 15) +
          Math.cos(x * 0.015 - t * 1.5) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, centerY - 50, 0, h);
      waveGrad.addColorStop(0, l % 2 === 0 ? neon1 : neon3);
      waveGrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = waveGrad;
      ctx.fill();

      // Sharp wave border
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = l % 2 === 0 ? neon1 : neon2;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  } else if (layoutType === 6) {
    // 6: Circular Starburst Audio Core (360-degree rays from center)
    const cx = w * 0.5;
    const cy = h * 0.5;
    const rayCount = 64;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayLen =
        Math.min(w, h) *
        (0.15 +
          0.3 *
            (Math.abs(Math.sin(t * 4.0 + i * 0.5)) * 0.7 +
              Math.abs(Math.cos(t * 2.0 + i * 0.2)) * 0.3));

      ctx.save();
      ctx.strokeStyle = i % 2 === 0 ? neon1 : neon3;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen);
      ctx.stroke();
      ctx.restore();
    }
  } else if (layoutType === 7) {
    // 7: Matrix Dots Grid VU-Meter
    const cols = 20;
    const rows = 16;
    const dotW = w / (cols + 2);
    const dotH = (h * 0.55) / rows;
    const startY = h * 0.25;

    for (let c = 0; c < cols; c++) {
      const activeRows = Math.floor(
        (Math.abs(Math.sin(t * 3.0 + c * 0.3)) * 0.7 +
          Math.abs(Math.cos(t * 1.8 + c * 0.5)) * 0.3) *
          rows
      );

      for (let r = 0; r < rows; r++) {
        const rx = (c + 1) * dotW;
        const ry = startY + (rows - 1 - r) * dotH;
        const isActive = r <= activeRows;

        ctx.save();
        ctx.fillStyle = isActive
          ? r > rows * 0.8
            ? neon1
            : r > rows * 0.5
            ? neon2
            : neon3
          : 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(rx + dotW * 0.5, ry + dotH * 0.5, Math.min(dotW, dotH) * 0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  } else if (layoutType === 8) {
    // 8: Diagonal Futuristic Laser Bars
    const barCount = 18;
    const maxLen = Math.min(w, h) * 0.6;
    for (let i = 0; i < barCount; i++) {
      const cx = (i / barCount) * w;
      const cy = h * 0.5;
      const len =
        (Math.abs(Math.sin(t * 3.2 + i * 0.35)) * 0.7 +
          Math.abs(Math.cos(t * 2.0 + i * 0.2)) * 0.3) *
        maxLen;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = i % 2 === 0 ? neon1 : neon3;
      ctx.shadowColor = neon2;
      ctx.shadowBlur = 12;
      ctx.fillRect(-6, -len * 0.5, 12, len);
      ctx.restore();
    }
  } else if (layoutType === 9) {
    // 9: Hexagonal Pulsing Sound Core
    const cx = w * 0.5;
    const cy = h * 0.5;
    const hexSides = 6;
    for (let layer = 1; layer <= 5; layer++) {
      const radius =
        layer * 40 +
        Math.abs(Math.sin(t * 3.5 + layer)) * 30 +
        Math.abs(Math.cos(t * 2 + layer * 2)) * 15;

      ctx.save();
      ctx.strokeStyle = layer % 2 === 0 ? neon1 : neon3;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = neon2;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      for (let s = 0; s < hexSides; s++) {
        const a = (s / hexSides) * Math.PI * 2 + t * 0.2;
        const hx = cx + Math.cos(a) * radius;
        const hy = cy + Math.sin(a) * radius;
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  } else if (layoutType === 10) {
    // 10: Horizontal Floating Audio Bars (Left to Right)
    const barCount = 16;
    const barHeight = (h * 0.6) / barCount;
    const startY = h * 0.2;

    for (let i = 0; i < barCount; i++) {
      const y = startY + i * barHeight;
      const barLen =
        (Math.abs(Math.sin(t * 3.0 + i * 0.4)) * 0.7 +
          Math.abs(Math.cos(t * 1.5 + i * 0.2)) * 0.3) *
        (w * 0.75);

      ctx.save();
      const bGrad = ctx.createLinearGradient(w * 0.1, y, w * 0.1 + barLen, y);
      bGrad.addColorStop(0, neon3);
      bGrad.addColorStop(0.5, neon2);
      bGrad.addColorStop(1, neon1);
      ctx.fillStyle = bGrad;
      ctx.fillRect(w * 0.1, y + 3, barLen, barHeight - 6);
      ctx.restore();
    }
  } else {
    // 11: Curved Bottom Arch Spectrum (Amphitheater Arch)
    const cx = w * 0.5;
    const cy = h * 0.95;
    const archRadius = Math.min(w, h) * 0.65;
    const rayCount = 38;

    for (let i = 0; i < rayCount; i++) {
      const angle = Math.PI + (i / (rayCount - 1)) * Math.PI; // Semicircle
      const rayLen =
        (Math.abs(Math.sin(t * 3.2 + i * 0.3)) * 0.7 +
          Math.abs(Math.cos(t * 2.0 + i * 0.2)) * 0.3) *
        (archRadius * 0.45);

      const x1 = cx + Math.cos(angle) * (archRadius - rayLen);
      const y1 = cy + Math.sin(angle) * (archRadius - rayLen);
      const x2 = cx + Math.cos(angle) * archRadius;
      const y2 = cy + Math.sin(angle) * archRadius;

      ctx.save();
      ctx.strokeStyle = i % 2 === 0 ? neon1 : neon3;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

/* ================= 8. DYNAMIC GEOMETRY ================= */
function drawShapes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Diverse dynamic background gradient driven by seed
  const bgTheme = Math.floor(rng() * 5);
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  if (bgTheme === 0) {
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e1b4b');
    bgGrad.addColorStop(1, '#31122b');
  } else if (bgTheme === 1) {
    bgGrad.addColorStop(0, '#022c22');
    bgGrad.addColorStop(0.5, '#0f766e');
    bgGrad.addColorStop(1, '#020617');
  } else if (bgTheme === 2) {
    bgGrad.addColorStop(0, '#450a0a');
    bgGrad.addColorStop(0.5, '#581c87');
    bgGrad.addColorStop(1, '#09090b');
  } else if (bgTheme === 3) {
    bgGrad.addColorStop(0, '#180e29');
    bgGrad.addColorStop(0.5, '#0284c7');
    bgGrad.addColorStop(1, '#090a1a');
  } else {
    bgGrad.addColorStop(0, '#1e1005');
    bgGrad.addColorStop(0.5, '#431407');
    bgGrad.addColorStop(1, '#0c0a09');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Generate 35 shapes with extreme size ranges (from micro crystals 10px to gigantic 550px wireframe structures!)
  const shapeCount = 35;
  const colors = ['#f43f5e', '#a855f7', '#38bdf8', '#34d399', '#facc15', '#fb7185', '#c084fc'];

  for (let i = 0; i < shapeCount; i++) {
    const shapeType = Math.floor(rng() * 6); // 0: Circle, 1: Square, 2: Triangle, 3: Ring, 4: Hexagon, 5: Diamond
    const isGiant = i < 4; // 4 gigantic structural shapes crossing the whole screen!
    const isMicro = i > 26; // micro floating particles

    let baseSize = 40;
    if (isGiant) {
      baseSize = 260 + rng() * 260; // 260px to 520px!
    } else if (isMicro) {
      baseSize = 8 + rng() * 18; // 8px to 26px
    } else {
      baseSize = 25 + rng() * 85; // 25px to 110px
    }

    const scalePulse = 0.85 + 0.25 * Math.sin(t * (1 + rng()) + i);
    const size = baseSize * scalePulse;

    const speedX = (rng() - 0.5) * (isGiant ? 15 : 45);
    const speedY = (rng() - 0.5) * (isGiant ? 15 : 45);
    const rotSpeed = (rng() - 0.5) * (isGiant ? 0.6 : 2.0);

    const initialX = rng() * w;
    const initialY = rng() * h;

    const x = (initialX + t * speedX + Math.sin(t * 0.8 + i) * 35 + w * 2) % w;
    const y = (initialY + t * speedY + Math.cos(t * 0.8 + i) * 35 + h * 2) % h;
    const rot = t * rotSpeed + i * 0.6;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    const color = colors[i % colors.length];
    ctx.globalAlpha = isGiant ? 0.12 : isMicro ? 0.4 + 0.4 * Math.sin(t * 3 + i) : 0.7 + 0.3 * Math.sin(t * 2 + i);

    if (isGiant) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
    } else {
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }

    ctx.beginPath();
    if (shapeType === 0) {
      // Circle
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    } else if (shapeType === 1) {
      // Square
      const half = size * 0.5;
      ctx.rect(-half, -half, size, size);
    } else if (shapeType === 2) {
      // Triangle
      const r = size * 0.6;
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
    } else if (shapeType === 3) {
      // Ring
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      if (!isGiant) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4.5;
      }
    } else if (shapeType === 4) {
      // Hexagon
      const r = size * 0.5;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        const hx = Math.cos(a) * r;
        const hy = Math.sin(a) * r;
        if (k === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
    } else {
      // Diamond
      const r = size * 0.5;
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.65, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.65, 0);
      ctx.closePath();
    }

    if (isGiant || shapeType === 3) {
      ctx.stroke();
    } else {
      ctx.fill();
    }

    ctx.restore();
  }
}

/* ================= 9. EMOJI UNIVERSE ================= */
function drawEmojis(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  rng: () => number,
  seed: number
) {
  // Surreal space void / neon dimension background
  const bgTheme = Math.floor(rng() * 5);
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.1, w * 0.5, h * 0.5, w * 0.85);
  if (bgTheme === 0) {
    bgGrad.addColorStop(0, '#2e1065');
    bgGrad.addColorStop(0.5, '#0f0a2a');
    bgGrad.addColorStop(1, '#030210');
  } else if (bgTheme === 1) {
    bgGrad.addColorStop(0, '#500724');
    bgGrad.addColorStop(0.5, '#18020a');
    bgGrad.addColorStop(1, '#09090b');
  } else if (bgTheme === 2) {
    bgGrad.addColorStop(0, '#022c22');
    bgGrad.addColorStop(0.5, '#064e3b');
    bgGrad.addColorStop(1, '#020617');
  } else if (bgTheme === 3) {
    bgGrad.addColorStop(0, '#1e1b4b');
    bgGrad.addColorStop(0.5, '#090d16');
    bgGrad.addColorStop(1, '#030712');
  } else {
    bgGrad.addColorStop(0, '#31122b');
    bgGrad.addColorStop(0.5, '#1e1005');
    bgGrad.addColorStop(1, '#050208');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Expanded rich emoji pool
  const fullEmojiLibrary = [
    '🤩', '🚀', '💎', '🦄', '⚡', '🔮', '🌟', '🍕', '🎭',
    '👾', '🪐', '🔥', '🌈', '🥳', '👽', '🎨', '💥', '🎈',
    '💖', '🍀', '🏆', '🎯', '🎸', '🍿', '🍦', '🍩', '🥑',
    '🦊', '🐱', '🦋', '😎', '🛸', '👑', '🎉', '🌊', '⚡',
    '🧸', '🌮', '🍭', '🌸', '✨', '🪐', '🤖', '🍒', '🌻'
  ];

  // Pick 12 distinct emojis for this seed universe
  const chosenEmojis: string[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = Math.floor(rng() * fullEmojiLibrary.length);
    chosenEmojis.push(fullEmojiLibrary[idx]);
  }

  // Render 32 emojis ranging from GIANT background objects (380px) to micro dust (16px)
  const count = 32;
  for (let i = 0; i < count; i++) {
    const emoji = chosenEmojis[i % chosenEmojis.length];
    const isGiant = i < 3; // 3 giant background floating emojis
    const isMicro = i > 24; // micro dust emojis

    let baseFontSize = 48;
    if (isGiant) {
      baseFontSize = 240 + rng() * 160; // 240px to 400px!
    } else if (isMicro) {
      baseFontSize = 14 + rng() * 16; // 14px to 30px
    } else {
      baseFontSize = 38 + rng() * 65; // 38px to 103px
    }

    const scalePulse = 0.9 + 0.2 * Math.sin(t * 1.5 + i);
    const fontSize = baseFontSize * scalePulse;

    const speedY = isGiant ? -12 - rng() * 10 : isMicro ? -45 - rng() * 30 : -25 - rng() * 40;
    const swayAmp = isGiant ? 15 : 30 + rng() * 25;
    const swayFreq = 0.8 + rng() * 1.2;

    const initialX = rng() * w;
    const initialY = rng() * h;

    const y = (initialY + t * speedY + h * 2) % (h + fontSize * 2) - fontSize;
    const x = initialX + Math.sin(t * swayFreq + i * 2) * swayAmp;
    const rot = (Math.sin(t * 0.8 + i) * 0.25) + (isGiant ? 0 : t * 0.3);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.globalAlpha = isGiant ? 0.16 : isMicro ? 0.4 + 0.4 * Math.sin(t * 3 + i) : 0.85 + 0.15 * Math.sin(t * 2 + i);
    if (!isGiant) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = isMicro ? 4 : 15;
    }

    ctx.font = `${Math.floor(fontSize)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);

    ctx.restore();
  }
}
