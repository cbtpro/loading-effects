const maxPixels = 4_000_000;
const maxEdge = 4096;

export function createCanvasRenderer(element, effect) {
  const canvas = element.ownerDocument.createElement('canvas');
  canvas.width = 0;
  canvas.height = 0;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    display: 'block', width: '100%', height: '100%', pointerEvents: 'none',
  });
  const context = canvas.getContext('2d');
  if (!context) {
    const fallback = element.ownerDocument.createElement('div');
    fallback.setAttribute('aria-hidden', 'true');
    Object.assign(fallback.style, { width: '100%', height: '100%', pointerEvents: 'none' });
    element.append(fallback);
    const updateFallback = effect.mountFallback?.(fallback);
    return {
      name: 'static',
      animated: false,
      update(options) {
        const { background, color, opacity } = options;
        fallback.style.background = background;
        fallback.style.opacity = opacity;
        if (updateFallback) {
          updateFallback(options);
          return;
        }
        fallback.style.backgroundImage = `radial-gradient(circle, ${color} 1px, transparent 1.5px)`;
        fallback.style.backgroundSize = '18px 18px';
      },
      resize() {},
      render() {},
      destroy: () => fallback.remove(),
    };
  }

  element.append(canvas);
  const state = effect.createState?.();
  const staticState = effect.createState?.();
  let size;
  let layout;
  let layoutKey;

  function prepare(options) {
    if (!size?.width || !size.height) return;
    const key = JSON.stringify([size.width, size.height, ...effect.layoutFields.map(name => options[name])]);
    if (key === layoutKey) return;
    layout = effect.prepare(size, options);
    layoutKey = key;
  }

  return {
    name: 'canvas',
    supportsPointer: true,
    animated: true,
    isActive: effect.isActive && (() => effect.isActive(state)),
    trigger: effect.trigger && ((origin, elapsed, options) => effect.trigger(state, origin, elapsed, options)),
    update(options) {
      canvas.style.backgroundColor = options.background;
      prepare(options);
    },
    resize(nextSize, dpr, options) {
      size = nextSize;
      const { width, height } = size;
      const ratio = width && height
        ? Math.min(dpr, 2, Math.sqrt(maxPixels / (width * height)), maxEdge / width, maxEdge / height)
        : 0;
      canvas.width = ratio ? Math.max(1, Math.floor(width * ratio)) : 0;
      canvas.height = ratio ? Math.max(1, Math.floor(height * ratio)) : 0;
      if (ratio) context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
      prepare(options);
    },
    render(elapsed, options, still, [x, y] = [0, 0]) {
      if (!canvas.width || !canvas.height) return;
      context.clearRect(0, 0, size.width, size.height);
      if (x || y) {
        context.save();
        context.translate(x, y);
      }
      try {
        effect.draw(context, layout, elapsed, options, still ? staticState : state, size, still);
      } finally {
        if (x || y) context.restore();
      }
    },
    destroy: () => canvas.remove(),
  };
}
