import { commonSchema, createLoading, normalizeProgress, progressAttributes, splitGraphemes } from '@loading-effects/core';
import {
  circularSpinner, bouncingDots, pulseCircle, rotatingSquares, orbitDots, elasticLine, morphingShape, flipTiles,
  circularProgress, gradientProgress, segmentedProgress, stepProgress, waveProgress,
  particleFlow, particleConvergence, particleExplosion, particleOrbit, particleMorph, particleNetwork,
  shimmerSkeleton, pulseSkeleton, staggeredSkeleton, progressiveReveal,
  liquidBlob, liquidFill, metaball, fluidRibbon, inkDiffusion,
  typingDots, characterWave, textShimmer, scrambleText,
  dotMatrixWave, radialRipple, directionalWave, matrixBreathing, matrixVortex, interactiveRipple,
} from '@loading-effects/effects';
import { createCssRenderer } from '@loading-effects/renderer-css';
import { createCanvasRenderer } from '@loading-effects/renderer-canvas';
import { createWebGLRenderer } from '@loading-effects/renderer-webgl';
import { buildExample } from './code-example.js';
import './style.css';

const groups = [
  ['matrix-effects', '点阵与波纹', [dotMatrixWave, radialRipple, directionalWave, matrixBreathing, matrixVortex, interactiveRipple]],
  ['progress-effects', '进度反馈', [circularProgress, gradientProgress, segmentedProgress, stepProgress, waveProgress]],
  ['particle-effects', '粒子系统', [particleFlow, particleConvergence, particleExplosion, particleOrbit, particleMorph, particleNetwork]],
  ['skeleton-effects', '骨架占位', [shimmerSkeleton, pulseSkeleton, staggeredSkeleton, progressiveReveal]],
  ['liquid-effects', '流体与液态', [liquidBlob, liquidFill, metaball, fluidRibbon, inkDiffusion]],
  ['text-effects', '文字动效', [typingDots, characterWave, textShimmer, scrambleText]],
  ['geometry-effects', '基础几何', [circularSpinner, bouncingDots, pulseCircle, rotatingSquares, orbitDots, elasticLine, morphingShape, flipTiles]],
];
const effects = groups.flatMap(([, , presets]) => presets);
const media = matchMedia('(prefers-reduced-motion: reduce)');
const registry = {
  effects: Object.fromEntries(effects.map(effect => [effect.id, effect])),
  renderers: { canvas: createCanvasRenderer, css: createCssRenderer, webgl: createWebGLRenderer },
};
const template = document.querySelector('#effect-card');

