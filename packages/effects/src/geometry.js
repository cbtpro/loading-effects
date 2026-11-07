const tau = 2 * Math.PI;
const cycle = phase => ((phase % 1) + 1) % 1;
const pulse = phase => (1 - Math.cos(tau * phase)) / 2;
const number = (label, value, min, max, step = 1) => ({ label, default: value, min, max, step });
const choice = (label, value, choices) => ({ label, default: value, choices });
const duration = value => number('周期（ms）', value, 200, 8000, 10);

function part(surface, styles) {
  const node = surface.ownerDocument.createElement('div');
  Object.assign(node.style, {
    position: 'absolute', gridArea: '1 / 1', placeSelf: 'center', ...styles,
  });
  surface.append(node);
  return node.style;
}

function dot(surface, diameter) {
  return part(surface, {
    width: `${diameter}px`, height: `${diameter}px`,
    background: 'currentColor', borderRadius: '50%',
  });
}

function geometry(id, title, description, schema, layoutFields, mount) {
  return {
    id, title, description, renderer: 'css', layoutFields, mount,
    schema: {
      color: { type: 'color', default: '#2359BE', label: '动效颜色' },
      duration: duration(1200),
      ...schema,
    },
  };
}

export const circularSpinner = /* @__PURE__ */ geometry(
  'circular-spinner', '环形旋转', '不完整圆弧绕中心旋转，尾部逐渐淡出。',
  {
    size: /* @__PURE__ */ number('直径（px）', 24, 12, 96),
    strokeWidth: /* @__PURE__ */ number('线宽（px）', 2, 1, 12),
    arcAngle: /* @__PURE__ */ number('弧长（°）', 100, 20, 330),
    tailOpacity: /* @__PURE__ */ number('尾部透明度', .25, 0, 1, .05),
    duration: /* @__PURE__ */ duration(900),
  },
  ['size', 'strokeWidth', 'arcAngle', 'tailOpacity'],
  (surface, { size, strokeWidth, arcAngle, tailOpacity }) => {
    const thickness = Math.min(strokeWidth, size / 2);
    const style = dot(surface, size);
    style.background = `conic-gradient(transparent 0deg, color-mix(in srgb, currentColor ${tailOpacity * 100}%, transparent) 0deg, currentColor ${arcAngle}deg, transparent ${arcAngle}deg)`;
    style.maskImage = `radial-gradient(circle closest-side, transparent calc(100% - ${thickness}px), black calc(100% - ${thickness}px + .5px))`;
    return phase => { style.transform = `rotate(${360 * phase}deg)`; };
  },
);

export const bouncingDots = /* @__PURE__ */ geometry(
  'bouncing-dots', '弹跳圆点', '多个圆点沿水平方向排开，错峰上跳再落回原位。',
  {
    count: { .../* @__PURE__ */ number('圆点数', 3, 2, 8), integer: true },
    gap: /* @__PURE__ */ number('间距（px）', 5, 1, 24),
    height: /* @__PURE__ */ number('跳跃高度（px）', 6, 1, 30),
    stagger: /* @__PURE__ */ number('错峰（ms）', 120, 0, 600, 10),
    easing: /* @__PURE__ */ choice('缓动', 'ease-in-out', ['ease-in-out', 'linear']),
  },
  ['count', 'gap'],
  (surface, { count, gap }) => {
    const dots = Array.from({ length: count }, () => dot(surface, 6));
    return (phase, { height, stagger, duration, easing }) => {
      dots.forEach((style, index) => {
        const offset = cycle(phase - index * stagger / duration);
        const lift = easing === 'linear' ? 1 - Math.abs(2 * offset - 1) : pulse(offset);
        const x = (index - (count - 1) / 2) * (6 + gap);
        style.transform = `translate(${x}px, ${-height * lift}px)`;
      });
    };
  },
);

export const pulseCircle = /* @__PURE__ */ geometry(
  'pulse-circle', '呼吸圆环', '同心圆错峰放大并渐隐。',
  {
    count: { .../* @__PURE__ */ number('圆环数', 2, 1, 5), integer: true },
    radius: /* @__PURE__ */ number('半径（px）', 8, 3, 32),
    maxScale: /* @__PURE__ */ number('最大倍率', 1.6, 1, 3, .1),
    minOpacity: /* @__PURE__ */ number('最低透明度', .15, 0, 1, .05),
    duration: /* @__PURE__ */ duration(1600),
  },
  ['count', 'radius'],
  (surface, { count, radius }) => {
    const rings = Array.from({ length: count }, () => part(surface, {
      width: `${radius * 2}px`, height: `${radius * 2}px`,
      border: '2px solid currentColor', borderRadius: '50%', boxSizing: 'border-box',
    }));
    return (phase, { maxScale, minOpacity }) => rings.forEach((style, index) => {
      const offset = cycle(phase - index / count);
      style.transform = `scale(${1 + (maxScale - 1) * offset})`;
      style.opacity = 1 - (1 - minOpacity) * offset;
    });
  },
);

export const rotatingSquares = /* @__PURE__ */ geometry(
  'rotating-squares', '方块旋转', '方块绕中心旋转，并交替缩放。',
  {
    count: { .../* @__PURE__ */ number('方块数', 4, 1, 8), integer: true },
    side: /* @__PURE__ */ number('边长（px）', 6, 3, 24),
    turnAngle: /* @__PURE__ */ number('每轮旋转（°）', 360, 45, 720, 45),
    direction: /* @__PURE__ */ choice('方向', 'clockwise', ['clockwise', 'counterclockwise']),
    minScale: /* @__PURE__ */ number('最小倍率', .7, .2, 1, .05),
  },
  ['count', 'side'],
  (surface, { count, side }) => {
    const squares = Array.from({ length: count }, () => part(surface, {
      width: `${side}px`, height: `${side}px`, background: 'currentColor', borderRadius: '1px',
    }));
    return (phase, { turnAngle, direction, minScale }) => {
      const sign = direction === 'clockwise' ? 1 : -1;
      // Partial turns return to their start angle so the loop stays continuous.
      const turn = turnAngle % 360 === 0 ? phase : pulse(phase);
      squares.forEach((style, index) => {
        const angle = 360 * index / count + sign * turnAngle * turn;
        const scale = minScale + (1 - minScale) * pulse(phase + index / count);
        style.transform = `rotate(${angle}deg) translateX(${side * 1.4}px) scale(${scale})`;
      });
    };
  },
);

