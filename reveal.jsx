// RevealPhase — the finished cyanotype print; actions live in the app footer grid.

const PHASE_PAPER_DISPLAY_BOOST = 1.14;
const PAPER_TOP_BASE = 16;
const PAPER_SCREEN_SHIFT_PX = 48;

const CYANOTYPE_BASE = window.CYANOTYPE_BASE_HEX || '#2E5483';
const UI = () => window.UI_THEME || {
  fg: '#000', fgMuted: '#5a5a5a', line: '#000', bg: '#fff', bgInverse: '#000', fgInverse: '#fff',
  font: 'sans-serif', fontMono: 'monospace', paperShadow: '6px 6px 0 #000', panelShadow: '4px 4px 0 #000',
};

const RevealPhase = ({ items, paperTone, printVariationSeed = 0, onSave, onNew, onFooterChange, trayBandHeight = 0 }) => {
  const stageScale = React.useContext(window.ScaleContext || React.createContext(1)) || 1;
  const [entered, setEntered] = React.useState(false);
  const paperRef = React.useRef(null);

  React.useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!onFooterChange) return;
    onFooterChange({
      status: '> Print complete',
      actions: [
        { label: 'New print', onClick: onNew, variant: 'secondary' },
        { label: 'Save as image', onClick: () => onSave(paperRef.current), variant: 'primary' },
      ],
    });
    return () => onFooterChange(null);
  }, [onFooterChange, onSave, onNew]);

  const paperSeed = React.useMemo(
    () => window.deriveCyanotypePaperSeed(items, printVariationSeed),
    [items, printVariationSeed],
  );
  const paperVariationBg = React.useMemo(
    () => window.buildCyanotypePaperVariationDataUrl(PAPER_W, PAPER_H, paperSeed),
    [paperSeed],
  );

  const displayScale = PHASE_PAPER_DISPLAY_BOOST;
  const paperTopOffset = PAPER_TOP_BASE - (PAPER_SCREEN_SHIFT_PX / Math.max(stageScale, 0.001));

  return (
    <motion.div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
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
              transform: `scale(${displayScale}) translateY(${entered ? 0 : 12}px)`,
              transformOrigin: 'top center',
              opacity: entered ? 1 : 0,
              transition: 'opacity 500ms ease, transform 500ms ease',
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
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

window.RevealPhase = RevealPhase;
