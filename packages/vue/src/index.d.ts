import type { DefineComponent } from 'vue';
import type { LoadingEffectHandle, LoadingOptions, LoadingRegistry } from '@loading-effects/core';

export type { LoadingEffectHandle } from '@loading-effects/core';

export interface LoadingEffectProps {
  effect: string;
  registry: LoadingRegistry;
  options?: LoadingOptions;
  label?: string;
}

export const LoadingEffect: DefineComponent<LoadingEffectProps> &
  (new () => LoadingEffectHandle);
