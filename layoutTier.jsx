// Responsive layout tier + arrange-specific stage sizing (design px before ScaleStage transform).

const LayoutTierContext = React.createContext({
  tier: 'xl',
  vw: 1400,
  vh: 1040,
  compactArrangeChrome: false,
});

function computeTier(vw, vh) {
  if (vw < 480) return 'xs';
  if (vw < 720) return 'sm';
  if (vw < 1024) return 'md';
  if (vw < 1400) return 'lg';
  return 'xl';
}

function paperBoostForTierNum(tier) {
  switch (tier) {
    case 'xs': return 1.02;
    case 'sm': return 1.05;
    case 'md': return 1.08;
    case 'lg': return 1.1;
    default: return 1.14;
  }
}

/** Short viewport: always bottom tray; matches tighter arrange canvas height. */
const ARRANGE_SHORT_VH = 700;

/** Below this viewport height, step 1 locks stage scale and scrolls instead of shrinking further. */
const ARRANGE_SCALE_FLOOR_VH = ARRANGE_SHORT_VH;

/** Logical ScaleStage height for arrange + expose (app.jsx). */
const EXPOSE_STAGE_DESIGN_H = 1040;
const PHASE_PAPER_DISPLAY_BOOST = 1.14;
const PAPER_TOP_BASE = 16;
const PAPER_SCREEN_SHIFT_PX = 48;

/**
 * Arrange ScaleStage logical size — always the xl canvas so changing viewport width
 * does not swap in a smaller/larger design rect (which would rescale all content).
 */
function getArrangeScaleCanvasDimensions(_vh) {
  return { width: 1400, height: EXPOSE_STAGE_DESIGN_H };
}

function readViewportH(viewportH) {
  if (viewportH > 0) return viewportH;
  if (typeof window !== 'undefined') return window.innerHeight;
  return EXPOSE_STAGE_DESIGN_H;
}

/** Stage scale Expose would use at this viewport height (no tray inset). */
function getExposeEquivalentStageScale(viewportH) {
  return readViewportH(viewportH) / EXPOSE_STAGE_DESIGN_H;
}

/**
 * CSS transform scale on the paper so its screen size matches Expose at the same viewport,
 * compensating for arrange tray inset / shorter arrange canvas height.
 */
function getPhasePaperDisplayScale(currentStageScale, viewportH) {
  const s = Math.max(currentStageScale, 0.001);
  return (getExposeEquivalentStageScale(viewportH) / s) * PHASE_PAPER_DISPLAY_BOOST;
}

function getPhasePaperTopOffset(currentStageScale) {
  const s = Math.max(currentStageScale, 0.001);
  return PAPER_TOP_BASE - (PAPER_SCREEN_SHIFT_PX / s);
}

/** Fixed specimen rail width (screen px) — does not shrink with viewport. */
const TRAY_RAIL_WIDTH_PX = 210;

/** Reflow to bottom tray when gap from rail to progress stepper would be at or below this (screen px). */
const ARRANGE_STEPPER_LEFT_MIN_GAP_PX = 32;

/**
 * When already in compact (bottom tray) mode, stay there until the left margin is clearly wider.
 * Must be > ARRANGE_STEPPER_LEFT_MIN_GAP_PX to prevent rail↔bottom tray oscillation at the breakpoint.
 */
const ARRANGE_STEPPER_LEFT_GAP_EXIT_PX = 56;

/** Fallback until the stepper is measured in the DOM. */
const PHASE_STEPPER_ESTIMATE_WIDTH_PX = 380;

function compactLeftGapPx(vw, stepperWidthPx) {
  const trayPx = TRAY_RAIL_WIDTH_PX;
  const mainW = Math.max(0, vw - trayPx);
  const stepperW = stepperWidthPx > 0 ? stepperWidthPx : PHASE_STEPPER_ESTIMATE_WIDTH_PX;
  return (mainW - stepperW) / 2;
}

/**
 * Bottom tray when vertical space is tight, or when centering the stepper in the
 * main column (viewport minus fixed rail) would leave ≤32px to the left of it.
 */
function computeCompactArrangeChrome(vw, vh, stepperWidthPx) {
  if (vh <= ARRANGE_SHORT_VH) return true;
  return compactLeftGapPx(vw, stepperWidthPx) <= ARRANGE_STEPPER_LEFT_MIN_GAP_PX;
}

/**
 * Hysteresis: same decision as computeCompactArrangeChrome for enter, but requires extra margin
 * to leave compact mode. Breaks the feedback loop where rail width ↔ measured stepper width ↔
 * compact toggle caused flicker while resizing.
 *
 * @param {boolean|null} prevCompact  null on first run (same as instant compute)
 */
