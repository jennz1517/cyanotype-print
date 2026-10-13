// BrushAsidePhase — after exposure, pressed specimens are swept from the sheet
// to uncover the latent UV mask (lighter imprints) before rinsing.

const EXPOSED_PAPER_HEX = window.EXPOSED_COATED_PAPER_HEX || '#7A7F75';

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

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const LIFT_TOTAL_MS = 4400;
const LIFT_ANIM_START = 0.06;
const LIFT_ANIM_SPAN = 0.4;
/** Normalized time (0..1) when specimen motion reaches the edge (matches raw === 1 below). */
const LIFT_SPECIMENS_OFF_T = LIFT_ANIM_START + LIFT_ANIM_SPAN;
const RINSE_VISIBLE_T = LIFT_SPECIMENS_OFF_T + (220 / LIFT_TOTAL_MS);
const PHASE_PAPER_DISPLAY_BOOST = 1.14;
const PAPER_TOP_BASE = 16;
const PAPER_SCREEN_SHIFT_PX = 48;

const BrushAsidePhase = ({ items, onComplete, onLiftSpecimensOff, onFooterChange, onFooterClicks, trayBandHeight = 0 }) => {
  const stageScale = React.useContext(window.ScaleContext || React.createContext(1)) || 1;
  const [liftStarted, setLiftStarted] = React.useState(false);
  const [t, setT] = React.useState(0);
  const rafRef = React.useRef(0);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onFooterChangeRef = React.useRef(onFooterChange);
  onFooterChangeRef.current = onFooterChange;
  const onFooterClicksRef = React.useRef(onFooterClicks);
  onFooterClicksRef.current = onFooterClicks;
  const rinseStartedRef = React.useRef(false);
  const liftOffReportedRef = React.useRef(false);

  React.useEffect(() => {
    if (!liftStarted || !onLiftSpecimensOff) return;
    if (t < LIFT_SPECIMENS_OFF_T) return;
    if (liftOffReportedRef.current) return;
    liftOffReportedRef.current = true;
    onLiftSpecimensOff();
  }, [t, liftStarted, onLiftSpecimensOff]);

  React.useEffect(() => {
    if (!liftStarted) return;
    rinseStartedRef.current = false;
    const t0 = performance.now();
    const loop = (now) => {
      const p = Math.min(1, (now - t0) / LIFT_TOTAL_MS);
      setT(p);
      if (p < 1) rafRef.current = requestAnimationFrame(loop);
      else setT(1);
    };
    rafRef.current = requestAnimationFrame(loop);
    SoundManager.rustle();
    return () => cancelAnimationFrame(rafRef.current);
  }, [liftStarted]);

  const tRef = React.useRef(t);
  tRef.current = t;

  const startLift = React.useCallback(() => {
    setLiftStarted(true);
  }, []);

  const handleRinse = React.useCallback(() => {
    if (rinseStartedRef.current || tRef.current < RINSE_VISIBLE_T) return;
    rinseStartedRef.current = true;
    onCompleteRef.current();
  }, []);

  // Bind live click handlers when the footer action mode changes (not every anim frame).
  const footerMode = !liftStarted ? 'lift' : (t >= RINSE_VISIBLE_T ? 'rinse' : 'lifting');
  React.useLayoutEffect(() => {
    const bind = onFooterClicksRef.current;
    if (!bind) return undefined;
    if (footerMode === 'lift') bind([startLift]);
    else if (footerMode === 'rinse') bind([handleRinse]);
    else bind([]);
    return () => bind([]);
  }, [footerMode, startLift, handleRinse]);

  React.useEffect(() => {
    const setFooter = onFooterChangeRef.current;
    if (!setFooter) return;
    let status = '> Lift specimens to reveal the latent print';
    let action = null;
    if (footerMode === 'lift') {
      action = { label: 'Lift specimens →', variant: 'primary' };
    } else if (footerMode === 'rinse') {
      status = '> Rinse with water to reveal the print.';
      action = { label: 'Rinse →', variant: 'primary' };
    } else {
      status = '> Lifting specimens…';
    }
    setFooter({ status, action });
  }, [footerMode]);

  React.useEffect(() => () => {
    const setFooter = onFooterChangeRef.current;
    if (setFooter) setFooter(null);
    const bind = onFooterClicksRef.current;
    if (bind) bind([]);
  }, []);

  // All specimens share the same motion window (no stagger).
  const raw =
    t <= LIFT_ANIM_START ? 0 : t >= LIFT_SPECIMENS_OFF_T ? 1 : (t - LIFT_ANIM_START) / LIFT_ANIM_SPAN;
  const e = easeOutCubic(raw);
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : undefined;
  const paperLayout = window.getContinuousPhasePaperLayout
    ? window.getContinuousPhasePaperLayout(stageScale, viewportH)
    : {
      displayScale: PHASE_PAPER_DISPLAY_BOOST,
      paperTopOffset: PAPER_TOP_BASE - (PAPER_SCREEN_SHIFT_PX / Math.max(stageScale, 0.001)),
    };
  const displayScale = paperLayout.displayScale;
  const paperTopOffset = paperLayout.paperTopOffset;
  return (
    <motion.div
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
              zIndex: 1,
              width: PAPER_W,
              height: PAPER_H,
              flexShrink: 0,
              transform: `scale(${displayScale})`,
              transformOrigin: 'top center',
            }}
          >
            <motion.div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              background: EXPOSED_PAPER_HEX,
              boxShadow: 'none',
              border: '1px solid #000000',
              overflow: 'hidden',
            }}>
              <motion.div style={{ position: 'absolute', inset: 0, ...EXPOSED_PAPER_SPECKLE }}/>

          <div style={{
            position: 'absolute', inset: 0,
            pointerEvents: 'none',
          }}>
            {items.map((item) => {
              const b = BOTANICALS[item.kind];
              const w = b.bounds.w * item.scale;
              const h = b.bounds.h * item.scale;
              return (
                <div key={item.id + '-imprint'} style={{
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

          {items.map((item, index) => {
            const b = BOTANICALS[item.kind];
            const w = b.bounds.w * item.scale;
            const h = b.bounds.h * item.scale;
            // Exit direction follows specimen position on paper to avoid crossing paths:
            // left-half items move left, right-half items move right.
            const exitRight = item.x >= PAPER_W / 2;
            const margin = 80;
            const halfDiag = Math.hypot(w, h) / 2;
            let txEnd;
            if (exitRight) {
              txEnd = PAPER_W + margin - item.x - w / 2 + halfDiag;
            } else {
              txEnd = -margin - item.x + w / 2 - halfDiag;
            }
            const tx = e * txEnd;
            const ty = e * (26 + (index % 3) * 10) * (exitRight ? 1 : -1) + Math.sin(e * Math.PI) * -22;
            const rot = item.rotation + e * (exitRight ? 1 : -1) * (16 + (index % 5) * 2.5);
            const blur = Math.sin(e * Math.PI) * 2.2;
            const opacity = e > 0.88 ? Math.max(0, 1 - (e - 0.88) / 0.12) : 1;
            return (
              <div key={item.id + '-brush'} style={{
                position: 'absolute',
                left: item.x - w / 2,
                top: item.y - h / 2,
                width: w, height: h,
                transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${1 + e * 0.03})`,
                opacity,
                filter: blur > 0.05 ? `drop-shadow(0 4px 8px oklch(25% 0.02 55 / 0.2)) blur(${blur}px)` : 'drop-shadow(0 4px 8px oklch(25% 0.02 55 / 0.2))',
                pointerEvents: 'none',
                zIndex: 2,
              }}>
                <BotanicalSVG kind={item.kind} size={item.scale} color="#000000"/>
              </div>
            );
          })}
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

window.BrushAsidePhase = BrushAsidePhase;
