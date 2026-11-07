import { bendSurface, pointerWeight } from './pointer.js';
import { waveSchema, createWaveState, updateWaveLevel } from './progress.js';

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
  draw(ctx, { x, y, limit }, elapsed, { radius, lobes, amplitude, duration, color, opacity }, _state, _size, _still, pointer) {
    const r = Math.min(radius, limit);
    const a = Math.min(amplitude, r * .45, limit - r);
    const phase = elapsed % duration / duration * tau;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let index = 0; index < 96; index++) {
      const angle = index / 96 * tau;
      const baseDistance = r + a * (.74 * Math.sin(lobes * angle - phase) +
        .26 * Math.sin((lobes - 1) * angle + phase));
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const strength = pointerWeight(pointer, x + baseDistance * cos, y + baseDistance * sin, 72);
      const pull = (pointer?.x ?? x) * cos + (pointer?.y ?? y) * sin - (x * cos + y * sin + baseDistance);
      const distance = Math.max(1, Math.min(limit, baseDistance + strength * Math.max(-8, Math.min(10, pull))));
      const px = x + distance * cos;
      const py = y + distance * sin;
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

function drawLayer(ctx, tank, level, amplitude, wavelength, phase, pointer) {
  const { x, y, size } = tank;
  const bottom = y + size;
  const surfaceY = bottom - level;
  const bendLimit = Math.min(12, level, size - level);
  const surfaceAt = offset => surfaceY + amplitude * Math.sin(offset / wavelength * tau - phase) +
    bendSurface(pointer, x + offset, surfaceY, bendLimit);
  ctx.beginPath();
  ctx.moveTo(x, bottom);
  for (let offset = 0; offset < size; offset += 2) {
    ctx.lineTo(x + offset, surfaceAt(offset));
  }
  ctx.lineTo(x + size, surfaceAt(size));
  ctx.lineTo(x + size, bottom);
  ctx.closePath();
  ctx.fill();
}

function drawLiquidFill(ctx, tank, elapsed, options, state, _size, still, pointer) {
  const { progress, progressSource, duration, amplitude, wavelength, showValue, color, backColor, opacity } = options;
  const level = tank.size * updateWaveLevel(state, elapsed, options, still) / 100;
  const { x, y, size, shape } = tank;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const phase = elapsed % duration / duration * tau;

  ctx.save();
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(centerX, centerY, size / 2, 0, tau);
  else ctx.roundRect(x, y, size, size, size * .18);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.globalAlpha = .11 * opacity;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = .35 * opacity;
  ctx.stroke();

  if (progress === null) {
    const indicatorY = centerY + (showValue ? size * .19 : 0);
    for (let index = 0; index < 3; index++) {
      ctx.globalAlpha = opacity * (still ? .55 : .42 + .3 * Math.sin(phase - index * 1.4));
      ctx.beginPath();
      ctx.arc(centerX + (index - 1) * size * .09, indicatorY, size * .022, 0, tau);
      ctx.fill();
    }
  } else if (level > 0) {
    const wave = still ? 0 : Math.min(amplitude, level, Math.max(0, size - level));
    if (wave > 0) {
      ctx.fillStyle = backColor;
      ctx.globalAlpha = .72 * opacity;
      drawLayer(ctx, tank, level, wave, wavelength, -phase + 2, pointer);
    }
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    drawLayer(ctx, tank, level, wave, wavelength, phase, pointer);
  }

  if (showValue) {
    const text = progress === null ? '加载中' : `${progressSource === 'estimated' ? '预计 ' : ''}${progress}%`;
    ctx.globalAlpha = opacity;
    ctx.font = `600 ${Math.min(14, size * .19)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const width = Math.min(size * .9, ctx.measureText(text).width + 16);
    const height = Math.min(24, size * .32);
    ctx.beginPath();
    ctx.roundRect(centerX - width / 2, centerY - height / 2, width, height, height / 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#16243b';
    ctx.fillText(text, centerX, centerY, Math.max(1, width - 6));
  }
  ctx.restore();
}

function mountLiquidFallback(host) {
  const document = host.ownerDocument;
  const tank = document.createElement('div');
  const fill = document.createElement('div');
  const label = document.createElement('span');
  Object.assign(host.style, { display: 'grid', placeItems: 'center', containerType: 'size' });
  Object.assign(tank.style, {
    width: 'min(80%, 100px)', aspectRatio: '1', position: 'relative',
    overflow: 'hidden', display: 'grid', placeItems: 'center',
  });
  tank.style.width = 'min(80cqw, 76cqh, 132px)';
  Object.assign(fill.style, { position: 'absolute', bottom: '0', insetInline: '0' });
  Object.assign(label.style, {
    position: 'relative', borderRadius: '999px', padding: '2px 7px',
    backgroundColor: '#fff', color: '#16243b', font: '600 12px system-ui',
  });
  tank.append(fill, label);
  host.append(tank);
  return ({ progress, progressSource, shape, color, showValue }) => {
    tank.style.borderRadius = shape === 'circle' ? '50%' : '18%';
    tank.style.color = color;
    tank.style.backgroundColor = '#eaf2ff';
    tank.style.backgroundColor = 'color-mix(in srgb, currentColor 11%, transparent)';
    tank.style.boxShadow = 'inset 0 0 0 1px color-mix(in srgb, currentColor 35%, transparent)';
    fill.style.backgroundColor = color;
    fill.style.height = `${progress ?? 0}%`;
    label.hidden = !showValue;
    label.textContent = progress === null ? '加载中' :
      `${progressSource === 'estimated' ? '预计 ' : ''}${progress}%`;
  };
}

export const liquidFill = {
  id: 'liquid-fill',
  title: '液位填充',
  description: '任务进度推动液位变化，液面波纹限制在容器内。',
  renderer: 'canvas',
  taskProgress: true,
  layoutFields: ['shape'],
  createState: createWaveState,
  draw: drawLiquidFill,
  mountFallback: mountLiquidFallback,
  schema: {
    ...waveSchema,
    backColor: { type: 'color', default: '#74A7FA', label: '后层液面颜色' },
    shape: { default: 'circle', choices: ['circle', 'rounded-square'], label: '容器形状' },
    amplitude: { ...waveSchema.amplitude, default: 3 },
    wavelength: { ...waveSchema.wavelength, default: 36 },
  },
  prepare({ width, height }, { shape }) {
    const size = Math.min(width * .8, height * .76, 132);
    return { x: (width - size) / 2, y: (height - size) / 2, size, shape };
  },
};
