// RinsePhase — begins where Lift ends: exposed coated paper with latent UV mask.
// Cold water pours; the plate oxidizes to Prussian blue and latent grays resolve
// into the finished print. Blend-heavy layers (plus-lighter, bright cap, screen
// gloss) are staged so the parent never fades the whole stack at once — that
// caused a milky white flash before the final image snapped in.

const EXPOSED_PAPER_HEX = window.EXPOSED_COATED_PAPER_HEX || '#7A7F75';
const CYANOTYPE_FINAL_HEX = window.CYANOTYPE_BASE_HEX || '#2E5483';
const PHASE_PAPER_DISPLAY_BOOST = 1.14;
const PAPER_TOP_BASE = 16;
const PAPER_SCREEN_SHIFT_PX = 48;

const EXPOSED_PAPER_SPECKLE = {
  backgroundImage: [
    'radial-gradient(circle at 20% 30%, rgba(35,55,62,0.07) 0, transparent 2px)',
    'radial-gradient(circle at 70% 60%, rgba(40,60,68,0.055) 0, transparent 2px)',
    'radial-gradient(circle at 45% 80%, rgba(45,65,72,0.05) 0, transparent 1.5px)',
    'radial-gradient(circle at 85% 20%, rgba(38,58,65,0.05) 0, transparent 1.5px)',
    'radial-gradient(circle at 15% 75%, rgba(42,62,70,0.06) 0, transparent 2px)',
  ].join(', '),
  backgroundSize: '180px 180px, 220px 220px, 160px 160px, 240px 240px, 200px 200px',
};

const parseHex = (hex) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerpHex = (hexA, hexB, t) => {
  const [r1, g1, b1] = parseHex(hexA);
  const [r2, g2, b2] = parseHex(hexB);
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(lerp(r1, r2, k))}, ${Math.round(lerp(g1, g2, k))}, ${Math.round(lerp(b1, b2, k))})`;
};

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutCubic = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

/** Smoothstep; keeps overlap gentle without long plateaus. */
const smoothstep = (edge0, edge1, x) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/**
 * Irregular wet front (percent from top of paper) for clip-path — reads like water
 * pooling unevenly as it runs down the sheet.
 */
const buildWetRegionClipPath = (leadPct, progress, segments = 22) => {
  const pts = ['0% 0%', '100% 0%'];
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const x = t * 100;
    const wobble =
      Math.sin(t * Math.PI * 4.5 + progress * 18) * 3.4 +
      Math.sin(t * Math.PI * 9 + progress * 11) * 1.9 +
      Math.sin(t * 13.7 + progress * 26) * 1.1 +
      Math.sin(t * 21 + progress * 7) * 0.65;
    const y = Math.min(106, Math.max(0, leadPct + wobble));
    pts.push(`${x}% ${y}%`);
  }
  pts.push('0% 0%');
  return `polygon(${pts.join(', ')})`;
};

/** Pour phase: how far the wet front has traveled down the paper (0–~102%). */
const wetFrontPercent = (progress) => {
  if (progress >= 0.6) return 105;
  const u = Math.min(1, progress / 0.5);
  return easeOutCubic(u) * 102;
};

/** Soft localized eddies in shallow water; avoids linear wipe artifacts. */
const WaterEddy = ({ seed, progress }) => {
  const rand = (n) => {
    let x = Math.sin(seed * 47.11 + n * 19.4) * 43758.5453;
    return x - Math.floor(x);
  };
  const left = 8 + rand(1) * 84;
  const top = 8 + rand(2) * 76;
  const phase = rand(2) * Math.PI * 2;
  const speed = 0.65 + rand(3) * 0.75;
  const driftX = Math.sin(progress * speed * 7 + phase) * (2 + rand(4) * 3);
  const driftY = Math.cos(progress * speed * 6 + phase * 1.3) * (1.5 + rand(5) * 2.2);
  const width = 80 + rand(6) * 170;
  const height = 30 + rand(7) * 85;
  const opacity = 0.09 + rand(8) * 0.12;
  const delay = rand(9) * 0.18;
  const run = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
  return (
    <div style={{
      position: 'absolute',
      left: `${left}%`,
      top: `${top}%`,
      width,
      height,
      transform: `translate(${driftX}px, ${driftY}px) rotate(${Math.sin(progress * 3 + phase) * 8}deg)`,
      background: `radial-gradient(ellipse at center,
        rgba(245,252,255,0.32) 0%,
        rgba(205,230,248,0.2) 30%,
        rgba(165,210,240,0.12) 58%,
        transparent 86%)`,
      filter: 'blur(1.2px)',
      opacity: opacity * (0.35 + run * 0.65),
      pointerEvents: 'none',
    }}/>
  );
};

/** Full-paper wash: clipped wet region + shear currents + eddies. */
const OrganicWaterWash = ({ progress, developT }) => {
  const lead = wetFrontPercent(progress);
  const clip = buildWetRegionClipPath(lead, progress);
  const drift = Math.sin(progress * Math.PI * 4.2) * 8 + Math.sin(progress * 10.8) * 3.8;
  const shearShift = progress * 130;
  const turbulenceShift = progress * 95;
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: '-3%',
        right: '-3%',
        top: '-4%',
        bottom: '-4%',
        clipPath: clip,
        WebkitClipPath: clip,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${drift}px, ${Math.sin(progress * 8) * 1.8}px)`,
          opacity: 0.34 + developT * 0.22,
          background: [
            `linear-gradient(103deg,
              transparent 0%,
              rgba(236,248,255,0.12) 22%,
              transparent 46%,
              rgba(197,226,248,0.1) 71%,
              transparent 100%)`,
            `linear-gradient(172deg,
              rgba(250,255,255,0.14) 0%,
              rgba(182,218,244,0.1) 21%,
              rgba(145,201,236,0.08) 49%,
              rgba(176,221,248,0.09) 69%,
              rgba(218,240,255,0.06) 100%)`,
            `repeating-linear-gradient(84deg,
              transparent 0px,
              transparent 14px,
              rgba(255,255,255,0.028) 14px,
              rgba(255,255,255,0.028) 16px)`,
          ].join(', '),
          backgroundSize: `100% 100%, 100% 100%, 210px 100%`,
          backgroundPosition: `0 0, 0 0, ${shearShift}px 0`,
          mixBlendMode: 'screen',
          filter: 'blur(0.55px)',
        }}/>
        <div style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${-drift * 0.55}px, ${Math.cos(progress * 7.4) * 1.6}px)`,
          opacity: 0.12 + developT * 0.11,
          background: [
            `radial-gradient(ellipse 130% 62% at 52% -8%,
              rgba(255,255,255,0.24) 0%,
              transparent 58%)`,
            `repeating-linear-gradient(11deg,
              rgba(215,240,255,0.034) 0px,
              rgba(215,240,255,0.034) 10px,
              transparent 10px,
              transparent 22px)`,
          ].join(', '),
          backgroundPosition: `0 0, ${-turbulenceShift}px 0`,
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${48 + Math.sin(progress * 6) * 5}% ${Math.max(8, lead - 20)}%,
            rgba(235,248,255,0.26) 0%,
            rgba(170,216,244,0.14) 24%,
            transparent 54%)`,
          mixBlendMode: 'screen',
          opacity: 0.3 + (1 - developT) * 0.25,
          filter: 'blur(1.4px)',
        }}/>
        {Array.from({ length: 18 }).map((_, i) => (
          <WaterEddy key={i} seed={i * 17 + 3} progress={progress} />
        ))}
      </div>
    </div>
  );
};