export const orbitDots = /* @__PURE__ */ geometry(
  'orbit-dots', '轨道圆点', '圆点沿椭圆轨道依次追逐。',
  {
    count: { .../* @__PURE__ */ number('圆点数', 3, 1, 8), integer: true },
    radiusX: /* @__PURE__ */ number('横向半径（px）', 12, 3, 40),
    radiusY: /* @__PURE__ */ number('纵向半径（px）', 8, 3, 40),
    phaseGap: /* @__PURE__ */ number('相邻相位差（°）', 30, 10, 180, 5),
  },
  ['count'],
  (surface, { count }) => {
    const dots = Array.from({ length: count }, () => dot(surface, 5));
    return (phase, { radiusX, radiusY, phaseGap }) => dots.forEach((style, index) => {
      const angle = tau * (phase - index * phaseGap / 360);
      style.transform = `translate(${Math.cos(angle) * radiusX}px, ${Math.sin(angle) * radiusY}px)`;
      style.opacity = 1 - .7 * index / count;
    });
  },
);

export const elasticLine = /* @__PURE__ */ geometry(
  'elastic-line', '弹性线条', '水平线条随位移伸展和收缩，回到起点。',
  {
    minLength: /* @__PURE__ */ number('最短长度（px）', 6, 2, 32),
    maxLength: /* @__PURE__ */ number('最长长度（px）', 24, 8, 80),
    travel: /* @__PURE__ */ number('位移（px）', 12, 0, 40),
    strokeWidth: /* @__PURE__ */ number('线宽（px）', 3, 1, 12),
  },
  ['strokeWidth'],
  (surface, { strokeWidth }) => {
    const style = part(surface, {
      width: '1px', height: `${strokeWidth}px`, background: 'currentColor',
    });
    return (phase, { minLength, maxLength, travel }) => {
      const shift = pulse(phase);
      const length = minLength + (Math.max(minLength, maxLength) - minLength) * Math.sin(Math.PI * shift);
      style.transform = `translateX(${travel * (shift - .5)}px) scaleX(${length})`;
    };
  },
);

const shapes = {
  'circle-square-diamond': ['circle', 'square', 'diamond'],
  'circle-diamond-square': ['circle', 'diamond', 'square'],
};

export const morphingShape = /* @__PURE__ */ geometry(
  'morphing-shape', '形状变换', '圆形、方形和菱形之间连续过渡。',
  {
    shapes: { default: ['circle', 'square', 'diamond'], itemChoices: ['circle', 'square', 'diamond'] },
    shapeOrder: /* @__PURE__ */ choice('变换顺序', 'circle-square-diamond', /* @__PURE__ */ Object.keys(shapes)),
    cornerRadius: /* @__PURE__ */ number('方形圆角（px）', 3, 0, 12),
    duration: /* @__PURE__ */ duration(2100),
  },
  [],
  surface => {
    const style = dot(surface, 24);
    return (phase, { shapes: sequence, shapeOrder, cornerRadius }) => {
      const order = shapeOrder === 'circle-square-diamond' ? sequence : shapes[shapeOrder];
      const position = cycle(phase) * order.length;
      const index = Math.floor(position);
      const current = order[index];
      const next = order[(index + 1) % order.length];
      const fraction = pulse((position - index) / 2);
      const radius = shape => shape === 'circle' ? 12 : cornerRadius;
      const angle = shape => shape === 'diamond' ? 45 : 0;
      style.borderRadius = `${radius(current) + (radius(next) - radius(current)) * fraction}px`;
      style.transform = `rotate(${angle(current) + (angle(next) - angle(current)) * fraction}deg)`;
    };
  },
);

export const flipTiles = /* @__PURE__ */ geometry(
  'flip-tiles', '翻转方块', '网格中的方块按行错峰翻转。',
  {
    rows: { .../* @__PURE__ */ number('行数', 2, 1, 5), integer: true },
    columns: { .../* @__PURE__ */ number('列数', 2, 1, 5), integer: true },
    axis: /* @__PURE__ */ choice('翻转轴', 'y', ['x', 'y']),
    tileSize: /* @__PURE__ */ number('边长（px）', 8, 4, 20),
    stagger: /* @__PURE__ */ number('错峰（ms）', 90, 0, 300, 10),
  },
  ['rows', 'columns', 'tileSize'],
  (surface, { rows, columns, tileSize }) => {
    const tiles = Array.from({ length: rows * columns }, () => part(surface, {
      width: `${tileSize}px`, height: `${tileSize}px`, background: 'currentColor', borderRadius: '1px',
    }));
    return (phase, { axis, stagger, duration }) => tiles.forEach((style, index) => {
      const row = Math.floor(index / columns);
      const x = (index % columns - (columns - 1) / 2) * (tileSize + 3);
      const y = (row - (rows - 1) / 2) * (tileSize + 3);
      const rotation = cycle(phase - row * stagger / duration) * 360;
      style.transform = `translate(${x}px,${y}px) perspective(80px) rotate${axis.toUpperCase()}(${rotation}deg)`;
    });
  },
);
