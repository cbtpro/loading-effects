export function createCssRenderer(element, effect) {
  const surface = element.ownerDocument.createElement('div');
  if (!effect.reveal) surface.setAttribute('aria-hidden', 'true');
  Object.assign(surface.style, {
    width: '100%', height: '100%', display: 'grid', placeItems: 'center',
    position: 'relative', overflow: 'hidden', pointerEvents: 'none',
  });
  element.append(surface);

  let options;
  let draw;
  let layoutKey;

  return {
    name: 'css',
    get animated() { return effect.animated?.(options) ?? true; },
    resize() {},
    update(next) {
      surface.style.background = next.background === 'transparent' ? '' : next.background;
      surface.style.color = next.color;
      surface.style.opacity = next.opacity;
      const key = JSON.stringify(effect.layoutFields.map(name => next[name]));
      options = next;
      if (key !== layoutKey) {
        layoutKey = key;
        surface.replaceChildren();
        draw = effect.mount(surface, options);
      }
    },
    render(elapsed, _options, still) {
      const progress = options.loop
        ? (elapsed % options.duration) / options.duration
        : Math.min(1, elapsed / options.duration);
      draw(progress, options, still);
    },
    destroy: () => surface.remove(),
  };
}
