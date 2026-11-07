import { splitGraphemes } from '@loading-effects/core';
import { pointerAlong } from './pointer.js';

const base = {
  text: { type: 'text', default: 'Loading', maxLength: 48, label: '文字' },
  color: { type: 'color', default: '#2359BE', label: '文字颜色' },
};

function label(surface) {
  const node = surface.ownerDocument.createElement('span');
  Object.assign(node.style, { whiteSpace: 'pre', fontWeight: '600', fontSize: '1rem' });
  surface.append(node);
  return node;
}

export const typingDots = {
  id: 'typing-dots',
  title: '输入省略号',
  description: '圆点按节拍依次出现，文字和尾部占位保持固定。',
  renderer: 'css',
  layoutFields: ['text', 'maxDots'],
  schema: {
    ...base,
    maxDots: { default: 3, min: 1, max: 6, integer: true, step: 1, label: '圆点上限' },
    interval: { default: 300, min: 60, max: 1000, step: 10, label: '圆点间隔（ms）' },
  },
  resolveDuration: ({ maxDots, interval }) => (maxDots + 1) * interval,
  mount(surface, { text, maxDots }) {
    const node = label(surface);
    node.append(text);
    const dots = Array.from({ length: maxDots }, () => {
      const dot = surface.ownerDocument.createElement('span');
      dot.textContent = '.';
      node.append(dot);
      return dot;
    });
    return (phase, _options, still, pointer) => {
      const shown = still ? maxDots : Math.min(maxDots, Math.floor(phase * (maxDots + 1)));
      const strength = pointer?.strength ?? 0;
      dots.forEach((dot, index) => {
        dot.style.visibility = index < shown || strength > 0 ? 'visible' : 'hidden';
        dot.style.opacity = index < shown ? '1' : String(strength * (1 - index / maxDots) * .65);
      });
    };
  },
};

export const characterWave = {
  id: 'character-wave',
  title: '字符波浪',
  description: '字素簇错峰抬升和回落，组合字符和表情保持完整。',
  renderer: 'css',
  layoutFields: ['text'],
  schema: {
    ...base,
    amplitude: { default: 4, min: 0, max: 18, step: 1, label: '抬升高度（px）' },
    stagger: { default: 75, min: 0, max: 300, step: 5, label: '错峰（ms）' },
  },
  mount(surface, { text }) {
    const node = label(surface);
    const chars = splitGraphemes(text).map(value => {
      const char = surface.ownerDocument.createElement('span');
      char.textContent = value;
      char.style.display = 'inline-block';
      node.append(char);
      return char;
    });
    return (phase, { amplitude, stagger, duration }, still, pointer) => {
      const strength = pointer?.strength ?? 0;
      const center = strength ? pointerAlong(pointer, surface, node) * chars.length : 0;
      chars.forEach((char, index) => {
        const angle = (phase - index * stagger / duration) * Math.PI * 2;
        const boost = Math.max(0, 1 - Math.abs(center - index - .5) / 2) * strength;
        const lift = still ? 0 : ((1 - Math.cos(angle)) / 2 + .75 * boost) * amplitude;
        char.style.transform = `translateY(${-lift}px)`;
      });
    };
  },
};

export const textShimmer = {
  id: 'text-shimmer',
  title: '文字流光',
  description: '高光沿文字表面移动，字形与文字宽度保持稳定。',
  renderer: 'css',
  layoutFields: ['text'],
  schema: {
    ...base,
    highlightWidth: { default: .28, min: .1, max: .7, step: .01, label: '高光宽度比例' },
    direction: { default: 0, min: 0, max: 359, step: 1, label: '方向（°）' },
    duration: { default: 1600, min: 300, max: 6000, step: 100, label: '周期（ms）' },
  },
  mount(surface, { text }) {
    const node = label(surface);
    node.textContent = text;
    node.style.backgroundClip = 'text';
    return (phase, { color, highlightWidth, direction }, still, pointer) => {
      const half = highlightWidth * 50;
      const moving = phase * (100 + 2 * half) - half;
      const center = pointer?.strength ? moving + (pointerAlong(pointer, surface, node) * 100 - moving) * pointer.strength : moving;
      node.style.color = still || !node.style.backgroundClip ? color : 'transparent';
      node.style.backgroundImage = still ? 'none' :
        `linear-gradient(${90 + direction}deg, ${color} ${center - half}%, color-mix(in srgb, ${color}, white 48%) ${center}%, ${color} ${center + half}%)`;
    };
  },
};

export const scrambleText = {
  id: 'scramble-text',
  title: '字符解码',
  description: '临时字符依次锁定为目标文字，短暂停留后开始下一轮。',
  renderer: 'css',
  layoutFields: ['text', 'alphabet'],
  schema: {
    ...base,
    alphabet: { type: 'text', default: 'ABC012', maxLength: 48, label: '临时字符集' },
    tick: { default: 90, min: 40, max: 500, step: 10, label: '解码节拍（ms）' },
    hold: { default: 500, min: 0, max: 2000, step: 50, label: '停留（ms）' },
    seed: { default: 1, min: 0, max: 999, integer: true, step: 1, label: '随机种子' },
  },
  resolveDuration: ({ text, tick, hold }) => splitGraphemes(text).length * tick + hold,
  mount(surface, { text, alphabet }) {
    const node = label(surface);
    const pool = splitGraphemes(alphabet);
    const slots = splitGraphemes(text).map(value => {
      const slot = surface.ownerDocument.createElement('span');
      Object.assign(slot.style, { position: 'relative', display: 'inline-block' });
      const measure = surface.ownerDocument.createElement('span');
      measure.textContent = value;
      measure.style.visibility = 'hidden';
      const glyph = surface.ownerDocument.createElement('span');
      Object.assign(glyph.style, { position: 'absolute', inset: '0', overflow: 'hidden', textAlign: 'center' });
      slot.append(measure, glyph);
      node.append(slot);
      return { value, glyph };
    });
    return (phase, { duration, tick, seed }, still, pointer) => {
      const strength = pointer?.strength ?? 0;
      const hovered = strength ? Math.min(slots.length - 1, Math.floor(pointerAlong(pointer, surface, node) * slots.length)) : -1;
      const step = Math.floor(phase * duration / tick);
      slots.forEach(({ value, glyph }, index) => {
        const state = Math.imul(seed + index * 31 + step * 101, 0x9e3779b1);
        const next = still || index < step || (index === hovered && strength > .4) || !value.trim()
          ? value : pool[(state >>> 0) % pool.length];
        if (glyph.textContent !== next) glyph.textContent = next;
      });
    };
  },
};
