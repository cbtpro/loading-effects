import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createLoading, progressAttributes } from '@loading-effects/core';

const defaults = Object.freeze({});

export const LoadingEffect = forwardRef(function LoadingEffect(
  { effect, registry, options = defaults, label = '正在加载', ...attributes },
  ref,
) {
  const element = useRef(null);
  const instance = useRef(null);

  useEffect(() => {
    const loading = createLoading(element.current, { effect }, registry);
    instance.current = loading;
    return () => {
      instance.current = null;
      loading.destroy();
    };
  }, [effect, registry]);

  useEffect(() => {
    instance.current.replaceOptions(options);
  }, [effect, registry, options]);

  useImperativeHandle(ref, () => ({
    trigger: origin => instance.current?.trigger(origin),
  }), []);

  return createElement('div', {
    ...attributes, children: undefined, ref: element, ...progressAttributes(registry.effects?.[effect], options, label),
  });
});
