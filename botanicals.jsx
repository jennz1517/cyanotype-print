// Botanical SVG silhouettes — designed as opaque shapes since cyanotype
// prints record silhouettes, not fine detail. Tray/paper use sepia tones;
// the finished Prussian print uses a cool range only (see CYANOTYPE_PRINT_*).

const BotanicalFern = () => (
  <g>
    {/* central stem */}
    <path d="M 0 -90 Q -1 0 0 90" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    {/* leaflets arranged alternately along stem */}
    {Array.from({length: 14}).map((_, i) => {
      const t = i / 13;
      const y = -90 + t * 180;
      const side = i % 2 === 0 ? 1 : -1;
      const size = Math.sin(t * Math.PI) * 32 + 6;
      const angle = side * (65 - t * 20);
      return (
        <g key={i} transform={`translate(0 ${y}) rotate(${angle})`}>
          <path
            d={`M 0 0 Q ${size*0.55} -${size*0.25} ${size} 0 Q ${size*0.55} ${size*0.25} 0 0 Z`}
            fill="currentColor"
          />
          {/* tiny pinnule notches */}
          {Array.from({length: 5}).map((__, j) => {
            const tt = (j+1)/6;
            return (
              <path key={j} d={`M ${tt*size} -1 L ${tt*size} -${size*0.15}`} stroke="#f2ead6" strokeWidth="0.8"/>
            );
          })}
        </g>
      );
    })}
  </g>
);

const BotanicalRose = () => (
  <g>
    {/* stem — curved */}
    <path d="M 2 90 Q -10 40 -4 -10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* thorns */}
    <path d="M -4 60 l -4 -3 l 4 0 Z" fill="currentColor"/>
    <path d="M -6 30 l -4 -3 l 4 0 Z" fill="currentColor"/>
    <path d="M -6 5 l 4 -3 l 0 4 Z" fill="currentColor"/>
    {/* leaf left */}
    <g transform="translate(-6 45) rotate(-40)">
      <path d="M 0 0 Q -8 -6 -18 -2 Q -14 4 -20 10 Q -10 12 -2 6 Q 2 2 0 0 Z" fill="currentColor"/>
    </g>
    {/* leaf right */}
    <g transform="translate(-2 20) rotate(35)">
      <path d="M 0 0 Q 8 -6 20 -2 Q 16 6 22 12 Q 10 12 2 6 Q -2 2 0 0 Z" fill="currentColor"/>
    </g>
    {/* rose bloom — nested spiral petals */}
    <g transform="translate(-4 -30)">
      <path d="M -28 0 Q -34 -26 -10 -34 Q 18 -40 30 -18 Q 38 10 16 24 Q -14 32 -28 0 Z" fill="currentColor"/>
      <path d="M -20 -4 Q -24 -22 -6 -26 Q 14 -28 22 -12 Q 26 8 8 16 Q -12 20 -20 -4 Z" fill="#f2ead6" opacity="0.22"/>
      <path d="M -12 -6 Q -14 -18 -2 -20 Q 10 -20 14 -8 Q 16 4 4 10 Q -8 12 -12 -6 Z" fill="#f2ead6" opacity="0.22"/>
      <path d="M -6 -6 Q -6 -12 0 -13 Q 6 -12 6 -4 Q 4 2 -2 2 Q -6 0 -6 -6 Z" fill="#f2ead6" opacity="0.28"/>
    </g>
  </g>
);

const BotanicalDaisy = () => (
  <g>
    {/* stem */}
    <path d="M 0 80 Q -2 30 1 -4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    {/* small leaf */}
    <g transform="translate(0 40) rotate(-35)">
      <path d="M 0 0 Q 6 -4 14 -1 Q 10 4 14 9 Q 6 8 0 0 Z" fill="currentColor"/>
    </g>
    {/* 12 petals radiating */}
    {Array.from({length: 12}).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return (
        <ellipse
          key={i}
          cx={Math.cos(a) * 24}
          cy={Math.sin(a) * 24 - 20}
          rx="14"
          ry="5"
          fill="currentColor"
          transform={`rotate(${(a * 180 / Math.PI) + 90} ${Math.cos(a)*24} ${Math.sin(a)*24 - 20})`}
        />
      );
    })}
    {/* center */}
    <circle cx="0" cy="-20" r="7" fill="currentColor"/>
    <circle cx="0" cy="-20" r="5" fill="#f2ead6" opacity="0.3"/>
  </g>
);

