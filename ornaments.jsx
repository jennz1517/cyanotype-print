// Shared UI — minimal brutalist grid chrome (typography, frames, buttons).

window.UI_THEME = {
  bg: '#ffffff',
  bgSoft: '#f7f7f7',
  bgInverse: '#000000',
  fg: '#000000',
  fgMuted: '#5a5a5a',
  fgInverse: '#ffffff',
  line: '#000000',
  lineSoft: '#d4d4d4',
  lineWidth: 1,
  font: '"IBM Plex Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace',
  paperShadow: 'none',
  panelShadow: '4px 4px 0 #000000',
};

const T = () => window.UI_THEME;
const linePx = () => T().lineWidth ?? 1;
const border = (color) => `${linePx()}px solid ${color ?? T().line}`;

window.UI_BORDER = border;

const CornerFleuron = ({ size = 28, color, rotate = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" style={{ transform: `rotate(${rotate}deg)`, display: 'block' }}>
    <path d="M 2 2 L 26 2" stroke={color || T().line} strokeWidth="1" fill="none"/>
    <path d="M 2 2 L 2 26" stroke={color || T().line} strokeWidth="1" fill="none"/>
  </svg>
);

const DoubleRule = ({ color, width = '100%' }) => (
  <div style={{
    width,
    borderTop: border(color || T().line),
    height: 0,
  }}/>
);

const OrnamentHeader = ({ children, color }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: color || T().fg,
    fontFamily: T().font,
    fontSize: 11,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    fontWeight: 600,
  }}>
    <div style={{ flex: 1, height: linePx(), background: color || T().line }}/>
    <div>{children}</div>
    <div style={{ flex: 1, height: linePx(), background: color || T().line }}/>
  </div>
);

const FramedPanel = ({ children, style, color }) => (
  <div style={{ position: 'relative', border: border(color || T().line), ...style }}>
    {children}
  </div>
);

const PAPER_TEXTURE_CSS = '';

const CatalogLabel = ({ children, size = 10, color }) => (
  <div style={{
    fontFamily: T().fontMono,
    fontSize: size,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: color || T().fgMuted,
    fontWeight: 500,
  }}>{children}</div>
);

const InkButton = ({ children, onClick, disabled, variant = 'primary', style }) => {
  const [hover, setHover] = React.useState(false);
  const primary = variant === 'primary';
  const bg = primary
    ? (disabled ? T().lineSoft : (hover && !disabled ? T().fgMuted : T().bgInverse))
    : (hover && !disabled ? T().bgSoft : T().bg);
  const fg = primary
    ? (disabled ? T().fgMuted : T().fgInverse)
    : (disabled ? T().fgMuted : T().fg);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: bg,
        color: fg,
        border: border(T().line),
        padding: '12px 24px',
        fontFamily: T().font,
        fontSize: 12,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 120ms, color 120ms',
        borderRadius: 0,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

Object.assign(window, {
  CornerFleuron, DoubleRule, OrnamentHeader, FramedPanel, CatalogLabel, InkButton,
  PAPER_TEXTURE_CSS,
});
