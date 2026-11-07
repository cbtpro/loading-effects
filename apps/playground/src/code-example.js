export function buildExample(effect, framework, language, options) {
  const typescript = language === 'ts';
  const vue = framework === 'vue';
  const interactive = effect.id === 'interactive-ripple';
  const preset = effect.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const canvas = effect.renderer === 'canvas';
  const renderer = canvas ? 'createCanvasRenderer' : 'createCssRenderer';
  const adapter = `@loading-effects/${framework}`;
  const imports = [
    interactive && (vue ? "import { ref } from 'vue';" : "import { useRef } from 'react';"),
    `import { LoadingEffect } from '${adapter}';`,
    interactive && typescript && `import type { LoadingEffectHandle } from '${adapter}';`,
    typescript && "import type { LoadingOptions } from '@loading-effects/core';",
    `import { ${preset} } from '@loading-effects/effects';`,
    `import { ${renderer} } from '@loading-effects/renderer-${effect.renderer}';`,
  ].filter(Boolean).join('\n');
  const setup = `${imports}

const registry = {
  effects: { [${preset}.id]: ${preset} },
  renderers: { ${effect.renderer}: ${renderer} },
};
const options${typescript ? ': LoadingOptions' : ''} = ${JSON.stringify(options, null, 2)};`;
  const refType = typescript ? '<LoadingEffectHandle | null>' : '';
  const size = canvas ? 'width: 100%; height: 240px' : 'width: 160px; height: 100px';

  if (vue) {
    const trigger = interactive ? `
const loading = ref${refType}(null);

function trigger() {
  loading.value?.trigger([0.5, 0.5]);
}` : '';
    return `<script setup${typescript ? ' lang="ts"' : ''}>
${setup}${trigger}
</script>

<template>
  <LoadingEffect${interactive ? '\n    ref="loading"' : ''}
    effect="${effect.id}"
    :registry="registry"
    :options="options"
    style="${size}"
  />${interactive ? '\n  <button type="button" @click="trigger">从中心触发涟漪</button>' : ''}
</template>`;
  }

  const reactStyle = canvas ? "{ width: '100%', height: 240 }" : '{ width: 160, height: 100 }';
  const component = `<LoadingEffect${interactive ? '\n        ref={loading}' : ''}
        effect="${effect.id}"
        registry={registry}
        options={options}
        style={${reactStyle}}
      />`;
  const content = interactive ? `<>
      ${component}
      <button type="button" onClick={() => loading.current?.trigger([0.5, 0.5])}>
        从中心触发涟漪
      </button>
    </>` : component.split('\n').map((line, index) => index ? line.slice(2) : line).join('\n');
  return `${setup}

export default function LoadingExample() {${interactive ? `
  const loading = useRef${refType}(null);
` : ''}
  return (
    ${content}
  );
}`;
}