const BotanicalButtercup = () => (
  <g>
    {/* slender stem */}
    <path d="M 0 70 Q 4 20 0 -6" stroke="currentColor" strokeWidth="1" fill="none"/>
    {/* tiny side bud */}
    <circle cx="10" cy="8" r="5" fill="currentColor"/>
    <path d="M 10 8 Q 5 20 0 30" stroke="currentColor" strokeWidth="0.8" fill="none"/>
    {/* 5 cupped petals */}
    {Array.from({length: 5}).map((_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI/2;
      return (
        <path
          key={i}
          d={`M 0 -10 Q ${Math.cos(a)*8} ${Math.sin(a)*8 - 10 - 6} ${Math.cos(a)*18} ${Math.sin(a)*18 - 10} Q ${Math.cos(a+0.8)*8} ${Math.sin(a+0.8)*8 - 10} 0 -10 Z`}
          fill="currentColor"
        />
      );
    })}
    <circle cx="0" cy="-10" r="3" fill="#f2ead6" opacity="0.3"/>
  </g>
);

const BotanicalDandelion = () => (
  <g>
    {/* stem */}
    <path d="M 0 80 Q 0 20 0 -10" stroke="currentColor" strokeWidth="1" fill="none"/>
    {/* seed head — translucent puff ball with radiating seeds */}
    {Array.from({length: 28}).map((_, i) => {
      const a = (i / 28) * Math.PI * 2;
      const r = 34;
      const x2 = Math.cos(a) * r;
      const y2 = Math.sin(a) * r - 40;
      return (
        <g key={i}>
          <line x1="0" y1="-40" x2={x2} y2={y2} stroke="currentColor" strokeWidth="0.5" opacity="0.85"/>
          {/* pappus tuft */}
          <g transform={`translate(${x2} ${y2}) rotate(${a * 180 / Math.PI})`}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((off, j) => (
              <line key={j} x1="0" y1="0" x2={Math.cos(off)*5} y2={Math.sin(off)*5 - 5} stroke="currentColor" strokeWidth="0.4" opacity="0.7"/>
            ))}
          </g>
        </g>
      );
    })}
    {/* central receptacle */}
    <circle cx="0" cy="-40" r="3" fill="currentColor"/>
    {/* a couple detached seeds floating */}
    <g transform="translate(40 -60) rotate(30)">
      <line x1="0" y1="0" x2="0" y2="-8" stroke="currentColor" strokeWidth="0.5"/>
      {[-0.4, 0, 0.4].map((off, j) => (
        <line key={j} x1="0" y1="-8" x2={Math.cos(off-Math.PI/2)*4} y2={-8+Math.sin(off-Math.PI/2)*4} stroke="currentColor" strokeWidth="0.4"/>
      ))}
    </g>
    <g transform="translate(-38 -20) rotate(-40)">
      <line x1="0" y1="0" x2="0" y2="-6" stroke="currentColor" strokeWidth="0.5"/>
      {[-0.4, 0, 0.4].map((off, j) => (
        <line key={j} x1="0" y1="-6" x2={Math.cos(off-Math.PI/2)*3} y2={-6+Math.sin(off-Math.PI/2)*3} stroke="currentColor" strokeWidth="0.4"/>
      ))}
    </g>
  </g>
);

