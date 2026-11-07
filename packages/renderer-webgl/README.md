# WebGL 2 渲染器

`createWebGLRenderer` 将预设的片元着色器绘制到透明画布。它接收核心引擎的累计时间、容器尺寸和当前参数。画布受 DPR 2、单边 2048 px 和 100 万像素限制，滚出视口后由核心引擎暂停绘制。

```js
import { createLoading } from '@loading-effects/core';
import { metaball } from '@loading-effects/effects';
import { createWebGLRenderer } from '@loading-effects/renderer-webgl';

const registry = {
  effects: { [metaball.id]: metaball },
  renderers: { webgl: createWebGLRenderer },
};

const loading = createLoading(document.querySelector('#fluid'), {
  effect: metaball.id,
  radius: 18,
}, registry);
```

给宿主设置宽高，卸载时调用 `loading.destroy()`。WebGL 2 不可用或上下文丢失时显示预设的 CSS 静态图形。上下文恢复后重新创建着色器程序，并按原有累计时间恢复绘制。实例的 `renderer` 属性可以读取当前实际结果。
