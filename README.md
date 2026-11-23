# Browsely (Browserly)

[browserly.maoxunxing.com](https://browserly.maoxunxing.com/) 的线上代码存档：17 个浏览器智能体（Browser Use、Stagehand、Skyvern、Playwright MCP 等）的双语对比看板，每条有独立详情页 `/agent/<id>`，另有 `/sponsor` 赞助页。

> 仓库名按 GitHub 既定名称拼作 `browsely`，产品名与域名为 **Browserly**（原名 BrowseBoard）。

## 这是什么形态的代码

本站没有传统的源码仓库：它是 **Next.js + OpenNext 构建后跑在 Cloudflare Workers** 上的站点，Worker 名为 `browseboard`。本仓库保存的是当前线上正在运行的构建产物与运维脚本，用于版本存档与后续补丁维护：

| 路径 | 内容 |
|---|---|
| `pkg/worker.js` | 当前线上 Worker 构建产物（单文件 bundle） |
| `assets_current/` | 当前线上全量静态资产（`_next` chunks、logos、posters、`llms.txt`、`api/agents` 数据等），清单见 `manifest_raw.json` |
| `upload_and_version.py` | 创建资产上传会话、上传变更资产并上传新 Worker 版本（`--deploy` 直接部署） |
| `deploy_version.py` | 把指定 version_id 以 100% 流量部署 |
| `get_version.py` | 查询当前版本 |
| `patch_title.py` / `patch_footer.py` / `patch_contact.py` | 对 `worker.js` 的历史补丁脚本（标题恢复、页脚恢复、全站联系方式） |
| `crawl_current.py` | 抓取线上资产清单的脚本 |
| `deployments.json` | 历史部署记录 |

## 部署方式

通过 Cloudflare Workers API 直传（脚本内走已配置的 Cloudflare 凭证）：

```bash
python3 upload_and_version.py --deploy   # 上传资产 + 新版本并部署
python3 deploy_version.py <version_id>   # 部署已有版本
```

## 注意

- `completion.jwt` 是资产上传会话的一次性令牌，**不要提交**（已在 `.gitignore` 中排除）。
- 本地工作目录中的历史页面快照、旧 bundle 等过程文件未入仓；如需继续开发，建议以本仓库的线上产物为准。