const BOTANICALS = {
  fern:       { name: "Fern",          latin: "Polypodiopsida", image: "assets/flowers/fern.png",        bounds: { w: 150, h: 200 } },
  babybreath: { name: "Baby's Breath", latin: "Gypsophila",     image: "assets/flowers/baby-breath.png", bounds: { w: 180, h: 240 } },
  poppy:      { name: "Poppy",         latin: "Papaver",        image: "assets/flowers/flower-1.png",    bounds: { w: 140, h: 260 } },
  pressedRose:{ name: "Rose",  latin: "Rosa",     image: "assets/flowers/flower-2.png",    bounds: { w: 140, h: 220 } },
  tulip:      { name: "Tulip",         latin: "Tulipa",         image: "assets/flowers/flower-3.png",    bounds: { w: 170, h: 240 } },
  cosmos:     { name: "Cosmos",        latin: "C. bipinnatus",  image: "assets/flowers/pink-flower.png", bounds: { w: 150, h: 230 } },
  pansy:      { name: "Pansy",         latin: "Viola tricolor", image: "assets/flowers/pansy.png",       bounds: { w: 170, h: 200 } },
  dandelion:  { name: "Dandelion",     latin: "T. officinale",  image: "assets/flowers/dandelion.png",   bounds: { w: 160, h: 200 }, filterProfile: "dandelion" },
  peony:      { name: "Peony",         latin: "Paeonia",        image: "assets/flowers/peony.png",       bounds: { w: 190, h: 190 }, lumLift: 0.12, lumContrast: 1.18, filterProfile: "peony" },
  loveinamist:{ name: "Love-in-a-Mist", latin: "Nigella damascena", image: "assets/flowers/loveinamist.png", bounds: { w: 150, h: 240 } },
};

window.BOTANICALS = BOTANICALS;

// --- Final print palette (Prussian plate): dense → cool highlight; thin / bright scan → light blue ---
const CYANOTYPE_THIN_BLUE = '#A4BCD9';
const CYANOTYPE_PRINT_DENSE = '#F8F8F2';

// Pre-wash latent contact plate (post-UV, pre-rinse): sensitized paper tone + specimen UV map.
// Opaque / pigmented areas of the press block more light → #7A8D94; thin / translucent → #575F6A.
const CYANOTYPE_LATENT_THIN = '#575F6A';
const CYANOTYPE_LATENT_DENSE = '#7A8D94';
// Coated sheet after exposure — muted sage gray, matches end of ExposePhase / BrushAsidePhase paper.
const EXPOSED_COATED_PAPER_HEX = '#7A7F75';

window.parseColorRgb01 = (c) => {
  if (typeof c !== 'string') return [0, 0, 0];
  let m = c.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const s = m[1];
    return [parseInt(s[0] + s[0], 16) / 255, parseInt(s[1] + s[1], 16) / 255, parseInt(s[2] + s[2], 16) / 255];
  }
  m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const s = m[1];
    return [parseInt(s.slice(0, 2), 16) / 255, parseInt(s.slice(2, 4), 16) / 255, parseInt(s.slice(4, 6), 16) / 255];
  }
  m = c.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(',').map((s) => parseFloat(s));
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
  }
  if (!window.parseColorRgb01._cache) window.parseColorRgb01._cache = {};
  if (window.parseColorRgb01._cache[c]) return window.parseColorRgb01._cache[c];
  const d = document.createElement('div');
  d.style.color = c;
  document.body.appendChild(d);
  const computed = getComputedStyle(d).color;
  document.body.removeChild(d);
  const cm = computed.match(/rgba?\(([^)]+)\)/);
  if (cm) {
    const parts = cm[1].split(',').map((s) => parseFloat(s));
    const out = [parts[0] / 255, parts[1] / 255, parts[2] / 255];
    window.parseColorRgb01._cache[c] = out;
    return out;
  }
  return [0, 0, 0];
};

const buildCyanotypeLuminanceBlockingTable = (steps, opts = {}) => {
  const lift = opts.lumLift ?? 0;
  const contrast = opts.lumContrast ?? 1;
  const gain = opts.blockGain ?? 2.75;
  const power = opts.blockPower ?? 0.82;
  const ceiling = opts.blockCeiling ?? 0.91;
  const parts = [];
  for (let i = 0; i < steps; i++) {
    let L = i / (steps - 1);
    if (lift !== 0 || contrast !== 1) {
      L = Math.min(1, Math.max(0, (L - 0.5) * contrast + 0.5 + lift));
    }
    // Dark / pigmented areas (low L) → strong blocking → dense endpoint; bright / thin scan (high L) → thin endpoint.
    // (Print: white / thin blue. Latent plate: #7A8D94 / #575F6A — same curve.)
    let block = Math.min(1, Math.max(0, gain * (ceiling - L)));
    block = Math.pow(block, power);
    parts.push(block.toFixed(5));
  }
  return parts.join(' ');
};

