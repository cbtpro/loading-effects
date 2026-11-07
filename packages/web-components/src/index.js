import { createLoading, progressAttributes } from '@loading-effects/core';

const registered = new WeakSet();
const attributes = {
  color: ['color', String],
  background: ['background', String],
  duration: ['duration', Number],
  speed: ['speed', Number],
  opacity: ['opacity', Number],
  paused: ['paused', () => true],
  loop: ['loop', value => value !== 'false'],
  progress: ['progress', Number],
  'progress-source': ['progressSource', String],
  'active-step': ['activeStep', Number],
  'reduced-motion': ['reducedMotion', String],
};
const progressFields = ['role', 'aria-label', 'aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext'];

export function defineLoadingEffect(tagName = 'loading-effect') {
  const elements = globalThis.customElements;
  if (!elements) throw new Error('Register loading effects in a browser with Custom Elements support');
  const existing = elements.get(tagName);
  if (existing) {
    if (registered.has(existing)) return existing;
    throw new Error(`Custom element already registered: ${tagName}`);
  }

  class LoadingEffectElement extends HTMLElement {
    static observedAttributes = ['effect', 'label', ...Object.keys(attributes)];

    #registry;
    #options = {};
    #instance;
    #mountedEffect;
    #mountedRegistry;
    #surface;
    #connecting = false;

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      const style = this.ownerDocument.createElement('style');
      style.textContent = ':host { display: block; } #surface { width: 100%; height: 100%; }';
      this.#surface = this.ownerDocument.createElement('div');
      this.#surface.id = 'surface';
      shadow.append(style, this.#surface);
    }

    get effect() { return this.getAttribute('effect') ?? ''; }
    set effect(value) { this.setAttribute('effect', value); }

    get label() { return this.getAttribute('label') ?? '正在加载'; }
    set label(value) { this.setAttribute('label', value); }

    get registry() { return this.#registry; }
    set registry(value) {
      this.#registry = value;
      this.#sync();
    }

    get options() { return this.#options; }
    set options(value) {
      this.#options = { ...value };
      this.#sync();
    }

    get renderer() { return this.#instance?.renderer; }

    connectedCallback() {
      this.#connecting = true;
      for (const property of ['effect', 'label', 'registry', 'options']) {
        if (!Object.hasOwn(this, property)) continue;
        const value = this[property];
        delete this[property];
        this[property] = value;
      }
      this.#connecting = false;
      this.#sync();
    }

    disconnectedCallback() {
      this.#destroy();
    }

    attributeChangedCallback() {
      this.#sync();
    }

    trigger(origin) {
      this.#instance?.trigger(origin);
    }

    #destroy() {
      this.#instance?.destroy();
      this.#instance = undefined;
      this.#mountedEffect = undefined;
      this.#mountedRegistry = undefined;
    }

    #sync() {
      if (this.#connecting || !this.isConnected) return;
      const id = this.effect;
      const registry = this.#registry;
      const effect = Object.hasOwn(registry?.effects ?? {}, id) ? registry.effects[id] : undefined;
      const options = { ...this.#options };
      for (const [attribute, [name, parse]] of Object.entries(attributes)) {
        const value = this.getAttribute(attribute);
        if (value !== null && value.trim() !== '') options[name] = parse(value);
        else if (value !== null && attribute === 'paused') options[name] = true;
      }

      const semantics = progressAttributes(effect, options, this.label);
      for (const name of progressFields) {
        const value = semantics[name];
        if (value === undefined) this.removeAttribute(name);
        else if (this.getAttribute(name) !== String(value)) this.setAttribute(name, value);
      }

      if (effect !== this.#mountedEffect || registry !== this.#mountedRegistry) this.#destroy();
      if (!effect || !Object.hasOwn(registry.renderers ?? {}, effect.renderer)) return;
      if (this.#instance) {
        this.#instance.replaceOptions(options);
      } else {
        this.#instance = createLoading(this.#surface, { ...options, effect: id }, registry);
        this.#mountedEffect = effect;
        this.#mountedRegistry = registry;
      }
    }
  }

  elements.define(tagName, LoadingEffectElement);
  registered.add(LoadingEffectElement);
  return LoadingEffectElement;
}
