// ArrangePhase — user drags botanicals from a tray onto the cyanotype paper.

const UI = () => window.UI_THEME || { fg: '#000', fgMuted: '#5a5a5a', line: '#000', lineSoft: '#d4d4d4', lineWidth: 1, bg: '#fff', bgSoft: '#f7f7f7', font: 'sans-serif', fontMono: 'monospace', paperShadow: 'none' };
const border = (color) => `${UI().lineWidth}px solid ${color ?? UI().line}`;
// Placed items can be moved, rotated, scaled, deleted.

let nextCyanotypeSvgFilterId = 1;

const PAPER_W = 520;
const PAPER_H = 646;
const PAPER_TOP_BASE = 16;
const PAPER_SCREEN_SHIFT_PX = 48;
/** Extra downward shift for the fixed Expose button — bottom-tray layout only (see compactArrangeChrome). */
const COMPACT_EXPOSE_BTN_CLEAR_PAPER_PX = 160;
// Inner margin inside paper where items live
const PAPER_MARGIN = 40;

// Renders a botanical. Two modes:
//   - photo (default): shows the real pressed-flower image for image-backed kinds
//   - silhouette: luminance → lerp(thin, dense); print uses CYANOTYPE_THIN_BLUE…PRINT_DENSE;
//     silhouetteLatent uses CYANOTYPE_LATENT_THIN_HEX…LATENT_DENSE (pre-wash plate, botanicals.jsx)
const BotanicalSVG = ({ kind, size = 1, color = "#000000", asSilhouette = false, silhouetteLatent = false }) => {
  const cyanFilterIdRef = React.useRef(null);
  if (cyanFilterIdRef.current == null) {
    cyanFilterIdRef.current = 'cn' + (nextCyanotypeSvgFilterId++);
  }
  const b = BOTANICALS[kind];
  if (!b) return null;
  const { w, h } = b.bounds;
  if (b.image) {
    if (asSilhouette) {
      const fid = cyanFilterIdRef.current;
      const negRgb = parseColor(color);
      const thinRgb = silhouetteLatent
        ? (window.CYANOTYPE_LATENT_THIN_RGB01 || window.CYANOTYPE_THIN_RGB01)
        : window.CYANOTYPE_THIN_RGB01;
      const curveOpts = { lumLift: b.lumLift, lumContrast: b.lumContrast, filterProfile: b.filterProfile };
      const filterHtml = window.cyanotypeNegativeFilterMarkup(fid, negRgb, thinRgb, curveOpts);
      return (
        <svg
          width={w * size} height={h * size}
          viewBox={`0 0 ${w} ${h}`}
          style={{display: 'block', overflow: 'visible'}}
        >
          <defs dangerouslySetInnerHTML={{ __html: filterHtml }}/>
          <image
            href={b.image}
            x="0" y="0"
            width={w} height={h}
            preserveAspectRatio="xMidYMid meet"
            filter={`url(#${fid})`}
          />
        </svg>
      );
    }
    return (
      <img
        src={b.image}
        draggable={false}
        style={{
          width: w * size,
          height: h * size,
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    );
  }
  const Render = b.render;
  return (
    <svg
      width={w * size} height={h * size}
      viewBox={`${-w/2} ${-h/2} ${w} ${h}`}
      style={{color, display: 'block', overflow: 'visible'}}
    >
      <Render/>
    </svg>
  );
};

// Parse CSS color to rgb 0..1 (shared with cyanotype filters in botanicals.jsx).
const parseColor = (c) => window.parseColorRgb01(c);

/** Fixed tray grid cell height (px) — keeps every specimen card the same size. */
const TRAY_GRID_CARD_HEIGHT = 272;

const TRAY_SCROLL_TRACK = 6;
const TRAY_SCROLL_THUMB_MIN = 28;
const TRAY_SCROLL_TRACK_BG = '#f0f0f0';
const TRAY_SCROLL_THUMB_BG = '#b0b0b0';

/** Square-corner scrollbar for specimen tray (WebKit native thumbs stay pill-shaped). */
const SpecimenTrayScroll = ({ axis = 'y', style = {}, children }) => {
  const vertical = axis === 'y';
  const viewportRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [thumb, setThumb] = React.useState({ size: 0, offset: 0, overflow: false });

  const sync = React.useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const client = vertical ? el.clientHeight : el.clientWidth;
    const scrollSize = vertical ? el.scrollHeight : el.scrollWidth;
    const pos = vertical ? el.scrollTop : el.scrollLeft;
    if (scrollSize <= client + 1) {
      setThumb({ size: 0, offset: 0, overflow: false });
      return;
    }
    const size = Math.max(TRAY_SCROLL_THUMB_MIN, Math.round((client / scrollSize) * client));
    const maxOffset = Math.max(0, client - size);
    const offset = maxOffset > 0
      ? Math.round((pos / (scrollSize - client)) * maxOffset)
      : 0;
    setThumb({ size, offset, overflow: true });
  }, [vertical]);

  const showScrollbar = thumb.overflow && (hovered || dragging);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    Array.from(el.children).forEach((child) => ro.observe(child));
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [sync, children]);

  const onThumbPointerDown = React.useCallback((e) => {
    e.preventDefault();
    const el = viewportRef.current;
    if (!el || !thumb.overflow) return;
    setDragging(true);
    const startPointer = vertical ? e.clientY : e.clientX;
    const startScroll = vertical ? el.scrollTop : el.scrollLeft;
    const client = vertical ? el.clientHeight : el.clientWidth;
    const scrollSize = vertical ? el.scrollHeight : el.scrollWidth;
    const maxScroll = Math.max(0, scrollSize - client);
    const thumbTravel = Math.max(1, client - thumb.size);

    const onMove = (ev) => {
      const delta = (vertical ? ev.clientY : ev.clientX) - startPointer;
      const next = startScroll + (delta / thumbTravel) * maxScroll;
      if (vertical) el.scrollTop = Math.max(0, Math.min(maxScroll, next));
      else el.scrollLeft = Math.max(0, Math.min(maxScroll, next));
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }, [vertical, thumb.size, thumb.overflow]);

  const { flex, flexShrink, minHeight, minWidth, alignSelf, maxHeight, ...restStyle } = style;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
      position: 'relative',
      minHeight: minHeight ?? 0,
      minWidth: minWidth ?? 0,
      maxHeight,
      flex,
      flexShrink,
      alignSelf,
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
    }}>
      <div
        ref={viewportRef}
        className="specimen-tray-scroll"
        style={{
          width: '100%',
          height: '100%',
          overflowX: vertical ? 'hidden' : 'auto',
          overflowY: vertical ? 'auto' : 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          boxSizing: 'border-box',
          ...restStyle,
        }}
      >
        {children}
      </div>
      {showScrollbar && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            pointerEvents: 'auto',
            background: TRAY_SCROLL_TRACK_BG,
            zIndex: 2,
            ...(vertical
              ? { top: 0, right: 0, bottom: 0, width: TRAY_SCROLL_TRACK }
              : { left: 0, right: 0, bottom: 0, height: TRAY_SCROLL_TRACK }),
          }}
        >
          <div
            role="presentation"
            onPointerDown={onThumbPointerDown}
            style={{
              position: 'absolute',
              background: TRAY_SCROLL_THUMB_BG,
              borderRadius: 0,
              touchAction: 'none',
              ...(vertical
                ? {
                  width: TRAY_SCROLL_TRACK,
                  height: thumb.size,
                  top: thumb.offset,
                  left: 0,
                  cursor: 'ns-resize',
                }
                : {
                  height: TRAY_SCROLL_TRACK,
                  width: thumb.size,
                  left: thumb.offset,
                  top: 0,
                  cursor: 'ew-resize',
                }),
            }}
          />
        </div>
      )}
    </div>
  );
};