/** Push leaf mid-tones toward thin blue while keeping bulk near dense white (peony veins). */
const buildLeafVeinAccentTable = (blockedTableValues) => {
  const parts = blockedTableValues.trim().split(/\s+/).map(Number);
  return parts.map((b) => {
    if (b >= 0.84) return b;
    if (b <= 0.34) return b;
    const t = (0.84 - b) / 0.5;
    return Math.max(0, b - 0.3 * Math.pow(t, 0.82));
  }).map((v) => v.toFixed(5)).join(' ');
};

const mapLumBlockedToPrint = (blockedName, outName, negRgb, thinRgb) => {
  const [Wr, Wg, Wb] = negRgb;
  const [Br, Bg, Bb] = thinRgb;
  const dr = Wr - Br;
  const dg = Wg - Bg;
  const db = Wb - Bb;
  const alpha = `${outName}Alpha`;
  const scaled = `${outName}Scaled`;
  const mapped = `${outName}Mapped`;
  return `
  <feColorMatrix in="SourceGraphic" type="matrix" result="${alpha}"
    values="0 0 0 1 0
            0 0 0 1 0
            0 0 0 1 0
            0 0 0 1 0"/>
  <feComposite in="${blockedName}" in2="${alpha}" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="${scaled}"/>
  <feColorMatrix in="${scaled}" type="matrix" result="${mapped}"
    values="${dr} 0 0 0 ${Br}
            0 ${dg} 0 0 ${Bg}
            0 0 ${db} 0 ${Bb}
            0 0 0 1 0"/>
  <feComposite in="${mapped}" in2="SourceGraphic" operator="in" result="${outName}"/>`;
};

