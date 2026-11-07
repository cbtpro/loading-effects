# 动效定义

导出 `dotMatrixWave`、`radialRipple`、`directionalWave`、`matrixBreathing`、`matrixVortex` 和 `interactiveRipple`。六种预设共用点阵布局，分别声明参数 Schema 和波形。挂载 `interactiveRipple` 后，宿主可调用实例的 `trigger([x, y])`，坐标按画布宽高归一化到 0–1。

基础几何的 8 个预设通过同一入口导出，使用 CSS 渲染器。列表见[动效目录](../../docs/effect-catalog.md#01-基础几何)。

参见[技术设计](../../docs/architecture.md)。
