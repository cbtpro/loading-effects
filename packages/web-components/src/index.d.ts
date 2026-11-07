import type { LoadingEffectHandle, LoadingOptions, LoadingRegistry } from '@loading-effects/core';

export interface LoadingEffectElement extends HTMLElement, LoadingEffectHandle {
  effect: string;
  label: string;
  registry: LoadingRegistry | undefined;
  options: LoadingOptions;
  readonly renderer: string | undefined;
}

export function defineLoadingEffect(tagName?: string): { new (): LoadingEffectElement };

declare global {
  interface HTMLElementTagNameMap {
    'loading-effect': LoadingEffectElement;
  }
}
