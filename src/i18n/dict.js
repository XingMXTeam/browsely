export const BRAND_NAME = "Browserly";
export const SUBMIT_URL = `mailto:xunxing1989@gmail.com?subject=${encodeURIComponent(`${BRAND_NAME} 收录提交`)}`;
export const LOCALE_COOKIE = "bb-locale";

export const DICT = {
  en: {
    meta: {
      title: "Browserly — Browser-driving AI Agents Matrix",
      description:
        "Live matrix of browser-driving AI agents and frameworks, with verification dates. Not a cloud-browser hourly pricing board."
    },
    nav: {
      matrix: "Matrix",
      skill: "Skill",
      method: "Method",
      sponsor: "Sponsor"
    },
    locale: {
      label: "Language",
      zh: "中文",
      en: "English"
    },
    home: {
      eyebrow: "First-party verified · Updated {date}",
      title: "Browser-driving agents",
      subtitle:
        "Every perception pipeline, MCP server, credential vault, anti-bot claim, and pricing figure read from primary docs and dated — never guessed.",
      changelog: "Changelog",
      empty: "No agents match those filters.",
      emptyHint: "Try clearing one or more filters or search terms.",
      search: "Search",
      searchLabel: "Search agents",
      searchPlaceholder: "Search agents, vendors, licenses…",
      comparison: "Agent comparison",
      open: "Has unknowns",
      hasDemo: "Has official demo",
      evidence: "{name} evidence",
      expand: "Expand {name}",
      cards: "Cards",
      table: "Table",
      filters: "Filters",
      clear: "Clear",
      clearAll: "Clear all",
      sortLabel: "Sort",
      curatedSort: "Curated",
      nameSort: "Name",
      checkedSort: "Last checked",
      details: "Full dossier",
      shortDetails: "Details",
      browse: "Browse matrix",
      findAgent: "30s Web Finder",
      compareTop: "Compare top 4",
      submit: "Submit a browser agent",
      quickCopy: {
        modePrompt: "Send to any AI",
        modeCli: "Install Skill (CLI)",
        hintPrompt: "Paste into Claude, ChatGPT, Antigravity, Cursor, or Codex — interactive Q&A selection in 30s.",
        hintCli: "Install momo-browserly-advisor skill into Antigravity, Claude Code, Codex, or Cursor.",
        promptText:
          "Help me pick the right browser-driving AI agent: read https://browserly.maoxunxing.com/SKILL.md (rules + 17 first-party verified tools), ask me 2-3 quick interactive questions about my login session, hosting, MCP, license, and anti-bot needs, then query https://browserly.maoxunxing.com/api/recommend and give me a Primary Pick, Runner-up, Why-Not exclusions, and honest caveats.",
        cliText: "npx skills add XingMXTeam/browsely",
        copyBtn: "Copy",
        copiedBtn: "Copied!",
        copiedToast: "Copied! Paste it into your AI assistant to start."
      },
      showing: "{shown} of {total} agents",
      stats: {
        agents: "Verified agents",
        demos: "Official demos",
        dimensions: "Spec dimensions",
        dated: "Last pass"
      },
      presets: {
        label: "Quick views",
        all: "All agents",
        localFree: "Local & Free",
        mcpReady: "MCP Ready",
        cloudStealth: "Cloud & Stealth",
        hasDemo: "Has Demo",
        hybrid: "Hybrid Perception",
        needsCheck: "Needs Verification"
      }
    },
    columns: {
      agent: "Agent",
      perception: "Perception",
      license: "License",
      host: "Host",
      mcp: "MCP",
      credentials: "Credentials",
      antiBot: "Anti-bot",
      price: "Price",
      checked: "Checked"
    },
    filters: {
      perception: "Perception",
      hosting: "Hosting",
      mcp: "MCP",
      credentials: "Credentials",
      extras: "Status"
    },
    compare: {
      add: "Compare",
      added: "Comparing",
      dockCount: "{count}/4 selected",
      dockHint: "Select up to 4 agents to compare side by side",
      open: "Compare ({count})",
      clear: "Clear",
      title: "Side-by-side comparison",
      subtitle: "Verified first-party specifications and pricing",
      attribute: "Attribute",
      close: "Close comparison",
      limitReached: "You can compare up to 4 agents at once.",
      remove: "Remove {name}",
      watchDemo: "Watch demo"
    },
    motion: {
      docs: "Docs",
      source: "Source",
      play: "Play the official demo for {name}",
      close: "Close",
      start: "Play {name}",
      noVideo: "No official demo video published — showing verified visual reference."
    },
    apiBand: {
      badge: "Agent Skill & Recommendation API",
      title: "Built for humans. Installable by AI coding agents.",
      desc: "Copy a 1-line prompt to any AI assistant, install momo-browserly-advisor via CLI, or call /api/recommend directly.",
      jsonLabel: "JSON Catalog",
      llmsLabel: "LLM Index",
      openSkill: "Skill Guide",
      openFinder: "30s Web Finder",
      openJson: "Open /api/agents",
      openLlms: "Open /llms.txt",
      tabSkill: "Agent Skill",
      tabRecommend: "Recommend API",
      tabCatalog: "JSON & llms.txt",
      copy: "Copy",
      copied: "Copied"
    },
    advisor: {
      badge: "Browserly Advisor",
      title: "Find your browser agent in 30 seconds",
      subtitle: "Pick your engineering constraints — scored deterministically against first-party verified docs, with honest caveats and why-not exclusions.",
      close: "Close finder",
      reset: "Reset",
      comparePicks: "Compare top picks",
      copyForAi: "Copy for AI Agent",
      copiedForAi: "Copied! Paste into your AI assistant to continue setup.",
      copyApi: "Copy API URL",
      copied: "Copied",
      loading: "Scoring 17 verified agents…",
      error: "Could not reach /api/recommend. Try again.",
      matchedMeta: "{matched} matched · {excluded} ruled out",
      scoreLabel: "Match",
      whyMatched: "Why it fits",
      caveats: "Honest caveats",
      excludedTitle: "Why other agents were ruled out",
      adviceTitle: "Architecture & rollout notes",
      openDossier: "Full dossier",
      docs: "Docs",
      emptyTitle: "No single agent satisfies every hard constraint",
      emptyHint: "Relax one constraint below to unlock verified candidates:",
      relaxAxis: "Relax {axis} ({count})",
      tiers: {
        primary: "Primary Pick",
        "runner-up": "Runner-up",
        alternative: "Alternative"
      },
      axes: {
        useCase: "1. Primary Scenario",
        auth: "2. Credential & Session Boundary",
        hosting: "3. Hosting & Compliance",
        mcp: "4. MCP / Integration",
        antiBot: "5. Anti-bot & Login Wall",
        budget: "6. Budget & License"
      },
      opts: {
        useCase: {
          "coding-agent": "Coding Agent / MCP",
          "logged-in-ops": "Logged-in Ops",
          "headless-pipeline": "Headless Pipeline",
          "visual-canvas": "Visual / Canvas UI",
          "hard-antibot": "Hard Anti-bot",
          any: "Any"
        },
        auth: {
          any: "Any",
          "local-session": "Local Session",
          "isolated-profile": "Isolated Profile",
          "cloud-vault": "Cloud Vault"
        },
        hosting: {
          any: "Any",
          "self-host": "Self-host Only",
          cloud: "Managed Cloud"
        },
        mcp: {
          any: "Any",
          required: "MCP Required",
          preferred: "MCP Preferred",
          "sdk-cli": "SDK / CLI"
        },
        antiBot: {
          any: "Any",
          none: "Own App / None",
          "login-reuse": "Real Login Reuse",
          "stealth-captcha": "Stealth / CAPTCHA"
        },
        budget: {
          any: "Any",
          "free-oss": "Free MIT / Apache",
          "oss-any": "Any OSS",
          "paid-ok": "Paid SaaS OK"
        }
      }
    },
    contact: {
      wechatId: "WeChat: maoxunxing",
      wechatOa: "WeChat official account: 毛毛星 — search to follow",
      copyId: "Copy ID",
      copied: "Copied!"
    },
    footer: {
      docs: "Public docs only. Prices we could not verify stay marked unknown.",
      tag: "A live index of browser-driving AI agents. {count} agents checked entry by entry — perception, hosting, MCP and credential models — each with a verification date.",
      built: "Built from public docs only. Prices and capabilities we could not verify stay marked unknown.",
      explore: "Explore",
      all: "All agents",
      popular: "Popular agents",
      contribute: "Contribute",
      submit: "Submit a browser agent",
      sponsorship: "Sponsorship",
      coverage: "Coverage",
      rights: "Checked entry by entry · Source dates on everything",
      top: "Back to top",
      copy: "© 2026 Browserly"
    },
    about: {
      title: "Method",
      description:
        "How Browserly sources the agent matrix, what it leaves out, and what the numbers do not promise.",
      lead: "Browserly compares tools whose job is to let a model drive a browser. Each row keeps the date its sources were read. The latest pass is",
      legendTitle: "Reading the matrix badges",
      legendDesc: "Every color and border carries a strict epistemic meaning.",
      legendItems: [
        { kind: "good", label: "Verified / Open", desc: "First-party confirmed support (e.g. MCP Yes, Free, MIT / Apache-2.0)." },
        { kind: "warn", label: "Partial / Metered", desc: "Experimental adapter, hybrid pipeline, or usage/credit-billed plan." },
        { kind: "info", label: "Architecture", desc: "Perception mode (DOM / Vision) or deployment topology (Cloud)." },
        { kind: "unknown", label: "Unknown (Dashed)", desc: "Not verified from public docs yet. Never a guess and never a no." }
      ],
      cellTitle: "How a cell gets filled",
      cellFile: "The file is data/browseboard-seed.json.",
      policy: "All fields gathered from public docs/repos only. Prefer unknown over guessing. Prices and capabilities may change; re-check sources before publishing.",
      unknown: "A missing or conflicting public page stays unknown. Prices are the figures on the linked pages, not estimates. Skyvern's billing table is the plan source when the FAQ wording drifts.",
      mcp: "MCP marked partial is not a yes. Stagehand's in-repo adapter is experimental, and OpenAI Computer Use is a Responses API tool set rather than a Playwright-style MCP server.",
      offTitle: "What stays off the board",
      offDesc: "Cloud browsers sold by the hour are infrastructure, not peers.",
      changelogTitle: "Verification changelog",
      changelogDesc: "Dated passes recorded in the seed manifest.",
      disclaimerTitle: "Disclaimer",
      disclaimer1: "This is a reading aid, not legal, security, or purchasing advice. AGPL, SSPL, credential vaults, and anti-bot claims need your own review. Vendor stealth scores are vendor benches, cited as claims.",
      disclaimer2: "Browserly does not run these agents and does not rank them. Re-fetch the pricing pages before you treat a number as current.",
      coverageTitle: "Coverage"
    },
    detail: {
      breadcrumbMatrix: "Matrix",
      verdict: "Summary & breakdown",
      editorialBadge: "Verified Dossier",
      pricing: "Pricing",
      hosting: "Hosting",
      selfHost: "Self-host",
      cloud: "Cloud",
      both: "Self-host + cloud",
      status: "Status",
      active: "Active",
      checked: "Last checked",
      specsTitle: "Verified specs",
      sources: "Official sources",
      unknownsTitle: "Open questions",
      more: "More browser agents",
      prev: "Previous",
      next: "Next",
      visit: "Visit website",
      github: "GitHub",
      docs: "Docs",
      share: "Copy link",
      copied: "Link copied",
      line: "Browserly · Data comes from official first-party sources, each row dated. Pricing and capabilities per the official site.",
      credential: {
        user: "Your own browser session",
        runtime: "Agent runtime vault",
        vault: "Cloud vault",
        both: "Browser session + runtime",
        app: "App-owned account",
        profile: "Browser profile",
        unknown: "Unknown"
      }
    },
    sponsor: {
      title: "Sponsor",
      description: "A sponsor slot is not open.",
      body: "A sponsor slot is not open.",
      promiseTitle: "Editorial independence",
      promiseBody:
        "Browserly keeps every row dated and grounded in first-party documentation. Sponsored placements will never alter verification status, badge semantics, or capability notes.",
      contactTitle: "Get in touch",
      contactBody: "To suggest a correction, submit a browser-driving agent, or reach the maintainer directly:"
    },
    skillPage: {
      title: "Agent Skill & API Docs",
      description: "Let any AI assistant interactively select the right browser-driving agent using Browserly's verified catalog and /api/recommend engine.",
      badge: "momo-browserly-advisor",
      lead: "Copy one prompt to any AI assistant — or install the skill into your coding agent. It inspects your workspace, asks 2–3 sharp questions, and recommends the right stack with verified caveats and why-not exclusions.",
      tryFinder: "Open 30s Web Finder",
      waysTitle: "Two ways to start in 10 seconds",
      way1Badge: "Recommended · Zero Setup",
      way1Title: "Copy & paste to any AI assistant",
      way1Desc: "Works with ChatGPT, Claude, Antigravity, Cursor, Codex, DeepSeek, or any assistant that can read URLs.",
      way2Badge: "Persistent Install",
      way2Title: "Install into your Coding Agent",
      way2Desc: "Adds skills/momo-browserly-advisor directly so your coding agent auto-triggers it whenever you pick a browser stack.",
      demoTitle: "What actually happens after you paste it",
      demoDesc: "Instead of dumping a static table, your AI walks you through a fast interactive decision loop:",
      demoSteps: [
        { role: "You", text: "Paste the 1-line Browserly prompt into your AI assistant." },
        { role: "Your AI", text: "Checks package.json / .mcp.json, then asks: Do you need to reuse your local logged-in Chrome? Strict self-host & MIT/Apache-2.0? Facing Cloudflare/CAPTCHA?" },
        { role: "Your AI → Browserly API", text: "Calls /api/recommend with your exact constraints → returns #1 Playwright MCP (99%), #2 huashu-chrome (97%), rules out Skyvern (AGPL-3.0) & cloud-only tools, and flags honest caveats." }
      ],
      rawTitle: "Raw Skill & Machine-Readable Endpoints",
      rawDesc: "All underlying markdown playbooks and JSON endpoints stay live, CORS-enabled, and auto-synced with every verification pass.",
      openRaw: "Open"
    },
    notFound: {
      code: "404",
      title: "Page not found",
      body: "That agent dossier or route does not exist in the current verified index.",
      back: "Back to Browserly matrix"
    }
  },
  zh: {
    meta: {
      title: "Browserly — 驱动浏览器的 AI 智能体矩阵",
      description: "浏览器驱动型智能体和框架的对照表，每行带核对日期。不是云浏览器的小时价格表。"
    },
    nav: {
      matrix: "矩阵",
      skill: "Skill",
      method: "方法",
      sponsor: "赞助"
    },
    locale: {
      label: "语言",
      zh: "中文",
      en: "English"
    },
    home: {
      eyebrow: "一手文档核对 · 最近更新 {date}",
      title: "驱动浏览器的智能体",
      subtitle: "每一项感知路径、MCP 接入、凭据隔离、反爬宣称与定价口径均来自官方一手文档并标注核对日期，拒绝猜测。",
      changelog: "更新记录",
      empty: "没有符合条件的智能体",
      emptyHint: "试试减少筛选条件或清空搜索关键词。",
      search: "搜索",
      searchLabel: "搜索工具",
      searchPlaceholder: "搜索工具、厂商、许可证…",
      comparison: "工具对照表",
      open: "存在存疑项",
      hasDemo: "有官方演示",
      evidence: "{name} 的依据",
      expand: "展开 {name}",
      cards: "卡片",
      table: "表格",
      filters: "筛选",
      clear: "清除",
      clearAll: "清空全部",
      sortLabel: "排序",
      curatedSort: "推荐序",
      nameSort: "名称",
      checkedSort: "最近核对",
      details: "查看详情页",
      shortDetails: "详情",
      browse: "浏览全部矩阵",
      findAgent: "30 秒网页选型",
      compareTop: "对比前 4 项",
      submit: "提交浏览器智能体",
      quickCopy: {
        modePrompt: "发给任意 AI 选型",
        modeCli: "安装 Skill (CLI)",
        hintPrompt: "复制粘贴给你的通用智能体（Claude / ChatGPT / Antigravity / Cursor / DeepSeek 等），30 秒对话完成选型。",
        hintCli: "一键将 momo-browserly-advisor 安装进 Antigravity / Claude Code / Codex / Cursor。",
        promptText:
          "请帮我选一个最合适的浏览器 AI 智能体：先阅读 https://browserly.maoxunxing.com/SKILL.zh-CN.md 里的选型规则与 17 个一手核验方案，再用 2-3 个简短交互问题确认我的需求（是否复用本机登录态、是否必须私有化/宽松开源、是否需要 MCP 和反爬），最后调用 https://browserly.maoxunxing.com/api/recommend 给出首选、备选、排除理由与避坑提醒。",
        cliText: "npx skills add XingMXTeam/browsely",
        copyBtn: "一键复制",
        copiedBtn: "已复制",
        copiedToast: "已复制！直接粘贴发给你的 AI 助手即可开始选型。"
      },
      showing: "当前显示 {shown} / {total} 个工具",
      stats: {
        agents: "已核对工具",
        demos: "官方演示",
        dimensions: "对比维度",
        dated: "最近核对"
      },
      presets: {
        label: "快速视图",
        all: "全部工具",
        localFree: "本地免费",
        mcpReady: "原生 MCP",
        cloudStealth: "云端与隐身",
        hasDemo: "含官方视频",
        hybrid: "混合感知",
        needsCheck: "含未知项"
      }
    },
    columns: {
      agent: "工具",
      perception: "感知",
      license: "许可",
      host: "托管",
      mcp: "MCP",
      credentials: "凭据",
      antiBot: "反爬",
      price: "价格",
      checked: "核对日期"
    },
    filters: {
      perception: "感知",
      hosting: "托管",
      mcp: "MCP",
      credentials: "凭据",
      extras: "附加条件"
    },
    compare: {
      add: "对比",
      added: "已选",
      dockCount: "已选 {count}/4",
      dockHint: "最多选择 4 个工具进行并排对比",
      open: "并排对比 ({count})",
      clear: "清空",
      title: "并排规格对比",
      subtitle: "基于官方一手文档核对的关键字段与定价",
      attribute: "维度",
      close: "关闭对比",
      limitReached: "最多同时对比 4 个智能体。",
      remove: "移除 {name}",
      watchDemo: "观看演示"
    },
    motion: {
      docs: "文档",
      source: "来源",
      play: "播放 {name} 的官方演示",
      close: "关闭",
      start: "播放 {name}",
      noVideo: "官方暂未提供演示视频，当前展示已核对的架构或图标。"
    },
    apiBand: {
      badge: "Agent Skill 与智能选型接口",
      title: "人可直接选型，AI 编程助手可一键装成 Skill。",
      desc: "复制一条提示词发给任意 AI 助手、通过 CLI 一键安装 momo-browserly-advisor，或直接调用 /api/recommend 与 /llms.txt。",
      jsonLabel: "JSON 目录",
      llmsLabel: "LLM 索引",
      openSkill: "查看 Skill 指南",
      openFinder: "30 秒网页选型",
      openJson: "打开 /api/agents",
      openLlms: "打开 /llms.txt",
      tabSkill: "安装 Skill",
      tabRecommend: "选型 API",
      tabCatalog: "JSON 与 llms.txt",
      copy: "复制",
      copied: "已复制"
    },
    advisor: {
      badge: "Browserly 选型顾问",
      title: "30 秒找到最匹配的浏览器智能体",
      subtitle: "按真实工程约束勾选条件，基于官方一手核验数据实时打分，并明确展示排除依据与避坑提示。",
      close: "关闭选型顾问",
      reset: "重置条件",
      comparePicks: "并排对比推荐方案",
      copyForAi: "复制给 AI 继续落地",
      copiedForAi: "已复制！直接粘贴发给你的 AI 助手即可按此条件配置。",
      copyApi: "复制 API 链接",
      copied: "已复制",
      loading: "正在匹配 17 个已核验方案…",
      error: "请求 /api/recommend 失败，请重试。",
      matchedMeta: "匹配 {matched} 项 · 排除 {excluded} 项",
      scoreLabel: "匹配度",
      whyMatched: "推荐依据",
      caveats: "风险与存疑提醒",
      excludedTitle: "为什么排除了其他热门方案",
      adviceTitle: "架构与落地建议",
      openDossier: "查看完整档案",
      docs: "官方文档",
      emptyTitle: "没有单一方案同时满足全部硬约束",
      emptyHint: "点击下方任一按钮放宽单个约束，立即解锁候选方案：",
      relaxAxis: "放宽「{axis}」({count} 项)",
      tiers: {
        primary: "首选方案",
        "runner-up": "备选方案",
        alternative: "差异化候选"
      },
      axes: {
        useCase: "1. 核心场景",
        auth: "2. 登录与凭证边界",
        hosting: "3. 部署与合规",
        mcp: "4. MCP / 接入形态",
        antiBot: "5. 风控与登录墙",
        budget: "6. 预算与开源协议"
      },
      opts: {
        useCase: {
          "coding-agent": "编程 Agent / MCP",
          "logged-in-ops": "复用本机登录态",
          "headless-pipeline": "无人值守批处理",
          "visual-canvas": "复杂视觉 / Canvas",
          "hard-antibot": "强风控 / 验证码",
          any: "不限"
        },
        auth: {
          any: "不限",
          "local-session": "本机已登录会话",
          "isolated-profile": "独立 Profile / 运行时",
          "cloud-vault": "云端密钥库"
        },
        hosting: {
          any: "不限",
          "self-host": "仅本机 / 私有化",
          cloud: "官方云托管"
        },
        mcp: {
          any: "不限",
          required: "必须原生 MCP",
          preferred: "有 MCP 加分",
          "sdk-cli": "代码 SDK / CLI"
        },
        antiBot: {
          any: "不限",
          none: "自家站点 / 无风控",
          "login-reuse": "本机真实登录绕过",
          "stealth-captcha": "隐身指纹 / 验证码"
        },
        budget: {
          any: "不限",
          "free-oss": "免费 MIT / Apache",
          "oss-any": "开源即可（含 AGPL）",
          "paid-ok": "接受按量 / 订阅"
        }
      }
    },
    contact: {
      wechatId: "微信号：maoxunxing",
      wechatOa: "公众号「毛毛星」，微信搜索关注",
      copyId: "复制微信号",
      copied: "已复制"
    },
    footer: {
      docs: "只依据公开文档。没核对上的价格标成未知。",
      tag: "浏览器驱动型智能体的实时索引。已逐条核对 {count} 个：感知、托管、MCP 和凭据模型，每条都有核对日期。",
      built: "只依据公开文档整理。没核对上的价格和能力标成未知。",
      explore: "探索",
      all: "全部智能体",
      popular: "常用智能体",
      contribute: "参与",
      submit: "提交浏览器智能体",
      sponsorship: "赞助",
      coverage: "覆盖范围",
      rights: "逐条核对 · 每条都标来源日期",
      top: "回到顶部",
      copy: "© 2026 Browserly"
    },
    about: {
      title: "方法",
      description: "Browserly 如何为对照表取证、故意不收录什么，以及这些数字不承诺什么。",
      lead: "Browserly 比较的是让模型去驱动浏览器的工具。每一行都留着来源读到的日期。最近一次核对是",
      legendTitle: "徽章与认知边界说明",
      legendDesc: "每一种徽章样式都对应明确的核对状态。",
      legendItems: [
        { kind: "good", label: "已核实 / 开放", desc: "官方文档明确支持（如 MCP 有、免费、MIT / Apache-2.0）。" },
        { kind: "warn", label: "部分 / 混合 / 计费", desc: "实验性适配器、混合感知路线或按量/积分收费。" },
        { kind: "info", label: "架构属性", desc: "纯 DOM、纯视觉或云端托管形态。" },
        { kind: "unknown", label: "未知（虚线框）", desc: "公开文档尚未写明或互相冲突，不代表“无”，也不替厂商猜测。" }
      ],
      cellTitle: "一格是怎么填上的",
      cellFile: "数据在 data/browseboard-seed.json。",
      policy: "字段只从公开文档和仓库整理。宁可标未知，也不猜测。价格和能力会变，发表前请再核对来源。",
      unknown: "公开页面没写，或两份官方页面互相矛盾，就标未知。价格是链接页面上的数字，不是估算。Skyvern 的方案以账单表为准，FAQ 用词漂移时不跟着改。",
      mcp: "MCP 标成「部分」不是「有」。Stagehand 仓库里的适配器仍是实验性质。OpenAI Computer Use 是 Responses API 的一组工具，不是 Playwright 那种 MCP 服务器。",
      offTitle: "不放进这张表的",
      offDesc: "按小时卖的云浏览器是基础设施，不是同行。",
      changelogTitle: "核对与收录记录",
      changelogDesc: "种子数据中记录的历次公开文档盘点。",
      disclaimerTitle: "声明",
      disclaimer1: "这是阅读辅助，不是法律、安全或采购建议。AGPL、SSPL、凭据库和反爬说法需要你自己再看。厂商的隐身分数是厂商自己的测试，这里只当作他们的声称来引用。",
      disclaimer2: "Browserly 不运行这些工具，也不给它们排名。把数字当成现价之前，请重新打开价格页。",
      coverageTitle: "覆盖范围"
    },
    detail: {
      breadcrumbMatrix: "矩阵",
      verdict: "结论与深度拆解",
      editorialBadge: "逐条核对档案",
      pricing: "价格",
      hosting: "托管",
      selfHost: "本机",
      cloud: "云端",
      both: "本机 + 云端",
      status: "状态",
      active: "活跃",
      checked: "最近核对",
      specsTitle: "核心规格",
      sources: "官方来源",
      unknownsTitle: "待核实说明",
      more: "更多浏览器智能体",
      prev: "上一个",
      next: "下一个",
      visit: "访问官网",
      github: "GitHub",
      docs: "文档",
      share: "复制链接",
      copied: "已复制链接",
      line: "Browserly · 数据来自官方一手来源，每行都标日期。价格和能力以官网为准。",
      credential: {
        user: "你自己的浏览器会话",
        runtime: "运行时保险库",
        vault: "云端保险库",
        both: "浏览器会话 + 运行时",
        app: "应用自有账号",
        profile: "浏览器资料",
        unknown: "未知"
      }
    },
    sponsor: {
      title: "赞助",
      description: "赞助位没有开放。",
      body: "赞助位没有开放。",
      promiseTitle: "编辑独立性原则",
      promiseBody: "Browserly 坚持所有数据来自公开一手文档并标注核对日期。任何商业合作均不会影响收录标准、徽章判定或结论陈述。",
      contactTitle: "联系维护者",
      contactBody: "欢迎纠错、提交新的浏览器驱动型智能体或交流产品动态："
    },
    skillPage: {
      title: "Agent Skill 与选型文档",
      description: "复制一条指令发给任意 AI 助手，或安装 momo-browserly-advisor Skill，通过 2~3 轮对话基于 Browserly 一手数据完成浏览器智能体选型。",
      badge: "momo-browserly-advisor",
      lead: "不想自己翻对照表？复制下面任意一条发给你的 AI 助手——它会先看你的项目环境、追问 2~3 个硬约束，再调用 Browserly 实时引擎给出首选、备选、排除原因与避坑提醒。",
      tryFinder: "打开 30 秒网页选型",
      waysTitle: "两种方式，10 秒用起来",
      way1Badge: "推荐 · 零安装",
      way1Title: "直接复制，发给任意通用 AI 助手",
      way1Desc: "适用于 Claude、ChatGPT、Antigravity、Cursor、Codex、DeepSeek 等所有支持联网或读文档的助手。",
      way2Badge: "持久集成",
      way2Title: "一行命令安装成编程助手 Skill",
      way2Desc: "自动安装 skills/momo-browserly-advisor，后续只要在项目里讨论浏览器自动化或 MCP 选型就会自动触发。",
      demoTitle: "粘贴给 AI 之后会发生什么？",
      demoDesc: "它不是给你甩一张静态表，而是走完一轮真正的交互式架构诊断：",
      demoSteps: [
        { role: "你", text: "粘贴刚才复制的一行 Browserly 选型指令给 AI 助手。" },
        { role: "你的 AI", text: "自动读取项目 package.json / .mcp.json，再简短追问：需要复用本机已登录的 Chrome 吗？必须私有化且 MIT/Apache-2.0 吗？目标站有 Cloudflare 或验证码吗？" },
        { role: "AI → Browserly 接口", text: "按你的回答实时调用 /api/recommend → 返回 #1 Playwright MCP (99%)、#2 huashu-chrome (97%)，明确排除 AGPL 协议与纯云端方案，并附核对日期与避坑清单。" }
      ],
      rawTitle: "原始 Skill 文档与机器可读端点",
      rawDesc: "所有底层 Markdown 规范与 JSON 接口长期在线、支持 CORS，并随每次数据核对自动同步。",
      openRaw: "打开"
    },
    notFound: {
      code: "404",
      title: "页面不存在",
      body: "当前已核对索引中未找到该智能体档案或路由。",
      back: "返回 Browserly 矩阵"
    }
  }
};

