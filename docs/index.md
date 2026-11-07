---
slug: /
title: Loading Effects
sidebar_label: 开始
---

Loading Effects 是面向 Web 的可配置加载动效库。目前的 Playground 提供 29 种预设，分为基础几何、点阵与波纹、进度反馈、粒子系统和骨架占位。每种动效可独立调参，并提供 Vue、React、Web Components 的 JS 和 TS 接入示例。

- [动效目录](effect-catalog.md)包含 50 项规划及已实现动效的实拍。
- [点阵与波纹](dot-matrix-ripple.md)包含 6 种预设的参数、波形和浏览器截图。
- [技术设计](architecture.md)说明时间轴、渲染器和框架适配的职责。
- [产品需求与里程碑](product-requirements.md)记录各阶段的交付范围。

## 本地运行 Playground

需要 Node.js 22 或更高版本及 pnpm 10。从项目根目录执行以下命令。

```sh
pnpm install --frozen-lockfile
pnpm --filter @loading-effects/app-playground dev --port 4173
```

打开 [本地 Playground](http://127.0.0.1:4173/)，向下浏览动效卡片。展开「参数与演示进度」可以调参，展开「查看代码」可以切换框架和语言并复制示例。
