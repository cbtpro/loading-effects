import { commonSchema } from '@loading-effects/core';

const tau = 2 * Math.PI;

const matrixSchema = {
  color: { type: 'color', default: '#4D8DFF', label: '点阵颜色' },
  background: { type: 'color', default: '#FFFFFF' },
  rows: { default: 'auto', choices: ['auto'], min: 1, max: 160, integer: true },
  columns: { default: 'auto', choices: ['auto'], min: 1, max: 160, integer: true },
  gap: { default: 'auto', choices: ['auto'], min: 10, max: 40, step: 1, label: '间距（px）' },
  density: { default: null, min: 4, max: 24, integer: true },
  origin: { default: [.5, .64], type: 'origin' },
  amplitude: { default: 1.4, min: 0, max: 3, step: .1, label: '振幅（px）' },
  falloff: { default: 1.2, min: 0, max: 3, step: .1, label: '空间衰减' },
  maxDots: { default: 2500, min: 1, max: 2500, integer: true },
  exitDuration: { default: 180, min: 0, max: 300 },
};

function prepareGrid({ width, height }, options, spatialPhase) {
  const gap = options.gap === 'auto'
    ? (options.density === null ? 18 : 28 - .6 * options.density)
    : options.gap;
  const columns = options.columns === 'auto' ? Math.max(1, Math.floor(width / gap)) : options.columns;
  const rows = options.rows === 'auto' ? Math.max(1, Math.floor(height / gap)) : options.rows;
  const scale = Math.min(1, Math.sqrt(options.maxDots / (columns * rows)));
  const countX = Math.min(options.maxDots, Math.max(1, Math.floor(columns * scale)));
  const countY = Math.min(Math.floor(options.maxDots / countX), Math.max(1, Math.floor(rows * scale)));
  const stepX = options.columns === 'auto' && countX === columns ? gap : width / countX;
  const stepY = options.rows === 'auto' && countY === rows ? gap : height / countY;
  const startX = (width - (countX - 1) * stepX) / 2;
  const startY = (height - (countY - 1) * stepY) / 2;
  const phaseAt = spatialPhase(width, height, options);
  const points = [];

  for (let row = 0; row < countY; row++) {
    for (let column = 0; column < countX; column++) {
      const x = startX + column * stepX;
      const y = startY + row * stepY;
      const dx = x - options.origin[0] * width;
      const dy = y - options.origin[1] * height;
      points.push({
        x, y,
        weight: Math.max(.12, 1 - Math.hypot(dx / width, dy / height) * options.falloff),
        phase: phaseAt(dx, dy),
      });
    }
  }

  return { points, maxRadius: .42 * Math.min(stepX, stepY) };
}

function drawGrid(context, { points, maxRadius }, options, waveAt) {
  context.fillStyle = options.color;
  for (const point of points) {
    const wave = waveAt(point);
    const radius = Math.min(.6 + point.weight * (.75 + options.amplitude * wave), maxRadius);
    context.globalAlpha = options.opacity * Math.min(.9, .13 + point.weight * (.18 + .5 * wave));
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, tau);
    context.fill();
  }
  context.globalAlpha = 1;
}

const sineWave = phase => (Math.sin(phase) + 1) / 2;

const gridFields = ['rows', 'columns', 'gap', 'density', 'origin', 'falloff', 'maxDots'];
const direction = {
  default: 35, min: 0, max: 359, step: 1, label: '方向（°）',
  normalize: value => ((value % 360) + 360) % 360,
};
const wavelength = { default: 120, min: 24, max: 480, step: 1, label: '波长（px）' };
const duration = { default: 1900, min: 500, max: 8000, step: 100, label: '周期（ms）' };

function matrixEffect(id, title, description, motionFields, layoutFields, spatialPhase, wave = sineWave) {
  return {
    id, title, description,
    renderer: 'canvas',
    schema: { ...matrixSchema, ...motionFields },
    layoutFields: [...gridFields, ...layoutFields],
    prepare: (size, options) => prepareGrid(size, options, spatialPhase),
    draw(context, layout, elapsed, options) {
      const phase = tau * ((elapsed % options.duration) / options.duration);
      drawGrid(context, layout, options, point => wave(point.phase - phase, options));
    },
  };
}

function projectedPhase(width, height, options) {
  const angle = options.direction * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const span = width * Math.abs(cos) + height * Math.abs(sin);
  const pitch = options.crestCount > 0 ? span / options.crestCount : options.wavelength;
  return (dx, dy) => tau * (dx * cos + dy * sin) / pitch;
}

export const dotMatrixWave = /* @__PURE__ */ matrixEffect(
  'dot-matrix-wave', '点阵波浪', '圆点保持在固定网格中，波峰经过时改变半径和透明度。',
  { direction, wavelength, duration }, ['direction', 'wavelength'], projectedPhase,
);

export const radialRipple = /* @__PURE__ */ matrixEffect(
  'radial-ripple', '径向涟漪', '同心波峰从波源向外传播，沿途逐渐减弱。',
  {
    wavelength, duration,
    crestWidth: { default: .45, min: .1, max: 1, step: .05, label: '波峰宽度（周期比例）' },
  },
  ['wavelength'],
  (width, height, options) => (dx, dy) => tau * Math.hypot(dx, dy) / options.wavelength,
  (phase, { crestWidth }) => {
    const offset = Math.abs(phase % tau);
    const distance = Math.min(offset, tau - offset);
    return .5 + .5 * Math.cos(Math.PI * Math.min(1, distance / (Math.PI * crestWidth)));
  },
);