const LABELS = {
  perception: {
    en: { dom: "DOM", vision: "Vision", hybrid: "Hybrid", unknown: "Unknown" },
    zh: { dom: "DOM", vision: "视觉", hybrid: "混合", unknown: "未知" }
  },
  hosting: {
    en: { "self-host": "Self-host", cloud: "Cloud", both: "Both" },
    zh: { "self-host": "本机", cloud: "云端", both: "两边" }
  },
  mcp: {
    en: { yes: "Yes", partial: "Partial", no: "No", unknown: "Unknown" },
    zh: { yes: "有", partial: "部分", no: "无", unknown: "未知" }
  },
  auth: {
    en: {
      user_browser: "User",
      agent_runtime: "Runtime",
      cloud_vault: "Vault",
      both_user_browser_and_runtime: "Both",
      app_owned: "App-owned",
      browser_profile: "Profiles",
      unknown: "Unknown"
    },
    zh: {
      user_browser: "用户",
      agent_runtime: "运行时",
      cloud_vault: "保险库",
      both_user_browser_and_runtime: "两边",
      app_owned: "应用",
      browser_profile: "配置",
      unknown: "未知"
    }
  },
  license: {
    en: { proprietary: "Proprietary", proprietary_api_mit_sample: "API + MIT", unknown: "Unknown" },
    zh: { proprietary: "专有", proprietary_api_mit_sample: "API + MIT", unknown: "未知" }
  }
};

