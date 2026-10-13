// Seeded Prussian-blue wash variation — organic faded patches + faint paper grain.
// Used only on the finished print (rinse / reveal / save), not on arrange.

const CYANOTYPE_BASE_HEX = '#2E5483';
const BASE_RGB = [46, 84, 131];
const GRAIN_TILE = 192;

const cyanotypeRand = (seed) => {
  let s = seed >>> 0;
  return (n = 0) => {
    s = (Math.imul(s ^ (n + 1), 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const hash2 = (ix, iy, seed) => {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return h / 4294967296;
};

const fadeSmooth = (t) => t * t * (3 - 2 * t);

const valueNoise2D = (x, y, seed) => {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fadeSmooth(x - x0);
  const fy = fadeSmooth(y - y0);
  const v00 = hash2(x0, y0, seed);
  const v10 = hash2(x0 + 1, y0, seed);
  const v01 = hash2(x0, y0 + 1, seed);
  const v11 = hash2(x0 + 1, y0 + 1, seed);
  return v00 + (v10 - v00) * fx + ((v01 + (v11 - v01) * fx) - (v00 + (v10 - v00) * fx)) * fy;
};

const fbm2 = (x, y, seed, octaves = 4) => {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let o = 0; o < octaves; o++) {
    v += valueNoise2D(x * freq, y * freq, (seed + o * 101) >>> 0) * amp;
    sum += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return v / sum;
};

const deriveCyanotypePaperSeed = (items, sessionSeed = 0) => {
  let h = (sessionSeed >>> 0) || 1;
  const mix = (v) => {
    h ^= v;
    h = Math.imul(h, 16777619) >>> 0;
  };
  if (!items || items.length === 0) {
    mix(0x9e3779b9);
    return h >>> 0;
  }
  for (const it of items) {
    const kind = it.kind || '';
    for (let i = 0; i < kind.length; i++) mix((kind.charCodeAt(i) << 8) | i);
    mix(Math.round(it.x * 47) | 0);
    mix(Math.round(it.y * 83) | 0);
    mix(Math.round(it.rotation * 11) | 0);
    mix(Math.round((it.scale || 1) * 1000) | 0);
  }
  return h >>> 0;
};

const drawFadedBlueField = (ctx, cw, ch, seed) => {
  const sw = Math.max(1, Math.floor(cw / 2));
  const sh = Math.max(1, Math.floor(ch / 2));
  const tmp = document.createElement('canvas');
  tmp.width = sw;
  tmp.height = sh;
  const tctx = tmp.getContext('2d');
  const img = tctx.createImageData(sw, sh);
  const data = img.data;
  const [br, bg, bb] = BASE_RGB;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const n = fbm2((x / sw) * 4.4, (y / sh) * 5.6, seed, 4);
      const n2 = fbm2((x / sw) * 8.1 + 2.2, (y / sh) * 7.3 + 1.4, (seed ^ 0x9e3779b9) >>> 0, 3);
      let fade = Math.max(0, (n - 0.4) / 0.6);
      fade = fade * fade;
      const veil = Math.max(0, (n2 - 0.52) / 0.48);
      const amount = Math.min(1, fade * 0.85 + veil * 0.45);
      const i = (y * sw + x) * 4;
      data[i] = Math.min(255, br + 38);
      data[i + 1] = Math.min(255, bg + 30);
      data[i + 2] = Math.min(255, bb + 18);
      data[i + 3] = Math.round(amount * 82);
    }
  }
  tctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tmp, 0, 0, cw, ch);
};

const drawOrganicBlueSpots = (ctx, cw, ch, seed) => {
  const [br, bg, bb] = BASE_RGB;
  const rand = cyanotypeRand(seed);

  drawFadedBlueField(ctx, cw, ch, seed);

  const span = Math.min(cw, ch);
  const blobCount = 6 + Math.floor(rand(1) * 6);
  for (let i = 0; i < blobCount; i++) {
    const cx = rand(10 + i) * cw;
    const cy = rand(20 + i) * ch;
    const r = (0.16 + rand(30 + i) * 0.38) * span;
    const alpha = 0.08 + rand(50 + i) * 0.14;
    const lift = 18 + rand(55 + i) * 22;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${br + lift}, ${bg + lift - 4}, ${bb + lift - 8}, ${alpha})`);
    g.addColorStop(0.5, `rgba(${br + lift * 0.4}, ${bg + lift * 0.35}, ${bb + lift * 0.28}, ${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }

  const darkCount = 2 + Math.floor(rand(4) * 3);
  for (let i = 0; i < darkCount; i++) {
    const cx = rand(70 + i) * cw;
    const cy = rand(80 + i) * ch;
    const r = (0.12 + rand(90 + i) * 0.22) * span;
    const alpha = 0.04 + rand(100 + i) * 0.06;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${Math.round(br * 0.82)}, ${Math.round(bg * 0.78)}, ${Math.round(bb * 0.84)}, ${alpha})`);
    g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }
};

const drawCyanotypePaperVariation = (ctx, cw, ch, seed, { spotsOnly = false } = {}) => {
  if (spotsOnly) {
    ctx.clearRect(0, 0, cw, ch);
  } else {
    ctx.fillStyle = CYANOTYPE_BASE_HEX;
    ctx.fillRect(0, 0, cw, ch);
  }

  drawOrganicBlueSpots(ctx, cw, ch, seed);

  if (!spotsOnly) {
    drawCyanotypePaperGrain(ctx, cw, ch, seed, { tiled: false, opacity: 0.11, blend: 'overlay' });
  }
};

const drawCyanotypePaperGrain = (ctx, cw, ch, seed, {
  tiled = true,
  opacity = 0.16,
  blend = 'multiply',
} = {}) => {
  const tile = document.createElement('canvas');
  tile.width = GRAIN_TILE;
  tile.height = GRAIN_TILE;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(GRAIN_TILE, GRAIN_TILE);
  const data = img.data;
  const grainSeed = (seed ^ 0x85ebca6b) >>> 0;
  for (let y = 0; y < GRAIN_TILE; y++) {
    for (let x = 0; x < GRAIN_TILE; x++) {
      const n = hash2(x, y, grainSeed);
      const n2 = hash2(x + 17, y * 3, grainSeed ^ 0xc2b2ae35);
      const v = 168 + (n - 0.5) * 52 + (n2 - 0.5) * 18;
      const i = (y * GRAIN_TILE + x) * 4;
      data[i] = v;
      data[i + 1] = v - 2;
      data[i + 2] = v - 6;
      data[i + 3] = 255;
    }
  }
  tctx.putImageData(img, 0, 0);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = blend;
  if (tiled) {
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, cw, ch);
  } else {
    ctx.drawImage(tile, 0, 0, cw, ch);
  }
  ctx.restore();
};

const variationUrlCache = new Map();
const buildCyanotypePaperVariationDataUrl = (width, height, seed, { spotsOnly = false } = {}) => {
  const key = `${width}x${height}:${seed >>> 0}:${spotsOnly ? 'spots' : 'full'}`;
  if (variationUrlCache.has(key)) return variationUrlCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCyanotypePaperVariation(canvas.getContext('2d'), width, height, seed, { spotsOnly });
  const url = canvas.toDataURL('image/png');
  variationUrlCache.set(key, url);
  return url;
};

const grainUrlCache = new Map();
const buildCyanotypePaperGrainDataUrl = (seed) => {
  const key = seed >>> 0;
  if (grainUrlCache.has(key)) return grainUrlCache.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = GRAIN_TILE;
  canvas.height = GRAIN_TILE;
  drawCyanotypePaperGrain(canvas.getContext('2d'), GRAIN_TILE, GRAIN_TILE, seed, {
    tiled: false,
    opacity: 1,
    blend: 'source-over',
  });
  const url = canvas.toDataURL('image/png');
  grainUrlCache.set(key, url);
  return url;
};

const getCyanotypePaperGrainStyle = (seed, { opacity = 0.14 } = {}) => ({
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${buildCyanotypePaperGrainDataUrl(seed)})`,
  backgroundSize: `${GRAIN_TILE}px ${GRAIN_TILE}px`,
  backgroundRepeat: 'repeat',
  mixBlendMode: 'multiply',
  opacity,
  pointerEvents: 'none',
});

window.CYANOTYPE_BASE_HEX = CYANOTYPE_BASE_HEX;
window.deriveCyanotypePaperSeed = deriveCyanotypePaperSeed;
window.drawCyanotypePaperVariation = drawCyanotypePaperVariation;
window.drawCyanotypePaperGrain = drawCyanotypePaperGrain;
window.buildCyanotypePaperVariationDataUrl = buildCyanotypePaperVariationDataUrl;
window.buildCyanotypePaperGrainDataUrl = buildCyanotypePaperGrainDataUrl;
window.getCyanotypePaperGrainStyle = getCyanotypePaperGrainStyle;
