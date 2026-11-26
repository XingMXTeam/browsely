---
name: momo-browserly-advisor
description: 浏览器驱动型 AI Agent 与自动化方案选型顾问。结合当前代码库环境与 Browserly 一手核验事实库，根据登录态边界、托管合规、MCP 接入、感知路径、反爬强度与许可证约束，在 17+ 方案中输出可验证的首选、备选、排除原因与避坑清单。用于选择浏览器 Agent、MCP 浏览器驱动、登录态自动化或云端反爬方案；切勿替代自家应用确定性 CI/E2E 测试（应继续使用 e2e-testing / Playwright）。
---

# Browserly Advisor — 浏览器智能体选型顾问

> 数据事实源：[Browserly](https://browserly.maoxunxing.com)（最近一手核验：`2026-11-02`，收录 `17` 个活跃方案，外加 Browserbase 配套设施注记）。
> 设计原则：**认知诚实（Epistemic Honesty）** — 严禁编造 `unknown` 价格、许可证或反爬 SLA；若常规确定性 Playwright 足够，明确告知用户无需引入重型 LLM Browser Agent。

## 适用边界（When to Use）

- 用户需要为 Coding Agent（Claude Code / Antigravity / Cursor / Codex）挑选或挂载浏览器驱动 / MCP 工具。
- 用户需要在本机复用已登录会话操作后台（微信/小红书/内部 ERP/CRM），或构建无人值守的云端/自托管浏览器自动化任务。
- 用户在 `playwright-mcp`、`browser-use`、`stagehand`、`skyvern`、`ego-lite`、`huashu-chrome`、`agent-browser`、`opencode-browse`、`notte` 等方案之间犹豫不决。
- 在 `e2e-testing` 或 `interactive-review` 流程中，遇到必须复用真实登录态、跨站探索或风控拦截而无法靠纯脚本覆盖时，触发本 Skill 做驱动升级选型。

不适用场景：
- 自家 Web 应用的常规确定性回归测试与 CI 验收（请直接使用 `@playwright/test` 或 `agent-skills` 中的 `e2e-testing`）。
- 纯后端 HTTP/GraphQL API 测试（请使用 `api-testing`）。

## 执行工作流（Workflow）

### 1. 先自动探测当前工作区（少问废话）
在向用户提问前，先快速检查当前仓库（若处于代码项目内）：
- 技术栈与依赖：`package.json` / `pyproject.toml`（判断是否已有 Playwright、TypeScript 或 Python 环境）。
- 现有配置：`.mcp.json` / `.cursor/` / `.claude/` / `.agents/`（是否已挂载某浏览器 MCP 或 `agent-skills` 流水线）。
- 能从代码库确定的条件直接填入参数，不要重复询问用户。

### 2. 最多追问 3 个高杠杆硬约束
仅追问无法推断的关键决策轴（可合并为一次简短提问）：
1. **场景与登录态边界（最重要）**：操作用户本机已登录会话且密码绝不上云（`local-session`），还是无人值守的独立 Profile（`isolated-profile`）或云端密钥库（`cloud-vault`）？
2. **部署与合规边界**：是否要求数据不出内网必须自托管（`self-host`），还是接受云端托管（`cloud`）？许可证是否限制为 MIT/Apache-2.0（`free-oss`，避开 AGPL/SSPL）？
3. **接入形态与风控压力**：是否必须原生 MCP（`required`），还是偏好 CLI/SDK（`sdk-cli`）？目标站点是否有强风控/CAPTCHA（`stealth-captcha`）或仅靠本机登录态即可（`login-reuse`）？

### 3. 调用实时决策 API（优先）或降级使用离线核验矩阵
将约束映射为标准参数，调用 Browserly 确定性推荐接口：

```bash
curl -s "https://browserly.maoxunxing.com/api/recommend?useCase=coding-agent&auth=local-session&hosting=self-host&mcp=required&antiBot=none&budget=free-oss&locale=zh"
```

支持的查询参数：
- `useCase`: `any` | `coding-agent` | `logged-in-ops` | `headless-pipeline` | `visual-canvas` | `hard-antibot`
- `auth`: `any` | `local-session` | `isolated-profile` | `cloud-vault`
- `hosting`: `any` | `self-host` | `cloud`
- `mcp`: `any` | `required` | `preferred` | `sdk-cli`
- `antiBot`: `any` | `none` | `login-reuse` | `stealth-captcha`
- `budget`: `any` | `free-oss` | `oss-any` | `paid-ok`
- `perception`: `any` | `dom` | `hybrid` | `vision`（可选覆盖）
- `limit`: `1..10`（默认 `3`），`locale`: `zh` | `en`

若需拉取完整原始目录：`https://browserly.maoxunxing.com/api/agents` 或 `https://browserly.maoxunxing.com/llms.txt`。若当前环境断网/处于无网沙盒，直接依据文末「离线核验速查表」执行同等硬排除与取舍。

### 4. 输出结构化选型诊断书
交付给用户的结论必须包含以下 5 项，且全部标注核验日期与一手来源链接：
1. **首选方案（Primary Pick）**：命中理由、核心规格、官方文档与 Browserly 档案页链接。
2. **备选 / 互补方案（Runner-up）**：说明在什么拐点下切换（例如本地调试 vs 上云扩容、DOM 提速 vs 视觉兜底）。
3. **为什么不选其他热门方案（Why-Not Exclusions）**：直接引用 API 返回的 `excluded` 硬排除理由（如纯云端、无原生 MCP、AGPL/SSPL 协议冲突）。
4. **风险与未核实项警示（Caveats & Unknowns）**：明确列出 `caveats`（包含 `unknown` 字段、partial MCP、反爬无 SLA 提醒、云端额外计费边界）。
5. **下一步落地动作（Next Step）**：结合当前代码库给出具体验证步骤（先跑 3–5 条真实页面冒烟任务验证延迟与登录稳定性）。

## 反模式红线（Anti-patterns）

- ❌ **杀鸡用牛刀**：用户只需给自家前端写确定性回归测试时，强推重型 LLM Browser Agent（应建议原生 `@playwright/test` / `e2e-testing`）。
- ❌ **编造事实**：将矩阵里标为 `unknown` 的价格、协议或反爬能力脑补为“免费”或“支持”。
- ❌ **无视安全红线**：用户明确要求 `local-session` 或 `self-host` 时，仍推荐纯云端或需上传凭据到云端密钥库的方案。
- ❌ **隐瞒许可证风险**：在商业项目选型中推荐 `AGPL-3.0`（Skyvern）或 `SSPL-1.0`（Notte）却不提示法务评估。
- ❌ **混淆基础设施与智能体**：把 Browserbase 等按小时计费的云浏览器基础设施直接等同于完整 Agent（它属于 Stagehand 等框架的配套宿主）。

## 交付验收标准（Done Criteria）

- 已结合用户环境与硬约束完成实时 API 查询（或说明因离线使用了内置核验快照）。
- 明确给出首选、备选、Why-Not 排除清单、Caveats 风险提示与具体下一步。
- 所有规格结论均附带核对日期（`lastChecked`）及官方文档 / Browserly 档案来源链接，零凭空猜测。

## 离线兜底：一手核验快照（as_of: 2026-11-02）

| ID | 名称 | 感知 | 托管 | MCP | 凭据模型 | 反爬 | 定价 | 许可 | 核对 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `browser-use` | Browser Use | hybrid | both | yes | `both_user_browser_and_runtime` | Stealth | Usage | MIT | 2026-10-19 |
| `stagehand` | Stagehand | hybrid | both | partial | `agent_runtime` | Host | OSS | MIT | 2026-10-24 |
| `skyvern` | Skyvern | vision | both | yes | `cloud_vault` | CAPTCHA | $29/mo | AGPL-3.0 | 2026-10-19 |
| `playwright-mcp` | Playwright MCP | dom | self-host | yes | `user_browser` | None | Free | Apache-2.0 | 2026-10-19 |
| `claude-in-chrome` | Claude in Chrome | hybrid | cloud | no | `user_browser` | Gated | Plan | proprietary | 2026-10-19 |
| `notte` | Notte | hybrid | both | yes | `cloud_vault` | CAPTCHA | $20/mo | SSPL-1.0 | 2026-10-24 |
| `openai-computer-use` | OpenAI Computer Use / Browser tools | hybrid | both | partial | `app_owned` | Driver | Tokens | proprietary_api_mit_sample | 2026-10-24 |
| `smooth` | Smooth | unknown | cloud | partial | `browser_profile` | CAPTCHA | $0.005 | unknown | 2026-10-24 |
| `ego-lite` | ego (lite) | dom | self-host | no | `user_browser` | Login | Free | MIT | 2026-10-26 |
| `xbrowser` | xbrowser | dom | self-host | no | `user_browser` | Stealth | Free | MIT | 2026-10-26 |
| `agent-browser` | agent-browser | dom | self-host | yes | `user_browser` | None | Free | Apache-2.0 | 2026-10-26 |
| `huashu-chrome` | huashu-chrome | dom | self-host | yes | `user_browser` | Login | Free | MIT | 2026-10-26 |
| `opencode-browse` | OpenCode Browse | hybrid | self-host | yes | `user_browser` | Stealth | Free | MIT | 2026-11-02 |
| `foundry-browser-automation` | Foundry Browser Automation Tool | unknown | cloud | yes | `unknown` | Unknown | Unknown | proprietary | 2026-11-02 |
| `auto-browser` | Auto Browser | hybrid | self-host | yes | `browser_profile` | None | Free | MIT | 2026-11-02 |
| `browsentic` | Browsentic | hybrid | self-host | partial | `user_browser` | CAPTCHA | Free | Apache-2.0 | 2026-11-02 |
| `better-browser-mcp` | better-browser-mcp | dom | self-host | yes | `user_browser` | Unknown | Free | MIT | 2026-11-02 |

- 配套基础设施注记：`Browserbase` 属于云浏览器宿主（常搭配 Stagehand 上云），不是独立的浏览器驱动智能体行。
- 在线交互式选型向导与最新核验档案：https://browserly.maoxunxing.com/
