# Vue 适配

使用 `LoadingEffect` 接收预设 ID、注册表和参数。宿主通过样式提供尺寸。将注册表声明为普通对象，参数可随 Vue 响应式状态变化。

```vue
<script setup>
import { LoadingEffect } from '@loading-effects/vue';
import { dotMatrixWave } from '@loading-effects/effects';
import { createCanvasRenderer } from '@loading-effects/renderer-canvas';

const registry = {
  effects: { [dotMatrixWave.id]: dotMatrixWave },
  renderers: { canvas: createCanvasRenderer },
};
</script>

<template>
  <LoadingEffect
    effect="dot-matrix-wave"
    :registry="registry"
    :options="{ gap: 16 }"
    style="height: 180px"
  />
</template>
```

删除参数后恢复默认值。组件卸载时释放实例。使用交互涟漪时，可通过模板 ref 调用 `trigger([x, y])`，坐标按宿主宽高归一化到 0–1。

可运行示例见[项目 README](../../README.md#框架示例)。
