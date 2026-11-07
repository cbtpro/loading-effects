# React 适配

使用 `LoadingEffect` 接收预设 ID、注册表和参数。给宿主设置尺寸，画布会随容器变化。注册表可在组件外创建，避免每次渲染都重新挂载动效。

```jsx
import { LoadingEffect } from '@loading-effects/react';
import { circularSpinner } from '@loading-effects/effects';
import { createCssRenderer } from '@loading-effects/renderer-css';

const registry = {
  effects: { [circularSpinner.id]: circularSpinner },
  renderers: { css: createCssRenderer },
};

export function Waiting() {
  return (
    <LoadingEffect
      effect="circular-spinner"
      registry={registry}
      options={{ size: 32 }}
      style={{ width: 48, height: 48 }}
    />
  );
}
```

替换 `options` 会实时应用新参数，省略的字段恢复默认值。组件卸载时释放实例。使用交互涟漪时，可通过组件 ref 调用 `trigger([x, y])`，坐标按宿主宽高归一化到 0–1。

可运行示例见[项目 README](../../README.md#框架示例)。