/** Bottom-of-frame zone mask — peony leaves sit low; petals are not green-dominant so color alone cannot split zones. */
const peonyLeafZoneMaskDataUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 190">'
  + '<linearGradient id="z" gradientUnits="userSpaceOnUse" x1="0" y1="52" x2="0" y2="190">'
  + '<stop offset="0" stop-color="#000"/>'
  + '<stop offset="0.32" stop-color="#fff"/>'
  + '<stop offset="1" stop-color="#fff"/>'
  + '</linearGradient>'
  + '<rect width="190" height="190" fill="url(#z)"/>'
  + '</svg>',
)}`;

/** Peony print filter: petals use the specimen curve; leaves get a green-weighted high-pass so veins read as light blue on white. */
const peonyCyanotypeFilterMarkup = (filterId, negRgb, thinRgb, curveOpts = {}) => {
  const flowerTbl = buildCyanotypeLuminanceBlockingTable(22, {
    lumLift: curveOpts.lumLift ?? 0.12,
    lumContrast: curveOpts.lumContrast ?? 1.18,
  });
  const leafTblBase = buildCyanotypeLuminanceBlockingTable(22, {
    lumLift: 0.48,
    lumContrast: 1.75,
    blockGain: 3.5,
    blockPower: 0.7,
    blockCeiling: 0.9,
  });
  const leafTbl = buildLeafVeinAccentTable(leafTblBase);
  const hpK = 3.2;
  const blurStd = 0.4;

  return `<filter id="${filterId}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feColorMatrix in="SourceGraphic" type="matrix" result="flowerLum"
    values="0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0 0 0 1 0"/>
  <feComponentTransfer in="flowerLum" result="flowerBlocked">
    <feFuncR type="table" tableValues="${flowerTbl}"/>
    <feFuncG type="table" tableValues="${flowerTbl}"/>
    <feFuncB type="table" tableValues="${flowerTbl}"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
  ${mapLumBlockedToPrint('flowerBlocked', 'flowerPrint', negRgb, thinRgb)}
  <feColorMatrix in="SourceGraphic" type="matrix" result="leafLum"
    values="0.22 0.58 0.2 0 0
            0.22 0.58 0.2 0 0
            0.22 0.58 0.2 0 0
            0 0 0 1 0"/>
  <feGaussianBlur in="leafLum" stdDeviation="${blurStd}" result="leafLumBlur"/>
  <feComposite in="leafLum" in2="leafLumBlur" operator="arithmetic" k1="0" k2="${(1 - hpK).toFixed(3)}" k3="${hpK.toFixed(3)}" k4="0" result="leafHpLum"/>
  <feComponentTransfer in="leafHpLum" result="leafBlocked">
    <feFuncR type="table" tableValues="${leafTbl}"/>
    <feFuncG type="table" tableValues="${leafTbl}"/>
    <feFuncB type="table" tableValues="${leafTbl}"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
  ${mapLumBlockedToPrint('leafBlocked', 'leafPrint', negRgb, thinRgb)}
  <feColorMatrix in="SourceGraphic" type="matrix" result="peonyLum"
    values="0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0 0 0 1 0"/>
  <feComponentTransfer in="peonyLum" result="darkLeafMask">
    <feFuncR type="table" tableValues="1 1 1 1 0.98 0.92 0.82 0.68 0.52 0.38 0.24 0.14 0.07 0.03 0.01 0 0 0 0 0 0 0 0"/>
    <feFuncG type="table" tableValues="1 1 1 1 0.98 0.92 0.82 0.68 0.52 0.38 0.24 0.14 0.07 0.03 0.01 0 0 0 0 0 0 0 0"/>
    <feFuncB type="table" tableValues="1 1 1 1 0.98 0.92 0.82 0.68 0.52 0.38 0.24 0.14 0.07 0.03 0.01 0 0 0 0 0 0 0 0"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
  <feColorMatrix in="SourceGraphic" type="matrix" result="pinkDom"
    values="1 -1 0 0 0
            1 -1 0 0 0
            1 -1 0 0 0
            0 0 0 1 0"/>
  <feComponentTransfer in="pinkDom" result="notPinkMask">
    <feFuncR type="table" tableValues="1 1 1 1 0.95 0.75 0.45 0.2 0.05 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/>
    <feFuncG type="table" tableValues="1 1 1 1 0.95 0.75 0.45 0.2 0.05 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/>
    <feFuncB type="table" tableValues="1 1 1 1 0.95 0.75 0.45 0.2 0.05 0 0 0 0 0 0 0 0 0 0 0 0 0 0"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
  <feImage href="${peonyLeafZoneMaskDataUrl}" result="leafZone" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none"/>
  <feComposite in="darkLeafMask" in2="leafZone" operator="in" result="leafMaskRaw"/>
  <feComposite in="leafMaskRaw" in2="notPinkMask" operator="in" result="leafMaskRgb"/>
  <feColorMatrix in="leafMaskRgb" type="matrix" result="leafMaskRgbA"
    values="0 0 0 0 0
            0 0 0 0 0
            0 0 0 0 0
            1 0 0 0 0"/>
  <feColorMatrix in="SourceGraphic" type="matrix" result="specimenAlpha"
    values="0 0 0 1 0
            0 0 0 1 0
            0 0 0 1 0
            0 0 0 1 0"/>
  <feComposite in="leafMaskRgbA" in2="specimenAlpha" operator="in" result="leafMask"/>
  <feComposite in="leafPrint" in2="leafMask" operator="in" result="leafLayer"/>
  <feComposite in="flowerPrint" in2="leafMask" operator="out" result="flowerLayer"/>
  <feComposite in="leafLayer" in2="flowerLayer" operator="over"/>
</filter>`;
};

/** Dandelion print filter: opaque stem band → dense white; seed head keeps default translucency curve. */
const dandelionStemMaskDataUrl = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200">'
  + '<defs><radialGradient id="s" gradientUnits="userSpaceOnUse" cx="80" cy="186" r="88" fx="80" fy="186" gradientTransform="scale(0.2 1) translate(320 0)">'
  + '<stop offset="0" stop-color="#fff"/>'
  + '<stop offset="0.42" stop-color="#fff" stop-opacity="0.92"/>'
  + '<stop offset="0.78" stop-color="#000" stop-opacity="0"/>'
  + '<stop offset="1" stop-color="#000"/>'
  + '</radialGradient></defs>'
  + '<rect width="160" height="200" fill="url(#s)"/>'
  + '</svg>',
)}`;

