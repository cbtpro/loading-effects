const progressSchema = {
  progress: { default: null, min: 0, max: 100 },
  progressSource: { default: 'actual', choices: ['actual', 'estimated'] },
  color: { type: 'color', default: '#2359BE', label: '主色' },
};

export const circularProgress = {
  id: 'circular-progress',
  title: '环形进度',
  description: '弧长随任务进度增长，未知进度时显示旋转弧线。',
  renderer: 'css',
  taskProgress: true,
  layoutFields: [],
  schema: {
    ...progressSchema,
    size: { default: 88, min: 64, max: 132, step: 1, label: '直径（px）' },
    strokeWidth: { default: 4, min: 1, max: 12, step: 1, label: '线宽（px）' },
    startAngle: { default: -90, min: -180, max: 180, step: 1, label: '起始角度（°）' },
    showValue: { type: 'boolean', default: true, label: '显示数值' },
    transition: { default: 180, min: 0, max: 500, step: 10, label: '填充过渡（ms）' },
  },
  animated: options => options.progress === null,
  mount(surface) {
    const document = surface.ownerDocument;
    const ns = 'http://www.w3.org/2000/svg';
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, { display: 'grid', placeItems: 'center' });
    const svg = document.createElementNS(ns, 'svg');
    svg.style.gridArea = '1 / 1';
    const track = document.createElementNS(ns, 'circle');
    const arc = document.createElementNS(ns, 'circle');
    for (const circle of [track, arc]) {
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', 'currentColor');
    }
    track.setAttribute('stroke-opacity', '.15');
    arc.setAttribute('pathLength', '100');
    const value = document.createElement('span');
    Object.assign(value.style, { gridArea: '1 / 1', fontSize: '.75rem', fontVariantNumeric: 'tabular-nums' });
    svg.append(track, arc);
    wrapper.append(svg, value);
    surface.append(wrapper);

    return (phase, options, still) => {
      const { progress, progressSource, size, strokeWidth, startAngle, showValue, transition } = options;
      const unknown = progress === null;
      svg.setAttribute('width', size);
      svg.setAttribute('height', size);
      for (const circle of [track, arc]) {
        circle.setAttribute('cx', size / 2);
        circle.setAttribute('cy', size / 2);
        circle.setAttribute('r', (size - strokeWidth) / 2);
        circle.setAttribute('stroke-width', strokeWidth);
      }
      arc.style.transition = unknown || still || options.paused ? 'none' : `stroke-dashoffset ${transition}ms ease-out`;
      arc.setAttribute('stroke-dasharray', '100 100');
      arc.style.strokeDashoffset = String(100 - (unknown ? 24 : progress));
      svg.style.transform = `rotate(${startAngle + (unknown ? phase * 360 : 0)}deg)`;
      value.hidden = !showValue;
      const label = unknown ? '加载中' : `${progressSource === 'estimated' ? '预计 ' : ''}${progress}%`;
      if (value.textContent !== label) value.textContent = label;
    };
  },
};

export const gradientProgress = {
  id: 'gradient-progress',
  title: '渐变进度条',
  description: '填充长度随任务进度变化，流光限制在已填充区域。',
  renderer: 'css',
  taskProgress: true,
  layoutFields: [],
  schema: {
    ...progressSchema,
    height: { default: 6, min: 3, max: 20, step: 1, label: '高度（px）' },
    cornerRadius: { default: 3, min: 0, max: 12, step: 1, label: '圆角（px）' },
    endColor: { type: 'color', default: '#4D8DFF', label: '渐变终点色' },
    shimmer: { type: 'boolean', default: true, label: '显示流光' },
  },
  animated: options => options.progress === null || (options.shimmer && options.progress > 0),
  mount(surface) {
    const document = surface.ownerDocument;
    const track = document.createElement('div');
    const fill = document.createElement('div');
    const light = document.createElement('div');
    Object.assign(track.style, {
      width: 'min(85%, 320px)', overflow: 'hidden', background: 'color-mix(in srgb, currentColor 15%, transparent)',
    });
    Object.assign(fill.style, { height: '100%', overflow: 'hidden' });
    Object.assign(light.style, {
      width: '35%', height: '100%', background: 'linear-gradient(90deg, transparent, #ffffff70, transparent)',
    });
    fill.append(light);
    track.append(fill);
    surface.append(track);

    return (phase, { progress, height, cornerRadius, endColor, shimmer }, still) => {
      const unknown = progress === null;
      track.style.height = `${height}px`;
      track.style.borderRadius = `${cornerRadius}px`;
      fill.style.width = `${unknown ? 28 : progress}%`;
      fill.style.borderRadius = 'inherit';
      fill.style.background = `linear-gradient(90deg, currentColor, ${endColor})`;
      fill.style.transform = unknown ? `translateX(${(phase * 128 - 28) / .28}%)` : '';
      if (unknown && still) fill.style.transform = 'translateX(125%)';
      light.hidden = unknown || !shimmer || still;
      light.style.transform = `translateX(${phase * 390 - 100}%)`;
    };
  },
};