// The tray — holds one card per botanical kind. Drag originates here.
// layout: 'grid' (2-column) | 'row' (horizontal strip) | 'column' (single column)
const trayHeaderStyle = {
  fontFamily: UI().fontMono,
  fontSize: 9,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: UI().fgMuted,
};

const BotanicalTray = ({ onPickup, layout = 'column', orientation, strip, header, sideRail, scrollHost = true }) => {
  const resolved = layout || (orientation === 'row' ? 'row' : 'column');
  const row = resolved === 'row';
  const grid = resolved === 'grid';
  const cards = Object.entries(BOTANICALS).map(([kind, b]) => (
    <TrayCard key={kind} kind={kind} botanical={b} onPickup={onPickup} compact={row} gridCell={grid} sideRail={sideRail}/>
  ));

  // Row + header: width:100% on the header in a horizontal flex row consumes the full
  // line and pushes every specimen card off-screen to the right.
  if (row && header && !grid) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
        <div style={{
          ...trayHeaderStyle,
          flexShrink: 0,
          padding: strip ? '8px 12px 0' : '8px 10px 0 28px',
        }}>{header}</div>
        <SpecimenTrayScroll axis="x" style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            gap: 10,
            padding: strip ? '6px 12px 8px' : '6px 10px 8px 28px',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            width: 'max-content',
            minWidth: '100%',
            boxSizing: 'border-box',
          }}>
            {cards}
          </div>
        </SpecimenTrayScroll>
      </div>
    );
  }

  const scrollable = scrollHost && row && !strip;
  const trayBody = (
    <div style={grid ? {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gridTemplateRows: 'auto',
      gridAutoRows: `${TRAY_GRID_CARD_HEIGHT}px`,
      gap: 10,
      padding: '10px 12px 12px',
      alignContent: 'start',
      width: '100%',
      boxSizing: 'border-box',
    } : {
      display: 'flex',
      flexDirection: row ? 'row' : 'column',
      flexWrap: row ? 'nowrap' : 'wrap',
      gap: row ? 10 : 12,
      padding: strip ? '8px 12px' : (row ? '8px 10px 8px 28px' : '10px 8px 10px 36px'),
      alignItems: row ? 'stretch' : 'flex-start',
      justifyContent: row ? 'flex-start' : 'center',
      width: (row && !strip) ? 'max-content' : '100%',
      minWidth: (row && !strip) ? '100%' : undefined,
      boxSizing: 'border-box',
    }}>
      {header && grid && (
        <div style={{ ...trayHeaderStyle, gridColumn: '1 / -1' }}>{header}</div>
      )}
      {header && !grid && (
        <div style={{ ...trayHeaderStyle, flexShrink: 0, width: '100%' }}>{header}</div>
      )}
      {cards}
    </div>
  );
  if (scrollable) {
    return (
      <SpecimenTrayScroll axis="x" style={{ width: '100%', boxSizing: 'border-box' }}>
        {trayBody}
      </SpecimenTrayScroll>
    );
  }
  return trayBody;
};

