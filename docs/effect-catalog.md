import EffectDemo, { EffectGallery } from '@site/src/components/EffectDemo';

# 动效目录

对话中的分类说明、视觉参考图与 Playground 概念见[动效库构想](loading-effects-concept.md)。

沿用原讨论的分类、名称和编号。英文短名转换为稳定的 kebab-case ID。每项参数给出建议默认值，长度为 CSS px，角度为度，时间为毫秒，透明度为 0–1。周期使用公共参数 `duration`，默认 1200 ms，下表列出有专门默认值或有辨识度的参数。公共协议见[技术设计](architecture.md)。渲染器列为首选实现。

## 01 基础几何

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 01 | circular-spinner · 环形旋转 | 不完整圆弧绕中心匀速转动，尾部渐隐。 | `size=24`，`strokeWidth=2`，`arcAngle=100`，`tailOpacity=.25`，`duration=900` | CSS |
| 02 | bouncing-dots · 弹跳圆点 | 三个圆点错峰上跳并缓落。 | `count=3`，`gap=5`，`height=6`，`stagger=120`，`easing=ease-in-out` | CSS |
| 03 | pulse-circle · 呼吸圆环 | 同心圆扩大时逐渐淡出，错相形成呼吸。 | `count=2`，`radius=8`，`maxScale=1.6`，`minOpacity=.15`，`duration=1600` | CSS |
| 04 | rotating-squares · 方块旋转 | 方块组绕中心转动，方块交替缩放。 | `count=4`，`side=6`，`turnAngle=360`，`direction=clockwise`，`minScale=.7` | CSS |
| 05 | orbit-dots · 轨道圆点 | 圆点沿椭圆轨道追逐。 | `count=3`，`radiusX=12`，`radiusY=8`，`phaseGap=30` | CSS |
| 06 | elastic-line · 弹性线条 | 水平线向前伸展，随后收缩并回到初始状态。 | `minLength=6`，`maxLength=24`，`travel=12`，`strokeWidth=3` | CSS |
| 07 | morphing-shape · 形状变换 | 圆形、方形和菱形连续变换，回到圆形。 | `shapes=[circle,square,diamond]`，`cornerRadius=3`，`duration=2100` | CSS |
| 08 | flip-tiles · 翻转方块 | 方块按行错峰沿指定轴翻转。 | `rows=2`，`columns=2`，`axis=y`，`tileSize=8`，`stagger=90` | CSS |

### 基础几何演示