export const segmentedProgress = {
  id: 'segmented-progress',
  title: '分段进度',
  description: '各段依次填充，可选择是否显示当前段的部分进度。',
  renderer: 'css',
  taskProgress: true,
  layoutFields: ['segments'],
  schema: {
    ...progressSchema,
    segments: { default: 10, min: 2, max: 24, integer: true, step: 1, label: '段数' },
    gap: { default: 3, min: 0, max: 10, step: 1, label: '间距（px）' },
    partial: { type: 'boolean', default: true, label: '允许部分填充' },
  },
  animated: options => options.progress === null,
  mount(surface, { segments }) {
    const document = surface.ownerDocument;
    const track = document.createElement('div');
    Object.assign(track.style, {
      display: 'grid', width: 'min(85%, 320px)',
      gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))`,
    });
    const fills = Array.from({ length: segments }, () => {
      const segment = document.createElement('div');
      const fill = document.createElement('div');
      Object.assign(segment.style, {
        height: '10px', borderRadius: '3px', overflow: 'hidden',
        background: 'color-mix(in srgb, currentColor 15%, transparent)',
      });
      Object.assign(fill.style, { height: '100%', background: 'currentColor' });
      segment.append(fill);
      track.append(segment);
      return fill;
    });
    surface.append(track);
    return (phase, { progress, gap, partial }) => {
      track.style.gap = `min(${gap}px, 2%)`;
      const active = Math.floor(phase * segments);
      const filled = progress * segments / 100;
      fills.forEach((fill, index) => {
        const amount = progress === null
          ? Number(index === active)
          : Math.min(1, Math.max(0, (partial ? filled : Math.floor(filled)) - index));
        fill.style.width = `${amount * 100}%`;
      });
    };
  },
};

export const stepProgress = {
  id: 'step-progress',
  title: '阶段进度',
  description: '按宿主提供的阶段标记已完成、当前与待开始的步骤。',
  renderer: 'css',
  stageProgress: true,
  layoutFields: ['steps'],
  schema: {
    color: progressSchema.color,
    steps: { type: 'labels', default: ['准备', '处理', '完成'], min: 2, max: 8 },
    activeStep: { default: 0, min: 0, max: 7, integer: true, step: 1, label: '当前阶段（从 0 开始）' },
    showLabels: { type: 'boolean', default: true, label: '显示阶段名称' },
  },
  animated: () => false,
  mount(surface, { steps }) {
    const document = surface.ownerDocument;
    const row = document.createElement('ol');
    Object.assign(row.style, {
      display: 'grid', gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
      width: 'min(94%, 540px)', gap: '4px', margin: '0', padding: '0', listStyle: 'none',
    });
    const nodes = steps.map(name => {
      const item = document.createElement('li');
      Object.assign(item.style, { display: 'grid', justifyItems: 'center', gap: '6px', minWidth: '0' });
      const marker = document.createElement('span');
      Object.assign(marker.style, {
        display: 'grid', placeItems: 'center', width: '24px', height: '24px',
        border: '1px solid currentColor', borderRadius: '50%', fontSize: '.75rem',
      });
      const label = document.createElement('span');
      label.textContent = name;
      Object.assign(label.style, {
        maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '.75rem',
      });
      item.append(marker, label);
      row.append(item);
      return { item, marker, label };
    });
    surface.append(row);
    return (_, { activeStep, color, showLabels }) => {
      const current = Math.min(activeStep, nodes.length - 1);
      nodes.forEach(({ item, marker, label }, index) => {
        item.dataset.state = index < current ? 'completed' : index === current ? 'current' : 'pending';
        marker.textContent = index < current ? '✓' : String(index + 1);
        marker.style.background = index <= current ? color : 'transparent';
        marker.style.color = index <= current ? '#fff' : 'currentColor';
        item.style.opacity = index <= current ? '1' : '.55';
        label.hidden = !showLabels;
      });
    };
  },
};

export const waveSchema = {
  ...progressSchema,
  amplitude: { default: 4, min: 0, max: 12, step: 1, label: '振幅（px）' },
  wavelength: { default: 40, min: 12, max: 120, step: 1, label: '波长（px）' },
  showValue: { type: 'boolean', default: true, label: '显示数值' },
  transition: { default: 180, min: 0, max: 500, step: 10, label: '液面过渡（ms）' },
};

export const createWaveState = () => ({ target: null, level: 0, from: 0, start: 0 });

export function updateWaveLevel(state, elapsed, options, still) {
  const { progress, transition } = options;
  if (progress !== state.target) {
    state.from = state.target === null ? progress ?? 0 : state.level;
    state.target = progress;
    state.start = elapsed;
  }
  const fraction = still || options.paused || transition === 0 ? 1 : Math.min(1, (elapsed - state.start) / transition);
  state.level = progress === null ? 0 : state.from + (progress - state.from) * fraction;
  return state.level;
}

export function drawWaveTank(ctx, tank, elapsed, options, state, _size, still) {
  const { progress, progressSource, duration, amplitude, wavelength, showValue, color, opacity } = options;
  const levelPercent = updateWaveLevel(state, elapsed, options, still);
  const { x, y, width, height } = tank;
  const radius = Math.min(8, height / 2, width / 2);
  const phase = elapsed / duration * Math.PI * 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.globalAlpha = .14 * opacity;
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = opacity;
  if (progress === null) {
    const band = width * .28;
    const left = still ? x + (width - band) / 2 : x - band + (width + band) * ((elapsed % duration) / duration);
    ctx.fillRect(left, y + height / 2 - 2, band, 4);
  } else if (levelPercent > 0) {
    const level = height * levelPercent / 100;
    const wave = Math.min(amplitude, level, height - level);
    const bottom = y + height;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    for (let dx = 0; dx < width; dx += 2) {
      ctx.lineTo(x + dx, bottom - level + wave * Math.sin(dx / wavelength * Math.PI * 2 - phase));
    }
    ctx.lineTo(x + width, bottom - level + wave * Math.sin(width / wavelength * Math.PI * 2 - phase));
    ctx.lineTo(x + width, bottom);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  if (showValue) {
    const label = progress === null ? '加载中' : `${progressSource === 'estimated' ? '预计 ' : ''}${progress}%`;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelWidth = ctx.measureText(label).width + 14;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + (width - labelWidth) / 2, y + height / 2 - 10, labelWidth, 20);
    ctx.fillStyle = '#16243b';
    ctx.fillText(label, x + width / 2, y + height / 2);
    ctx.restore();
  }
}

export const waveProgress = {
  id: 'wave-progress',
  title: '波浪进度',
  description: '液面高度由任务进度控制，波峰沿填充区域横向移动。',
  renderer: 'canvas',
  taskProgress: true,
  layoutFields: [],
  schema: waveSchema,
  prepare({ width, height }) {
    const tankWidth = Math.min(width * .85, 320);
    const tankHeight = Math.min(height * .58, 84);
    return { x: (width - tankWidth) / 2, y: (height - tankHeight) / 2, width: tankWidth, height: tankHeight };
  },
  createState: createWaveState,
  draw: drawWaveTank,
};