const TrayCard = ({ kind, botanical, onPickup, compact, gridCell, sideRail }) => {
  const [hover, setHover] = React.useState(false);
  const onMouseDown = (e) => {
    e.preventDefault();
    SoundManager.rustle();
    onPickup(kind, e.clientX, e.clientY);
  };
  const b = botanical;
  const previewW = gridCell ? 124 : (compact ? 82 : 108);
  const previewH = gridCell ? 170 : (compact ? 92 : 124);
  const s = Math.min(previewW / b.bounds.w, previewH / b.bounds.h) * (gridCell ? 1.08 : (compact ? 0.94 : 0.97));
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: gridCell ? '100%' : (compact ? 88 : 118),
        minWidth: gridCell ? 0 : undefined,
        height: gridCell ? '100%' : undefined,
        minHeight: gridCell ? TRAY_GRID_CARD_HEIGHT : (compact ? 118 : 150),
        flexShrink: 0,
        background: hover ? UI().bgSoft : UI().bg,
        border: border(UI().line),
        boxShadow: hover ? '4px 4px 0 rgba(0,0,0,0.2)' : 'none',
        transform: hover ? 'translate(-1px, -1px)' : 'translate(0, 0)',
        zIndex: hover ? 1 : undefined,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: gridCell
          ? (sideRail ? '8px 6px 14px' : '8px 6px 6px')
          : (sideRail && !compact ? '10px 8px 16px' : '10px 8px 8px'),
        cursor: 'grab',
        transition: 'background 160ms ease-out, transform 160ms ease-out, box-shadow 160ms ease-out',
        position: 'relative',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        flex: gridCell ? 1 : undefined,
        width: '100%',
        minHeight: gridCell ? 0 : undefined,
        height: gridCell ? undefined : (compact ? 80 : 110),
        overflow: gridCell ? 'hidden' : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{transform: `scale(${s})`, transformOrigin: 'center'}}>
          <BotanicalSVG kind={kind} size={1} color="#000000"/>
        </div>
      </div>
      <div style={{
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        ...(sideRail ? { transform: 'translateY(-2px)' } : {}),
      }}>
        <div style={{
          alignSelf: 'stretch',
          textAlign: 'center',
          whiteSpace: 'normal',
          fontFamily: UI().font,
          fontSize: gridCell ? 11 : (compact ? 11 : 13),
          letterSpacing: compact ? '0.12em' : '0.14em',
          textTransform: 'uppercase',
          color: UI().fg,
          marginTop: gridCell ? 4 : 6,
          fontWeight: 700,
          lineHeight: 1.2,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}>{b.name}</div>
        <div style={{
          alignSelf: 'stretch',
          textAlign: 'center',
          fontFamily: UI().fontMono,
          fontSize: (gridCell ? 9 : (compact ? 10 : 11)) + (sideRail ? 2 : 0),
          color: UI().fgMuted,
          letterSpacing: '0.06em',
          marginTop: 2,
          lineHeight: 1.2,
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}>{b.latin}</div>
      </div>
    </div>
  );
};

