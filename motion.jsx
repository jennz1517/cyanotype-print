// motion.* — DOM wrappers (style/ref/onClick). No Framer Motion dependency.

const motionTag = (tag) => {
  const C = React.forwardRef((props, ref) => React.createElement(tag, { ...props, ref }));
  C.displayName = `motion.${tag}`;
  return C;
};

const motion = new Proxy({}, {
  get: (_, tag) => motionTag(tag),
});