const dandelionCyanotypeFilterMarkup = (filterId, negRgb, thinRgb) => {
  const headTbl = window.CYANOTYPE_LUM_BLOCK_TABLE;
  const stemTbl = buildCyanotypeLuminanceBlockingTable(22, {
    lumLift: -0.24,
    lumContrast: 1.18,
    blockGain: 3.85,
    blockPower: 0.68,
    blockCeiling: 0.96,
  });

  return `<filter id="${filterId}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feColorMatrix in="SourceGraphic" type="matrix" result="headLum"
    values="0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0 0 0 1 0"/>
  <feComponentTransfer in="headLum" result="headBlocked">
    <feFuncR type="table" tableValues="${headTbl}"/>
    <feFuncG type="table" tableValues="${headTbl}"/>
    <feFuncB type="table" tableValues="${headTbl}"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
  ${mapLumBlockedToPrint('headBlocked', 'headPrint', negRgb, thinRgb)}
  <feColorMatrix in="SourceGraphic" type="matrix" result="stemLum"
    values="0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0 0 0 1 0"/>
  <feComponentTransfer in="stemLum" result="stemBlocked">
    <feFuncR type="table" tableValues="${stemTbl}"/>
    <feFuncG type="table" tableValues="${stemTbl}"/>
    <feFuncB type="table" tableValues="${stemTbl}"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
  ${mapLumBlockedToPrint('stemBlocked', 'stemPrint', negRgb, thinRgb)}
  <feImage href="${dandelionStemMaskDataUrl}" result="stemZone" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none"/>
  <feComposite in="stemPrint" in2="stemZone" operator="in" result="stemLayer"/>
  <feFlood flood-color="white" flood-opacity="1" result="paperMask"/>
  <feComposite in="paperMask" in2="stemZone" operator="out" result="headZone"/>
  <feComposite in="headPrint" in2="headZone" operator="in" result="headLayer"/>
  <feComposite in="stemLayer" in2="headLayer" operator="over"/>
</filter>`;
};

window.CYANOTYPE_THIN_BLUE = CYANOTYPE_THIN_BLUE;
window.CYANOTYPE_LUM_BLOCK_TABLE = buildCyanotypeLuminanceBlockingTable(22);
window.CYANOTYPE_THIN_RGB01 = window.parseColorRgb01(CYANOTYPE_THIN_BLUE);
window.CYANOTYPE_LATENT_THIN_HEX = CYANOTYPE_LATENT_THIN;
window.CYANOTYPE_LATENT_DENSE_HEX = CYANOTYPE_LATENT_DENSE;
window.CYANOTYPE_LATENT_THIN_RGB01 = window.parseColorRgb01(CYANOTYPE_LATENT_THIN);
window.EXPOSED_COATED_PAPER_HEX = EXPOSED_COATED_PAPER_HEX;

// Overlapping silhouettes add light (denser blocked UV → whiter negative), without blending into the blue base.
window.CYANOTYPE_SPECIMEN_STACK_ISOLATION_STYLE = {
  position: 'absolute',
  inset: 0,
  isolation: 'isolate',
  pointerEvents: 'none',
};
window.CYANOTYPE_SPECIMEN_OVERLAP_BLEND_STYLE = {
  mixBlendMode: 'plus-lighter',
};

window.CYANOTYPE_PRINT_DENSE_HEX = CYANOTYPE_PRINT_DENSE;
window.CYANOTYPE_PRINT_SILHOUETTE_COLOR = CYANOTYPE_PRINT_DENSE;
window.CYANOTYPE_NEGATIVE_BRIGHT_CAP_HEX = CYANOTYPE_PRINT_DENSE;
window.CYANOTYPE_SPECIMEN_BRIGHT_CAP_LAYER_STYLE = {
  position: 'absolute',
  inset: 0,
  background: CYANOTYPE_PRINT_DENSE,
  mixBlendMode: 'darken',
  pointerEvents: 'none',
};