export const directionalWave = /* @__PURE__ */ matrixEffect(
  'directional-wave', '定向波浪', '等亮度网格上的平行波峰沿指定方向扫描。',
  {
    direction: { ...direction, default: 0 },
    wavelength: { ...wavelength, default: 96 },
    duration: { ...duration, default: 1500 },
    falloff: { ...matrixSchema.falloff, default: 0 },
    crestCount: { default: 'auto', choices: ['auto'], min: 1, max: 12, integer: true, step: 1, label: '波峰数' },
  },
  ['direction', 'wavelength', 'crestCount'], projectedPhase,
);

export const matrixBreathing = /* @__PURE__ */ matrixEffect(
  'matrix-breathing', '点阵呼吸', '圆点接近同步地明暗起伏，边缘略晚于中心达到峰值。',
  {
    duration: { ...duration, default: 2500 },
    amplitude: { ...matrixSchema.amplitude, default: 1.1 },
    phaseSpread: { default: 55, min: 0, max: 180, step: 1, label: '相位差（°）' },
  },
  ['phaseSpread'],
  (width, height, options) => {
    const farthest = Math.hypot(Math.max(options.origin[0], 1 - options.origin[0]),
      Math.max(options.origin[1], 1 - options.origin[1]));
    const spread = options.phaseSpread * Math.PI / 180;
    return (dx, dy) => Math.hypot(dx / width, dy / height) / farthest * spread;
  },
);

export const matrixVortex = /* @__PURE__ */ matrixEffect(
  'matrix-vortex', '点阵漩涡', '螺旋波峰绕波源旋转，圆点的位置保持固定。',
  {
    origin: { ...matrixSchema.origin, default: [.5, .5] },
    wavelength,
    duration: { ...duration, default: 2200 },
    arms: { default: 3, min: 1, max: 8, integer: true, step: 1, label: '螺旋臂数' },
    twist: { default: 1.2, min: 0, max: 2, step: .1, label: '扭转（圈／波长）' },
  },
  ['wavelength', 'arms', 'twist'],
  (width, height, options) => (dx, dy) =>
    options.arms * Math.atan2(dy, dx) + tau * options.twist * Math.hypot(dx, dy) / options.wavelength,
);

export const interactiveRipple = {
  id: 'interactive-ripple',
  title: '交互涟漪',
  description: '点击或轻触画布触发一圈向外扩散的涟漪。',
  renderer: 'canvas',
  layoutFields: gridFields,
  schema: {
    ...matrixSchema,
    cursor: { ...commonSchema.cursor, default: 'pointer' },
    waveSpeed: { default: 100, min: 25, max: 400, step: 5, label: '扩散速度（px/s）' },
    pulseWidth: { default: 24, min: 12, max: 100, step: 1, label: '脉冲宽度（px）' },
    lifetime: { default: 1500, min: 300, max: 4000, step: 100, label: '寿命（ms）' },
    maxRipples: { default: 3, min: 1, max: 8, integer: true, step: 1, label: '同时波源数' },
  },
  prepare: (size, options) => prepareGrid(size, options, () => () => 0),
  createState: () => [],
  trigger(state, [x, y], elapsed, options) {
    state.push({ x, y, start: elapsed });
    state.splice(0, Math.max(0, state.length - options.maxRipples));
  },
  isActive: state => state.length > 0,
  draw(context, layout, elapsed, options, state, { width, height }) {
    while (state.length && (state.length > options.maxRipples || elapsed - state[0].start >= options.lifetime)) {
      state.shift();
    }
    const ripples = state.map(ripple => {
      const age = elapsed - ripple.start;
      return {
        x: ripple.x * width, y: ripple.y * height,
        radius: options.waveSpeed * age / 1000,
        strength: 1 - age / options.lifetime,
      };
    });
    drawGrid(context, layout, options, point => {
      let wave = 0;
      for (const ripple of ripples) {
        const offset = Math.abs(Math.hypot(point.x - ripple.x, point.y - ripple.y) - ripple.radius);
        const edge = Math.min(1, 2 * offset / options.pulseWidth);
        wave = Math.max(wave, ripple.strength * (.5 + .5 * Math.cos(Math.PI * edge)));
      }
      return wave;
    });
  },
};

export {
  circularSpinner, bouncingDots, pulseCircle, rotatingSquares, orbitDots, elasticLine, morphingShape, flipTiles,
} from "./geometry.js";

export { circularProgress, gradientProgress, segmentedProgress, stepProgress, waveProgress } from './progress.js';

export { particleFlow, particleConvergence, particleExplosion, particleOrbit, particleMorph, particleNetwork } from './particles.js';
export { shimmerSkeleton, pulseSkeleton, staggeredSkeleton, progressiveReveal } from './skeleton.js';

export { typingDots, characterWave, textShimmer, scrambleText } from './text.js';

export { liquidBlob, liquidFill } from './liquid.js';

export { metaball, fluidRibbon, inkDiffusion } from './fluid-webgl.js';
