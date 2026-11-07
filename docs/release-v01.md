# 回归与发布检查

本页记录当前工作区的检查方式。各版本的功能范围见[里程碑](product-requirements.md#里程碑)。`v1.0.0-alpha.1` 对应文字动效批次，包含 33 个预设。版本标签用于定位源码与文档，当前工作区包供本地接入使用。

## 回归命令

在项目根目录执行。首次运行浏览器回归时安装对应浏览器。

```sh
pnpm install --frozen-lockfile
pnpm test:bundle
pnpm exec playwright install --no-shell chromium firefox webkit
pnpm test:e2e
pnpm -r --if-present build
```

`test:bundle` 重新构建 框架示例，确认生产包只包含实际导入的两个预设。浏览器回归覆盖 Chromium、Firefox 和 WebKit，包括屏外停帧、相位和进度恢复、Canvas 降级、框架卸载和文字动效。系统剪贴板用例在 Chromium 执行。GitHub Actions 的 `v0.1 Regression Checks` 运行相同检查。

## GitHub Pages 与 npm 发布

- 在移动真机上复核滚动、触摸涟漪和持续播放的表现，并用屏幕阅读器检查进度及状态播报。
- 若要公开发布包，确认开源许可证和 npm 包名，核对发布文件及各包依赖后再调整私有标记。当前包供工作区内使用。
- 在目标 GitHub 仓库启用 Pages 的 GitHub Actions 发布来源。首次运行后，打开工作流提供的网址检查导航和图片。线上发布需在目标仓库执行。
