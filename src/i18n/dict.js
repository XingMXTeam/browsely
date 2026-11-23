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
      browse: "Browse agents",
      compareTop: "Compare top 4",
      submit: "Submit a browser agent",
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
      badge: "Machine-Readable Catalog",
      title: "Built for humans. Structured for AI coding agents.",
      desc: "Fetch the exact verified dataset as clean JSON or point your coding assistant directly at /llms.txt.",
      jsonLabel: "JSON Catalog",
      llmsLabel: "LLM Index",
      openJson: "Open /api/agents",
      openLlms: "Open /llms.txt",
      copy: "Copy URL",
      copied: "Copied"
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
      browse: "浏览智能体",
      compareTop: "对比前 4 项",
      submit: "提交浏览器智能体",
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
      badge: "面向人与 Agent 的结构化目录",
      title: "既服务研究者，也原生适配编程智能体。",
      desc: "直接拉取干净的 JSON 目录，或将 /llms.txt 接入你的编程助手上下文。",
      jsonLabel: "JSON 目录",
      llmsLabel: "LLM 索引",
      openJson: "打开 /api/agents",
      openLlms: "打开 /llms.txt",
      copy: "复制链接",
      copied: "已复制"
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
