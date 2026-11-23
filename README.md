# Browsely (Browserly)

[browserly.maoxunxing.com](https://browserly.maoxunxing.com/)：17 个浏览器驱动型 AI 智能体（Browser Use、Stagehand、Skyvern、Playwright MCP 等）的双语核对矩阵与深度档案看板，含详情页 `/agent/<id>`、方法论与更新记录页 `/about`、赞助页 `/sponsor`，以及面向程序与 Agent 的 `/api/agents` 与 `/llms.txt`。

> 仓库名按 GitHub 既定名称拼作 `browsely`，产品名与域名为 **Browserly**（原名 BrowseBoard）。详细架构与维护指南见 [AGENTS.md](./AGENTS.md)。

## 源码与构建结构

项目采用零外部依赖的原生 ES Module Cloudflare Worker + 轻量化静态资产架构：

| 路径 | 内容 |
|---|---|
| `src/data/` | `seed.json`（核心核对数据）、`stories.json`（中文深度评述）与标准化数据层 `catalog.js` |
| `src/i18n/dict.js` | 中英双语词典与语义徽章映射 |
| `src/styles/app.css` | 编辑级视觉系统、响应式栅格与克制微动效 |
| `src/client/app.js` | 零依赖前端运行时（实时筛选、快速场景、并排对比弹窗、演示抽屉、即时无刷新双语切换） |
| `src/server/` | Cloudflare Worker 服务端渲染与路由 (`worker.js`、`pages.js`、`components.js`、`icons.js`) |
| `scripts/build.mjs` | 打包压缩 CSS/JS 与单文件 `pkg/worker.js`，并更新 `assets_current/manifest_raw.json` |
| `scripts/dev.mjs` | 本地 Worker 预览服务器（默认端口 `8787`） |
| `scripts/verify.mjs` | 数据层不变量、全路由 SSR、API 契约、资产哈希与体积预算自动化校验 |
| `pkg/worker.js` | 编译后的单文件 Cloudflare Worker 产物 |
| `assets_current/` | 静态资产（`assets/app.*.css|js`、字体、logos、posters、二维码、`manifest_raw.json`） |
| `wrangler.jsonc` | 标准 Cloudflare Wrangler 配置文件 |
| `upload_and_version.py` | Cloudflare Workers API 静态资产同步与版本部署脚本 |

## 本地开发与校验

仅需 Node.js（原生 ESM，无需 `npm install`）：

```bash
npm run check    # 构建 pkg/worker.js + 静态资产并运行全量自动化校验
npm run dev      # 启动本地预览服务器 http://127.0.0.1:8787
```

## 部署到 Cloudflare Workers

支持两种方式部署到 `browseboard` Worker：

1. **通过 API 脚本构建、校验并一键部署**：
   ```bash
   CLOUDFLARE_API_TOKEN=<你的Token> npm run deploy
   ```
2. **通过 Wrangler CLI 部署**（已内置 `wrangler.jsonc`）：
   ```bash
   npx wrangler deploy
   ```
