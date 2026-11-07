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
SITE_URL=https://cbtpro.github.io BASE_URL=/loading-effects/ pnpm --filter @loading-effects/app-docs build
BASE_URL=/loading-effects/ pnpm --filter @loading-effects/app-docs serve --host 127.0.0.1 --port 4175
```

构建产物位于 `apps/docs/build/`。本地打开 [子路径预览](http://127.0.0.1:4175/loading-effects/)。

## 部署

在线站点位于 [GitHub Pages](https://cbtpro.github.io/loading-effects/)。推送到默认分支 `main` 后，[Documentation Pages](https://github.com/cbtpro/loading-effects/actions/workflows/docs-pages.yml) 工作流会构建并发布站点，也可以在 Actions 中手动运行。拉取请求只执行构建检查。

部署到派生仓库时，在 **Settings → Pages** 将 **Source** 设为 **GitHub Actions**。工作流读取目标仓库的 Pages 域名和子路径，也支持已在 Pages 设置中配置的自定义域名。
