# Web Components 适配

在浏览器里调用 `defineLoadingEffect()`，注册 `<loading-effect>`。模块可以在服务端导入，注册须在浏览器中执行。同名注册重复调用会返回同一个构造函数。

```js
import { defineLoadingEffect } from '@loading-effects/web-components';
import { circularProgress } from '@loading-effects/effects';
import { createCssRenderer } from '@loading-effects/renderer-css';

defineLoadingEffect();

const element = document.createElement('loading-effect');
element.effect = circularProgress.id;
element.registry = {
  effects: { [circularProgress.id]: circularProgress },
  renderers: { css: createCssRenderer },
};
element.options = { progress: 42, progressSource: 'estimated' };
element.style.cssText = 'width: 240px; height: 120px;';
document.body.append(element);
```

通过 `options` 传入预设参数。每次赋值替换上一份配置。也可以通过 `effect`、`label`、`progress`、`progress-source`、`active-step`、`speed`、`duration`、`color`、`background`、`opacity`、`paused`、`loop` 和 `reduced-motion` 属性传入标量值。同名属性优先于 `options`，移除属性后使用 `options`。存在 `paused` 属性即暂停，`loop="false"` 只播放一轮。

复杂参数通过 `options` 属性传入。交互涟漪可调用 `trigger([x, y])`，坐标按宿主宽高归一化到 0–1。改变选中的动效或注册表会重建渲染器，普通调参复用实例。移除元素会释放渲染资源，重新挂载时读取最新配置。

[框架示例运行方式](../../README.md#框架示例)
