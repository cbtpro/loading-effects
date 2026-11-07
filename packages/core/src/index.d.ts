export interface LoadingOptions {
  [name: string]: unknown;
  color?: string;
  background?: string;
  duration?: number;
  speed?: number;
  opacity?: number;
  loop?: boolean;
  paused?: boolean;
  progress?: number | null;
  progressSource?: 'actual' | 'estimated';
  steps?: readonly string[];
  activeStep?: number;
  readyKeys?: readonly string[];
  content?: Readonly<Record<string, string>>;
  reducedMotion?: 'system' | 'static';
}

export interface EffectDefinition {
  id: string;
  renderer: string;
  taskProgress?: boolean;
  stageProgress?: boolean;
  schema?: Record<string, LoadingField>;
}

export interface LoadingRenderer {
  name: string;
  animated: boolean;
  resize(size: { width: number; height: number }, dpr: number, options: LoadingOptions): void;
  update(options: LoadingOptions): void;
  render(elapsed: number, options: LoadingOptions, still: boolean): void;
  isActive?(): boolean;
  setRefresh?(refresh: () => void): void;
  trigger?(origin: [number, number], elapsed: number, options: LoadingOptions): void;
  destroy(): void;
}

export type RendererFactory = (element: HTMLElement, effect: EffectDefinition) => LoadingRenderer;

export interface LoadingRegistry {
  effects: Record<string, EffectDefinition>;
  renderers: Record<string, RendererFactory>;
}

export interface LoadingEffectHandle {
  trigger(origin: [number, number]): void;
}

export interface LoadingInstance extends LoadingEffectHandle {
  readonly renderer: string;
  update(patch: LoadingOptions): void;
  replaceOptions(options: LoadingOptions): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface LoadingField {
  default: unknown;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  choices?: readonly unknown[];
  itemChoices?: readonly unknown[];
  minItems?: number;
  integer?: boolean;
  label?: string;
  normalize?(value: number): number;
}

export function splitGraphemes(text: string): string[];
export const commonSchema: Record<string, LoadingField>;
export function normalizeOptions(
  schema: Record<string, LoadingField>,
  input: LoadingOptions,
  supportsColor: (value: string) => boolean,
): LoadingOptions;
export function normalizeProgress(value: unknown): number | null;
export function progressAttributes(
  effect: EffectDefinition | undefined,
  options: LoadingOptions,
  label: string,
): Record<string, string | number>;
export function createLoading(
  element: HTMLElement,
  options: LoadingOptions & { effect: string },
  registry: LoadingRegistry,
): LoadingInstance;
