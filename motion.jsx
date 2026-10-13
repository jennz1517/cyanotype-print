// motion.* — DOM wrappers (style/ref/onClick). No Framer Motion dependency.
// Cache tag components so parent re-renders don't remount children (new type each access).

const motionTag = (tag) => {
  const C = React.forwardRef((props, ref) => React.createElement(tag, { ...props, ref }));
  C.displayName = `motion.${tag}`;
  return C;
};

const motionCache = Object.create(null);
const motion = new Proxy({}, {
  get: (_, tag) => {
    if (typeof tag !== 'string') return undefined;
    if (!motionCache[tag]) motionCache[tag] = motionTag(tag);
    return motionCache[tag];
  },
});

window.motion = motion;
