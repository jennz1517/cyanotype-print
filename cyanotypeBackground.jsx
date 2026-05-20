// Seeded Prussian-blue wash variation — organic lighter/darker pools, not a uniform edge vignette.

const CYANOTYPE_BASE_HEX = '#2E5483';
const BASE_RGB = [46, 84, 131];

const cyanotypeRand = (seed) => {
  let s = seed >>> 0;
  return (n = 0) => {
    s = (Math.imul(s ^ (n + 1), 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
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

const drawCyanotypePaperVariation = (ctx, cw, ch, seed) => {
  const [br, bg, bb] = BASE_RGB;
  const rand = cyanotypeRand(seed);

  ctx.fillStyle = CYANOTYPE_BASE_HEX;
  ctx.fillRect(0, 0, cw, ch);

  const span = Math.min(cw, ch);
  const blobCount = 10 + Math.floor(rand(1) * 7);

  for (let i = 0; i < blobCount; i++) {
    const cx = rand(10 + i) * cw;
    const cy = rand(20 + i) * ch;
    const r = (0.2 + rand(30 + i) * 0.38) * span;
    const darker = rand(40 + i) > 0.5;
    const alpha = 0.045 + rand(50 + i) * 0.07;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    if (darker) {
      g.addColorStop(0, `rgba(${Math.round(br * 0.8)}, ${Math.round(bg * 0.76)}, ${Math.round(bb * 0.82)}, ${alpha})`);
      g.addColorStop(0.6, `rgba(${br}, ${bg}, ${bb}, ${alpha * 0.28})`);
      g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    } else {
      g.addColorStop(0, `rgba(${br + 12}, ${bg + 10}, ${bb + 8}, ${alpha})`);
      g.addColorStop(0.6, `rgba(${br}, ${bg}, ${bb}, ${alpha * 0.25})`);
      g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }

  const washCount = 2 + Math.floor(rand(2) * 2);
  for (let w = 0; w < washCount; w++) {
    const x0 = rand(60 + w) * cw;
    const y0 = rand(70 + w) * ch;
    const x1 = x0 + (rand(80 + w) - 0.5) * cw * 0.55;
    const y1 = y0 + (rand(90 + w) - 0.5) * ch * 0.55;
    const lift = rand(100 + w) > 0.5;
    const a = 0.03 + rand(110 + w) * 0.04;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    if (lift) {
      g.addColorStop(0, `rgba(${br + 6}, ${bg + 5}, ${bb + 4}, ${a})`);
      g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    } else {
      g.addColorStop(0, `rgba(${Math.round(br * 0.86)}, ${Math.round(bg * 0.84)}, ${Math.round(bb * 0.88)}, ${a})`);
      g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
  }
};

const buildCyanotypePaperVariationDataUrl = (width, height, seed) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCyanotypePaperVariation(canvas.getContext('2d'), width, height, seed);
  return canvas.toDataURL('image/png');
};

window.CYANOTYPE_BASE_HEX = CYANOTYPE_BASE_HEX;
window.deriveCyanotypePaperSeed = deriveCyanotypePaperSeed;
window.drawCyanotypePaperVariation = drawCyanotypePaperVariation;
window.buildCyanotypePaperVariationDataUrl = buildCyanotypePaperVariationDataUrl;
