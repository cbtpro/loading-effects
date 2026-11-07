import { waveSchema, createWaveState, drawWaveTank } from './progress.js';

const tau = Math.PI * 2;

export const liquidBlob = {
  id: 'liquid-blob',
  title: '液态形变',
  description: '液态团块的轮廓沿周向连续起伏，整体位置保持不动。',
  renderer: 'canvas',
  layoutFields: [],
  schema: {
    color: { type: 'color', default: '#2359BE', label: '液体颜色' },
    radius: { default: 22, min: 8, max: 80, step: 1, label: '半径（px）' },
    lobes: { default: 5, min: 2, max: 8, integer: true, step: 1, label: '波瓣数' },
    amplitude: { default: 4, min: 0, max: 20, step: 1, label: '形变幅度（px）' },
    duration: { default: 2800, min: 500, max: 8000, step: 100, label: '周期（ms）' },
  },
  prepare: ({ width, height }) => ({ x: width / 2, y: height / 2, limit: Math.min(width, height) * .46 }),
  draw(ctx, { x, y, limit }, elapsed, { radius, lobes, amplitude, duration, color, opacity }) {
    const r = Math.min(radius, limit);
    const a = Math.min(amplitude, r * .45, limit - r);
    const phase = elapsed % duration / duration * tau;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let index = 0; index < 96; index++) {
      const angle = index / 96 * tau;
      const distance = r + a * (.74 * Math.sin(lobes * angle - phase) +
        .26 * Math.sin((lobes - 1) * angle + phase));
      const px = x + distance * Math.cos(angle);
      const py = y + distance * Math.sin(angle);
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    const highlight = ctx.createLinearGradient(x, y - r, x, y + r);
    highlight.addColorStop(0, '#ffffff55');
    highlight.addColorStop(1, '#ffffff00');
    ctx.fillStyle = highlight;
    ctx.fill();
    ctx.restore();
  },
};

export const liquidFill = {
  id: 'liquid-fill',
  title: '液位填充',
  description: '任务进度推动液位变化，液面波纹限制在容器内。',
  renderer: 'canvas',
  taskProgress: true,
  layoutFields: ['shape'],
  createState: createWaveState,
  draw: drawWaveTank,
  schema: {
    ...waveSchema,
    shape: { default: 'circle', choices: ['circle', 'rounded-square'], label: '容器形状' },
    amplitude: { ...waveSchema.amplitude, default: 3 },
    wavelength: { ...waveSchema.wavelength, default: 36 },
  },
  prepare({ width, height }, { shape }) {
    const size = Math.min(width * .8, height * .76, 132);
    return { x: (width - size) / 2, y: (height - size) / 2, width: size, height: size, shape };
  },
};