function nextCompactArrangeChrome(prevCompact, vw, vh, stepperWidthPx) {
  if (vh <= ARRANGE_SHORT_VH) return true;
  const leftGap = compactLeftGapPx(vw, stepperWidthPx);
  if (prevCompact == null) return leftGap <= ARRANGE_STEPPER_LEFT_MIN_GAP_PX;
  if (prevCompact) return leftGap <= ARRANGE_STEPPER_LEFT_GAP_EXIT_PX;
  return leftGap <= ARRANGE_STEPPER_LEFT_MIN_GAP_PX;
}

/** Screen px width of the left specimen rail (fixed; 0 in bottom-tray mode). */
function approxTrayRailWidthPx(_vw, _tier, trayBottomMode) {
  if (trayBottomMode) return 0;
  return TRAY_RAIL_WIDTH_PX;
}

function stageFitScale(vw, vh, stageW, stageH) {
  return Math.min(vw / Math.max(stageW, 1), vh / Math.max(stageH, 1));
}

/** Arrange: scale from viewport height only so narrowing vw shrinks side margins, not the paper. */
function stageArrangeFitScale(_vw, vh, _stageW, stageH, bottomInsetPx = 0) {
  const inset = Math.max(0, bottomInsetPx || 0);
  return Math.max(0, vh - inset) / Math.max(stageH, 1);
}

/**
 * Arrange (step 1): fit to viewport height, but never scale below the floor —
 * shorter viewports scroll instead of shrinking content (avoids a giant empty band).
 */
function getArrangeStageScalePolicy(vh, stageH, bottomInsetPx = 0) {
  const inset = Math.max(0, bottomInsetPx || 0);
  const natural = Math.max(0, vh - inset) / Math.max(stageH, 1);
  const minScale = Math.max(0, ARRANGE_SCALE_FLOOR_VH - inset) / Math.max(stageH, 1);
  if (natural >= minScale) {
    return { scale: natural, scrollable: false };
  }
  return { scale: minScale, scrollable: true };
}

function getArrangeStageDimensions(tier, vh) {
  const short = vh <= ARRANGE_SHORT_VH;
  const table = {
    xs: [420, 740],
    sm: [560, 780],
    md: [780, 820],
    lg: [1040, 920],
    xl: [1400, 1040],
  };
  const pair = table[tier] || table.xl;
  let width = pair[0];
  let height = pair[1];
  if (short) height = Math.min(height, 640);
  return { width, height };
}

function useLayoutTier() {
  const read = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return {
        tier: 'xl',
        vw: 1400,
        vh: 1040,
        compactArrangeChrome: false,
      };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tier = computeTier(vw, vh);
    return {
      tier,
      vw,
      vh,
      compactArrangeChrome: computeCompactArrangeChrome(vw, vh, null),
    };
  }, []);

  const [state, setState] = React.useState(read);

  React.useEffect(() => {
    const onResize = () => setState(read());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [read]);

  return state;
}

window.LayoutTierContext = LayoutTierContext;
window.useLayoutTier = useLayoutTier;
window.computeTier = computeTier;
window.getArrangeStageDimensions = getArrangeStageDimensions;
window.getArrangeScaleCanvasDimensions = getArrangeScaleCanvasDimensions;
window.computeCompactArrangeChrome = computeCompactArrangeChrome;
window.nextCompactArrangeChrome = nextCompactArrangeChrome;
window.ARRANGE_STEPPER_LEFT_GAP_EXIT_PX = ARRANGE_STEPPER_LEFT_GAP_EXIT_PX;
window.approxTrayRailWidthPx = approxTrayRailWidthPx;
window.TRAY_RAIL_WIDTH_PX = TRAY_RAIL_WIDTH_PX;
window.ARRANGE_STEPPER_LEFT_MIN_GAP_PX = ARRANGE_STEPPER_LEFT_MIN_GAP_PX;
window.stageFitScale = stageFitScale;
window.stageArrangeFitScale = stageArrangeFitScale;
window.getArrangeStageScalePolicy = getArrangeStageScalePolicy;
window.ARRANGE_SCALE_FLOOR_VH = ARRANGE_SCALE_FLOOR_VH;
window.EXPOSE_STAGE_DESIGN_H = EXPOSE_STAGE_DESIGN_H;
window.PHASE_PAPER_DISPLAY_BOOST = PHASE_PAPER_DISPLAY_BOOST;
window.getPhasePaperDisplayScale = getPhasePaperDisplayScale;
window.getPhasePaperTopOffset = getPhasePaperTopOffset;
