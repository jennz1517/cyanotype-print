// Main app shell — orchestrates the four phases and the tweak panel.

const ScaleContext = React.createContext(1);
window.ScaleContext = ScaleContext;

/** Layout px: horizontal center of arrange chrome (stepper + paper column). */
const ArrangeHCenterContext = React.createContext(null);
window.ArrangeHCenterContext = ArrangeHCenterContext;

const UI = () => window.UI_THEME || {
  bg: '#ffffff', bgSoft: '#f7f7f7', fg: '#000000', fgMuted: '#5a5a5a',
  line: '#000000', lineSoft: '#d4d4d4', lineWidth: 1,
  font: 'sans-serif', fontMono: 'monospace',
  paperShadow: 'none', panelShadow: '4px 4px 0 #000000',
};

/** Specimen tray column width in the arrange grid (design px). */
/** Tray column width (design px) — fits two portrait specimen cards side by side. */
const ARRANGE_TRAY_COL_PX = 400;
/** Left inset of specimen cards in the arrange tray (matches BotanicalTray sideRail grid padding). */
const ARRANGE_TRAY_SPECIMEN_INSET_PX = 24;

// Stage strip colors (shared by chrome + full-bleed viewport bands)
const STAGE_MIDDLE_BG = '#ffffff';
const STAGE_STRIP_BG = '#ffffff';
const STAGE_RULE = '#000000';

// Letterboxed viewport gutters — match each phase’s workspace so wide screens don’t show a mismatched frame.
const BLEED_EXPOSE = 'linear-gradient(180deg, #ececec 0%, #d8d8d8 100%)';

const middleBleedBackground = (phase) => {
  switch (phase) {
    case 'expose': return BLEED_EXPOSE;
    case 'brush': return STAGE_MIDDLE_BG;
    case 'rinse': return STAGE_MIDDLE_BG;
    case 'reveal': return STAGE_MIDDLE_BG;
    default: return STAGE_MIDDLE_BG;
  }
};

/** Fallback until the portaled bottom tray is measured (compact row layout). */
const ARRANGE_BOTTOM_TRAY_ESTIMATE_PX = 220;

/** Specimen tray slide-out when leaving step 1 (arrange → expose). */
const TRAY_SIDE_EXIT_MS = 380;
const TRAY_BOTTOM_EXIT_MS = 750;
const TRAY_EXIT_EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';
const TRAY_EXIT_Z = 10000;
/** Footer band sits above the sliding tray so it passes underneath the action grid. */
const TRAY_EXIT_FOOTER_Z = 10001;
const TRAY_BOTTOM_EXIT_FALLBACK_FOOTER_PX = 56;

const trayExitDurationMs = (bottomExit) => (bottomExit ? TRAY_BOTTOM_EXIT_MS : TRAY_SIDE_EXIT_MS);

const cubicBezierAt = (t, p0, p1, p2, p3) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

/** Easing fn matching TRAY_EXIT_EASE — drives tray + paper inset in one rAF loop. */
const TRAY_EXIT_EASE_FN = (() => {
  const p1x = 0.33;
  const p1y = 1;
  const p2x = 0.68;
  const p2y = 1;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t0 = 0;
    let t1 = 1;
    for (let i = 0; i < 10; i += 1) {
      const tm = (t0 + t1) / 2;
      if (cubicBezierAt(tm, 0, p1x, p2x, 1) < x) t0 = tm;
      else t1 = tm;
    }
    const t = (t0 + t1) / 2;
    return cubicBezierAt(t, 0, p1y, p2y, 1);
  };
})();

const STEPPER_PHASE_TRANSITION_MS = 420;

const trayBleedBackground = (phase) => {
  switch (phase) {
    case 'expose': return BLEED_EXPOSE;
    case 'brush': return STAGE_MIDDLE_BG;
    case 'rinse': return STAGE_MIDDLE_BG;
    case 'reveal': return STAGE_MIDDLE_BG;
    default: return STAGE_STRIP_BG;
  }
};

const PAPER_TONES = {
  cream:  { base: '#f2ead6', texture: 'radial-gradient(circle at 20% 30%, rgba(120,90,50,0.05) 0, transparent 3px), radial-gradient(circle at 70% 60%, rgba(120,90,50,0.04) 0, transparent 2px), radial-gradient(circle at 45% 80%, rgba(120,90,50,0.04) 0, transparent 2px)', negative: '#efe3c5', name: 'Cream' },
  white:  { base: '#FEFCF4', texture: 'none', negative: '#FEFCF4', name: 'White' },
  aged:   { base: '#e5d4a8', texture: 'radial-gradient(circle at 20% 30%, rgba(110,70,30,0.08) 0, transparent 3px), radial-gradient(circle at 70% 60%, rgba(110,70,30,0.06) 0, transparent 2px), radial-gradient(circle at 45% 80%, rgba(110,70,30,0.06) 0, transparent 2px), radial-gradient(circle at 85% 20%, rgba(110,70,30,0.05) 0, transparent 4px)', negative: '#e0cda0', name: 'Aged' },
};

// Renders a preview that follows the cursor when dragging from the tray
const DragGhost = ({ kind, x, y }) => {
  if (!kind) return null;
  const b = BOTANICALS[kind];
  const s = Math.min(180 / b.bounds.w, 220 / b.bounds.h);
  return (
    <div style={{
      position: 'fixed',
      left: x, top: y,
      pointerEvents: 'none',
      zIndex: 10000,
      transform: 'translate(-50%, -50%)',
      opacity: 0.85,
    }}>
      <div style={{transform: `scale(${s})`, transformOrigin: 'center'}}>
        <BotanicalSVG kind={kind} color="#000000"/>
      </div>
    </div>
  );
};

// Portal the drag ghost to document.body so it's above the scaled stage
const DragGhostPortal = (props) => {
  if (!props.kind) return null;
  return ReactDOM.createPortal(<DragGhost {...props}/>, document.body);
};

const SpecimenTrayScroll = window.SpecimenTrayScroll;

