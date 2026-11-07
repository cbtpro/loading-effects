# v0.1 发布检查

v0.1 包含 14 种预设、CSS 与 Canvas 2D 渲染器，以及 Vanilla JS、React、Vue 接入。当前预发布版本和新增动效见[里程碑](product-requirements.md#里程碑)。

## 回归命令

在项目根目录执行。

```sh
pnpm install --frozen-lockfile
pnpm test:bundle
pnpm exec playwright install --no-shell chromium firefox webkit
pnpm test:e2e
pnpm -r --if-present build
```

`test:bundle` 重新构建 React/Vue 示例，确认生产包只包含实际导入的两个预设。浏览器回归覆盖屏外停帧、相位和进度恢复、静态模式、Canvas 降级、示例代码复制以及框架组件卸载。GitHub Actions 的 `v0.1 Regression Checks` 运行相同检查。

## 发布前确认

- 在移动真机上复核滚动、触摸涟漪和持续播放的表现，并用屏幕阅读器检查进度及状态播报。
- 若要公开发布包，确认开源许可证和 npm 包名，核对发布文件及各包依赖后再调整私有标记。当前包供工作区内使用。
- 在目标 GitHub 仓库启用 Pages 的 GitHub Actions 发布来源。首次运行后，打开工作流提供的网址检查导航和图片。线上发布需在目标仓库执行。