const RinsePhase = ({ items, paperTone, printVariationSeed = 0, onComplete, onFooterChange, trayBandHeight = 0 }) => {
  const stageScale = React.useContext(window.ScaleContext || React.createContext(1)) || 1;
  const [progress, setProgress] = React.useState(0);
  const duration = 6500;
  const startRef = React.useRef(null);
  const onFooterChangeRef = React.useRef(onFooterChange);
  onFooterChangeRef.current = onFooterChange;

  React.useEffect(() => {
    const waterSound = SoundManager.water(duration / 1000);
    const step = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(onComplete, 600);
    };
    requestAnimationFrame(step);
    return () => { if (waterSound) waterSound.stop(); };
  }, []);

  const pouring = progress < 0.62;
  const leadPct = wetFrontPercent(progress);

  const developT = easeInOut(Math.max(0, Math.min(1, (progress - 0.04) / 0.92)));
  const paperBg = lerpHex(EXPOSED_PAPER_HEX, CYANOTYPE_FINAL_HEX, developT);

  const paperSeed = React.useMemo(
    () => window.deriveCyanotypePaperSeed(items, printVariationSeed),
    [items, printVariationSeed],
  );
  const paperVariationBg = React.useMemo(
    () => window.buildCyanotypePaperVariationDataUrl(PAPER_W, PAPER_H, paperSeed),
    [paperSeed],
  );
  const variationOpacity = smoothstep(0.32, 0.96, developT);

  // Latent eases out; paper lerps throughout so the sheet never “empties” to a pale wash.
  const latentOpacity = 1 - smoothstep(0.04, 0.82, developT);
  // Plus-lighter stacks blow out to white if the whole isolation group is faded — fade per specimen instead.
  const silhouetteStrength = smoothstep(0.08, 0.98, developT);
  // Bright cap (cream + darken) tames plus-lighter overlaps; bring it in with silhouettes, not as a late snap.
  const brightCapOpacity = smoothstep(0.22, 0.96, developT);

  const speckleOpacity = Math.max(0, 1 - developT);

  const glossTop = Math.max(0, Math.min(100, leadPct * 0.96));
  // Screen gloss was washing the sheet to white; scale by wash progress and cap strength.
  const glossStrength = 0.14 + developT * 0.12;
  const displayScale = PHASE_PAPER_DISPLAY_BOOST;
  const paperTopOffset = PAPER_TOP_BASE - (PAPER_SCREEN_SHIFT_PX / Math.max(stageScale, 0.001));

  React.useEffect(() => {
    const setFooter = onFooterChangeRef.current;
    if (!setFooter) return;
    setFooter({
      status: `> Rinsing print · ${Math.round(progress * 100)}%`,
    });
  }, [progress]);

  React.useEffect(() => () => {
    const setFooter = onFooterChangeRef.current;
    if (setFooter) setFooter(null);
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'transparent',
      overflow: 'visible',
    }}>
      <div data-paper="true" style={{
        position: 'relative',
        top: paperTopOffset,
        zIndex: 1,
        width: PAPER_W, height: PAPER_H,
        background: paperTone.base,
        boxShadow: 'none',
        border: '1px solid #000000',
        overflow: 'hidden',
        transform: `scale(${displayScale})`,
        transformOrigin: 'top center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: paperBg,
        }}/>

        {variationOpacity > 0.004 && (
          <div style={{
            position: 'absolute', inset: 0,
            opacity: variationOpacity,
            backgroundImage: `url(${paperVariationBg})`,
            backgroundSize: '100% 100%',
            pointerEvents: 'none',
          }}/>
        )}

        {speckleOpacity > 0.02 && (
          <div style={{
            position: 'absolute', inset: 0,
            opacity: speckleOpacity,
            pointerEvents: 'none',
            ...EXPOSED_PAPER_SPECKLE,
          }}/>
        )}

        {/* Latent mask — end of Lift */}
        <div style={{
          position: 'absolute', inset: 0,
          opacity: latentOpacity,
          pointerEvents: 'none',
        }}>
          {items.map((item) => {
            const b = BOTANICALS[item.kind];
            const w = b.bounds.w * item.scale;
            const h = b.bounds.h * item.scale;
            return (
              <div key={item.id + '-latent'} style={{
                position: 'absolute',
                left: item.x - w / 2,
                top: item.y - h / 2,
                width: w, height: h,
                transform: `rotate(${item.rotation}deg)`,
              }}>
                <BotanicalSVG
                  kind={item.kind}
                  size={item.scale}
                  color={window.CYANOTYPE_LATENT_DENSE_HEX || '#7A8D94'}
                  asSilhouette={true}
                  silhouetteLatent={true}
                />
              </div>
            );
          })}
        </div>

        {/* Finished print — per-item opacity avoids premultiplied white on the isolated plus-lighter group. */}
        <div style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none',
        }}>
          <div style={window.CYANOTYPE_SPECIMEN_STACK_ISOLATION_STYLE}>
            {items.map(item => {
              const b = BOTANICALS[item.kind];
              const w = b.bounds.w * item.scale;
              const h = b.bounds.h * item.scale;
              return (
                <div key={item.id + '-print'} style={{
                  position: 'absolute',
                  left: item.x - w/2,
                  top: item.y - h/2,
                  width: w, height: h,
                  transform: `rotate(${item.rotation}deg)`,
                  opacity: silhouetteStrength,
                  ...window.CYANOTYPE_SPECIMEN_OVERLAP_BLEND_STYLE,
                }}>
                  <BotanicalSVG kind={item.kind} size={item.scale} color={window.CYANOTYPE_PRINT_SILHOUETTE_COLOR} asSilhouette={true}/>
                </div>
              );
            })}
          </div>
          <div style={{
            ...window.CYANOTYPE_SPECIMEN_BRIGHT_CAP_LAYER_STYLE,
            opacity: brightCapOpacity,
          }}/>
        </div>

        <div style={{
          position: 'absolute', inset: 0,
          opacity: glossStrength,
          background: `linear-gradient(180deg,
            rgba(200,220,240,0) 0%,
            rgba(200,220,240,0.35) ${glossTop - 8}%,
            rgba(200,220,240,0.5) ${glossTop}%,
            rgba(200,220,240,0.12) ${Math.min(100, glossTop + 18)}%,
            transparent ${Math.min(100, glossTop + 35)}%)`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}/>

        {pouring && (
          <OrganicWaterWash progress={progress} developT={developT} />
        )}
      </div>

      {pouring && (
        <div style={{
          position: 'absolute',
          zIndex: 0,
          left: '50%',
          top: `calc(50% - ${PAPER_H / 2}px + ${PAPER_H * 0.24}px)`,
          transform: `translateX(calc(-50% + ${Math.sin(progress * 4.8) * 8}px))`,
          width: PAPER_W * 0.96,
          height: PAPER_H * 0.58,
          background: [
            `radial-gradient(ellipse at 35% 45%, rgba(205,228,244,0.18) 0%, transparent 58%)`,
            `radial-gradient(ellipse at 72% 40%, rgba(188,214,238,0.14) 0%, transparent 60%)`,
            `linear-gradient(172deg, rgba(220,240,255,0.06) 0%, rgba(170,208,236,0.12) 48%, rgba(210,235,252,0.06) 100%)`,
          ].join(', '),
          pointerEvents: 'none',
          filter: 'blur(5px)',
          mixBlendMode: 'screen',
          opacity: 0.56,
        }}/>
      )}

    </div>
  );
};

window.RinsePhase = RinsePhase;
