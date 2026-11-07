export const commonSchema = {
  color: { default: '#4D8DFF', type: 'color' },
  background: { default: 'transparent', type: 'color' },
  duration: { default: 1200, min: 1, max: Infinity },
  speed: { default: 1, min: .2, max: 3, step: .1 },
  opacity: { default: 1, min: 0, max: 1, step: .05 },
  loop: { default: true, type: 'boolean' },
  paused: { default: false, type: 'boolean' },
  pointerReactive: { default: true, type: 'boolean' },
  reducedMotion: { default: 'system', choices: ['system', 'static'] },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

let graphemeSegmenter;

export function splitGraphemes(text) {
  if (typeof Intl.Segmenter !== 'function') return Array.from(text);
  graphemeSegmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' });
  return Array.from(graphemeSegmenter.segment(text), entry => entry.segment);
}

export function normalizeOptions(schema, input, supportsColor) {
  return Object.fromEntries(Object.entries(schema).map(([key, field]) => {
    const value = input[key];
    let result = field.default;
    if (field.type === 'color' && typeof value === 'string' && supportsColor(value)) {
      result = value;
    } else if (field.type === 'boolean' && typeof value === 'boolean') {
      result = value;
    } else if (field.type === 'origin' && Array.isArray(value) &&
      value.length === 2 && value.every(Number.isFinite)) {
      result = value.map(component => clamp(component, 0, 1));
    } else if (field.type === 'text' && typeof value === 'string' && value.trim()) {
      result = splitGraphemes(value).slice(0, field.maxLength).join('') || field.default;
    } else if (field.type === 'labels' && Array.isArray(value) && value.length >= field.min &&
      value.length <= field.max && value.every(label => typeof label === 'string' && label.trim() && label.length <= 32)) {
      result = value.map(label => label.trim());
    } else if (field.type === 'textMap' && value && typeof value === 'object' && !Array.isArray(value)) {
      result = Object.fromEntries(field.itemChoices.filter(name => Object.hasOwn(value, name) &&
        typeof value[name] === 'string').map(name => [name, value[name].slice(0, 300)]));
    } else if (field.itemChoices && Array.isArray(value) && value.length >= (field.minItems ?? 2) &&
      value.length <= field.itemChoices.length && value.every(item => field.itemChoices.includes(item))) {
      result = value;
    } else if (field.choices?.includes(value)) {
      result = value;
    } else if (field.type !== 'labels' && Number.isFinite(value) && field.min !== undefined) {
      const number = field.integer ? Math.round(value) : value;
      result = field.normalize ? field.normalize(number) : clamp(number, field.min, field.max);
    }
    return [key, Array.isArray(result) ? [...result] : result];
  }));
}

export function normalizeProgress(value) {
  return Number.isFinite(value) ? clamp(value, 0, 100) : null;
}

export function progressAttributes(effect, options, label) {
  if (effect?.stageProgress) {
    const { steps, activeStep } = normalizeOptions({
      steps: effect.schema.steps,
      activeStep: effect.schema.activeStep,
    }, options);
    return { role: 'status', 'aria-label': `${label}，当前阶段 ${steps[Math.min(activeStep, steps.length - 1)]}` };
  }
  const amount = effect?.taskProgress ? normalizeProgress(options.progress) : null;
  if (amount === null) return { role: 'status', 'aria-label': label };
  const estimated = options.progressSource === 'estimated';
  return {
    role: 'progressbar',
    'aria-label': label,
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': amount,
    'aria-valuetext': estimated ? `预计 ${amount}%` : `${amount}%`,
  };
}

export function createLoading(element, { effect: id, ...input }, registry) {
  const effect = registry.effects[id];
  if (!effect) throw new RangeError(`Unknown loading effect: ${id}`);

  const document = element.ownerDocument;
  const window = document.defaultView;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const schema = { ...commonSchema, ...effect.schema };
  const resolve = () => {
    const normalized = normalizeOptions(schema, input, value => window.CSS.supports('color', value));
    if (effect.resolveDuration) normalized.duration = effect.resolveDuration(normalized);
    return normalized;
  };
  let options = resolve();
  const renderer = registry.renderers[effect.renderer](element, effect);
  let size = { width: 0, height: 0 };
  let dpr = window.devicePixelRatio;
  let layoutPending = true;
  let inView = false;
  let destroyed = false;
  let frame = null;
  let previous = null;
  let elapsed = 0;
  const target = [0, 0];
  const offset = [0, 0];

  const isStatic = () => options.reducedMotion === 'static' || media.matches;
  const visible = () => size.width > 0 && size.height > 0 && inView && !document.hidden;
  const allowsMotion = () => !options.paused && !isStatic();
  const animationRunning = () => allowsMotion() && renderer.animated &&
    (renderer.isActive?.() ?? (options.loop || elapsed < options.duration));
  const pointerEnabled = () => allowsMotion() && options.pointerReactive && renderer.supportsPointer;
  const running = () => visible() && (animationRunning() ||
    (pointerEnabled() && (offset[0] !== target[0] || offset[1] !== target[1])));

  function movePointer(event) {
    if (event.pointerType !== 'mouse' || !pointerEnabled()) return;
    const bounds = element.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const reach = Math.min(10, Math.min(bounds.width, bounds.height) * .06);
    target[0] = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1) * reach;
    target[1] = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1) * reach;
    schedule();
  }

  function leavePointer() {
    target.fill(0);
    schedule();
  }

  function advancePointer() {
    for (let index = 0; index < 2; index++) {
      const distance = target[index] - offset[index];
      offset[index] = Math.abs(distance) < .08 ? target[index] : offset[index] + distance * .24;
    }
  }

  function draw() {
    if (visible()) {
      if (layoutPending) {
        renderer.resize(size, dpr, options);
        layoutPending = false;
      }
      const still = isStatic();
      renderer.render(still ? 0 : elapsed, options, still, offset);
    }
  }

  function tick(timestamp) {
    frame = null;
    if (!running()) {
      previous = null;
      return;
    }
    if (animationRunning()) {
      if (previous !== null) elapsed += (timestamp - previous) * options.speed;
      if (!options.loop && !renderer.isActive) elapsed = Math.min(elapsed, options.duration);
      previous = timestamp;
    } else {
      previous = null;
    }
    if (pointerEnabled()) advancePointer();
    draw();
    schedule();
  }

  function schedule() {
    if (running()) {
      frame ??= window.requestAnimationFrame(tick);
    } else {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      previous = null;
    }
  }

  function refresh() {
    if (!visible() || !pointerEnabled()) {
      target.fill(0);
      offset.fill(0);
    }
    draw();
    schedule();
  }

  function resize() {
    size = { width: element.clientWidth, height: element.clientHeight };
    dpr = window.devicePixelRatio;
    layoutPending = true;
    if (!size.width || !size.height) renderer.resize(size, dpr, options);
    refresh();
  }

  const resizeObserver = new window.ResizeObserver(resize);
  const intersectionObserver = new window.IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    refresh();
  });
  let dprQuery;

  function watchDpr() {
    dprQuery?.removeEventListener('change', watchDpr);
    if (dpr !== window.devicePixelRatio) resize();
    dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprQuery.addEventListener('change', watchDpr);
  }

  function replaceOptions(next) {
    if (destroyed) return;
    input = { ...next };
    options = resolve();
    renderer.update(options);
    refresh();
  }

  function update(patch) {
    replaceOptions({ ...input, ...patch });
  }

  renderer.setRefresh?.(refresh);
  renderer.update(options);
  resizeObserver.observe(element);
  intersectionObserver.observe(element);
  document.addEventListener('visibilitychange', refresh);
  media.addEventListener('change', refresh);
  element.addEventListener('pointerenter', movePointer);
  element.addEventListener('pointermove', movePointer);
  element.addEventListener('pointerleave', leavePointer);
  watchDpr();
  resize();

  return {
    get renderer() { return renderer.name; },
    update,
    replaceOptions,
    pause: () => update({ paused: true }),
    resume: () => update({ paused: false }),
    trigger(origin) {
      if (destroyed || !renderer.trigger || !visible() || options.paused || isStatic() ||
        !Array.isArray(origin) || origin.length !== 2 || !origin.every(Number.isFinite)) return;
      const position = [
        clamp(origin[0] - offset[0] / size.width, 0, 1),
        clamp(origin[1] - offset[1] / size.height, 0, 1),
      ];
      renderer.trigger(position, elapsed, options);
      refresh();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', refresh);
      media.removeEventListener('change', refresh);
      element.removeEventListener('pointerenter', movePointer);
      element.removeEventListener('pointermove', movePointer);
      element.removeEventListener('pointerleave', leavePointer);
      dprQuery.removeEventListener('change', watchDpr);
      renderer.destroy();
    },
  };
}
