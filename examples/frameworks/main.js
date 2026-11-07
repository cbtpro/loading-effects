import { createElement as hReact, StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h, ref } from 'vue';
import { LoadingEffect as ReactLoading } from '@loading-effects/react';
import { LoadingEffect as VueLoading } from '@loading-effects/vue';
import { defineLoadingEffect } from '@loading-effects/web-components';
import { circularSpinner, dotMatrixWave } from '@loading-effects/effects';
import { createCssRenderer } from '@loading-effects/renderer-css';
import { createCanvasRenderer } from '@loading-effects/renderer-canvas';

const registry = {
  effects: { [circularSpinner.id]: circularSpinner, [dotMatrixWave.id]: dotMatrixWave },
  renderers: { css: createCssRenderer, canvas: createCanvasRenderer },
};

const nextEffect = effect => effect === circularSpinner.id ? dotMatrixWave.id : circularSpinner.id;
const color = '#9333ea';

function ReactExample() {
  const [visible, setVisible] = useState(true);
  const [effect, setEffect] = useState(circularSpinner.id);
  const [alternate, setAlternate] = useState(false);
  return hReact('div', null,
    hReact('button', { onClick: () => setVisible(!visible) }, visible ? '卸载' : '挂载'),
    hReact('button', { onClick: () => setEffect(nextEffect) }, '切换动效'),
    hReact('button', { onClick: () => setAlternate(!alternate) }, '切换颜色'),
    visible && hReact(ReactLoading, { effect, registry, options: alternate ? { color } : {} }),
  );
}

createRoot(document.querySelector('#react-app')).render(hReact(StrictMode, null, hReact(ReactExample)));

createApp({
  setup() {
    const visible = ref(true);
    const effect = ref(dotMatrixWave.id);
    const alternate = ref(false);
    return () => h('div', [
      h('button', { onClick: () => { visible.value = !visible.value; } }, visible.value ? '卸载' : '挂载'),
      h('button', { onClick: () => { effect.value = nextEffect(effect.value); } }, '切换动效'),
      h('button', { onClick: () => { alternate.value = !alternate.value; } }, '切换颜色'),
      visible.value && h(VueLoading, {
        effect: effect.value, registry, options: alternate.value ? { color } : {},
      }),
    ]);
  },
}).mount('#vue-app');

defineLoadingEffect();
const element = document.createElement('loading-effect');
const elementHost = document.querySelector('#element-app');
const elementToggle = document.querySelector('#element-toggle');
element.effect = circularSpinner.id;
element.registry = registry;
element.style.height = '160px';
elementHost.append(element);

elementToggle.addEventListener('click', () => {
  if (element.isConnected) {
    element.remove();
    elementToggle.textContent = '挂载';
  } else {
    elementHost.append(element);
    elementToggle.textContent = '卸载';
  }
});
document.querySelector('#element-effect').addEventListener('click', () => {
  element.effect = nextEffect(element.effect);
});
document.querySelector('#element-speed').addEventListener('input', event => {
  element.setAttribute('speed', event.target.value);
});