export function perceptionLabel(locale, value) {
  return LABELS.perception[locale]?.[value] ?? value;
}

export function hostingLabel(locale, value) {
  return LABELS.hosting[locale]?.[value] ?? value;
}

export function mcpLabel(locale, value) {
  return LABELS.mcp[locale]?.[value] ?? value;
}

export function authLabel(locale, value) {
  return LABELS.auth[locale]?.[value] ?? value;
}

export function licenseLabel(locale, value) {
  return LABELS.license[locale]?.[value] ?? value;
}

export function isUncertain(field, value) {
  if (field === "perception" || field === "license") return value === "unknown";
  if (field === "mcp") return value === "partial" || value === "unknown";
  if (field === "auth") return value === "unknown";
  if (field === "pricing") return /unknown|未知/i.test(String(value));
  return value === "Unknown" || value === "Partial";
}

export function badgeTone(field, value) {
  if (isUncertain(field, value)) {
    return field === "mcp" && value === "partial" ? "warn" : "unknown";
  }
  if (field === "mcp") {
    return value === "yes" ? "good" : "neutral";
  }
  if (field === "perception") {
    if (value === "hybrid") return "warn";
    if (value === "vision" || value === "dom") return "info";
    return "unknown";
  }
  if (field === "hosting") {
    return value === "cloud" ? "info" : value === "both" ? "good" : "neutral";
  }
  if (field === "pricing") {
    if (value === "Free" || value === "OSS") return "good";
    if (value === "Usage" || value === "Tokens" || /^\$/.test(value)) return "warn";
    return "neutral";
  }
  if (field === "license") {
    if (value === "MIT" || value === "Apache-2.0") return "good";
    if (value === "AGPL-3.0" || value === "SSPL-1.0") return "warn";
    return "neutral";
  }
  if (field === "antiBot") {
    if (value === "Stealth" || value === "CAPTCHA") return "info";
    return "neutral";
  }
  return "neutral";
}

export function formatTemplate(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ""));
}
