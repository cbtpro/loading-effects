const rows = [
  { key: 'title', width: '58%' },
  { key: 'body', width: '100%' },
  { key: 'footer', width: '76%' },
];
const keys = ['title', 'body', 'footer'];
const base = {
  layout: { default: 'text-lines', choices: ['text-lines', 'article-card'], label: '布局' },
  cornerRadius: { default: 4, min: 0, max: 16, step: 1, label: '圆角（px）' },
  color: { type: 'color', default: '#91AED5', label: '占位颜色' },
  duration: { default: 1600, min: 500, max: 5000, step: 100, label: '周期（ms）' },
};

function skeletonRows(surface, layout) {
  const document = surface.ownerDocument;
  const container = document.createElement('div');
  Object.assign(container.style, {
    width: 'min(86%, 400px)', display: 'grid', gap: '8px',
  });
  if (layout === 'article-card') {
    Object.assign(container.style, {
      padding: '12px', border: '1px solid color-mix(in srgb, currentColor 45%, transparent)', borderRadius: '10px',
    });
  }
  surface.append(container);
  return rows.map(({ key, width }) => {
    const region = document.createElement('div');
    region.dataset.region = key;
    Object.assign(region.style, { position: 'relative', height: '18px', minWidth: '0' });
    const placeholder = document.createElement('div');
    placeholder.setAttribute('aria-hidden', 'true');
    Object.assign(placeholder.style, {
      width: layout === 'article-card' && key === 'title' ? '42%' : width,
      height: '100%', backgroundColor: 'currentColor',
    });
    region.append(placeholder);
    container.append(region);
    return { region, placeholder, key };
  });
}

const breathe = phase => .5 - .5 * Math.cos(phase * Math.PI * 2);

function skeletonEffect(id, title, description, schema, paint) {
  return {
    id, title, description, renderer: 'css', skeleton: true, layoutFields: ['layout'],
    schema: { ...base, ...schema },
    mount(surface, options) {
      const regions = skeletonRows(surface, options.layout);
      return (phase, next, still, pointer) => regions.forEach(({ placeholder }, index) => {
        placeholder.style.borderRadius = `${next.cornerRadius}px`;
        paint(placeholder.style, phase, next, index, still);
        const hovered = Math.min(regions.length - 1, Math.floor((pointer?.y ?? 0) * regions.length));
        const strength = index === hovered ? pointer?.strength ?? 0 : 0;
        placeholder.style.filter = strength ? `brightness(${1 + strength * .3})` : '';
      });
    },
  };
}

export const shimmerSkeleton = /* @__PURE__ */ skeletonEffect(
  'shimmer-skeleton', '流光骨架', '柔和高光扫过占位块，保持内容区域的尺寸。',
  { bandWidth: { default: .3, min: .1, max: .8, step: .05, label: '光带宽度比例' } },
  (style, phase, { bandWidth }, _, still) => {
    const center = phase * (100 + bandWidth * 100) - bandWidth * 50;
    style.backgroundImage = still ? 'none' : `linear-gradient(90deg, transparent ${center - bandWidth * 50}%, #ffffff8c ${center}%, transparent ${center + bandWidth * 50}%)`;
    style.opacity = '.65';
  },
);

export const pulseSkeleton = /* @__PURE__ */ skeletonEffect(
  'pulse-skeleton', '呼吸骨架', '占位块同步在设定的透明度范围内起伏。',
  {
    minOpacity: { default: .55, min: .1, max: 1, step: .05, label: '最低透明度' },
    maxOpacity: { default: 1, min: .1, max: 1, step: .05, label: '最高透明度' },
  },
  (style, phase, { minOpacity, maxOpacity }, _, still) => {
    const low = Math.min(minOpacity, maxOpacity);
    const high = Math.max(minOpacity, maxOpacity);
    style.opacity = low + (high - low) * (still ? .5 : breathe(phase));
  },
);

export const staggeredSkeleton = /* @__PURE__ */ skeletonEffect(
  'staggered-skeleton', '错峰骨架', '占位块按阅读顺序错峰变亮并回落。',
  {
    stagger: { default: 100, min: 0, max: 500, step: 10, label: '错峰（ms）' },
    minOpacity: { default: .6, min: .1, max: 1, step: .05, label: '最低透明度' },
  },
  (style, phase, { duration, stagger, minOpacity }, index, still) => {
    style.opacity = minOpacity + (1 - minOpacity) * (still ? .5 : breathe(phase - index * stagger / duration));
  },
);

export const progressiveReveal = {
  id: 'progressive-reveal',
  title: '渐进揭示',
  description: '各区内容就绪后独立替换占位，保留原来的区域尺寸。',
  renderer: 'css',
  skeleton: true,
  reveal: true,
  layoutFields: ['layout'],
  schema: {
    layout: base.layout,
    cornerRadius: base.cornerRadius,
    color: base.color,
    readyKeys: { default: [], itemChoices: keys, minItems: 0 },
    content: { default: {}, type: 'textMap', itemChoices: keys },
    fadeDuration: { default: 180, min: 0, max: 500, step: 10, label: '淡入时间（ms）' },
  },
  animated: () => false,
  mount(surface, { layout }) {
    const document = surface.ownerDocument;
    const regions = skeletonRows(surface, layout).map(entry => {
      const text = document.createElement('div');
      Object.assign(text.style, {
        position: 'absolute', inset: '0', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', lineHeight: '18px', fontSize: '.8rem', color: 'var(--loading-content-color, #16243b)',
        opacity: '0',
      });
      entry.region.append(text);
      return { ...entry, text };
    });
    return (_, options, still, pointer) => {
      const hovered = pointer?.strength
        ? regions[Math.min(regions.length - 1, Math.floor(pointer.y * regions.length))]
        : null;
      for (const { region, placeholder, text, key } of regions) {
        const ready = options.readyKeys.includes(key);
        region.dataset.ready = String(ready);
        const duration = still || options.paused ? 0 : options.fadeDuration;
        placeholder.style.borderRadius = `${options.cornerRadius}px`;
        placeholder.style.transition = `opacity ${duration}ms ease`;
        text.style.transition = placeholder.style.transition;
        placeholder.style.opacity = ready ? '0' : String(.65 + (hovered?.region === region ? .25 * pointer.strength : 0));
        text.style.opacity = ready ? '1' : '0';
        text.setAttribute('aria-hidden', String(!ready));
        const content = ready ? options.content[key] ?? '' : '';
        if (text.textContent !== content) text.textContent = content;
      }
    };
  },
};
