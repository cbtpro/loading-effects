# 技术设计

## 分层与依赖

| 工作区 | 责任 | 工作区依赖方向 |
| --- | --- | --- |
| `packages/core` | 注册与解析预设、参数归一化、时间轴、挂载及销毁、可见性与降级协调 | 无 |
| `packages/effects` | ID、默认值、可序列化参数 Schema、渲染能力声明和动效实现 | core 的公开契约 |
| `packages/renderer-css` | 受控 DOM、CSS 样式及原生动画 | core 的渲染器契约 |
| `packages/renderer-canvas` | Canvas 2D 表面、绘制与高分屏控制 | 同上 |
| `packages/renderer-webgl` | WebGL 2 后端规划，当前为工作区占位 | 计划沿用 core 的渲染器契约 |
| `packages/react`、`packages/vue`、`packages/web-components` | 统一属性和事件，适配宿主生命周期 | core，选用渲染器由接入方注入 |
| `apps/docs` | 展示根目录规范和发布版本对应的用法 | 已发布 API 或本地 workspace 包 |
| `apps/playground` | 注册表、参数编辑、预览、代码生成 | core、effects、所支持的渲染器 |

核心引擎从调用方的 `registry` 读取预设和渲染器。Vanilla JS 直接调用核心引擎，React、Vue 和 Web Components 负责接上各自的生命周期。工作区包提供 ESM 入口和类型声明。框架示例只导入两个预设，`pnpm test:bundle` 检查其他预设是否从生产包剔除。

## 参数协议

| 参数 | 类型与默认 | 行为 |
| --- | --- | --- |
| `size` | 按预设声明 | CSS px，用于部分几何动效和环形进度。画布和骨架按容器尺寸布局 |
| `color`、`background` | CSS 颜色，`#4D8DFF`、`transparent` | 可由预设覆盖。渲染器挂载时解析颜色 |
| `duration` | 正数，1200 | 单周期毫秒数。动效可声明自己的默认和边界 |
| `speed` | 0.2–3，1 | 时间增量倍率，实际周期为 duration / speed |
| `loop`、`paused` | 布尔，true、false | 单次播放到终帧后停止。暂停冻结当前相位，独立于进度更新 |
| `progress`、`progressSource` | 0–100 或 null，默认 null。来源为 `actual` 或 `estimated`，默认 actual | 进度由宿主更新，非有限值回到 null。实际百分比和估算必须明确区分 |
| `density`、`amplitude` | 可选数字 | 仅在支持的预设生效，由该预设声明单位和范围 |
| `opacity` | 0–1，1 | 统一乘在视觉层，语义层独立 |
| 实例的 `renderer` | `css`、`canvas` 或 `static` | 预设指定后端，实例报告实际结果。Canvas 2D 初始化失败时返回 `static` |
| `reducedMotion` | `system` 或 `static`，默认 system | system 跟随系统偏好，static 始终使用静态姿态 |
| `label` | 非空文本，默认“正在加载” | 宿主可提供本地化状态名 |

参数合并顺序是公共默认、预设默认、调用方覆盖。按 Schema 校验枚举、有限数、整数、数组长度和容器相关上限。数值越界按字段范围截断，类型不符时恢复默认值。默认值与已归一化的参数对象不得被调用方更新原始对象所污染。目录中各项专属默认是实现输入，未定义的专属参数上下限在该预设落地时确定，并以 Schema 和测试为准。

## 实例、时间轴与渲染契约

当前通过 `createLoading(element, options, registry)` 创建实例。`update(patch)` 合并参数，`replaceOptions(options)` 整体替换。布局字段变化时重新准备绘制数据，普通参数更新沿用当前实例。销毁会释放帧回调、观察器、媒体查询监听和渲染节点，之后的更新会被忽略。

引擎统一调度 CSS / DOM 和 Canvas 2D。渲染器接收容器尺寸、DPR、参数和累计时间。宿主离开视口、页面不可见、容器为零尺寸、手动暂停或开启减少动态时停止连续绘制。恢复播放时，从已有累计时间绘制首帧，屏外时间不计入动画相位。静态模式仍可响应参数和进度更新。

交互涟漪由宿主把触点转换为归一化坐标并调用 `trigger([x, y])`。Canvas 按实例保存波源，以累计动画时间推进脉冲。渲染器在波源全部过期后报告空闲，调度器停止请求下一帧。暂停和减少动态时忽略新触发，减少动态时绘制静态底图。

| 后端 | 实现与降级 |
| --- | --- |
| CSS | 小型几何、文本、进度、骨架。优先用 transform 和 opacity，样式限于实例容器。由核心时间轴推进，部分状态切换使用 CSS 过渡。 |
| Canvas 2D | 点阵和中等规模粒子。缓存布局与相位，分辨率随容器和 DPR 调整，限制总缓冲像素。无法取得 2D 上下文时显示静态点阵，任务进度由宿主独立展示。 |
| WebGL 2 | 后续规划，面向流体、复杂材质和 3D。 |

## 框架接入与 Playground

React 在 effect 中挂载，卸载时销毁。Vue 在 mounted 后创建实例，通过 watch 更新参数，在卸载前销毁。Web Components 使用 `defineLoadingEffect()` 显式注册，断开时销毁，重新连接时按最新配置挂载。标量 HTML 属性优先于 `options`，移除属性后恢复使用 `options` 的值。各框架的用法见[接入指南](integration.md)。

Playground 根据 Schema 生成每张卡片的控件。参数、演示进度和暂停状态按卡片保存。代码区可以生成 Vue、React、Web Components 的 JS 和 TS 示例。分享链接与预设导入仍在规划中。

## 性能与无障碍验收

以下条目用于发布验收。浏览器回归的运行方式见[回归与发布检查](release-v01.md)。

- 以 60 FPS 为前台目标。选定桌面与中档移动设备，记录系统、浏览器、视口、DPR、动效、实例数。对 800 × 450 点阵运行 30 秒，记录帧间隔 P50/P95、脚本绘制耗时和掉帧。以 P95 帧间隔 ≤ 20 ms、绘制脚本 P95 ≤ 6 ms 作为首版桌面验收预算。移动端记录原始数据和降级后的结果。
- Canvas 默认 DPR 上限 2，单实例缓冲区上限约 4 百万像素，点阵上限见详细规范。运行时自动按帧耗时降级仍在规划中。粒子网络用空间分桶并限制每点连线数。
- 隐藏标签页或移出视口后停帧。重复挂载、改尺寸、暂停、销毁 50 次，检查回调、监听器和绘图资源可回收。验证 Canvas 初始化失败后的静态降级。WebGL 上下文恢复随对应后端验收。
- 装饰层使用 `aria-hidden=true`。未知进度以可访问名称和 `role=status` 传达。确定和估算使用命名的 `progressbar`，设置 `aria-valuemin=0`、`aria-valuemax=100`、`aria-valuenow`，估算附带说明。动态装饰不得产生连续播报。
- 宿主可对内容区域设置 `aria-busy`，状态播报节点放在该区域外。播报限于任务开始、阶段变化和终态。进度文案的普通字号对比度目标为至少 4.5:1。Playground 控件可用键盘操作，焦点清晰。
- 系统减少动态时展示静态姿态，保留可读状态和真实进度，禁用淡出过渡。验收包括系统偏好在运行中改变、文本放大、键盘操作和读屏实测。
