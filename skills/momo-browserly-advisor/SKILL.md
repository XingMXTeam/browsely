---
name: momo-browserly-advisor
description: Advisor for selecting browser-driving AI agents and browser MCP stacks. Inspects the local workspace, applies hard credential/hosting/MCP/license constraints against Browserly's first-party verified matrix, and delivers ranked picks, why-not exclusions, and epistemic caveats. Use when choosing a browser agent, MCP browser driver, logged-in session automation, or anti-bot runtime; never replace deterministic @playwright/test CI suites (use e2e-testing instead).
---

# Browserly Advisor — Browser-Driving Agent Selection Playbook

> Source of truth: [Browserly](https://browserly.maoxunxing.com) (last verified pass: `2026-11-02`, `17` active matrix rows + Browserbase companion infra note).
> Core rule: **Epistemic Honesty** — never fabricate `unknown` pricing, licenses, or anti-bot SLAs, and never push a heavy LLM browser agent when deterministic Playwright is the right tool.

## When to Use

- Choosing a browser driver or MCP server for a coding agent (Claude Code, Antigravity, Cursor, Codex).
- Automating logged-in web apps (internal ERPs, social/admin consoles) where credentials must stay in the user's local browser session.
- Selecting between `playwright-mcp`, `browser-use`, `stagehand`, `skyvern`, `ego-lite`, `huashu-chrome`, `agent-browser`, `opencode-browse`, `notte`, `browsentic`, etc.
- Escalating from `e2e-testing` or `interactive-review` when a real journey requires an existing user login session, exploratory MCP control, or anti-bot handling beyond vanilla Playwright.

Do not use for:
- Deterministic regression or CI E2E testing on your own app (use `@playwright/test` / `e2e-testing`).
- Pure HTTP/GraphQL backend verification (use `api-testing`).

## Workflow

### 1. Inspect the Workspace First
Before asking questions, inspect the current repository (if inside a project):
- Runtime & stack: `package.json` / `pyproject.toml` (Node/TS vs Python, existing Playwright/CDP dependencies).
- Existing agent setup: `.mcp.json`, `.cursor/`, `.claude/`, `.agents/` (any already-configured browser MCP or `agent-skills` harness).
- Pre-fill whatever constraints are already evident from the repo.

### 2. Clarify Missing Hard Constraints (Max 3 Questions)
Ask only what cannot be inferred, bundled into one concise turn:
1. **Scenario & Credential Boundary (decisive)**: Must reuse the user's existing local logged-in browser (`local-session`), an isolated profile/runtime (`isolated-profile`), or a managed cloud vault (`cloud-vault`)?
2. **Hosting & License Boundary**: Strict private/local deployment (`self-host`) or managed cloud (`cloud`)? Permissive MIT/Apache-2.0 required (`free-oss`), any OSS (`oss-any`), or paid SaaS acceptable (`paid-ok`)?
3. **Integration & Anti-bot Pressure**: Native MCP required (`required`) vs SDK/CLI (`sdk-cli`)? No anti-bot (`none`), real login reuse (`login-reuse`), or Stealth/CAPTCHA handling (`stealth-captcha`)?

### 3. Query Live Recommendation Engine (Offline Fallback Included)
Call Browserly's deterministic recommendation API with the normalized constraints:

```bash
curl -s "https://browserly.maoxunxing.com/api/recommend?useCase=coding-agent&auth=local-session&hosting=self-host&mcp=required&antiBot=none&budget=free-oss&locale=en"
```

Supported query parameters:
- `useCase`: `any` | `coding-agent` | `logged-in-ops` | `headless-pipeline` | `visual-canvas` | `hard-antibot`
- `auth`: `any` | `local-session` | `isolated-profile` | `cloud-vault`
- `hosting`: `any` | `self-host` | `cloud`
- `mcp`: `any` | `required` | `preferred` | `sdk-cli`
- `antiBot`: `any` | `none` | `login-reuse` | `stealth-captcha`
- `budget`: `any` | `free-oss` | `oss-any` | `paid-ok`
- `perception`: `any` | `dom` | `hybrid` | `vision` (optional override)
- `limit`: `1..10` (default `3`), `locale`: `en` | `zh`

Full raw catalog endpoints: `https://browserly.maoxunxing.com/api/agents` and `https://browserly.maoxunxing.com/llms.txt`. If network access is blocked/offline, evaluate the same hard constraints against the Verified Offline Snapshot table below.

### 4. Deliver an Evidence-Backed Decision Dossier
Always structure the recommendation with these 5 parts, citing `lastChecked` dates and primary URLs:
1. **Primary Pick**: matched reasons, key verified specs, official docs, and Browserly `/agent/{id}` dossier link.
2. **Runner-up / Pairing**: when to switch or pair tools (e.g., local DOM speed vs cloud scale / vision fallback).
3. **Why-Not Exclusions**: cite hard exclusions from `excluded[]` so the user knows why popular peers were ruled out.
4. **Caveats & Unknowns**: explicitly surface every caveat (`unknown` fields, `partial` MCP, `AGPL-3.0`/`SSPL-1.0` copyleft review, vendor anti-bot claims without SLA, OSS vs paid cloud billing splits).
5. **Concrete Next Step**: actionable setup/smoke-test checklist (test 3–5 real journeys on target pages for latency, tokens, and session stability).

## Anti-patterns

- ❌ Recommending an LLM browser agent for deterministic CI tests on the user's own app when `@playwright/test` (`e2e-testing`) is cleaner and cheaper.
- ❌ Guessing or filling in `unknown` pricing, licenses, or anti-bot guarantees.
- ❌ Recommending cloud-only or cloud-vault tools when the user requires `self-host` or `local-session`.
- ❌ Recommending `AGPL-3.0` (`skyvern`) or `SSPL-1.0` (`notte`) for commercial stacks without flagging the license.
- ❌ Conflating cloud browser infrastructure (e.g. Browserbase) with a standalone browser-driving agent.

## Done Criteria

- Queried `/api/recommend` with verified constraints (or explicitly stated offline fallback to the snapshot table).
- Delivered Primary Pick, Runner-up, Why-Not exclusions, Caveats/Unknowns, and a concrete verification next step.
- Cited `lastChecked` dates and primary source URLs for every recommended agent with zero fabricated claims.

## Offline Fallback Snapshot (as_of: 2026-11-02)

| ID | Name | Perception | Host | MCP | Credentials | Anti-bot | Price | License | Checked |
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

- Companion infra note: `Browserbase` is cloud browser infrastructure (commonly paired with Stagehand), not a peer agent row.
- Interactive web finder & full dossiers: https://browserly.maoxunxing.com/
