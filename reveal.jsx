// RevealPhase — the finished cyanotype print; actions live in the app footer grid.

const PHASE_PAPER_DISPLAY_BOOST = 1.14;
const PAPER_TOP_BASE = 16;
const PAPER_SCREEN_SHIFT_PX = 48;

const CYANOTYPE_BASE = window.CYANOTYPE_BASE_HEX || '#2E5483';
const UI = () => window.UI_THEME || {
  fg: '#000', fgMuted: '#5a5a5a', line: '#000', bg: '#fff', bgInverse: '#000', fgInverse: '#fff',
  font: 'sans-serif', fontMono: 'monospace', paperShadow: '6px 6px 0 #000', panelShadow: '4px 4px 0 #000',
};

const RevealPhase = ({ items, paperTone, printVariationSeed = 0, onSave, onNew, onFooterChange, onFooterClicks, trayBandHeight = 0 }) => {
  const stageScale = React.useContext(window.ScaleContext || React.createContext(1)) || 1;
  const paperRef = React.useRef(null);
  const onFooterChangeRef = React.useRef(onFooterChange);
  onFooterChangeRef.current = onFooterChange;
  const onFooterClicksRef = React.useRef(onFooterClicks);
  onFooterClicksRef.current = onFooterClicks;
  const onSaveRef = React.useRef(onSave);
  onSaveRef.current = onSave;
  const onNewRef = React.useRef(onNew);
  onNewRef.current = onNew;

  const onNewClick = React.useCallback(() => onNewRef.current(), []);
  const onSaveClick = React.useCallback(() => onSaveRef.current(paperRef.current), []);

  React.useLayoutEffect(() => {
    const bind = onFooterClicksRef.current;
    if (!bind) return undefined;
    bind([onNewClick, onSaveClick]);
    return () => bind([]);
  }, [onNewClick, onSaveClick]);

  React.useEffect(() => {
    const setFooter = onFooterChangeRef.current;
    if (!setFooter) return;
    setFooter({
      status: '> Print complete',
      actions: [
        { label: 'New print', variant: 'secondary' },
        { label: 'Save as image', variant: 'primary' },
      ],
    });
  }, []);

  React.useEffect(() => () => {
    const setFooter = onFooterChangeRef.current;
    if (setFooter) setFooter(null);
    const bind = onFooterClicksRef.current;
    if (bind) bind([]);
  }, []);

  const paperSeed = React.useMemo(
    () => window.deriveCyanotypePaperSeed(items, printVariationSeed),
    [items, printVariationSeed],
  );
  const paperVariationBg = React.useMemo(
    () => window.buildCyanotypePaperVariationDataUrl(PAPER_W, PAPER_H, paperSeed),
    [paperSeed],
  );
  const paperGrainStyle = React.useMemo(
    () => (window.getCyanotypePaperGrainStyle
      ? window.getCyanotypePaperGrainStyle(paperSeed, { opacity: 0.13 })
      : null),
    [paperSeed],
  );

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
    <motion.div style={{
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
    }}>
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
            ref={paperRef}
            data-paper="true"
            style={{
              position: 'relative',
              top: paperTopOffset,
              width: PAPER_W,
              height: PAPER_H,
              flexShrink: 0,
              transform: `scale(${displayScale})`,
              transformOrigin: 'top center',
              overflow: 'hidden',
              boxShadow: 'none',
              border: `1px solid ${UI().line}`,
            }}
          >
            <motion.div style={{ position: 'absolute', inset: 0, background: CYANOTYPE_BASE }}/>
            <motion.div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${paperVariationBg})`,
              backgroundSize: '100% 100%',
              pointerEvents: 'none',
            }}/>
            <motion.div style={window.CYANOTYPE_SPECIMEN_STACK_ISOLATION_STYLE}>
              {items.map(item => {
                const b = BOTANICALS[item.kind];
                const w = b.bounds.w * item.scale;
                const h = b.bounds.h * item.scale;
                return (
                  <motion.div key={item.id + '-neg'} style={{
                    position: 'absolute',
                    left: item.x - w/2, top: item.y - h/2,
                    width: w, height: h,
                    transform: `rotate(${item.rotation}deg)`,
                    ...window.CYANOTYPE_SPECIMEN_OVERLAP_BLEND_STYLE,
                  }}>
                    <BotanicalSVG kind={item.kind} size={item.scale} color={window.CYANOTYPE_PRINT_SILHOUETTE_COLOR} asSilhouette={true}/>
                  </motion.div>
                );
              })}
            </motion.div>
            <motion.div style={window.CYANOTYPE_SPECIMEN_BRIGHT_CAP_LAYER_STYLE}/>
            {paperGrainStyle && <motion.div style={paperGrainStyle}/>}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

window.RevealPhase = RevealPhase;
