---
title: 接入指南
---

## 选择预设

先按等待场景选动效，再决定需要传入哪些任务状态。

| 场景 | 可用预设 | 宿主提供的数据 |
| --- | --- | --- |
| 按钮、表单或局部操作 | `circular-spinner`、`bouncing-dots` | 开始与结束状态 |
| 图片生成或画布等待 | `dot-matrix-wave`、`radial-ripple` | 容器尺寸。交互涟漪另需触点坐标 |
| 上传、导出或批处理 | `circular-progress`、`gradient-progress`、`wave-progress` | 当前进度及来源 |
| 有明确步骤的任务 | `step-progress` | 阶段名称数组和当前下标 |
| 列表或详情首屏 | `shimmer-skeleton`、`progressive-reveal` | 占位布局。渐进揭示另需各区文本与就绪键 |
| 文字状态 | `typing-dots`、`character-wave` | 文字。辅助技术使用独立的状态名称 |

当前包通过仓库内的 pnpm 工作区使用。可以先运行 [Playground](index.md#本地运行-playground)，调好参数后从卡片的「查看代码」复制 Vue、React 或 Web Components 示例。可用 ID 与专属参数见[动效目录](effect-catalog.md)。

## Vanilla JS 最小接入

以环形进度为例，在页面中为动效和实际内容分别保留容器。

```html
<div id="upload-progress" style="width: 120px; height: 120px;"></div>
<section id="upload-result" aria-busy="true"></section>
```

```js
import { createLoading, progressAttributes } from '@loading-effects/core';
import { circularProgress } from '@loading-effects/effects';
import { createCssRenderer } from '@loading-effects/renderer-css';

const host = document.querySelector('#upload-progress');
const result = document.querySelector('#upload-result');
const registry = {
  effects: { [circularProgress.id]: circularProgress },
  renderers: { css: createCssRenderer },
};

const loading = createLoading(host, { effect: circularProgress.id }, registry);
let semanticAttributes = [];

function showProgress(progress, progressSource = 'actual') {
  const options = { progress, progressSource };
  loading.update(options);

  const attributes = progressAttributes(circularProgress, options, '文件上传');
  for (const name of semanticAttributes) host.removeAttribute(name);
  for (const [name, value] of Object.entries(attributes)) {
    host.setAttribute(name, String(value));
  }
  semanticAttributes = Object.keys(attributes);
}

function finishUpload(content) {
  loading.destroy();
  host.remove();
  result.textContent = content;
  result.setAttribute('aria-busy', 'false');
}

showProgress(null);
// 上传任务报告进度时调用 showProgress(93)。
// 上传完成并拿到结果后调用 finishUpload('上传成功')。
```

`progress: null` 表示等待但未知百分比，`0` 表示已知进度为零。`progressSource: 'estimated'` 会在进度语义中标注「预计」。到达 `100` 后，仍由宿主决定结果何时就绪。失败或取消时也应销毁实例，并更新内容区域的状态。进度由任务回调提供，预览中的滑块只用于演示。

## React、Vue 和 Web Components

三种方式都复用上例的 `registry`。把容器尺寸写在组件或宿主元素上。

### React

```jsx
import { LoadingEffect } from '@loading-effects/react';

<LoadingEffect
  effect="circular-progress"
  registry={registry}
  options={{ progress: 42, progressSource: 'estimated' }}
  label="文件上传"
  style={{ width: 120, height: 120 }}
/>
```

### Vue

```vue
<LoadingEffect
  effect="circular-progress"
  :registry="registry"
  :options="{ progress: 42, progressSource: 'estimated' }"
  label="文件上传"
  style="width: 120px; height: 120px;"
/>
```

在 `script setup` 中从 `@loading-effects/vue` 导入 `LoadingEffect`，并定义上例的 `registry`。React 和 Vue 组件会在卸载时释放实例。传入新的 `options` 时，省略的字段恢复预设或公共默认值。

### Web Components

```js
import { defineLoadingEffect } from '@loading-effects/web-components';

defineLoadingEffect();

const element = document.createElement('loading-effect');
element.effect = 'circular-progress';
element.label = '文件上传';
element.registry = registry;
element.options = { progress: 42, progressSource: 'estimated' };
element.style.cssText = 'width: 120px; height: 120px;';
document.body.append(element);
```

`registry` 和复杂参数通过 JS property 传入。标量 HTML 属性可覆盖 `options`，例如设置 `progress="80"` 后显示 80，移除该属性则恢复到 `options.progress`。从 DOM 移除元素会销毁实例，再插入时读取当前配置。显式注册在浏览器执行，模块可在服务端导入。

## 鼠标交互

默认开启 `pointerReactive`。动效根据鼠标在容器内的位置改变自身的绘制。粒子网络吸引附近粒子并重新计算连线，点阵加强附近点的亮度，液面在鼠标附近弯曲。鼠标移出后，交互逐渐消退。暂停、减少动态、触屏输入和静态降级时不触发鼠标交互。

在 Playground 的「参数与演示进度」中取消勾选「响应鼠标」即可关闭。接入代码中可传入 `pointerReactive: false`。Web Components 支持 `pointer-reactive="false"`。

## 更新与销毁

| 操作 | 行为 |
| --- | --- |
| `update(patch)` | 合并部分参数。省略的字段保留当前值 |
| `replaceOptions(options)` | 替换参数。省略的字段恢复默认 |
| `pause()` / `resume()` | 手动暂停或恢复。画布回到视口时仍尊重手动暂停 |
| `trigger([x, y])` | 为交互涟漪提供相对容器的坐标，两个分量均为 0–1 |
| `destroy()` | 释放渲染节点、观察器和帧回调。可重复调用 |
| `renderer` | 读取实际渲染器，可能是 `css`、`canvas`、`webgl` 或 `static` |

换动效时，Vanilla JS 应先销毁旧实例，再以新 ID 创建。框架适配会在更换动效或注册表时重建实例。离开视口会冻结时间轴，返回后继续已有相位。使用 `reducedMotion: 'static'` 可强制静态展示，默认 `system` 跟随系统设置。更多行为见[技术设计](architecture.md)。
