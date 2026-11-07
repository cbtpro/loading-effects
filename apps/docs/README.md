# 文档网站

站点使用 Docusaurus Classic 和中文界面。正文及参考图直接读取项目根目录的 `docs/`，修改时只维护这一份 Markdown 和图片。

## 本地预览

在项目根目录运行以下命令，然后打开 [文档站](http://localhost:3000/)。

```sh
pnpm install --frozen-lockfile
pnpm --filter @loading-effects/app-docs start
```

## 构建与预览 GitHub Pages 子路径

```sh
SITE_URL=https://example.github.io BASE_URL=/loading-effects/ pnpm --filter @loading-effects/app-docs build
BASE_URL=/loading-effects/ pnpm --filter @loading-effects/app-docs serve --host 127.0.0.1 --port 4175
```

构建产物位于 `apps/docs/build/`。本地打开 [子路径预览](http://127.0.0.1:4175/loading-effects/)。

## 部署

在目标 GitHub 仓库进入 **Settings → Pages**，将 **Source** 设为 **GitHub Actions**。代码推到默认分支后，`Documentation Pages` 工作流会构建并发布站点，也可从 **Actions** 手动运行。拉取请求只执行构建检查。

工作流读取目标仓库的 Pages 域名和子路径，适用于仓库子路径和已在 Pages 设置中配置的自定义域名。