const App = () => {
  const stageScale = React.useContext(ScaleContext);
  const layoutBase = window.useLayoutTier ? window.useLayoutTier() : {
    tier: 'xl', vw: 1400, vh: 1040, compactArrangeChrome: false,
  };
  const [stepperWidthPx, setStepperWidthPx] = React.useState(0);
  const [arrangeContentCenterX, setArrangeContentCenterX] = React.useState(null);
  const compactChromeStableRef = React.useRef(null);
  const compactArrangeChrome = window.nextCompactArrangeChrome
    ? window.nextCompactArrangeChrome(
      compactChromeStableRef.current,
      layoutBase.vw,
      layoutBase.vh,
      stepperWidthPx || null,
    )
    : (window.computeCompactArrangeChrome
      ? window.computeCompactArrangeChrome(layoutBase.vw, layoutBase.vh, stepperWidthPx || null)
      : layoutBase.compactArrangeChrome);
  compactChromeStableRef.current = compactArrangeChrome;
  const layout = { ...layoutBase, compactArrangeChrome };
  const arrangeStage = window.getArrangeScaleCanvasDimensions
    ? window.getArrangeScaleCanvasDimensions(layout.vh)
    : { width: 1400, height: 1040 };
  // Phase: arrange | expose | brush | rinse | reveal
  const [phase, setPhase] = React.useState('arrange');
  /** Stepper highlight — lags arrange→expose until tray slide-out finishes. */
  const [stepperPhase, setStepperPhase] = React.useState('arrange');
  React.useEffect(() => {
    if (phase !== 'arrange') setArrangeContentCenterX(null);
  }, [phase]);
  const [trayOverlayState, setTrayOverlayState] = React.useState('shown'); // shown | exiting | hidden
  const [items, setItems] = React.useState([]);
  const [selectedItemId, setSelectedItemId] = React.useState(null);
  const [printVariationSeed, setPrintVariationSeed] = React.useState(
    () => (Math.random() * 0xffffffff) >>> 0,
  );
  const [paperToneKey, setPaperToneKey] = React.useState('white');

  // Tweak defaults — host-persisted
  const TWEAKS = /*EDITMODE-BEGIN*/{
    "defaultPaperTone": "white"
  }/*EDITMODE-END*/;

  // Drag ghost state (for tray->paper drop)
  const [drag, setDrag] = React.useState(null); // {kind, x, y}

  // Tweak panel visibility
  const [tweaksVisible, setTweaksVisible] = React.useState(false);

  // Reserve the tray strip height when the tray is hidden so main (paper + stepper) does not re-center.
  const [trayBandHeight, setTrayBandHeight] = React.useState(ARRANGE_BOTTOM_TRAY_ESTIMATE_PX);
  const [arrangeTrayTop, setArrangeTrayTop] = React.useState(58);
  const trayPortalRef = React.useRef(null);
  const gridAsideRef = React.useRef(null);
  /** Screen rect captured from the in-grid tray before step 2 mounts (for slide-out overlay). */
  const [exitTraySnapshot, setExitTraySnapshot] = React.useState(null);
  /** Linear 0..1 progress while tray exit rAF runs (null when idle). */
  const [trayExitT, setTrayExitT] = React.useState(null);
  const trayExitRafRef = React.useRef(0);
  const [footerExitBand, setFooterExitBand] = React.useState(null);

  React.useEffect(() => {
    const onMessage = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweaksVisible(true);
      else if (e.data.type === '__deactivate_edit_mode') setTweaksVisible(false);
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Apply initial tweaks
  React.useEffect(() => {
    if (TWEAKS.defaultPaperTone && PAPER_TONES[TWEAKS.defaultPaperTone]) {
      setPaperToneKey(TWEAKS.defaultPaperTone);
    }
  }, []);

  const paperTone = PAPER_TONES[paperToneKey] || PAPER_TONES.cream;

  // Drag-from-tray handling
  const handlePickup = (kind, x, y) => {
    setDrag({ kind, x, y });
  };
  const swallowPostDropPointer = React.useCallback(() => {
    const stop = (ev) => { ev.stopPropagation(); };
    const kinds = ['pointerdown', 'mousedown'];
    const cleanup = () => {
      for (const k of kinds) window.removeEventListener(k, stop, true);
    };
    for (const k of kinds) window.addEventListener(k, stop, true);
    requestAnimationFrame(cleanup);
    setTimeout(cleanup, 0);
  }, []);
  React.useEffect(() => {
    if (!drag) return;
    const onMove = (e) => setDrag(d => d ? { ...d, x: e.clientX, y: e.clientY } : null);
    const onUp = (e) => {
      const id = ArrangePhase._addItem
        ? ArrangePhase._addItem(drag.kind, e.clientX, e.clientY)
        : null;
      if (id) {
        setSelectedItemId(id);
        swallowPostDropPointer();
      }
      setDrag(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag, swallowPostDropPointer]);

  const trayBandAtExposeStartRef = React.useRef(ARRANGE_BOTTOM_TRAY_ESTIMATE_PX);
  const [exposeTransitionInsetPx, setExposeTransitionInsetPx] = React.useState(0);

  const finishTrayExit = React.useCallback(() => {
    setTrayExitT(null);
    setTrayOverlayState('hidden');
    setExitTraySnapshot(null);
    setFooterExitBand(null);
    setExposeTransitionInsetPx(0);
    setPhase('expose');
    setStepperPhase('expose');
  }, []);

  const runTrayExitAnimation = React.useCallback((bottomExit) => {
    const reduced = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      finishTrayExit();
      return;
    }
    const startInset = trayBandAtExposeStartRef.current;
    const duration = trayExitDurationMs(bottomExit);
    const animateInset = layout.compactArrangeChrome || bottomExit;
    setTrayOverlayState('exiting');
    setTrayExitT(0);
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / duration);
      const eased = TRAY_EXIT_EASE_FN(u);
      setTrayExitT(u);
      if (animateInset) setExposeTransitionInsetPx(startInset * (1 - eased));
      if (u < 1) {
        trayExitRafRef.current = requestAnimationFrame(step);
      } else {
        finishTrayExit();
      }
    };
    trayExitRafRef.current = requestAnimationFrame(step);
  }, [finishTrayExit, layout.compactArrangeChrome]);

  React.useEffect(() => () => {
    if (trayExitRafRef.current) cancelAnimationFrame(trayExitRafRef.current);
  }, []);

  const toExpose = () => {
    if (items.length === 0) return;
    setPrintVariationSeed((Math.random() * 0xffffffff) >>> 0);
    trayBandAtExposeStartRef.current = trayBandHeight;
    if (layout.compactArrangeChrome) {
      setExposeTransitionInsetPx(trayBandHeight);
    }
    const reduced = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setExitTraySnapshot(null);
      setFooterExitBand(null);
      setTrayExitT(null);
      setPhase('expose');
      setStepperPhase('expose');
      setTrayOverlayState('hidden');
      setExposeTransitionInsetPx(0);
      return;
    }
    const aside = gridAsideRef.current;
    const rect = aside?.getBoundingClientRect();
    const footerEl = sectionRefs.current.footer?.current;
    const footerRect = footerEl?.getBoundingClientRect();
    const footerBandPx = footerRect?.height > 0
      ? Math.ceil(footerRect.height)
      : TRAY_BOTTOM_EXIT_FALLBACK_FOOTER_PX;
    // Bottom strip: stacked grid (vw < 900) or wide horizontal aside; else portaled compact tray.
    const bottomExit = layout.vw < 900
      || (rect && rect.width > rect.height * 1.15)
      || (layout.compactArrangeChrome && !rect);
    if (bottomExit && footerRect && footerRect.height > 0) {
      setFooterExitBand({
        top: footerRect.top,
        left: footerRect.left,
        width: footerRect.width,
        height: footerRect.height,
      });
    } else {
      setFooterExitBand(null);
    }
    if (rect && rect.width > 0 && rect.height > 0) {
      setExitTraySnapshot({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottomExit,
        footerBandPx,
      });
    } else {
      setExitTraySnapshot(bottomExit ? { bottomExit: true, footerBandPx, portaledOnly: true } : null);
    }
    setTrayOverlayState('shown');
    requestAnimationFrame(() => runTrayExitAnimation(bottomExit));
  };
  const [brushLiftComplete, setBrushLiftComplete] = React.useState(false);
  const [exposeProgress, setExposeProgress] = React.useState(0);
  const [exposeSkipRequested, setExposeSkipRequested] = React.useState(false);
  const exposeSkipRef = React.useRef(null);
  const exposeSkipRequestedRef = React.useRef(false);
  exposeSkipRequestedRef.current = exposeSkipRequested;
  const onExposeComplete = React.useCallback(() => {
    setBrushLiftComplete(false);
    setPhase('brush');
  }, []);
  const onBrushLiftSpecimensOff = React.useCallback(() => setBrushLiftComplete(true), []);
  const onBrushComplete = React.useCallback(() => setPhase('rinse'), []);
  const onRinseComplete = React.useCallback(() => setPhase('reveal'), []);

  const onNew = () => {
    if (trayExitRafRef.current) cancelAnimationFrame(trayExitRafRef.current);
    setItems([]);
    setSelectedItemId(null);
    setTrayOverlayState('shown');
    setExitTraySnapshot(null);
    setFooterExitBand(null);
    setTrayExitT(null);
    setExposeTransitionInsetPx(0);
    setPhase('arrange');
    setStepperPhase('arrange');
  };

  // Testing shortcut: return to the first screen (arrange), same reset as “Begin another print”.
  const onDevPhaseExit = React.useCallback(() => {
    if (trayExitRafRef.current) cancelAnimationFrame(trayExitRafRef.current);
    setItems([]);
    setSelectedItemId(null);
    setTrayOverlayState('shown');
    setExitTraySnapshot(null);
    setFooterExitBand(null);
    setTrayExitT(null);
    setExposeTransitionInsetPx(0);
    setPhase('arrange');
    setStepperPhase('arrange');
  }, []);

  React.useEffect(() => {
    if (phase === 'arrange') setStepperPhase('arrange');
    else if (phase !== 'expose') setStepperPhase(phase);
  }, [phase]);

  React.useEffect(() => {
    if (phase !== 'expose') {
      setExposeProgress(0);
      setExposeSkipRequested(false);
      return undefined;
    }

    let cancelled = false;
    let timerId = 0;
    let skipTimerId = 0;
    const duration = 7000;
    let t0 = performance.now();
    let skipFrom = 0;
    const sunDrone = SoundManager.sunDrone();

    const tick = () => {
      if (cancelled) return;
      const p = Math.min(1, (performance.now() - t0) / duration);
      setExposeProgress(p);
      if (p >= 1) {
        clearInterval(timerId);
        setTimeout(() => {
          if (!cancelled) onExposeComplete();
        }, 800);
      }
    };

    exposeSkipRef.current = () => {
      if (cancelled || exposeSkipRequestedRef.current) return;
      setExposeSkipRequested(true);
      skipFrom = Math.min(1, (performance.now() - t0) / duration);
      clearInterval(timerId);
      const skipT0 = performance.now();
      const skipDur = 1200;
      skipTimerId = setInterval(() => {
        if (cancelled) return;
        const k = Math.min(1, (performance.now() - skipT0) / skipDur);
        const p = skipFrom + (1 - skipFrom) * k;
        setExposeProgress(p);
        if (k >= 1) {
          clearInterval(skipTimerId);
          setTimeout(() => {
            if (!cancelled) onExposeComplete();
          }, 400);
        }
      }, 50);
    };

    setExposeProgress(0);
    timerId = setInterval(tick, 50);
    tick();

    return () => {
      cancelled = true;
      clearInterval(timerId);
      clearInterval(skipTimerId);
      exposeSkipRef.current = null;
      if (sunDrone) sunDrone.stop();
    };
  }, [phase, onExposeComplete]);

  const onSave = async (paperEl) => {
    // Render the paper element to a PNG via canvas by rasterizing its visual layers.
    // Since we can't use html2canvas, we'll build the image manually from data.
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = PAPER_W * scale;
    canvas.height = PAPER_H * scale;
    const ctx = canvas.getContext('2d');

    const paperSeed = window.deriveCyanotypePaperSeed(items, printVariationSeed);
    window.drawCyanotypePaperVariation(ctx, canvas.width, canvas.height, paperSeed);

    // Specimens: composite in isolation with "lighter" so overlaps add toward white (matches reveal + rinse).
    const specCanvas = document.createElement('canvas');
    specCanvas.width = canvas.width;
    specCanvas.height = canvas.height;
    const sctx = specCanvas.getContext('2d');
    for (const item of items) {
      const b = BOTANICALS[item.kind];
      const w = b.bounds.w * item.scale;
      const h = b.bounds.h * item.scale;
      const svgStr = await buildItemSvgString(item, window.CYANOTYPE_PRINT_DENSE_HEX || '#F8F8F2');
      const img = await loadSvgAsImage(svgStr);
      sctx.globalCompositeOperation = 'lighter';
      sctx.save();
      sctx.translate(item.x * scale, item.y * scale);
      sctx.rotate(item.rotation * Math.PI / 180);
      sctx.drawImage(img, -w * scale / 2, -h * scale / 2, w * scale, h * scale);
      sctx.restore();
    }
    sctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(specCanvas, 0, 0);
    ctx.globalCompositeOperation = 'darken';
    ctx.fillStyle = window.CYANOTYPE_PRINT_DENSE_HEX || '#F8F8F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    if (window.drawCyanotypePaperGrain) {
      window.drawCyanotypePaperGrain(ctx, canvas.width, canvas.height, paperSeed, {
        tiled: true,
        opacity: 0.13,
        blend: 'multiply',
      });
    }

    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cyanotype-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const sectionRefs = React.useRef({
    header: React.createRef(),
    stepper: React.createRef(),
    main: React.createRef(),
    tray: React.createRef(),
    footer: React.createRef(),
  });
  const useArrangeGridLayout = phase === 'arrange';
  const showPhaseFooter = phase === 'arrange' || phase === 'expose' || phase === 'brush' || phase === 'rinse' || phase === 'reveal';
  const [phaseFooter, setPhaseFooterState] = React.useState(null);
  // Handlers are written by the active phase on every layout (not via footer state),
  // so remounts/HMR cannot leave the footer wired to a dead setState.
  const phaseFooterOnClicksRef = React.useRef([]);
  const setPhaseFooter = React.useCallback((next) => {
    setPhaseFooterState((prev) => {
      if (next == null) return prev == null ? prev : null;
      if (prev == null) return next;
      const prevActs = prev.actions?.length ? prev.actions : (prev.action ? [prev.action] : []);
      const nextActs = next.actions?.length ? next.actions : (next.action ? [next.action] : []);
      const prevAct = prevActs[0];
      const nextAct = nextActs[0];
      if (
        prev.status === next.status
        && prevActs.length === nextActs.length
        && prevActs.every((a, i) => a?.label === nextActs[i]?.label && !!a?.disabled === !!nextActs[i]?.disabled)
        && prevAct?.variant === nextAct?.variant
      ) {
        return prev;
      }
      return next;
    });
  }, []);
  const bindPhaseFooterClicks = React.useCallback((clicks) => {
    phaseFooterOnClicksRef.current = Array.isArray(clicks) ? clicks : [];
  }, []);
  const phaseFooterActions = phaseFooter?.actions?.length
    ? phaseFooter.actions
    : (phaseFooter?.action ? [phaseFooter.action] : []);
  const showFooterActionColumn = phase === 'arrange' || phase === 'expose' || phaseFooterActions.length > 0;
  const exposeElapsedSec = Math.floor(exposeProgress * 7);
  const arrangeStacked = useArrangeGridLayout && layout.vw < 900;
  const shellRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (phase !== 'arrange') return;
    const readTop = () => {
      const headerEl = sectionRefs.current.header?.current;
      if (!headerEl) return;
      const nextTop = Math.round(headerEl.getBoundingClientRect().bottom);
      if (nextTop > 0) setArrangeTrayTop(nextTop);
    };
    readTop();
    window.addEventListener('resize', readTop);
    const ro = new ResizeObserver(readTop);
    const headerEl = sectionRefs.current.header?.current;
    if (headerEl) ro.observe(headerEl);
    return () => {
      window.removeEventListener('resize', readTop);
      ro.disconnect();
    };
  }, [phase]);

  React.useLayoutEffect(() => {
    if (phase !== 'arrange' || !layout.compactArrangeChrome) return;
    const el = trayPortalRef.current;
    if (!el) return;
    const read = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) {
        setTrayBandHeight(prev => (Math.abs(h - prev) > 3 ? h : prev));
      }
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase, layout.compactArrangeChrome, stageScale, trayOverlayState]);

  const exposeStageH = window.EXPOSE_STAGE_DESIGN_H || 1040;
  const stageW = phase === 'arrange' ? arrangeStage.width : 1400;
  const stageH = phase === 'arrange' ? arrangeStage.height : exposeStageH;
  const arrangeTrayBottomMode = layout.compactArrangeChrome && phase === 'arrange';
  /** Keep bottom-tray portal geometry during slide-out; phase is already `expose` while `exiting`. */
  const trayPortalBottomMode = layout.compactArrangeChrome && (phase === 'arrange' || trayOverlayState === 'exiting');
  /** Portaled bottom tray only — grid layout keeps tray in-flow (no scale inset). */
  const arrangeBottomInsetPx = (arrangeTrayBottomMode && !useArrangeGridLayout) ? trayBandHeight : 0;
  const arrangeScrollable = phase === 'arrange' && window.getArrangeStageScalePolicy
    ? window.getArrangeStageScalePolicy(layout.vh, stageH, arrangeBottomInsetPx).scrollable
    : false;
  const layoutCtx = {
    ...layout,
    arrangeScrollable,
    arrangePaperBottomInsetPx: phase === 'arrange' ? arrangeBottomInsetPx : 0,
  };

  const trayRailSurfacePx = window.approxTrayRailWidthPx
    ? window.approxTrayRailWidthPx(layout.vw, layout.tier, arrangeTrayBottomMode)
    : 0;
  const fitScale = phase === 'arrange'
    ? (window.stageArrangeFitScale
      ? window.stageArrangeFitScale(layout.vw, layout.vh, stageW, stageH, arrangeBottomInsetPx)
      : (layout.vh - arrangeBottomInsetPx) / Math.max(stageH, 0.001))
    : (window.stageArrangeFitScale
      ? window.stageArrangeFitScale(layout.vw, layout.vh, stageW, stageH, 0)
      : layout.vh / Math.max(stageH, 0.001));
  const trayExiting = trayOverlayState === 'exiting';
  const trayExitEased = trayExitT != null ? TRAY_EXIT_EASE_FN(trayExitT) : 0;
  const sideTrayRemain = trayExiting ? 1 - trayExitEased : 1;
  const arrangeSideTrayPx = ((phase === 'arrange' || trayExiting) && !useArrangeGridLayout && !arrangeTrayBottomMode && !exitTraySnapshot)
    ? trayRailSurfacePx * sideTrayRemain
    : 0;
  const exitLeftScreen = (phase === 'arrange' && !arrangeTrayBottomMode && !trayExiting)
    ? trayRailSurfacePx + 12
    : 14;
  const trayExitTransform = (bottomExit, footerPx) => {
    if (trayExitEased <= 0) return 'translate(0, 0)';
    const p = trayExitEased;
    if (bottomExit) {
      const band = footerPx ?? TRAY_BOTTOM_EXIT_FALLBACK_FOOTER_PX;
      return `translateY(calc(${p} * (100% + ${band}px)))`;
    }
    return `translateX(calc(-${p} * (100% + 8px)))`;
  };
  const LayoutTierCtx = window.LayoutTierContext || React.createContext({ tier: 'xl', compactArrangeChrome: false });
  return (
    <LayoutTierCtx.Provider value={layoutCtx}>
    <>
    <ScaleStage
      width={stageW}
      height={stageH}
      bandRefs={sectionRefs.current}
      layoutSignal={phase}
      stretchToViewportWidth
      arrangeSideTrayPx={arrangeSideTrayPx}
      arrangeBottomInsetPx={arrangeBottomInsetPx}
      exposeTransitionInsetPx={exposeTransitionInsetPx}
      trayExiting={trayExiting}
    >
    <ArrangeHCenterContext.Provider value={arrangeContentCenterX}>
    <div ref={shellRef} style={{
      position: 'absolute', inset: 0,
      background: 'transparent',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div ref={sectionRefs.current.header} style={{
        padding: phase === 'arrange'
          ? `14px 20px 14px ${arrangeStacked ? 12 : ARRANGE_TRAY_SPECIMEN_INSET_PX}px`
          : '14px 20px',
        background: UI().bg,
        borderBottom: `1px solid ${UI().line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: UI().font,
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: UI().fg,
          lineHeight: 1.2,
        }}>Cyanotype Print</div>
      </div>

      <div ref={sectionRefs.current.stepper} style={{
        flexShrink: 0,
        borderBottom: `1px solid ${UI().line}`,
        background: UI().bg,
      }}>
        <PhaseStepperGrid
          phase={stepperPhase}
          brushLiftComplete={brushLiftComplete}
          compact={layout.compactArrangeChrome && !arrangeScrollable}
          contentPadLeft={arrangeStacked ? 12 : ARRANGE_TRAY_SPECIMEN_INSET_PX}
        />
      </div>

      {/* Main: phase canvas + tray row (tray inside so Expose can paint sky into the former drawer band). */}
      <div ref={sectionRefs.current.main} style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <motion.div style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
        }}>
          {useArrangeGridLayout ? (
            <motion.div style={{
              flex: 1,
              alignSelf: 'stretch',
              minHeight: 0,
              height: '100%',
              display: 'flex',
              flexDirection: arrangeStacked ? 'column' : 'row',
              overflow: 'hidden',
              width: '100%',
            }}>
              <aside ref={gridAsideRef} style={{
                order: arrangeStacked ? 1 : 0,
                zIndex: arrangeStacked ? 1 : undefined,
                position: arrangeStacked ? 'relative' : undefined,
                width: (trayExiting && exitTraySnapshot && !exitTraySnapshot.portaledOnly && !arrangeStacked)
                  ? `min(${Math.max(0, ARRANGE_TRAY_COL_PX * (1 - trayExitEased))}px, ${Math.max(0, 36 * (1 - trayExitEased))}%)`
                  : (arrangeStacked ? '100%' : `min(${ARRANGE_TRAY_COL_PX}px, 36%)`),
                maxHeight: (trayExiting && exitTraySnapshot && !exitTraySnapshot.portaledOnly && arrangeStacked && exitTraySnapshot.height)
                  ? `${Math.max(0, exitTraySnapshot.height * (1 - trayExitEased))}px`
                  : undefined,
                flexShrink: 0,
                flexGrow: 0,
                boxSizing: 'border-box',
                borderRight: arrangeStacked ? 'none' : `1px solid ${UI().line}`,
                borderTop: arrangeStacked ? `1px solid ${UI().line}` : 'none',
                borderBottom: 'none',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                background: UI().bg,
                overflow: 'hidden',
                opacity: (trayExiting && exitTraySnapshot && !exitTraySnapshot.portaledOnly)
                  ? Math.max(0, 1 - trayExitEased)
                  : 1,
                pointerEvents: trayExiting ? 'none' : 'auto',
              }}>
                <SpecimenTrayScroll
                  axis={arrangeStacked ? 'x' : 'y'}
                  style={{
                    flex: arrangeStacked ? '0 0 auto' : 1,
                    minHeight: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <BotanicalTray
                    onPickup={handlePickup}
                    layout={arrangeStacked ? 'row' : 'grid'}
                    strip={arrangeStacked}
                    sideRail={!arrangeStacked}
                    scrollHost={false}
                  />
                </SpecimenTrayScroll>
              </aside>
              <motion.div style={{
                order: arrangeStacked ? 0 : 1,
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: arrangeStacked ? 0 : undefined,
              }}>
                <motion.div style={{
                  flex: 1,
                  minHeight: 0,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <ArrangePhase
                    items={items}
                    setItems={setItems}
                    selectedId={selectedItemId}
                    onSelectedIdChange={setSelectedItemId}
                    paperTone={paperTone}
                    inlineLayout={true}
                    ghost={drag}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          ) : null}
          {!useArrangeGridLayout && phase === 'expose' && (
            <ExposePhase
              items={items}
              paperTone={paperTone}
              progress={exposeProgress}
              trayBandHeight={0}
            />
          )}
          {!useArrangeGridLayout && phase === 'brush' && (
            <BrushAsidePhase
              items={items}
              onComplete={onBrushComplete}
              onLiftSpecimensOff={onBrushLiftSpecimensOff}
              onFooterChange={setPhaseFooter}
              onFooterClicks={bindPhaseFooterClicks}
              trayBandHeight={0}
            />
          )}
          {!useArrangeGridLayout && (phase === 'rinse' || phase === 'reveal') && (
            <RinsePhase
              items={items}
              paperTone={paperTone}
              printVariationSeed={printVariationSeed}
              complete={phase === 'reveal'}
              onComplete={onRinseComplete}
              onSave={onSave}
              onNew={onNew}
              onFooterChange={setPhaseFooter}
              onFooterClicks={bindPhaseFooterClicks}
              trayBandHeight={0}
            />
          )}
        </motion.div>

        <div
          ref={sectionRefs.current.tray}
          style={phase === 'arrange' ? {
            flexShrink: 0,
            height: 0,
            minHeight: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'transparent',
          } : {
            flexShrink: 0,
            height: 0,
            minHeight: 0,
            marginTop: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'transparent',
          }}
        >
          {phase === 'arrange' && null}
        </div>
      </div>

      {showPhaseFooter && (
        <div ref={sectionRefs.current.footer} style={{
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: showFooterActionColumn ? '1fr auto' : '1fr',
          borderTop: `${UI().lineWidth}px solid ${UI().line}`,
          background: UI().bg,
          height: 64,
          minHeight: 64,
          maxHeight: 64,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px',
            fontFamily: UI().fontMono,
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: UI().fgMuted,
            display: 'flex',
            alignItems: 'center',
          }}>
            {phase === 'arrange' && (
              items.length === 0
                ? '> No specimens placed. Drag from tray.'
                : `> ${items.length} specimen${items.length === 1 ? '' : 's'} on paper.`
            )}
            {phase === 'expose' && (
              `> Exposing to sunlight · ${String(exposeElapsedSec).padStart(2, '0')}s · ${Math.round(exposeProgress * 100)}%`
            )}
            {phase !== 'arrange' && phase !== 'expose' && (phaseFooter?.status ?? '')}
          </div>
          {showFooterActionColumn && (
            <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'stretch', gap: 8, flexWrap: 'nowrap' }}>
              {phase === 'arrange' && (
                <InkButton onClick={toExpose} disabled={items.length === 0 || trayExiting} style={{ minWidth: 200, alignSelf: 'stretch' }}>
                  Expose to sun →
                </InkButton>
              )}
              {phase === 'expose' && (
                <InkButton
                  onClick={() => exposeSkipRef.current?.()}
                  disabled={exposeSkipRequested}
                  variant="secondary"
                  style={{ minWidth: 200, alignSelf: 'stretch' }}
                >
                  {exposeSkipRequested ? 'Speeding up…' : 'Speed up'}
                </InkButton>
              )}
              {phaseFooterActions.map((act, i) => (
                <InkButton
                  key={act.label + String(i)}
                  onClick={() => phaseFooterOnClicksRef.current[i]?.()}
                  disabled={act.disabled}
                  variant={act.variant || 'primary'}
                  style={{ minWidth: 200, alignSelf: 'stretch' }}
                >
                  {act.label}
                </InkButton>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tweak panel — portaled to body so it doesn't scale with stage */}
      {tweaksVisible && ReactDOM.createPortal(
        <TweaksPanel
          paperToneKey={paperToneKey}
          setPaperToneKey={setPaperToneKey}
          onPersist={(edits) => {
            window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
          }}
        />,
        document.body
      )}

      <DragGhostPortal {...(drag || {})}/>
    </div>
    </ArrangeHCenterContext.Provider>
    </ScaleStage>
    {footerExitBand && trayOverlayState !== 'hidden' && ReactDOM.createPortal(
      <div style={{
        position: 'fixed',
        top: footerExitBand.top,
        left: footerExitBand.left,
        width: footerExitBand.width,
        height: footerExitBand.height,
        zIndex: TRAY_EXIT_FOOTER_Z,
        background: UI().bg,
        borderTop: `1px solid ${UI().line}`,
        pointerEvents: 'none',
      }}/>,
      document.body
    )}
    {exitTraySnapshot && !exitTraySnapshot.portaledOnly && trayOverlayState !== 'hidden' && ReactDOM.createPortal(
      <div style={{
        position: 'fixed',
        top: exitTraySnapshot.top,
        left: exitTraySnapshot.left,
        width: exitTraySnapshot.width,
        height: exitTraySnapshot.height,
        boxSizing: 'border-box',
        zIndex: TRAY_EXIT_Z,
        background: UI().bg,
        border: `1px solid ${UI().line}`,
        borderTop: exitTraySnapshot.bottomExit ? `1px solid ${UI().line}` : 'none',
        borderLeft: 'none',
        borderRight: exitTraySnapshot.bottomExit ? 'none' : 'none',
        borderBottom: 'none',
        boxShadow: UI().panelShadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: trayExitTransform(exitTraySnapshot.bottomExit, exitTraySnapshot.footerBandPx),
        willChange: trayExiting ? 'transform' : undefined,
        pointerEvents: 'none',
      }}>
        <BotanicalTray
          onPickup={handlePickup}
          layout={exitTraySnapshot.bottomExit ? 'row' : 'grid'}
          strip={exitTraySnapshot.bottomExit}
          sideRail={!exitTraySnapshot.bottomExit}
        />
      </div>,
      document.body
    )}
    {trayOverlayState !== 'hidden' && (!useArrangeGridLayout || exitTraySnapshot?.portaledOnly) && (phase !== 'arrange' || trayExiting) && ReactDOM.createPortal(
      <div ref={trayPortalRef} style={trayPortalBottomMode ? {
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        top: 'auto',
        width: '100%',
        maxHeight: '46vh',
        overflow: 'hidden',
        paddingTop: 10,
        /* Match fixed title portal (`left: max(28px, env(safe-area-inset-left))`) in compact arrange. */
        paddingLeft: 'max(28px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(28px, env(safe-area-inset-right, 0px))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
        zIndex: TRAY_EXIT_Z,
        border: `1px solid ${UI().line}`,
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        backgroundColor: UI().bg,
        boxShadow: UI().panelShadow,
        transform: trayExitTransform(true, exitTraySnapshot?.footerBandPx),
        willChange: trayExiting ? 'transform' : undefined,
        pointerEvents: phase === 'arrange' && !trayExiting ? 'auto' : 'none',
      } : {
        position: 'fixed',
        left: 'max(0px, env(safe-area-inset-left, 0px))',
        top: arrangeTrayTop,
        bottom: 0,
        width: Math.max(trayRailSurfacePx, 1),
        boxSizing: 'border-box',
        padding: '12px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 14,
        zIndex: 10000,
        border: `1px solid ${UI().line}`,
        borderTop: 'none',
        borderLeft: 'none',
        backgroundColor: UI().bg,
        boxShadow: UI().panelShadow,
        transform: trayExitTransform(false),
        willChange: trayExiting ? 'transform' : undefined,
        pointerEvents: phase === 'arrange' && !trayExiting ? 'auto' : 'none',
      }}>
        <div style={{color: UI().fgMuted, flexShrink: 0, paddingLeft: trayPortalBottomMode ? 28 : 36, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12}}>
          <div>
            <div style={{
              fontFamily: UI().fontMono,
              fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
              fontWeight: 500,
            }}>01 / Tray</div>
            <div style={{
              fontFamily: UI().font,
              fontSize: trayPortalBottomMode ? 14 : 16,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 4,
              color: UI().fg,
            }}>Specimens</div>
          </div>
        </div>
        <SpecimenTrayScroll
          axis={trayPortalBottomMode ? 'x' : 'y'}
          style={trayPortalBottomMode ? {
            flexShrink: 0,
            paddingBottom: 2,
            paddingRight: 8,
          } : {
            flex: 1,
            minHeight: 0,
            paddingRight: 2,
          }}
        >
          <BotanicalTray
            onPickup={handlePickup}
            orientation={trayPortalBottomMode ? 'row' : 'column'}
            sideRail={!trayPortalBottomMode}
            scrollHost={false}
          />
        </SpecimenTrayScroll>
      </div>,
      document.body
    )}
    {ReactDOM.createPortal(
      <button
        type="button"
        onClick={onDevPhaseExit}
        title="Testing: return to the first screen (arrange); clears specimens"
        style={{
          position: 'fixed',
          bottom: showPhaseFooter
            ? 'max(72px, calc(56px + env(safe-area-inset-bottom, 0px)))'
            : ((phase === 'arrange' && arrangeTrayBottomMode)
              ? `calc(${trayBandHeight}px + max(64px, env(safe-area-inset-bottom, 0px)) + 8px)`
              : 14),
          left: 'auto',
          right: (phase === 'arrange' && (useArrangeGridLayout || arrangeTrayBottomMode)) ? 14 : exitLeftScreen,
          zIndex: 10003,
          fontFamily: UI().fontMono,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding: '8px 12px',
          borderRadius: 0,
          border: `1px solid ${UI().line}`,
          background: UI().bg,
          color: UI().fg,
          cursor: 'pointer',
          boxShadow: UI().panelShadow,
        }}
      >
        Exit →
      </button>,
      document.body
    )}
    </>
    </LayoutTierCtx.Provider>
  );
};

// Full-viewport bands aligned to header / main / tray inside the scaled stage (transform-aware).
const ViewportBleedBands = ({ bandRefs, scale, layoutRef, layoutSignal, scrollportRef }) => {
  const [bands, setBands] = React.useState(null);
  React.useLayoutEffect(() => {
    let raf = 0;
    const read = () => {
      const h = bandRefs?.header?.current;
      const st = bandRefs?.stepper?.current;
      const m = bandRefs?.main?.current;
      const f = bandRefs?.footer?.current;
      const t = bandRefs?.tray?.current;
      if (!h || !m) {
        setBands(null);
        return;
      }
      const hr = h.getBoundingClientRect();
      const mr = m.getBoundingClientRect();
      const tr = t ? t.getBoundingClientRect() : null;
      const fr = f ? f.getBoundingClientRect() : null;
      const str = st ? st.getBoundingClientRect() : null;
      setBands({
        header: { top: hr.top, height: hr.height },
        stepper: str ? { top: str.top, height: str.height } : null,
        middle: { top: mr.top, height: mr.height },
        footer: fr ? { top: fr.top, height: fr.height } : null,
        tray: tr ? { top: tr.top, height: tr.height } : null,
      });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    schedule();
    window.addEventListener('resize', schedule);
    const scrollEl = scrollportRef?.current;
    if (scrollEl) scrollEl.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    if (layoutRef?.current) ro.observe(layoutRef.current);
    [bandRefs?.header, bandRefs?.stepper, bandRefs?.main, bandRefs?.footer, bandRefs?.tray].forEach((r) => {
      if (r?.current) ro.observe(r.current);
    });
    return () => {
      window.removeEventListener('resize', schedule);
      scrollEl?.removeEventListener('scroll', schedule);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [bandRefs, scale, layoutRef, layoutSignal, scrollportRef]);
  if (!bands) return null;
  const bandStyle = (rect, bg) => ({
    position: 'fixed',
    left: 0,
    right: 0,
    top: rect.top,
    height: rect.height,
    background: bg,
    zIndex: 0,
    pointerEvents: 'none',
  });
  const ruleStyle = (topPx, thickness = UI().lineWidth) => ({
    position: 'fixed',
    left: 0,
    right: 0,
    top: topPx,
    height: thickness,
    background: STAGE_RULE,
    zIndex: 0,
    pointerEvents: 'none',
  });
  const hr = bands.header;
  const tr = bands.tray;
  const headerRuleY = hr.top + hr.height - UI().lineWidth;
  const edgeStyle = (side) => ({
    position: 'fixed',
    top: 0,
    bottom: 0,
    width: UI().lineWidth,
    background: STAGE_RULE,
    zIndex: 0,
    pointerEvents: 'none',
    [side]: 0,
  });
  const isArrangeGrid = layoutSignal === 'arrange';
  const continuousPhaseBackground = (phase) => ({
    position: 'fixed',
    left: 0,
    right: 0,
    top: bands.middle.top,
    bottom: 0,
    background: phase === 'expose'
      ? BLEED_EXPOSE
      : phase === 'brush' || phase === 'rinse'
        ? STAGE_MIDDLE_BG
          : STAGE_MIDDLE_BG,
    zIndex: 0,
    pointerEvents: 'none',
  });
  const isContinuousPhase = layoutSignal !== 'arrange';
  const arrangeBleedBottomPx = (bands.footer && typeof window !== 'undefined')
    ? Math.max(0, window.innerHeight - (bands.footer.top + bands.footer.height))
    : 0;
  return (
    <>
      {isArrangeGrid && (
        <>
          <div style={edgeStyle('left')}/>
          <div style={edgeStyle('right')}/>
        </>
      )}
      <div style={bandStyle(bands.header, STAGE_STRIP_BG)}/>
      {isContinuousPhase ? (
        <div style={continuousPhaseBackground(layoutSignal)}/>
      ) : (
        <div style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: bands.middle.top,
          bottom: arrangeBleedBottomPx,
          background: STAGE_MIDDLE_BG,
          zIndex: 0,
          pointerEvents: 'none',
        }}/>
      )}
      <div style={ruleStyle(headerRuleY)}/>
      {bands.stepper && <div style={ruleStyle(bands.stepper.top + bands.stepper.height - UI().lineWidth)}/>}
      {tr && tr.height > 1 && !isContinuousPhase && <div style={ruleStyle(tr.top)}/>}
    </>
  );
};

// Scales fixed design canvas (width×height) to the viewport. Height-first for every phase so
// the stage fills the viewport vertically (same as arrange); horizontal overflow is clipped.
// Arrange (step 1): below a viewport-height floor, scale stops shrinking and the stage scrolls.
const ScaleStage = ({
  width, height, children, bandRefs, layoutSignal, stretchToViewportWidth = false,
  arrangeSideTrayPx = 0, arrangeBottomInsetPx = 0, exposeTransitionInsetPx = 0, trayExiting = false,
}) => {
  const [scale, setScale] = React.useState(1);
  const [stageWidth, setStageWidth] = React.useState(width);
  const [scrollable, setScrollable] = React.useState(false);
  const layoutRef = React.useRef(null);
  const scrollportRef = React.useRef(null);
  const lockedStageWidthRef = React.useRef(null);
  React.useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const bottomInset = Math.max(0, arrangeBottomInsetPx || 0);
      const exposeInset = Math.max(0, exposeTransitionInsetPx || 0);
      const verticalInset = layoutSignal === 'arrange'
        ? (trayExiting ? exposeInset : bottomInset)
        : (layoutSignal === 'expose' ? exposeInset : 0);
      const natural = Math.max(0, vh - verticalInset) / Math.max(height, 1);
      let s = natural;
      let scroll = false;
      if (layoutSignal === 'arrange' && window.getArrangeStageScalePolicy) {
        const policy = window.getArrangeStageScalePolicy(vh, height, verticalInset);
        s = policy.scale;
        scroll = policy.scrollable;
      }
      setScale(s);
      setScrollable(scroll);
      if (stretchToViewportWidth) {
        const nextW = Math.max(480, vw / Math.max(s, 0.001));
        if (scroll) {
          lockedStageWidthRef.current = Math.max(lockedStageWidthRef.current || 0, nextW);
          setStageWidth(lockedStageWidthRef.current);
        } else {
          lockedStageWidthRef.current = null;
          setStageWidth(nextW);
        }
      } else {
        lockedStageWidthRef.current = null;
        setStageWidth(width);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [width, height, layoutSignal, stretchToViewportWidth, arrangeBottomInsetPx, exposeTransitionInsetPx, trayExiting]);
  const gutterBg = stretchToViewportWidth ? STAGE_STRIP_BG : middleBleedBackground(layoutSignal);
  const visualStageH = height * scale;
  const stageInner = (
    <div ref={layoutRef} style={{
      width: stageWidth, height,
      position: 'relative',
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
      flexShrink: 0,
      zIndex: 1,
    }}>
      {children}
    </div>
  );
  return (
    <div ref={scrollportRef} style={{
      position: 'fixed', inset: 0,
      background: gutterBg,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowX: 'hidden',
      overflowY: scrollable ? 'auto' : 'hidden',
      WebkitOverflowScrolling: scrollable ? 'touch' : undefined,
      paddingLeft: arrangeSideTrayPx > 0 ? arrangeSideTrayPx : 0,
      boxSizing: 'border-box',
    }}>
      {bandRefs && (
        <ViewportBleedBands
          bandRefs={bandRefs}
          scale={scale}
          layoutRef={layoutRef}
          layoutSignal={layoutSignal}
          scrollportRef={scrollportRef}
        />
      )}
      <ScaleContext.Provider value={scale}>
        {scrollable ? (
          <div style={{
            width: stageWidth,
            height: visualStageH,
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
          }}>
            {stageInner}
          </div>
        ) : stageInner}
      </ScaleContext.Provider>
    </div>
  );
};

// Vertically centers the stepper midpoint between the title strip and the paper (layout px; scale-aware).
const PhaseStepperRail = ({ shellRef, sectionRefs, phase, children, arrangeCompact, onMeasureWidth, onContentCenterX }) => {
  const scale = React.useContext(ScaleContext);
  const s = scale > 0 ? scale : 1;
  const paperH = typeof PAPER_H !== 'undefined' ? PAPER_H : (window.PAPER_H || 646);
  const [centerY, setCenterY] = React.useState(null);
  const lastPaperTopRef = React.useRef(null);
  const railRef = React.useRef(null);

  const reportStepperWidth = React.useCallback(() => {
    if (!onMeasureWidth || !railRef.current) return;
    const w = Math.ceil(railRef.current.getBoundingClientRect().width);
    if (w > 0) onMeasureWidth(w);
  }, [onMeasureWidth]);

  const reportContentCenterX = React.useCallback(() => {
    if (!onContentCenterX || !railRef.current || !shellRef?.current) return;
    const shellRect = shellRef.current.getBoundingClientRect();
    const railRect = railRef.current.getBoundingClientRect();
    const cx = (railRect.left + railRect.width / 2 - shellRect.left) / s;
    if (Number.isFinite(cx)) onContentCenterX(cx);
  }, [onContentCenterX, shellRef, s]);

  const measure = React.useCallback(() => {
    const shell = shellRef?.current;
    const headerEl = sectionRefs?.current?.header?.current;
    const mainEl = sectionRefs?.current?.main?.current;
    if (!shell || !headerEl || !mainEl) return;
    const shellRect = shell.getBoundingClientRect();
    const headerBottom = (headerEl.getBoundingClientRect().bottom - shellRect.top) / s;
    const mr = mainEl.getBoundingClientRect();
    const paperEl = shell.querySelector('[data-paper="true"]');
    let paperTop = lastPaperTopRef.current;
    if (paperEl) {
      paperTop = (paperEl.getBoundingClientRect().top - shellRect.top) / s;
      lastPaperTopRef.current = paperTop;
    }
    if (paperTop == null) {
      paperTop = (mr.top - shellRect.top) / s + mr.height / (2 * s) - paperH / 2;
    }
    setCenterY((headerBottom + paperTop) / 2);
    reportStepperWidth();
    reportContentCenterX();
  }, [shellRef, sectionRefs, s, paperH, phase, reportStepperWidth, reportContentCenterX]);

  React.useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    const el = railRef.current;
    const ro = el ? new ResizeObserver(measure) : null;
    if (el && ro) ro.observe(el);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [measure]);

  if (centerY == null) return null;
  return (
    <div ref={railRef} style={{
      position: 'absolute',
      left: '50%',
      top: centerY,
      transform: 'translate(-50%, -50%)',
      zIndex: 6,
      maxWidth: 'calc(100% - 24px)',
      overflowX: 'auto',
      overflowY: 'hidden',
      display: 'flex',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  );
};

const PhaseStepperGrid = ({ phase, brushLiftComplete, compact, contentPadLeft }) => {
  const phases = [
    { key: 'arrange', label: 'Arrange' },
    { key: 'expose',  label: 'Expose' },
    { key: 'brush',   label: 'Lift' },
    { key: 'rinse',   label: 'Rinse' },
    { key: 'reveal',  label: 'Reveal' },
  ];
  let activeIdx = phases.findIndex(p => p.key === phase);
  if (phase === 'brush' && brushLiftComplete) {
    activeIdx = phases.findIndex(p => p.key === 'rinse');
  }
  const padY = compact ? 8 : 12;
  const padLeft = contentPadLeft ?? (compact ? 12 : ARRANGE_TRAY_SPECIMEN_INSET_PX);
  const padRight = compact ? 6 : 10;
  const stepperEase = `${STEPPER_PHASE_TRANSITION_MS}ms ${TRAY_EXIT_EASE}`;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))`,
    }}>
      {phases.map((p, i) => {
        const active = i === activeIdx;
        const done = i < activeIdx;
        const filled = done || active;
        const status = active ? '[ACTIVE]' : (done ? '[DONE]' : '[PENDING]');
        return (
          <div
            key={p.key}
            style={{
              padding: `${padY}px ${padRight}px ${padY}px ${padLeft}px`,
              borderRight: i < phases.length - 1 ? `1px solid ${UI().line}` : 'none',
              background: filled ? UI().bgInverse : UI().bg,
              color: filled ? UI().fgInverse : UI().fg,
              minWidth: 0,
              transition: `background-color ${stepperEase}, color ${stepperEase}`,
            }}
          >
            <div style={{
              fontFamily: UI().fontMono,
              fontSize: compact ? 9 : 10,
              letterSpacing: '0.12em',
              opacity: active ? 0.85 : (done ? 0.65 : 0.55),
              transition: `opacity ${stepperEase}`,
            }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{
              fontFamily: UI().font,
              fontSize: compact ? 10 : 12,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginTop: 4,
              lineHeight: 1.1,
            }}>{p.label}</div>
            <div style={{
              fontFamily: UI().fontMono,
              fontSize: compact ? 7 : 8,
              letterSpacing: '0.1em',
              marginTop: 6,
              opacity: active ? 0.9 : (done ? 0.7 : 0.5),
              transition: `opacity ${stepperEase}`,
            }}>{status}</div>
          </div>
        );
      })}
    </div>
  );
};

const PhaseIndicator = ({ phase, brushLiftComplete, compact }) => {
  const phases = [
    { key: 'arrange', label: 'Arrange' },
    { key: 'expose',  label: 'Expose' },
    { key: 'brush',   label: 'Lift' },
    { key: 'rinse',   label: 'Rinse' },
    { key: 'reveal',  label: 'Reveal' },
  ];
  let activeIdx = phases.findIndex(p => p.key === phase);
  // Lift is finished once specimens are off the sheet; highlight Rinse before the phase advances.
  if (phase === 'brush' && brushLiftComplete) {
    activeIdx = phases.findIndex(p => p.key === 'rinse');
  }
  const gap = compact ? 6 : 12;
  const innerGap = compact ? 5 : 8;
  const ruleW = compact ? 10 : 24;
  const dot = compact ? 15 : 18;
  const labelFs = compact ? 9 : 12;
  const markerFs = compact ? 9 : 10;
  return (
    <div style={{display: 'flex', alignItems: 'center', flexWrap: compact ? 'wrap' : 'nowrap', justifyContent: 'center', gap}}>
      {phases.map((p, i) => {
        const active = i === activeIdx;
        const done = i < activeIdx;
        const marker = done ? '✓' : String(i + 1);
        return (
          <React.Fragment key={p.key}>
            <div style={{display: 'flex', alignItems: 'center', gap: innerGap}}>
              <div style={{
                width: dot, height: dot, borderRadius: 0,
                border: `1px solid ${UI().line}`,
                background: done || active ? UI().bgInverse : UI().bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: UI().fontMono,
                fontSize: markerFs,
                color: done || active ? UI().fgInverse : UI().fgMuted,
                fontWeight: 600,
                lineHeight: 1,
              }}>
                <span style={{
                  display: 'block',
                  lineHeight: 1,
                  transform: done ? 'translateY(-0.5px)' : 'none',
                }}>{marker}</span>
              </div>
              <div style={{
                fontFamily: UI().font,
                fontSize: labelFs,
                letterSpacing: compact ? '0.12em' : '0.16em',
                textTransform: 'uppercase',
                fontWeight: active ? 700 : 500,
                color: active ? UI().fg : (done ? UI().fgMuted : UI().lineSoft),
              }}>{p.label}</div>
            </div>
            {i < phases.length - 1 && (
              <div style={{width: ruleW, height: UI().lineWidth, background: UI().line, flexShrink: 0}}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const SoundToggle_unused = ({ on, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'none',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4v4h2l3 2V2L4 4H2z" fill="currentColor"/>
        {on && <path d="M9 4q1 2 0 4M10.5 3q2 3 0 6" stroke="currentColor" strokeWidth="0.8" fill="none"/>}
        {!on && <path d="M8 4l3 4M11 4l-3 4" stroke="currentColor" strokeWidth="0.8"/>}
      </svg>
      {on ? 'Sound' : 'Muted'}
    </button>
  );
};

const TweaksPanel = ({ paperToneKey, setPaperToneKey, onPersist }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 20, right: 20,
      width: 260,
      background: UI().bg,
      border: `1px solid ${UI().line}`,
      padding: 0,
      fontFamily: UI().font,
      color: UI().fg,
      boxShadow: UI().panelShadow,
      zIndex: 9999,
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${UI().line}`,
        fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 700,
      }}>Tweaks</div>
      <div style={{padding: '14px'}}>
        <div style={{
          fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase',
          opacity: 0.65, marginBottom: 8,
        }}>Paper tone</div>
        <div style={{display: 'flex', gap: 6}}>
          {Object.entries(PAPER_TONES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => { setPaperToneKey(k); onPersist({ defaultPaperTone: k }); }}
              style={{
                flex: 1,
                background: v.base,
                border: `1px solid ${k === paperToneKey ? UI().line : UI().lineSoft}`,
                outline: k === paperToneKey ? `3px solid ${UI().line}` : 'none',
                outlineOffset: 0,
                padding: '16px 4px',
                fontFamily: UI().font,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >{v.name}</button>
          ))}
        </div>

      </div>
    </div>
  );
};

// Helper — build SVG string for an item (used by download export; matches on-screen cyanotype filter).
async function buildItemSvgString(item, negColor) {
  if (window.buildCyanotypeSpecimenSvgStringAsync) {
    return window.buildCyanotypeSpecimenSvgStringAsync(item, negColor);
  }
  const b = BOTANICALS[item.kind];
  const { w, h } = (b && b.bounds) || { w: 100, h: 100 };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`;
}

function loadSvgAsImage(svgStr) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
    img.onerror = reject;
    img.src = url;
  });
}

window.App = App;
