import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';
import type { LoadingEffectHandle, LoadingOptions, LoadingRegistry } from '@loading-effects/core';

export type { LoadingEffectHandle } from '@loading-effects/core';

export interface LoadingEffectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  effect: string;
  registry: LoadingRegistry;
  options?: LoadingOptions;
  label?: string;
}

export const LoadingEffect: ForwardRefExoticComponent<LoadingEffectProps & RefAttributes<LoadingEffectHandle>>;
