import type { EffectDefinition, LoadingField } from '@loading-effects/core';

export interface LoadingPreset extends EffectDefinition {
  title: string;
  description: string;
  renderer: 'canvas' | 'css';
  schema: Record<string, LoadingField>;
}

export const circularSpinner: LoadingPreset;
export const bouncingDots: LoadingPreset;
export const pulseCircle: LoadingPreset;
export const rotatingSquares: LoadingPreset;
export const orbitDots: LoadingPreset;
export const elasticLine: LoadingPreset;
export const morphingShape: LoadingPreset;
export const flipTiles: LoadingPreset;
export const dotMatrixWave: LoadingPreset;
export const radialRipple: LoadingPreset;
export const directionalWave: LoadingPreset;
export const matrixBreathing: LoadingPreset;
export const matrixVortex: LoadingPreset;
export const interactiveRipple: LoadingPreset;

export const circularProgress: LoadingPreset;
export const gradientProgress: LoadingPreset;

export const segmentedProgress: LoadingPreset;
export const stepProgress: LoadingPreset;
export const waveProgress: LoadingPreset;
