# 动效实验室

从仓库根目录运行 `pnpm --filter @loading-effects/app-playground dev --port 4173`。调参会立即刷新点阵，即使动画已经暂停。演示进度达到 100% 后仍会等待“模拟内容就绪”。开启系统减少动态或勾选强制静态预览后，画布保持在固定相位。

页面按类别纵向展示 38 种预设，包括点阵与波纹、进度反馈、粒子系统、骨架占位、流体与液态、文字动效和基础几何。展开某张卡片的「参数与演示进度」即可调整该动效。「恢复默认」只重置当前卡片。画布离开视口后停止绘制，重新进入时接着播放，保留手动暂停、静态模式和演示进度。交互涟漪支持在画布内点击或轻触，也可以使用「从中心触发涟漪」按钮。[查看点阵预设的在线演示](../../docs/dot-matrix-ripple.md#点阵与波纹演示)。

宽屏右侧目录按分类和动效两层展开，SVG 轨道在层级切换处斜接。滚动时，蓝色高亮沿轨道覆盖当前进入阅读区的目录项。窄屏使用顶部可展开的「本页目录」，点击链接后收起。

展开卡片的「查看代码」，选择 Vue、React 或 Web Components，以及 JS 或 TS，再点击「复制代码」。示例使用当前卡片的动效参数和静态预览设置。演示进度及内容就绪由 Playground 模拟，接入时由宿主任务提供。示例导入本仓库的工作区包。

运行 `pnpm --filter @loading-effects/app-playground build` 生成生产构建。

## 复用目录组件

从 `src/toc.js` 导入 `mountToc`，传入挂载容器和 props。目录项的 `id` 指向页面中已挂载的元素，可用 `children` 嵌套目录。传入 `heading` 可单独指定用于滚动高亮的标题元素，省略时观察锚点元素。

```js
const toc = mountToc(host, {
  items: [
    {
      id: 'particle-effects',
      title: '粒子系统',
      heading: document.querySelector('#particle-effects h2'),
      children: [{
        id: 'particle-network',
        title: '粒子网络',
        heading: document.querySelector('#particle-network h3'),
      }],
    },
  ],
  label: '动效分类',
  compactLabel: '本页目录',
  accentColor: '#2359be',
  trackColor: '#ccd7e7',
  duration: 150,
  rootMargin: '-20px 0px -40% 0px',
});

toc.update({ accentColor: '#7c3aed', duration: 200 });
// 页面卸载时
toc.destroy();
```

`duration` 的单位为毫秒，`rootMargin` 遵循 `IntersectionObserver` 的格式。调用 `update(nextProps)` 只覆盖传入的字段，传入新 `items` 会更新目录和滚动监听。系统开启减少动态时，指示条直接更新位置。