以下组件按默认参数运行。需要调参时，可打开 [Playground 的基础几何分组](http://127.0.0.1:4173/#geometry-effects)。

<EffectGallery presets={['circular-spinner', 'bouncing-dots', 'pulse-circle', 'rotating-squares', 'orbit-dots', 'elastic-line', 'morphing-shape', 'flip-tiles']} />

## 02 点阵与波纹

本类 6 项在 Playground 的「点阵与波纹」分组中纵向展示，可分别实时调参。[查看动效演示与操作说明](dot-matrix-ripple.md#点阵与波纹演示)。

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 09 | dot-matrix-wave · 点阵波浪 | 固定网格中，波峰逐点改变半径和透明度，中心偏下更显眼。 | `rows=auto`，`columns=auto`，`gap=18`，`direction=35`，`wavelength=120`，`amplitude=1.4`，`duration=1900` | Canvas 2D |
| 10 | radial-ripple · 径向涟漪 | 同心波峰从波源向外传播，随距离减弱。 | `origin=[.5,.64]`，`wavelength=120`，`crestWidth=.45`（周期比例），`falloff=1.2`，`duration=1900` | Canvas 2D |
| 11 | directional-wave · 定向波浪 | 平行波峰沿任意角度扫描均匀点阵。 | `direction=0`，`wavelength=96`，`crestCount=auto`，`duration=1500` | Canvas 2D |
| 12 | matrix-breathing · 点阵呼吸 | 全场缓慢明暗起伏，边缘比中心稍晚达到峰值。 | `origin=[.5,.64]`，`phaseSpread=55`，`amplitude=1.1`，`duration=2500` | Canvas 2D |
| 13 | matrix-vortex · 点阵漩涡 | 螺旋相位绕中心旋转，圆点位置固定。 | `origin=[.5,.5]`，`arms=3`，`twist=1.2`（每波长圈数），`wavelength=120`，`duration=2200` | Canvas 2D |
| 14 | interactive-ripple · 交互涟漪 | 点击或触摸触发短促扩散，未交互时保留底图。 | `waveSpeed=100`（px/s），`pulseWidth=24`，`lifetime=1500`，`maxRipples=3` | Canvas 2D |

## 03 粒子系统

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 15 | particle-flow · 粒子流 | 粒子沿曲线连续流入和流出，个体速度略有差异。 | `count=120`，`direction=0`，`velocity=42`（px/s），`curvature=.2`，`lifetime=3000` | Canvas 2D |
| 16 | particle-convergence · 粒子汇聚 | 边缘粒子向目标点靠拢，接近时缩小淡出。 | `origin=[.5,.5]`，`count=96`，`attraction=90`（px/s²），`fadeRadius=18` | Canvas 2D |
| 17 | particle-explosion · 粒子爆发 | 粒子由中心散开、衰减并回聚。 | `count=80`，`spreadRadius=64`，`decay=.65`，`duration=2200` | Canvas 2D |
| 18 | particle-orbit · 粒子轨道 | 多层粒子轨道异速转动。 | `count=72`，`rings=3`，`ringGap=12`，`speedSpread=.3`，`duration=2600` | Canvas 2D |
| 19 | particle-morph · 粒子变形 | 粒子在等点数的目标形状之间重组。 | `targets=[circle,square]`，`count=180`，`hold=400`，`duration=2600` | Canvas 2D |
| 20 | particle-network · 粒子网络 | 漂移粒子按距离连接，连线随距离淡出。 | `count=64`，`linkDistance=36`，`maxLinks=4`（每点），`velocity=16`（px/s） | Canvas 2D |

### 粒子系统演示

6 种粒子动效均使用 Canvas 2D。滚动离开视口时暂停绘制，返回后从原相位继续。粒子网络只比较相邻网格，并对连线两端同时应用数量上限。

<EffectGallery presets={['particle-flow', 'particle-convergence', 'particle-explosion', 'particle-orbit', 'particle-morph', 'particle-network']} />

## 04 流体与液态

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 21 | liquid-blob · 液态形变 | 团块边缘沿周向平滑起伏。 | `radius=22`，`lobes=5`，`amplitude=4`，`duration=2800` | Canvas 2D |
| 22 | liquid-fill · 液位填充 | 真实进度控制液面均值，波纹沿液面横移。 | `shape=circle`（可切换 `rounded-square`），`amplitude=3`，`wavelength=36`，`showValue=true` | Canvas 2D |
| 23 | metaball · 融合液滴 | 液滴靠拢时轮廓融合，拉开时细颈断开。 | `count=3`，`radius=12`，`threshold=.65`（归一化场强），`travel=16` | WebGL |
| 24 | fluid-ribbon · 流体丝带 | 带状曲面沿长度扭转并缓慢漂浮。 | `width=12`，`length=96`，`twist=180`，`amplitude=10`，`duration=3000` | WebGL |
| 25 | ink-diffusion · 墨水扩散 | 颜色由局部向外扩散，边界模糊后淡回初态。 | `origin=[.5,.5]`，`radius=60`，`softness=.6`，`seed=1`，`duration=3200` | WebGL |

### Canvas 流体演示

液态形变通过调整半径、波瓣数和振幅改变轮廓。液位填充沿用波浪进度的任务协议，`progress: null` 显示等待状态，`0–100` 控制液位。容器可在圆形和圆角方形之间切换。示例使用圆形和 63% 确定进度。

<EffectGallery presets={[{ id: 'liquid-blob', options: { radius: 36, amplitude: 8 } }, { id: 'liquid-fill', options: { progress: 63 } }]} />

### WebGL 流体演示

融合液滴叠加各液滴的场强，以阈值决定轮廓是否连在一起。丝带以横向起伏和扭转明暗表现曲面。墨水扩散支持归一化波源位置和可复现的纹理种子。浏览器无法创建 WebGL 2 上下文时显示静态姿态。

<EffectGallery presets={[{ id: 'metaball', options: { radius: 18, travel: 24 } }, { id: 'fluid-ribbon', options: { length: 140, width: 18 } }, 'ink-diffusion']} />

## 05 文字动效

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 26 | typing-dots · 输入省略号 | 固定文本后按节拍出现 0 至 3 个点，占位宽度固定。 | `text=Loading`，`maxDots=3`，`interval=300`，`duration=1200` | CSS |
| 27 | character-wave · 字符波浪 | 按字素簇错峰抬升并回落。 | `text=Loading`，`amplitude=4`，`stagger=75` | CSS |
| 28 | text-shimmer · 文字流光 | 柔和高光沿字形移动。 | `text=Loading`，`highlightWidth=.28`（字宽比例），`direction=0`，`duration=1600` | CSS |
| 29 | scramble-text · 字符解码 | 临时字符逐位锁定为目标文本，停留后进入下一轮。 | `text=Loading`，`alphabet=ABC012`，`tick=90`，`hold=500`，`seed=1` | CSS + DOM |

### 文字动效演示

输入省略号预留圆点宽度，字符解码按目标字形预留宽度。字符波浪和解码通过 `Intl.Segmenter` 按字素簇处理组合字符和 emoji。减少动态时直接显示静态文字。

<EffectGallery presets={['typing-dots', { id: 'character-wave', options: { text: '加载中 👩🏽‍💻', amplitude: 12 } }, 'text-shimmer', 'scramble-text']} />

## 06 进度反馈

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 30 | circular-progress · 环形进度 | 进度驱动弧长，圆心显示当前数值。 | `strokeWidth=4`，`startAngle=-90`，`showValue=true`，`transition=180` | CSS |
| 31 | gradient-progress · 渐变进度条 | 任务进度控制填充长度，高光只在填充区流动。 | `height=6`，`cornerRadius=3`，`endColor=#4D8DFF`，`shimmer=true` | CSS |
| 32 | segmented-progress · 分段进度 | 分段依次填充，当前段允许按比例填充。 | `segments=10`，`gap=3`，`partial=true` | CSS |
| 33 | step-progress · 阶段进度 | 节点显示已完成、当前和待开始状态，阶段由任务提供。 | `steps=[准备,处理,完成]`，`activeStep=0`（零基），`showLabels=true` | CSS |
| 34 | wave-progress · 波浪进度 | 波形填充区域均值随进度更新，波峰横向移动。 | `amplitude=4`，`wavelength=40`，`showValue=true`，`transition=180` | Canvas 2D |

### 进度反馈演示

五种进度反馈均已接入 Playground。环形、渐变、分段和波浪进度由宿主通过 `progress` 提供 `0–100` 的数值，或用 `null` 表示未知进度。估算值通过 `progressSource: 'estimated'` 标识，画面与辅助技术均可区分。预览到达 `100%` 时保留进度，点击「模拟内容就绪」才退出。

**环形进度**显示「预计 93%」。未知进度时，圆弧循环旋转。

<EffectDemo id="circular-progress" options={{ progress: 93, progressSource: 'estimated' }} />

**渐变进度条**填充到 93%。播放时流光只在已填充区域内移动，静态预览保留填充长度。

<EffectDemo id="gradient-progress" options={{ progress: 93 }} />

**分段进度**在 93% 时填满前九段，再填充第十段的 30%。关闭「允许部分填充」后只点亮已经完成的整段。

<EffectDemo id="segmented-progress" options={{ progress: 93 }} />

**阶段进度**使用 `steps` 和零基下标 `activeStep`。示例当前处于「处理」，前一步已完成，后一步待开始。

<EffectDemo id="step-progress" options={{ activeStep: 1 }} />

**波浪进度**的液面在 63% 附近起伏。静态模式保留当前液面，未知进度时显示横向移动的标记。

<EffectDemo id="wave-progress" options={{ progress: 63 }} />

## 07 骨架屏

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 35 | shimmer-skeleton · 流光骨架 | 高亮光带扫过与内容等尺寸的占位块。 | `layout=text-lines`，`cornerRadius=4`，`bandWidth=.3`，`duration=1600` | CSS |
| 36 | pulse-skeleton · 呼吸骨架 | 占位块在透明度范围内缓慢变化。 | `layout=text-lines`，`minOpacity=.55`，`maxOpacity=1`，`duration=1600` | CSS |
| 37 | staggered-skeleton · 错峰骨架 | 多块占位按阅读顺序依次亮起并回落。 | `layout=text-lines`，`stagger=100`，`minOpacity=.6` | CSS |
| 38 | progressive-reveal · 渐进揭示 | 各区内容就绪后独立替换骨架，保留布局。 | `layout=text-lines`，`readyKeys=[]`，`fadeDuration=180` | CSS |

### 骨架占位演示

四种骨架共用 `text-lines` 和 `article-card` 布局。流光、呼吸和错峰骨架在减少动态模式下保留静态占位。

渐进揭示通过 `content` 接收区域文本。宿主将已就绪的键传给 `readyKeys`，对应区域显示内容并保留宽高。下方示例先揭示标题，正文和补充信息仍保留占位。

<EffectGallery presets={['shimmer-skeleton', 'pulse-skeleton', 'staggered-skeleton', { id: 'progressive-reveal', options: { readyKeys: ['title'], content: { title: '加载动效示例', body: '各区域随任务结果独立显示。', footer: '已读取本地数据' } } }]} />

## 08 AI 生成

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 39 | neural-pulse · 神经网络脉冲 | 节点间的边按路径依次点亮。 | `layers=[3,5,3]`，`nodeRadius=2`，`pulseWidth=10`，`pulseInterval=480` | Canvas 2D |
| 40 | pixel-reconstruction · 像素重构 | 粗像素逐级细化为输入预览，无预览时使用抽象图形。 | `preview=null`，`cellSizes=[16,8,4,2]`，`stage=0`，`seed=1` | Canvas 2D |
| 41 | diffusion-reveal · 扩散显影 | 噪点权重逐渐降低，显出宿主提供的预览。 | `preview=null`，`noiseScale=4`，`blend=0`（显影权重），`seed=1` | WebGL |
| 42 | token-stream · Token 流 | 光点或字符片段沿路径出现并淡出。 | `tokens=[]`（空时使用光点），`emitInterval=140`，`lifetime=1200`，`maxItems=16` | Canvas 2D |
| 43 | generative-grid · 生成网格 | 网格按规则激活、保持和消退。 | `rows=8`，`columns=12`，`pattern=diagonal`，`hold=260` | Canvas 2D |

## 09 空间与 3D

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 44 | rotating-cube · 旋转立方体 | 立方体绕多个轴转动，面保留明暗区分。 | `side=28`，`axes=[x,y]`，`perspective=160`，`duration=2600` | CSS 3D |
| 45 | dot-sphere-3d · 点阵球体 | 球面点随球体旋转，远点更小更淡。 | `count=240`，`radius=42`，`tilt=20`，`duration=3600` | WebGL |
| 46 | infinite-tunnel · 无限隧道 | 嵌套图形向镜头移动，在远端循环补入。 | `rings=9`，`shape=hexagon`，`depth=400`（场景单位），`fov=50` | WebGL |
| 47 | wireframe-morph · 线框变形 | 顶点对应的线框在球体和方体间连续插值。 | `targets=[sphere,cube]`，`detail=12`，`hold=400`，`duration=3200` | WebGL |

## 10 品牌与创意

| 编号 | 动效 ID · 名称 | 视觉与运动 | 专属参数及默认值 | 渲染 |
| --- | --- | --- | --- | --- |
| 48 | logo-morph · 品牌形变 | 宿主轮廓与抽象形状互变，回到品牌原形。 | `paths=[]`（宿主提供同拓扑轮廓），`hold=450`，`duration=2600` | Canvas 2D |
| 49 | infinity-loop · 无限循环 | 光点沿 ∞ 形路径运动，短尾随光点淡出。 | `radiusX=26`，`radiusY=12`，`count=2`，`trailLength=.15`（路径比例），`duration=1800` | Canvas 2D |
| 50 | magnetic-dots · 磁吸圆点 | 圆点靠拢后弹开，阻尼抑制持续抖动。 | `count=5`，`restGap=14`，`stiffness=22`（s⁻²），`damping=6`（s⁻¹），`duration=2200` | Canvas 2D |
