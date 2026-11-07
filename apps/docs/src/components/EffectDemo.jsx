import React, { useRef, useState } from 'react';
import { LoadingEffect } from '@loading-effects/react';
import * as effects from '@loading-effects/effects';
import { createCssRenderer } from '@loading-effects/renderer-css';
import { createCanvasRenderer } from '@loading-effects/renderer-canvas';
import styles from './EffectDemo.module.css';

const registry = {
  effects: Object.fromEntries(Object.values(effects).map(effect => [effect.id, effect])),
  renderers: { css: createCssRenderer, canvas: createCanvasRenderer },
};
const defaults = Object.freeze({});

export default function EffectDemo({ id, options = defaults, completion = false }) {
  const effect = registry.effects[id];
  if (!effect) throw new Error(`Unknown documentation demo: ${id}`);

  const loading = useRef(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [readyKeys, setReadyKeys] = useState(options.readyKeys ?? []);
  const [activeStep, setActiveStep] = useState(options.activeStep ?? 0);
  const ripple = id === 'interactive-ripple';
  const interactive = !effect.stageProgress && !effect.reveal;
  const regions = effect.schema.readyKeys?.itemChoices ?? [];
  const steps = options.steps ?? effect.schema.steps?.default ?? [];
  const demoOptions = {
    ...options,
    ...(effect.reveal ? { readyKeys } : {}),
    ...(effect.stageProgress ? { activeStep } : {}),
    paused,
  };

  return (
    <figure className={styles.demo} data-effect={id}>
      <div className={styles.preview} data-canvas={effect.renderer === 'canvas'}>
        {ready ? (
          <div className={styles.ready} role="status">预览已就绪</div>
        ) : (
          <>
            <LoadingEffect
              ref={loading}
              className={styles.surface}
              effect={id}
              label={effect.title}
              registry={registry}
              options={demoOptions}
            />
            {completion && Number.isFinite(options.progress) && (
              <span className={styles.badge} role="progressbar" aria-label="演示进度" aria-valuenow={options.progress}>
                {options.progress}%
              </span>
            )}
          </>
        )}
      </div>
      <figcaption className={styles.caption}>
        <span>{effect.title}</span>
        <div className={styles.actions}>
          {interactive && !ready && (
            <button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
              {paused ? '继续播放' : '暂停'}
            </button>
          )}
          {ripple && !ready && (
            <button type="button" disabled={paused} onClick={() => loading.current?.trigger([0.5, 0.5])}>
              触发涟漪
            </button>
          )}
          {effect.stageProgress && (
            <button type="button" onClick={() => setActiveStep(value => (value + 1) % steps.length)}>
              {activeStep === steps.length - 1 ? '回到首阶段' : '下一阶段'}
            </button>
          )}
          {effect.reveal && (
            <button type="button" onClick={() => setReadyKeys(current =>
              current.length >= regions.length ? [] : [...current, regions.find(key => !current.includes(key))])}>
              {readyKeys.length >= regions.length ? '重置内容' : '揭示下一区域'}
            </button>
          )}
          {completion && (
            <button type="button" onClick={() => {
              setPaused(false);
              setReady(value => !value);
            }}>
              {ready ? '重新演示' : '模拟内容就绪'}
            </button>
          )}
        </div>
      </figcaption>
    </figure>
  );
}

export function EffectGallery({ presets }) {
  return (
    <div className={styles.gallery}>
      {presets.map(preset => {
        const props = typeof preset === 'string' ? { id: preset } : preset;
        return <EffectDemo key={props.id} {...props} />;
      })}
    </div>
  );
}