// A single placed item on the paper. Supports drag-move + rotation + scale handles + delete.
const PlacedItem = ({ item, selected, onSelect, onUpdate, onDelete, disabled, displayScale = 1 }) => {
  const b = BOTANICALS[item.kind];
  const ref = React.useRef(null);
  const scale = React.useContext(window.ScaleContext || React.createContext(1));

  // Drag to move
  const onBodyDown = (e) => {
    if (disabled) return;
    e.stopPropagation();
    onSelect(item.id);
    const startX = e.clientX, startY = e.clientY;
    const origX = item.x, origY = item.y;
    const effectiveScale = scale * displayScale;
    const onMove = (ev) => {
      onUpdate(item.id, {
        x: origX + (ev.clientX - startX) / effectiveScale,
        y: origY + (ev.clientY - startY) / effectiveScale,
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Rotate handle
  const onRotateDown = (e) => {
    e.stopPropagation();
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const origRot = item.rotation;
    const onMove = (ev) => {
      const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
      const d = (a - startAngle) * 180 / Math.PI;
      onUpdate(item.id, { rotation: origRot + d });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Scale handle
  const onScaleDown = (e) => {
    e.stopPropagation();
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy);
    const origScale = item.scale;
    const onMove = (ev) => {
      const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
      const next = Math.max(0.3, Math.min(2.4, origScale * (d / startDist)));
      onUpdate(item.id, { scale: next });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const w = b.bounds.w * item.scale;
  const h = b.bounds.h * item.scale;
  const handleSize = 14;
  // Rotate knob matches delete button footprint (18×18); scale handle stays compact on the corner.
  const rotateHandleSize = 18;
  const frameTop = -6; // dashed selection inset
  const rotateStemH = 20;
  const rotateTop = frameTop - rotateStemH - rotateHandleSize;
  const rotateStemTop = frameTop - rotateStemH;

  return (
    <div
      ref={ref}
      onMouseDown={onBodyDown}
      style={{
        position: 'absolute',
        left: item.x - w/2,
        top: item.y - h/2,
        width: w, height: h,
        transform: `rotate(${item.rotation}deg)`,
        cursor: disabled ? 'default' : 'grab',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'auto',
        filter: `drop-shadow(3px 3px 0 rgba(0,0,0,${item.pressed ? 0.12 : 0.22}))`,
      }}>
        <BotanicalSVG kind={item.kind} size={item.scale} color="#000000"/>
      </div>

      {/* Selection chrome */}
      {selected && !disabled && (
        <>
          <div style={{
            position: 'absolute', inset: -6,
            border: '1px dashed #000000',
            pointerEvents: 'none',
          }}/>
          {/* rotate handle (top) */}
          <div
            onMouseDown={onRotateDown}
            title="Rotate"
            style={{
              position: 'absolute',
              left: '50%', top: rotateTop,
              marginLeft: -rotateHandleSize / 2,
              width: rotateHandleSize, height: rotateHandleSize,
              borderRadius: 0,
              background: '#ffffff',
              border: '1px solid #000000',
              cursor: 'crosshair',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" overflow="visible" aria-hidden>
              <path
                d="M18.5 12A6.5 6.5 0 1 1 12 5.5"
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="butt"
                fill="none"
              />
              <path d="M11.4 3 L11.4 8 L18.75 5.5 Z" fill="#000000" />
            </svg>
          </div>
          {/* connecting line from rotate handle */}
          <div style={{
            position: 'absolute', left: '50%', top: rotateStemTop,
            width: 1, height: rotateStemH, background: '#000000',
            pointerEvents: 'none',
          }}/>
          {/* scale handle (bottom-right) */}
          <div
            onMouseDown={onScaleDown}
            title="Resize"
            style={{
              position: 'absolute',
              right: -handleSize/2 - 4, bottom: -handleSize/2 - 4,
              width: handleSize, height: handleSize,
              background: '#ffffff',
              border: '1px solid #000000',
              cursor: 'nwse-resize',
            }}
          />
          {/* delete button — counter-rotated so it's always readable */}
          <div
            onMouseDown={(e) => { e.stopPropagation(); onDelete(item.id); }}
            title="Remove"
            style={{
              position: 'absolute',
              left: -handleSize/2 - 4, top: -handleSize/2 - 4,
              width: handleSize + 4, height: handleSize + 4,
              background: '#000000',
              border: '1px solid #000000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden style={{ display: 'block' }}>
              <path
                d="M2.5 2.5 L7.5 7.5 M7.5 2.5 L2.5 7.5"
                stroke="#ffffff"
                strokeWidth="1.35"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

// The paper surface — where items are dropped & arranged.
// In later phases this paper becomes the print canvas, so we use refs.
const ArrangePhase = ({ items, setItems, paperTone, onExpose, onReady, ghost, bottomChromePx = 0, inlineLayout = false }) => {
  const [selectedId, setSelectedId] = React.useState(null);
  const paperRef = React.useRef(null);
  const scale = React.useContext(window.ScaleContext || React.createContext(1));
  const layout = React.useContext(window.LayoutTierContext || React.createContext({ tier: 'xl', compactArrangeChrome: false }));
  const contentCenterX = inlineLayout ? null : React.useContext(window.ArrangeHCenterContext || React.createContext(null));
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : layout.vh;
  const displayScale = window.getPhasePaperDisplayScale
    ? window.getPhasePaperDisplayScale(scale, viewportH)
    : (window.PHASE_PAPER_DISPLAY_BOOST || 1.14);
  const paperTopOffset = window.getPhasePaperTopOffset
    ? window.getPhasePaperTopOffset(scale)
    : (PAPER_TOP_BASE - (PAPER_SCREEN_SHIFT_PX / Math.max(scale || 1, 0.001)));
  // Add new item from tray drop
  const addItem = (kind, clientX, clientY) => {
    const rect = paperRef.current.getBoundingClientRect();
    // rect is already in scaled screen coords; convert back to paper-local coords
    const x = (clientX - rect.left) / (scale * displayScale);
    const y = (clientY - rect.top) / (scale * displayScale);
    // only add if within paper bounds
    if (x < 0 || x > PAPER_W || y < 0 || y > PAPER_H) return null;
    const id = 'item-' + Math.random().toString(36).slice(2, 9);
    setItems((prev) => [...prev, { id, kind, x, y, rotation: 0, scale: 0.8 + Math.random() * 0.3 }]);
    setSelectedId(id);
    SoundManager.rustle();
    return id;
  };
  // Expose for ghost drop
  React.useEffect(() => { ArrangePhase._addItem = addItem; });

  const updateItem = (id, patch) => {
    setItems((prev) => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  };
  const deleteItem = React.useCallback((id) => {
    setItems((prev) => prev.filter(it => it.id !== id));
    setSelectedId(null);
  }, [setItems]);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (!selectedId) return;
      e.preventDefault();
      deleteItem(selectedId);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, deleteItem]);

  const onPaperMouseDown = (e) => {
    // clicked empty paper — deselect
    if (e.target === paperRef.current || e.target.dataset.paper === 'bg') {
      setSelectedId(null);
    }
  };

  return (
    <motion.div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: 0,
      overflow: 'visible',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }}>
      <motion.div style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
      }}>
        <motion.div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: inlineLayout ? 0 : (contentCenterX != null ? contentCenterX : '50%'),
          right: inlineLayout ? 0 : undefined,
          transform: inlineLayout ? 'none' : 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100%',
        }}>
        <motion.div
          ref={paperRef}
          data-paper="true"
          onMouseDown={onPaperMouseDown}
          style={{
            position: 'relative',
            top: paperTopOffset,
            width: PAPER_W,
            height: PAPER_H,
            flexShrink: 0,
            transform: `scale(${displayScale})`,
            transformOrigin: 'top center',
            background: paperTone.base,
            backgroundImage: paperTone.texture,
            boxShadow: 'none',
            border: border(UI().line),
            cursor: 'default',
          }}
        >
      {/* Empty state hint */}
      {items.length === 0 && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          transform: 'translateY(-50%)',
          textAlign: 'center',
          color: UI().fgMuted,
          fontFamily: UI().font,
          fontSize: 14,
          fontWeight: 400,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          Drop objects onto the paper
        </div>
      )}

          {/* Placed items */}
          {items.map(item => (
            <PlacedItem
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={setSelectedId}
              onUpdate={updateItem}
              onDelete={deleteItem}
              displayScale={displayScale}
            />
          ))}
        </motion.div>
        </motion.div>
      </motion.div>
      {onExpose && !inlineLayout && !layout.compactArrangeChrome && (
        <motion.div style={{
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6px 20px 14px',
          gap: 8,
        }}>
          <InkButton onClick={onExpose} disabled={items.length === 0}>
            Expose →
          </InkButton>
        </motion.div>
      )}
      {onExpose && !inlineLayout && layout.compactArrangeChrome && (
        <motion.div style={{
          position: 'fixed',
          left: 12,
          right: 12,
          bottom: `calc(${Math.max(bottomChromePx, 1)}px + max(12px, env(safe-area-inset-bottom, 0px)) + 4px - ${COMPACT_EXPOSE_BTN_CLEAR_PAPER_PX}px)`,
          zIndex: 10001,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <InkButton onClick={onExpose} disabled={items.length === 0} style={{ width: '100%', maxWidth: 400 }}>
            Expose →
          </InkButton>
        </motion.div>
      )}
    </motion.div>
  );
};

window.ArrangePhase = ArrangePhase;
window.SpecimenTrayScroll = SpecimenTrayScroll;
window.BotanicalTray = BotanicalTray;
window.BotanicalSVG = BotanicalSVG;
window.PAPER_W = PAPER_W;
window.PAPER_H = PAPER_H;