function mountCard(card, effect) {
  const get = name => card.querySelector(`[data-part="${name}"]`);
  const surface = get('surface');
  const progress = get('progress');
  const pause = get('pause');
  const finish = get('finish');
  const mode = get('progress-mode');
  const value = get('progress-value');
  const forceStatic = get('static');
  const trigger = get('trigger');
  const preview = surface.parentElement;
  if (effect === circularProgress) progress.classList.add('sr-only');
  mode.closest('fieldset').hidden = Boolean(effect.stageProgress || effect.skeleton);
  if (effect.skeleton) progress.classList.add('sr-only');
  finish.hidden = Boolean(effect.reveal);
  pause.hidden = Boolean(effect.reveal);
  const codeExample = get('code-example');
  const code = get('code');
  const copyStatus = get('copy-status');
  let framework = 'vue';
  let language = 'js';
  let codeOptions = {};
  let loading;
  let completed = false;
  let paused = false;
  let exitTimer;

  card.id = effect.id;
  card.dataset.renderer = effect.renderer;
  if (effect.skeleton) card.dataset.skeleton = '';
  if (effect.taskProgress || effect.stageProgress) card.dataset.taskProgress = '';
  const title = get('title');
  title.id = `${effect.id}-title`;
  title.textContent = effect.title;
  card.setAttribute('aria-labelledby', title.id);
  get('description').textContent = effect.description;
  trigger.hidden = effect !== interactiveRipple;
  value.id = `${effect.id}-progress-value`;
  get('progress-label').htmlFor = value.id;
  get('progress-output').htmlFor = value.id;

  function renderCode() {
    if (!codeExample.open) return;
    code.textContent = buildExample(effect, framework, language, codeOptions);
    const extension = { vue: 'vue', react: `${language}x`, 'web-components': language };
    get('code-filename').textContent = `LoadingExample.${extension[framework]}`;
    copyStatus.textContent = '';
  }

  function setOption(name, value) {
    const field = effect.schema[name] ?? commonSchema[name];
    const initial = field.default;
    let same = initial === value;
    if (Array.isArray(initial)) same = initial.length === value.length && initial.every((part, index) => part === value[index]);
    if (field.type === 'color') same = initial.toLowerCase() === value.toLowerCase();
    if (same) delete codeOptions[name];
    else codeOptions[name] = value;
    loading?.update({ [name]: value });
    if (effect.stageProgress && name === 'activeStep' && !completed) updateProgress();
    renderCode();
  }

  codeExample.addEventListener('toggle', renderCode);
  for (const key of ['framework', 'language']) {
    const buttons = codeExample.querySelectorAll(`[data-${key}]`);
    for (const button of buttons) {
      button.addEventListener('click', () => {
        if (key === 'framework') framework = button.dataset[key];
        else language = button.dataset[key];
        for (const choice of buttons) choice.setAttribute('aria-pressed', String(choice === button));
        renderCode();
      });
    }
  }

  get('copy-code').addEventListener('click', async () => {
    const snippet = code.textContent;
    try {
      await navigator.clipboard.writeText(snippet);
      if (code.textContent === snippet && codeExample.open) copyStatus.textContent = '已复制';
    } catch {
      if (code.textContent !== snippet || !codeExample.open) return;
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      const copied = document.execCommand('copy');
      if (copied) selection.removeAllRanges();
      copyStatus.textContent = copied ? '已复制' : '代码已选中，请使用系统快捷键复制。';
    }
  });

  function buildControls() {
    const controls = get('controls');
    const fields = {
      speed: { ...commonSchema.speed, label: '速度（倍）' },
      ...Object.fromEntries(Object.entries(effect.schema).filter(([, field]) => field.label)),
    };
    if (effect.stageProgress) {
      delete fields.speed;
      fields.activeStep = { ...fields.activeStep, max: effect.schema.steps.default.length - 1 };
    }
    if (effect.reveal) delete fields.speed;
    const origin = effect.schema.origin?.default.slice();
    if (origin && effect !== interactiveRipple) {
      const position = { min: 0, max: 1, step: .01 };
      fields.originX = { ...position, default: origin[0], label: '波源 X（0–1）' };
      fields.originY = { ...position, default: origin[1], label: '波源 Y（0–1）' };
    }
    const inputs = {};
    controls.replaceChildren();

    for (const [name, field] of Object.entries(fields)) {
      const row = document.createElement('div');
      row.className = 'control';
      const label = document.createElement('label');
      const isSelect = field.choices && field.min === undefined;
      const input = document.createElement(isSelect ? 'select' : 'input');
      if (isSelect) {
        for (const option of field.choices) input.add(new Option(option, option));
      } else {
        input.type = { color: 'color', boolean: 'checkbox', text: 'text' }[field.type] ?? 'range';
      }
      const output = document.createElement('output');
      inputs[name] = input;
      input.id = `${effect.id}-${name}`;
      label.htmlFor = input.id;
      label.textContent = field.label;
      output.htmlFor = input.id;
      const autoCount = name === 'crestCount';
      if (input.type === 'range') Object.assign(input, {
        min: autoCount ? 0 : field.min, max: field.max, step: field.step,
      });
      if (input.type === 'text') input.maxLength = field.maxLength * 8;
      const displayDefault = name === 'gap' && field.default === 'auto' ? 18 : autoCount ? 0 : field.default;
      if (input.type === 'checkbox') input.checked = displayDefault;
      else input.value = displayDefault;
      function sync(event) {
        let current = input.value;
        if (input.type === 'range') current = input.valueAsNumber;
        if (input.type === 'checkbox') current = input.checked;
        if (input.type === 'text') {
          current = splitGraphemes(current).slice(0, field.maxLength).join('');
          if (input.value !== current) input.value = current;
        }
        const setting = autoCount && current === 0 ? 'auto' : current;
        output.value = setting === 'auto' ? '自动' : setting;
        if (autoCount) {
          input.setAttribute('aria-valuetext', output.value);
          inputs.wavelength.disabled = setting !== 'auto';
        }
        if (!event) return;
        if (name === 'originX' || name === 'originY') {
          origin[name === 'originX' ? 0 : 1] = setting;
          setOption('origin', [...origin]);
        } else {
          setOption(name, setting);
        }
      }
      sync();
      input.addEventListener('input', sync);
      row.append(label, ...(isSelect || input.type === 'checkbox' || input.type === 'text' ? [] : [output]), input);
      controls.append(row);
    }
    if (effect.reveal) {
      const readiness = document.createElement('fieldset');
      const heading = document.createElement('legend');
      heading.textContent = '模拟内容分区就绪';
      readiness.append(heading);
      const labels = { title: '标题', body: '正文', footer: '补充信息' };
      const checkboxes = effect.schema.readyKeys.itemChoices.map(key => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = key;
        label.append(checkbox, ` ${labels[key]}`);
        readiness.append(label);
        return checkbox;
      });
      readiness.addEventListener('change', () => {
        const ready = checkboxes.filter(checkbox => checkbox.checked);
        setOption('readyKeys', ready.map(checkbox => checkbox.value));
        get('status').textContent = `已就绪 ${ready.length} / ${checkboxes.length} 个区域`;
      });
      controls.append(readiness);
    }
  }

  function updateProgress() {
    if (effect.stageProgress) {
      progress.textContent = progressAttributes(effect, codeOptions, '正在加载')['aria-label'];
      get('status').textContent = progress.textContent;
      return;
    }
    const amount = normalizeProgress(value.valueAsNumber);
    get('progress-output').value = `${amount}%`;
    value.disabled = mode.value === 'unknown' || completed;
    if (effect.taskProgress) {
      setOption('progressSource', mode.value === 'estimated' ? 'estimated' : 'actual');
      setOption('progress', mode.value === 'unknown' ? null : amount);
    }
    const label = effect.renderer === 'css' || effect.taskProgress || effect.particle ? '正在加载' : '正在生成图片';
    if (mode.value === 'unknown') {
      progress.removeAttribute('role');
      for (const name of ['label', 'valuemin', 'valuemax', 'valuenow', 'valuetext']) {
        progress.removeAttribute(`aria-${name}`);
      }
      progress.textContent = label;
      return;
    }
    const estimated = mode.value === 'estimated';
    const progressLabel = effect.renderer === 'css' || effect.taskProgress || effect.particle ? '加载进度' : '生成进度';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', estimated ? `预计${progressLabel}` : progressLabel);
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.setAttribute('aria-valuenow', String(amount));
    progress.setAttribute('aria-valuetext', estimated ? `预计 ${amount}%` : `${amount}%`);
    progress.textContent = estimated ? `预计 ${amount}%` : `${amount}%`;
  }

  function clearPreview() {
    clearTimeout(exitTimer);
    loading?.destroy();
    loading = undefined;
    surface.hidden = true;
    progress.hidden = true;
  }

  function syncMotion() {
    const isStatic = forceStatic.checked || media.matches;
    get('motion').textContent = isStatic ? '当前为静态预览' : '当前允许播放动画';
    setOption('reducedMotion', forceStatic.checked ? 'static' : 'system');
    syncTrigger();
    if (completed && isStatic) clearPreview();
  }

  function syncTrigger() {
    trigger.disabled = completed || paused || forceStatic.checked || media.matches || loading?.renderer !== 'canvas';
  }

  function showRenderer(name) {
    get('renderer').textContent = {
      canvas: 'Canvas 2D', webgl: 'WebGL 2', css: 'CSS / DOM', static: '静态备用图形',
    }[name];
  }
  surface.addEventListener('loading-renderer-change', event => showRenderer(event.detail));

  function start() {
    clearPreview();
    completed = false;
    paused = false;
    codeOptions = {};
    buildControls();
    surface.hidden = false;
    progress.hidden = false;
    progress.removeAttribute("aria-hidden");
    surface.classList.remove('leaving');
    progress.classList.remove('leaving');
    get('ready').hidden = true;
    get('result').setAttribute('aria-busy', 'true');
    mode.value = 'unknown';
    value.value = '0';
    forceStatic.checked = false;
    mode.disabled = false;
    pause.disabled = false;
    pause.textContent = '暂停';
    pause.setAttribute('aria-pressed', 'false');
    finish.disabled = false;
    loading = createLoading(surface, { effect: effect.id }, registry);
    showRenderer(loading.renderer);
    if (effect === waveProgress || effect === liquidFill) progress.classList.toggle('sr-only', loading.renderer === 'canvas');
    if (effect.reveal) {
      setOption('content', {
        title: '加载动效示例',
        body: '各区域随任务结果独立显示。',
        footer: '已读取本地数据',
      });
    }
    updateProgress();
    syncMotion();
    if (!effect.stageProgress) {
      get('status').textContent = effect.renderer === 'css' || effect.taskProgress || effect.particle ? '正在加载' : '正在生成图片';
    }
  }

  pause.addEventListener('click', () => {
    paused = !paused;
    if (paused) loading.pause();
    else loading.resume();
    pause.textContent = paused ? '继续播放' : '暂停';
    pause.setAttribute('aria-pressed', String(paused));
    syncTrigger();
  });

  finish.addEventListener('click', () => {
    completed = true;
    syncTrigger();
    loading.pause();
    pause.disabled = true;
    finish.disabled = true;
    mode.disabled = true;
    value.disabled = true;
    get('ready').hidden = false;
    get('result').setAttribute('aria-busy', 'false');
    get('status').textContent = '预览已就绪';
    if (media.matches || forceStatic.checked) {
      clearPreview();
      return;
    }
    progress.setAttribute('aria-hidden', 'true');
    surface.classList.add('leaving');
    progress.classList.add('leaving');
    exitTimer = setTimeout(clearPreview, effect.schema.exitDuration?.default ?? 180);
  });

  get('reset').addEventListener('click', start);
  trigger.addEventListener('click', () => loading?.trigger([.5, .5]));
  preview.addEventListener('click', event => {
    if (trigger.hidden || trigger.disabled) return;
    const rect = surface.getBoundingClientRect();
    loading.trigger([(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height]);
  });
  mode.addEventListener('change', updateProgress);
  value.addEventListener('input', updateProgress);
  forceStatic.addEventListener('change', syncMotion);
  media.addEventListener('change', syncMotion);

  start();

  return () => {
    clearPreview();
    media.removeEventListener('change', syncMotion);
  };
}

const cleanups = [];
const list = document.querySelector('#effects');
for (const [id, title, presets] of groups) {
  const section = document.createElement('section');
  const heading = document.createElement('h2');
  section.id = id;
  section.className = 'effect-group';
  heading.textContent = title;
  section.append(heading);
  list.append(section);

  for (const effect of presets) {
    const card = template.content.firstElementChild.cloneNode(true);
    section.append(card);
    cleanups.push(mountCard(card, effect));
  }
}

window.addEventListener('pagehide', event => {
  if (!event.persisted) cleanups.forEach(cleanup => cleanup());
});
