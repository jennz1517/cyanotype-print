// ExposePhase — the sun-exposure time-lapse. The paper, coated with photosensitizer,
// holds its original tone briefly, then eases to the post-UV coated tone (muted sage gray,
// EXPOSED_COATED_PAPER_HEX in botanicals.jsx — same as pre-wash plate before rinsing).
// Specimens stay on top, unchanged. No moving sun, no cast shadows —
// real cyanotype exposures rely on soft, even UV, not directional light.

const PAPER_COLOR_HOLD_SEC = 1;
const EXPOSE_DURATION_SEC = 7;
const PAPER_HOLD_PROGRESS = PAPER_COLOR_HOLD_SEC / EXPOSE_DURATION_SEC;

const ExposePhase = ({ items, paperTone, progress = 0, reducedMotion, trayBandHeight = 0 }) => {
  const stageScale = React.useContext(window.ScaleContext || React.createContext(1)) || 1;

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const parseHex = (hex) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };

  const skyWarmth = easeInOut(Math.max(0, (progress - PAPER_HOLD_PROGRESS) / (1 - PAPER_HOLD_PROGRESS)));
  const skyGradient = `linear-gradient(180deg,
    rgb(${Math.round(lerp(236, 242, skyWarmth))}, ${Math.round(lerp(236, 238, skyWarmth))}, ${Math.round(lerp(236, 228, skyWarmth))}) 0%,
    rgb(${Math.round(lerp(216, 228, skyWarmth))}, ${Math.round(lerp(216, 224, skyWarmth))}, ${Math.round(lerp(216, 212, skyWarmth))}) 100%)`;
  const UI = () => window.UI_THEME || { fg: '#000', fgMuted: '#5a5a5a', line: '#000', bg: '#fff', font: 'sans-serif', fontMono: 'monospace', paperShadow: '6px 6px 0 #000' };

  const paperColor = (() => {
    const base = paperTone.base || '#FEFCF4';
    const target = window.EXPOSED_COATED_PAPER_HEX || '#7A7F75';
    if (progress < PAPER_HOLD_PROGRESS) return base;
    const t = easeInOut((progress - PAPER_HOLD_PROGRESS) / (1 - PAPER_HOLD_PROGRESS));
    const [r1, g1, b1] = parseHex(base);
    const [r2, g2, b2] = parseHex(target);
    return `rgb(${Math.round(lerp(r1, r2, t))}, ${Math.round(lerp(g1, g2, t))}, ${Math.round(lerp(b1, b2, t))})`;
  })();

  const trayPad = trayBandHeight || 0;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : undefined;
  const paperLayout = window.getContinuousPhasePaperLayout
    ? window.getContinuousPhasePaperLayout(stageScale, viewportH)
    : {
      displayScale: window.PHASE_PAPER_DISPLAY_BOOST || 1.14,
      paperTopOffset: 16 - (48 / Math.max(stageScale, 0.001)),
    };
  const displayScale = paperLayout.displayScale;
  const paperTopOffset = paperLayout.paperTopOffset;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        background: 'transparent',
        overflow: 'visible',
      }}
    >
      <motion.div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: trayPad ? -trayPad : 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: skyGradient,
        overflow: 'hidden',
      }}>
        <ExposeOrganicBackdrop progress={progress} frozen={!!reducedMotion} />
        {!reducedMotion && Array.from({ length: 40 }).map((_, i) => (
          <DustMote key={i} seed={i} progress={progress} />
        ))}
      </motion.div>

      <motion.div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <motion.div style={{ position: 'relative', pointerEvents: 'auto' }}>
          <motion.div
            data-paper="true"
            style={{
              position: 'relative',
              top: paperTopOffset,
              width: PAPER_W,
              height: PAPER_H,
              flexShrink: 0,
              transition: 'none',
              transform: `scale(${displayScale})`,
              transformOrigin: 'top center',
            }}
          >
            <motion.div style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              background: paperColor,
              transition: 'none',
              boxShadow: 'none',
              border: `1px solid ${UI().line}`,
            }}>
              {items.map(item => {
                const b = BOTANICALS[item.kind];
                const w = b.bounds.w * item.scale;
                const h = b.bounds.h * item.scale;
                return (
                  <motion.div key={item.id} style={{
                    position: 'absolute',
                    left: item.x - w/2,
                    top: item.y - h/2,
                    width: w, height: h,
                    transform: `rotate(${item.rotation}deg)`,
                    pointerEvents: 'none',
                  }}>
                    <BotanicalSVG kind={item.kind} size={item.scale} color="#000000"/>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const exposeRand = (seed, n) => {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const WARMTH_BLOBS = [
  { phase: 0, fx: 0.41, fy: 0.37, color: 'rgba(255, 232, 195, 0.9)' },
  { phase: 2.1, fx: 0.29, fy: 0.53, color: 'rgba(255, 225, 185, 0.75)' },
  { phase: 4.5, fx: 0.55, fy: 0.31, color: 'rgba(248, 238, 205, 0.65)' },
];

const ExposeOrganicBackdrop = ({ progress, frozen }) => {
  const p = frozen ? 0.55 : progress;
  const tau = p * Math.PI * 2;
  const warmth = 0.28 + p * 0.52;

  return (
    <>
      {WARMTH_BLOBS.map((blob, i) => {
        const x = 50 + 44 * Math.sin(tau * blob.fx + blob.phase);
        const y = 48 + 40 * Math.cos(tau * blob.fy + blob.phase * 0.72);
        const rx = 58 + 14 * Math.sin(tau * 0.33 + blob.phase);
        const ry = 52 + 12 * Math.cos(tau * 0.27 + blob.phase * 1.1);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: '-25%',
              background: `radial-gradient(ellipse ${rx}% ${ry}% at ${x}% ${y}%, ${blob.color} 0%, transparent 68%)`,
              opacity: warmth * (0.55 + i * 0.08),
              filter: 'blur(32px)',
              willChange: frozen ? 'auto' : 'opacity',
              pointerEvents: 'none',
            }}
          />
        );
      })}
      {!frozen && Array.from({ length: 5 }).map((_, i) => (
        <SkyHazeBand key={i} seed={i + 11} progress={p} />
      ))}
    </>
  );
};

const SkyHazeBand = ({ seed, progress }) => {
  const r1 = exposeRand(seed, 1);
  const r2 = exposeRand(seed, 2);
  const r3 = exposeRand(seed, 3);
  const tau = progress * Math.PI * 2;
  const top = ((r1 * 85 + progress * 35 + Math.sin(tau * 0.22 + r2 * 6) * 6) % 110) - 5;
  const slide = Math.sin(tau * (0.12 + r3 * 0.08) + r2 * 5) * (18 + r1 * 14);
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '-15%',
        right: '-15%',
        top: `${top}%`,
        height: `${10 + r2 * 8}%`,
        opacity: 0.22 + r3 * 0.18,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255, 252, 245, 0.14) 45%, transparent 100%)',
        transform: `translateX(${slide}px) skewX(${Math.sin(tau * 0.18 + seed) * 1.2}deg)`,
        pointerEvents: 'none',
      }}
    />
  );
};

const DustMote = ({ seed, progress }) => {
  const baseX = exposeRand(seed, 1) * 100;
  const baseY = exposeRand(seed, 2) * 100;
  const speed = 0.3 + exposeRand(seed, 3) * 0.7;
  const phase = exposeRand(seed, 4) * Math.PI * 2;
  const tau = progress * Math.PI * 2;
  const driftX = Math.sin(tau * speed + phase) * 22
    + Math.sin(tau * speed * 0.47 + phase * 1.6) * 10;
  const driftY = -progress * 48 + exposeRand(seed, 6) * 24
    + Math.cos(tau * speed * 0.63 + phase) * 14;
  const size = 2 + exposeRand(seed, 5) * 3;
  return (
    <motion.div style={{
      position: 'absolute',
      left: `${baseX}%`,
      top: `${baseY}%`,
      transform: `translate(${driftX}px, ${driftY}px)`,
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'rgba(255,240,200,0.55)',
      boxShadow: '0 0 5px rgba(255,240,200,0.35)',
      pointerEvents: 'none',
    }}/>
  );
};

window.ExposePhase = ExposePhase;
