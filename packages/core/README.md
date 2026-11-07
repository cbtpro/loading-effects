# 核心引擎

`createLoading(element, options, registry)` 管理时间轴、可见性和减少动态。调用方提供所需动效与渲染器。

```js
import { createLoading } from '@loading-effects/core';
import { circularSpinner } from '@loading-effects/effects';
import { createCssRenderer } from '@loading-effects/renderer-css';

const host = document.querySelector('#loading');
const loading = createLoading(host, { effect: circularSpinner.id, size: 32 }, {
  effects: { [circularSpinner.id]: circularSpinner },
  renderers: { css: createCssRenderer },
});
```

在页面中给 `#loading` 设置宽高，例如 `<div id="loading" role="status" aria-label="正在加载" style="width:48px;height:48px"></div>`。

- `update(patch)` 合并部分参数。
- `replaceOptions(options)` 替换参数，省略的字段恢复默认值。
- `pause()` 和 `resume()` 控制时间轴。
- `destroy()` 释放画布、观察器和帧回调，宿主移除时调用。

参见[技术设计](../../docs/architecture.md)。
