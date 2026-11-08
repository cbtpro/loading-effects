# 文档网站

站点使用 Docusaurus Classic 和中文界面。正文及参考图直接读取项目根目录的 `docs/`，修改时只维护这一份 Markdown 和图片。

## 本地预览

在项目根目录运行以下命令，然后打开 [文档站](http://localhost:3000/)。

```sh
pnpm install --frozen-lockfile
pnpm --filter @loading-effects/app-docs start
```

开发模式下，导航栏的 Playground 入口指向本地开发服务。另开终端运行 `pnpm --filter @loading-effects/app-playground dev --port 4173` 即可使用。

## 构建与预览 GitHub Pages 子路径

```sh
SITE_URL=http://127.0.0.1:4175 BASE_URL=/loading-effects/ pnpm build:pages
BASE_URL=/loading-effects/ pnpm --filter @loading-effects/app-docs serve --host 127.0.0.1 --port 4175
```

联合构建产物位于 `apps/docs/build/`，其中 `playground/` 是独立的 Vite 静态页面。可打开[文档预览](http://127.0.0.1:4175/loading-effects/)和 [Playground 预览](http://127.0.0.1:4175/loading-effects/playground/)。

## 部署

线上[文档站](https://blog.chenbitao.com/loading-effects/)和 [Playground](https://blog.chenbitao.com/loading-effects/playground/)共用一个 GitHub Pages 站点。推送到默认分支 `main` 后，[GitHub Pages 工作流](https://github.com/cbtpro/loading-effects/actions/workflows/docs-pages.yml)会构建并发布两者，也可以在 Actions 中手动运行。拉取请求只执行构建检查。

部署到派生仓库时，在 **Settings → Pages** 将 **Source** 设为 **GitHub Actions**。工作流读取目标仓库的 Pages 域名和子路径，也支持已在 Pages 设置中配置的自定义域名。