/** Full <filter>…</filter> markup: luminance curve × alpha → lerp(thin blue, dense print highlight). */
window.cyanotypeNegativeFilterMarkup = (filterId, negRgb, thinRgb, curveOpts = {}) => {
  if (curveOpts.filterProfile === 'dandelion') {
    return dandelionCyanotypeFilterMarkup(filterId, negRgb, thinRgb);
  }
  if (curveOpts.filterProfile === 'peony') {
    return peonyCyanotypeFilterMarkup(filterId, negRgb, thinRgb, curveOpts);
  }
  const [Wr, Wg, Wb] = negRgb;
  const [Br, Bg, Bb] = thinRgb;
  const dr = Wr - Br;
  const dg = Wg - Bg;
  const db = Wb - Bb;
  const hasCurve = (curveOpts.lumLift ?? 0) !== 0
    || (curveOpts.lumContrast ?? 1) !== 1
    || (curveOpts.blockGain ?? 2.75) !== 2.75
    || (curveOpts.blockPower ?? 0.82) !== 0.82;
  const tbl = hasCurve
    ? buildCyanotypeLuminanceBlockingTable(22, curveOpts)
    : window.CYANOTYPE_LUM_BLOCK_TABLE;
  return `<filter id="${filterId}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feColorMatrix in="SourceGraphic" type="matrix" result="lum"
    values="0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0.2126 0.7152 0.0722 0 0
            0 0 0 1 0"/>
  <feComponentTransfer in="lum" result="blocked">
    <feFuncR type="table" tableValues="${tbl}"/>
    <feFuncG type="table" tableValues="${tbl}"/>
    <feFuncB type="table" tableValues="${tbl}"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
  <feColorMatrix in="SourceGraphic" type="matrix" result="alphaOnly"
    values="0 0 0 1 0
            0 0 0 1 0
            0 0 0 1 0
            0 0 0 1 0"/>
  <feComposite in="blocked" in2="alphaOnly" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="tScaled"/>
  <feColorMatrix in="tScaled" type="matrix" result="mapped"
    values="${dr} 0 0 0 ${Br}
            0 ${dg} 0 0 ${Bg}
            0 0 ${db} 0 ${Bb}
            0 0 0 1 0"/>
  <feComposite in="mapped" in2="SourceGraphic" operator="in"/>
</filter>`;
};

// Raster bytes inlined so export SVG (loaded as a blob URL) does not reference http(s) URLs.
// External hrefs inside blob SVGs are often blocked, which produced broken-image tiles in PNG export.
const exportImageDataUrlCache = new Map();

window.imageUrlToDataUrlForExport = async (imageRelPath) => {
  if (exportImageDataUrlCache.has(imageRelPath)) {
    return exportImageDataUrlCache.get(imageRelPath);
  }
  let dataUrl;
  try {
    const res = await fetch(imageRelPath);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    dataUrl = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => reject(new Error('image load failed: ' + imageRelPath));
      img.src = imageRelPath;
    });
  }
  exportImageDataUrlCache.set(imageRelPath, dataUrl);
  return dataUrl;
};

/** SVG document for one specimen (used by PNG export). Async: inlines photo as data URL. */
window.buildCyanotypeSpecimenSvgStringAsync = async (item, negColorCss) => {
  const b = BOTANICALS[item.kind];
  if (!b || !b.image) {
    const { w, h } = (b && b.bounds) || { w: 100, h: 100 };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`;
  }
  const { w, h } = b.bounds;
  const fid = 'cnexp' + Math.floor(Math.random() * 1e10);
  const negRgb = window.parseColorRgb01(negColorCss);
  const thinRgb = window.CYANOTYPE_THIN_RGB01;
  const curveOpts = { lumLift: b.lumLift, lumContrast: b.lumContrast, filterProfile: b.filterProfile };
  const filterXml = window.cyanotypeNegativeFilterMarkup(fid, negRgb, thinRgb, curveOpts);
  const dataUrl = await window.imageUrlToDataUrlForExport(b.image);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>${filterXml}</defs>
  <image xlink:href='${dataUrl}' href='${dataUrl}' x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" filter="url(#${fid})"/>
</svg>`;
};
