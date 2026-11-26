import {
  BRAND_NAME,
  DICT,
  SUBMIT_URL,
  authLabel,
  badgeTone,
  formatTemplate,
  hostingLabel,
  isUncertain,
  licenseLabel,
  mcpLabel,
  perceptionLabel
} from "../i18n/dict.js";
import {
  getAgentStoriesPayload,
  getAgentStory,
  getCatalogStats,
  getCredentialKey
} from "../data/catalog.js";
import {
  esc,
  renderAgentCard,
  renderBadge,
  renderDetailFooter,
  renderDocument,
  renderHeader,
  renderHomeFooter,
  renderSimpleFooter,
  renderWeChatBlock
} from "./components.js";
import {
  iconArrowRight,
  iconCheck,
  iconChevronDown,
  iconChevronRight,
  iconClose,
  iconCopy,
  iconExternal,
  iconSparkles
} from "./icons.js";

function renderMarqueeRow(agents, reverse = false) {
  if (!agents.length) return "";
  const half = [];
  while (half.length < 16) half.push(...agents);
  const items = [...half, ...half];
  return `<ul class="bb-wall${reverse ? " bb-rev" : ""}">
    ${items
      .map((a, idx) => {
        const clone = idx >= agents.length;
        return `<li${clone ? ' aria-hidden="true"' : ""}>
          <button type="button" class="marquee-tile" style="background:${esc(a.pastel)}" data-focus-agent="${esc(a.id)}"${clone ? ' tabindex="-1"' : ` aria-label="${esc(a.name)}"`}>
            <span class="marquee-tip">${esc(a.name)} · ${esc(a.pricingBadge)}</span>
            <img src="${esc(a.logo)}" alt="">
          </button>
        </li>`;
      })
      .join("")}
  </ul>`;
}

function renderFilterGroup(groupKey, legendText, options) {
  return `<fieldset class="filter-group">
    <legend class="filter-legend" data-i18n="filters.${esc(groupKey)}">${esc(legendText)}</legend>
    <div>
      ${options
        .map(
          (opt) => `<label class="filter-option${opt.count === 0 ? " is-disabled" : ""}">
            <input type="checkbox" class="filter-checkbox" data-filter-group="${esc(groupKey)}" value="${esc(opt.value)}">
            <span class="custom-check" aria-hidden="true">${iconCheck()}</span>
            <span class="filter-label">${esc(opt.label)}</span>
            <span class="filter-count tabular-nums" data-count-for="${esc(groupKey)}:${esc(opt.value)}">${opt.count}</span>
          </label>`
        )
        .join("")}
    </div>
  </fieldset>`;
}

function computePresetCounts(agents) {
  return {
    all: agents.length,
    "local-free": agents.filter((a) => a.hosting !== "cloud" && (a.pricingBadge === "Free" || a.pricingBadge === "OSS")).length,
    mcp: agents.filter((a) => a.mcp === "yes").length,
    "cloud-stealth": agents.filter((a) => a.hosting !== "self-host" && (a.antiBotBadge === "Stealth" || a.antiBotBadge === "CAPTCHA")).length,
    demo: agents.filter((a) => Boolean(a.video)).length,
    hybrid: agents.filter((a) => a.perception === "hybrid").length,
    open: agents.filter((a) => a.unknowns.length > 0).length
  };
}

export function renderHomePage(catalog, locale, dict, assets, initialQuery = "") {
  const { agents, checked, coverage } = catalog;
  const stats = getCatalogStats(agents);
  const presetCounts = computePresetCounts(agents);

  const presets = [
    { id: "all", key: "all", count: presetCounts.all },
    { id: "local-free", key: "localFree", count: presetCounts["local-free"] },
    { id: "mcp", key: "mcpReady", count: presetCounts.mcp },
    { id: "cloud-stealth", key: "cloudStealth", count: presetCounts["cloud-stealth"] },
    { id: "demo", key: "hasDemo", count: presetCounts.demo },
    { id: "hybrid", key: "hybrid", count: presetCounts.hybrid },
    { id: "open", key: "needsCheck", count: presetCounts.open }
  ];

  const perceptionOpts = ["dom", "vision", "hybrid", "unknown"].map((v) => ({
    value: v,
    label: perceptionLabel(locale, v),
    count: agents.filter((a) => a.perception === v).length
  }));
  const hostingOpts = ["self-host", "cloud", "both"].map((v) => ({
    value: v,
    label: hostingLabel(locale, v),
    count: agents.filter((a) => a.hosting === v).length
  }));
  const mcpOpts = ["yes", "partial", "no"].map((v) => ({
    value: v,
    label: mcpLabel(locale, v),
    count: agents.filter((a) => a.mcp === v).length
  }));
  const authOpts = [
    "cloud_vault",
    "user_browser",
    "agent_runtime",
    "app_owned",
    "browser_profile",
    "both_user_browser_and_runtime",
    "unknown"
  ]
    .map((v) => ({
      value: v,
      label: authLabel(locale, v),
      count: agents.filter((a) => a.authModel === v).length
    }))
    .filter((o) => o.count > 0);

  const sampleJson = JSON.stringify(
    {
      id: agents[0].id,
      name: agents[0].name,
      vendor: agents[0].steward,
      perception: agents[0].perception,
      host: agents[0].hosting,
      mcp: agents[0].mcp,
      lastChecked: agents[0].lastChecked,
      detail: `/agent/${agents[0].id}`
    },
    null,
    2
  );

  const sampleLlms = [
    "# Browserly",
    "> Comparison matrix of browser-driving agents.",
    "- /api/recommend : Deterministic selector API",
    "- /SKILL.md      : Installable Agent Skill",
    "- /api/agents    : JSON catalog (17 rows)"
  ].join("\n");

  const sampleSkillInstall = [
    "# Antigravity / Claude Code / Codex / Cursor",
    "npx skills add XingMXTeam/browsely",
    "",
    "# Or fetch directly via URL",
    "curl -fsSL https://browserly.maoxunxing.com/SKILL.md"
  ].join("\n");

  const sampleSkillPreview = [
    "---",
    "name: momo-browserly-advisor",
    "---",
    "1. Inspect repo (.mcp.json, Playwright, stack)",
    "2. Clarify auth / hosting / MCP / license",
    "3. Query /api/recommend (offline snapshot fallback)",
    "4. Output Primary Pick + Why-Not + Caveats"
  ].join("\n");

  const sampleRecommendCmd = [
    "curl -s \"https://browserly.maoxunxing.com/api/recommend\\",
    "?useCase=coding-agent&auth=local-session\\",
    "&hosting=self-host&mcp=required&budget=free-oss\""
  ].join("\n");

  const sampleRecommendOut = [
    "{",
    "  \"matchedCount\": 7, \"excludedCount\": 10,",
    "  \"picks\": [",
    "    { \"rank\": 1, \"id\": \"playwright-mcp\", \"score\": 99 },",
    "    { \"rank\": 2, \"id\": \"agent-browser\",  \"score\": 98 }",
    "  ],",
    "  \"excluded\": [{ \"id\": \"skyvern\", \"reasonCode\": \"no_local_session\" }]",
    "}"
  ].join("\n");

  const row1 = agents.slice(0, 9);
  const row2 = agents.slice(9);

  const eyebrowText = formatTemplate(dict.home.eyebrow, { date: checked });
  const showingText = formatTemplate(dict.home.showing, { shown: agents.length, total: agents.length });

  const body = `
${renderHeader({ locale, dict, currentPath: "/", searchQuery: initialQuery })}
<main id="top">
  <section class="hero-stage">
    <div class="container hero-inner">
      <div class="hero-eyebrow fade-up">
        <span class="live-dot" aria-hidden="true"></span>
        <span data-hero-eyebrow>${esc(eyebrowText)}</span>
      </div>
      <p class="bb-wordmark fade-up delay-1">${BRAND_NAME}</p>
      <h1 class="type-hero fade-up delay-1" data-i18n="home.title">${esc(dict.home.title)}</h1>
      <p class="hero-subtitle fade-up delay-2" data-i18n="home.subtitle">${esc(dict.home.subtitle)}</p>
      <div class="hero-quickcopy fade-up delay-2" id="hero-quickcopy">
        <div class="qc-head">
          <div class="qc-modes" role="tablist" aria-label="${esc(dict.nav.skill)}">
            <button type="button" class="qc-mode" role="tab" data-qc-mode="prompt" aria-selected="true" data-i18n="home.quickCopy.modePrompt">${esc(dict.home.quickCopy.modePrompt)}</button>
            <button type="button" class="qc-mode" role="tab" data-qc-mode="cli" aria-selected="false" data-i18n="home.quickCopy.modeCli">${esc(dict.home.quickCopy.modeCli)}</button>
          </div>
          <a href="/skill" class="qc-doc-link" data-i18n="apiBand.openSkill">${esc(dict.apiBand.openSkill)} →</a>
        </div>
        <div class="qc-row">
          <code class="qc-code" id="hero-qc-code">${esc(dict.home.quickCopy.promptText)}</code>
          <button type="button" class="btn btn-lime qc-copy-btn" id="hero-qc-copy" data-copy="${esc(dict.home.quickCopy.promptText)}" data-copy-default="home.quickCopy.copyBtn" data-copy-done="home.quickCopy.copiedBtn" data-copy-toast="home.quickCopy.copiedToast">
            ${iconCopy()}
            <span>${esc(dict.home.quickCopy.copyBtn)}</span>
          </button>
        </div>
        <p class="qc-hint" id="hero-qc-hint">${esc(dict.home.quickCopy.hintPrompt)}</p>
      </div>
      <div class="hero-actions fade-up delay-2">
        <button type="button" class="btn btn-primary" id="open-advisor-btn" data-open-advisor>
          ${iconSparkles()}
          <span data-i18n="home.findAgent">${esc(dict.home.findAgent)}</span>
        </button>
        <a href="#catalog" class="btn btn-ghost" data-i18n="home.browse">${esc(dict.home.browse)}</a>
        <button type="button" class="btn btn-ghost" id="compare-top-btn" data-i18n="home.compareTop">${esc(dict.home.compareTop)}</button>
      </div>
      <div class="hero-stats fade-up delay-3" aria-label="${esc(dict.home.comparison)}">
        <div class="stat-cell">
          <span class="stat-value tabular-nums">${stats.total}</span>
          <span class="stat-label" data-i18n="home.stats.agents">${esc(dict.home.stats.agents)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value tabular-nums">${stats.withDemo}</span>
          <span class="stat-label" data-i18n="home.stats.demos">${esc(dict.home.stats.demos)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value tabular-nums">7</span>
          <span class="stat-label" data-i18n="home.stats.dimensions">${esc(dict.home.stats.dimensions)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-value tabular-nums">${esc(checked)}</span>
          <span class="stat-label" data-i18n="home.stats.dated">${esc(dict.home.stats.dated)}</span>
        </div>
      </div>
    </div>
    <div class="bb-wallwrap" aria-label="${esc(dict.home.comparison)}">
      ${renderMarqueeRow(row1, false)}
      ${renderMarqueeRow(row2, true)}
    </div>
  </section>

  <section id="catalog" class="container catalog-section">
    <div class="presets-bar" role="group" aria-label="${esc(dict.home.presets.label)}" data-i18n-aria="home.presets.label">
      ${presets
        .map(
          (p) => `<button type="button" class="preset-pill" data-preset="${esc(p.id)}" aria-pressed="${p.id === "all" ? "true" : "false"}">
            <span data-i18n="home.presets.${esc(p.key)}">${esc(dict.home.presets[p.key])}</span>
            <span class="preset-count">${p.count}</span>
          </button>`
        )
        .join("")}
    </div>

    <div class="catalog-grid">
      <div class="mobile-filter-bar">
        <button type="button" id="mobile-filter-toggle" class="filter-toggle-btn" aria-expanded="false" aria-controls="filter-sidebar">
          <span data-i18n="home.filters">${esc(dict.home.filters)}</span>
          <span class="preset-count" id="mobile-filter-count" hidden>0</span>
          ${iconChevronDown()}
        </button>
      </div>

      <aside id="filter-sidebar" class="filter-sidebar" aria-label="${esc(dict.home.filters)}" data-i18n-aria="home.filters">
        <div class="filter-panel">
          <div class="filter-header">
            <span class="filter-heading" data-i18n="home.filters">${esc(dict.home.filters)}</span>
            <button type="button" class="filter-clear-link" id="clear-filters-btn" hidden data-i18n="home.clear">${esc(dict.home.clear)}</button>
          </div>
          ${renderFilterGroup("perception", dict.filters.perception, perceptionOpts)}
          ${renderFilterGroup("hosting", dict.filters.hosting, hostingOpts)}
          ${renderFilterGroup("mcp", dict.filters.mcp, mcpOpts)}
          ${renderFilterGroup("credentials", dict.filters.credentials, authOpts)}
          <fieldset class="filter-group">
            <legend class="filter-legend" data-i18n="filters.extras">${esc(dict.filters.extras)}</legend>
            <div>
              <label class="filter-option">
                <input type="checkbox" class="filter-checkbox" id="filter-demo">
                <span class="custom-check" aria-hidden="true">${iconCheck()}</span>
                <span class="filter-label" data-i18n="home.hasDemo">${esc(dict.home.hasDemo)}</span>
                <span class="filter-count tabular-nums" id="count-demo">${stats.withDemo}</span>
              </label>
              <label class="filter-option">
                <input type="checkbox" class="filter-checkbox" id="filter-open">
                <span class="custom-check" aria-hidden="true">${iconCheck()}</span>
                <span class="filter-label" data-i18n="home.open">${esc(dict.home.open)}</span>
                <span class="filter-count tabular-nums" id="count-open">${presetCounts.open}</span>
              </label>
            </div>
          </fieldset>
        </div>
      </aside>

      <div style="min-width:0;">
        <div class="catalog-toolbar">
          <div class="toolbar-left">
            <p class="count-pill tabular-nums" id="showing-count">${esc(showingText)}</p>
            <div class="active-chips" id="active-chips"></div>
          </div>
          <div class="toolbar-controls">
            <div class="segmented" id="view-switch" data-index="0" role="group" aria-label="${esc(dict.home.comparison)}" data-i18n-aria="home.comparison">
              <span class="segmented-thumb" aria-hidden="true"></span>
              <button type="button" class="seg-btn" data-view="cards" aria-pressed="true" data-i18n="home.cards">${esc(dict.home.cards)}</button>
              <button type="button" class="seg-btn" data-view="table" aria-pressed="false" data-i18n="home.table">${esc(dict.home.table)}</button>
            </div>
            <div class="sort-group" role="group" aria-label="${esc(dict.home.sortLabel)}" data-i18n-aria="home.sortLabel">
              <button type="button" class="sort-pill" data-sort="curated" aria-pressed="true" data-i18n="home.curatedSort">${esc(dict.home.curatedSort)}</button>
              <button type="button" class="sort-pill" data-sort="name" aria-pressed="false" data-i18n="home.nameSort">${esc(dict.home.nameSort)}</button>
              <button type="button" class="sort-pill" data-sort="checked" aria-pressed="false" data-i18n="home.checkedSort">${esc(dict.home.checkedSort)}</button>
            </div>
          </div>
        </div>

        <ul class="cards-grid" id="cards-grid">
          ${agents.map((a) => renderAgentCard(a, locale, dict, false)).join("")}
        </ul>

        <div id="table-container" hidden></div>

        <div class="empty-box" id="empty-state" hidden>
          <h3 data-i18n="home.empty">${esc(dict.home.empty)}</h3>
          <p data-i18n="home.emptyHint">${esc(dict.home.emptyHint)}</p>
          <button type="button" class="btn btn-primary" id="empty-reset-btn" style="margin-top:1rem;" data-i18n="home.clearAll">${esc(dict.home.clearAll)}</button>
        </div>
      </div>
    </div>

    <section id="skill-api" class="api-band" aria-label="${esc(dict.apiBand.badge)}">
      <div class="api-band-grid">
        <div>
          <span class="api-eyebrow" data-i18n="apiBand.badge">${esc(dict.apiBand.badge)}</span>
          <h2 class="api-title" data-i18n="apiBand.title">${esc(dict.apiBand.title)}</h2>
          <p class="api-desc" data-i18n="apiBand.desc">${esc(dict.apiBand.desc)}</p>
          <div class="api-actions">
            <button type="button" class="btn btn-lime" data-open-advisor>
              ${iconSparkles()}
              <span data-i18n="apiBand.openFinder">${esc(dict.apiBand.openFinder)}</span>
            </button>
            <a href="/skill" class="btn btn-ghost api-ghost-btn" id="api-skill-link">
              <span data-i18n="apiBand.openSkill">${esc(dict.apiBand.openSkill)}</span>
              ${iconArrowRight()}
            </a>
            <a href="/llms.txt" target="_blank" rel="noreferrer" class="btn btn-ghost api-ghost-btn">
              <span data-i18n="apiBand.openLlms">${esc(dict.apiBand.openLlms)}</span>
              ${iconExternal()}
            </a>
          </div>
        </div>
        <div class="api-pane-wrap">
          <div class="api-tabs" role="tablist" aria-label="${esc(dict.apiBand.badge)}">
            <button type="button" class="api-tab" role="tab" data-api-tab="skill" aria-selected="true" data-i18n="apiBand.tabSkill">${esc(dict.apiBand.tabSkill)}</button>
            <button type="button" class="api-tab" role="tab" data-api-tab="recommend" aria-selected="false" data-i18n="apiBand.tabRecommend">${esc(dict.apiBand.tabRecommend)}</button>
            <button type="button" class="api-tab" role="tab" data-api-tab="catalog" aria-selected="false" data-i18n="apiBand.tabCatalog">${esc(dict.apiBand.tabCatalog)}</button>
          </div>
          <div class="api-cards" data-api-panel="skill">
            <div class="api-card">
              <div class="api-card-head">
                <span class="api-endpoint">npx skills add</span>
                <button type="button" class="api-copy-btn" data-copy="npx skills add XingMXTeam/browsely" data-copy-default="apiBand.copy" data-copy-done="apiBand.copied">
                  ${iconCopy()}
                  <span>${esc(dict.apiBand.copy)}</span>
                </button>
              </div>
              <pre class="api-pre"><code>${esc(sampleSkillInstall)}</code></pre>
            </div>
            <div class="api-card">
              <div class="api-card-head">
                <span class="api-endpoint">GET /SKILL.md</span>
                <button type="button" class="api-copy-btn" id="api-skill-copy-btn" data-copy="https://browserly.maoxunxing.com/${locale === "zh" ? "SKILL.zh-CN.md" : "SKILL.md"}" data-copy-default="apiBand.copy" data-copy-done="apiBand.copied">
                  ${iconCopy()}
                  <span>${esc(dict.apiBand.copy)}</span>
                </button>
              </div>
              <pre class="api-pre"><code>${esc(sampleSkillPreview)}</code></pre>
            </div>
          </div>
          <div class="api-cards" data-api-panel="recommend" hidden>
            <div class="api-card">
              <div class="api-card-head">
                <span class="api-endpoint">GET /api/recommend</span>
                <button type="button" class="api-copy-btn" data-copy="https://browserly.maoxunxing.com/api/recommend?useCase=coding-agent&auth=local-session&hosting=self-host&mcp=required&budget=free-oss" data-copy-default="apiBand.copy" data-copy-done="apiBand.copied">
                  ${iconCopy()}
                  <span>${esc(dict.apiBand.copy)}</span>
                </button>
              </div>
              <pre class="api-pre"><code>${esc(sampleRecommendCmd)}</code></pre>
            </div>
            <div class="api-card">
              <div class="api-card-head">
                <span class="api-endpoint">200 application/json</span>
                <a href="/api/recommend?useCase=coding-agent&amp;auth=local-session&amp;hosting=self-host&amp;mcp=required&amp;budget=free-oss" target="_blank" rel="noreferrer" class="api-copy-btn">
                  <span>JSON</span>
                  ${iconExternal()}
                </a>
              </div>
              <pre class="api-pre"><code>${esc(sampleRecommendOut)}</code></pre>
            </div>
          </div>
          <div class="api-cards" data-api-panel="catalog" hidden>
            <div class="api-card">
              <div class="api-card-head">
                <span class="api-endpoint">GET /api/agents</span>
                <button type="button" class="api-copy-btn" data-copy="https://browserly.maoxunxing.com/api/agents" data-copy-default="apiBand.copy" data-copy-done="apiBand.copied">
                  ${iconCopy()}
                  <span>${esc(dict.apiBand.copy)}</span>
                </button>
              </div>
              <pre class="api-pre"><code>${esc(sampleJson)}</code></pre>
            </div>
            <div class="api-card">
              <div class="api-card-head">
                <span class="api-endpoint">GET /llms.txt</span>
                <button type="button" class="api-copy-btn" data-copy="https://browserly.maoxunxing.com/llms.txt" data-copy-default="apiBand.copy" data-copy-done="apiBand.copied">
                  ${iconCopy()}
                  <span>${esc(dict.apiBand.copy)}</span>
                </button>
              </div>
              <pre class="api-pre"><code>${esc(sampleLlms)}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  </section>
</main>

${renderHomeFooter({ agents, coverage, locale, dict })}

<div class="compare-dock" id="compare-dock" role="region" aria-label="${esc(dict.compare.title)}" aria-hidden="true">
  <div class="dock-items" id="dock-items"></div>
  <div class="dock-actions">
    <button type="button" class="dock-clear-btn" id="dock-clear-btn" data-i18n="compare.clear">${esc(dict.compare.clear)}</button>
    <button type="button" class="dock-compare-btn" id="dock-open-btn"></button>
  </div>
</div>

<div class="modal-backdrop" id="advisor-modal-backdrop" aria-hidden="true">
  <div class="compare-modal advisor-modal" role="dialog" aria-modal="true" aria-labelledby="advisor-modal-title">
    <div class="modal-head">
      <div style="min-width:0;">
        <span class="advisor-eyebrow" data-i18n="advisor.badge">${esc(dict.advisor.badge)}</span>
        <h2 id="advisor-modal-title" style="font-size:1.2rem;font-weight:700;letter-spacing:-0.03em;margin-top:0.2rem;" data-i18n="advisor.title">${esc(dict.advisor.title)}</h2>
        <p style="font-size:0.82rem;color:var(--ink-muted);" data-i18n="advisor.subtitle">${esc(dict.advisor.subtitle)}</p>
      </div>
      <button type="button" class="modal-close-btn" id="advisor-modal-close" aria-label="${esc(dict.advisor.close)}" data-i18n-aria="advisor.close">${iconClose()}</button>
    </div>
    <div class="advisor-layout">
      <div class="advisor-controls" id="advisor-controls"></div>
      <div class="advisor-results" id="advisor-results"></div>
    </div>
  </div>
</div>

<div class="modal-backdrop" id="compare-modal-backdrop" aria-hidden="true">
  <div class="compare-modal" role="dialog" aria-modal="true" aria-labelledby="compare-modal-title">
    <div class="modal-head">
      <div>
        <h2 id="compare-modal-title" style="font-size:1.2rem;font-weight:700;letter-spacing:-0.03em;" data-i18n="compare.title">${esc(dict.compare.title)}</h2>
        <p style="font-size:0.82rem;color:var(--ink-muted);" data-i18n="compare.subtitle">${esc(dict.compare.subtitle)}</p>
      </div>
      <button type="button" class="modal-close-btn" id="compare-modal-close" aria-label="${esc(dict.compare.close)}" data-i18n-aria="compare.close">${iconClose()}</button>
    </div>
    <div class="compare-scroll" id="compare-modal-body"></div>
  </div>
</div>

<div class="drawer-backdrop" id="demo-backdrop" aria-hidden="true"></div>
<aside class="demo-drawer" id="demo-drawer" role="dialog" aria-modal="true" aria-labelledby="demo-drawer-title" aria-hidden="true">
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;">
    <div style="min-width:0;">
      <h2 id="demo-drawer-title" style="font-size:1.35rem;font-weight:700;letter-spacing:-0.03em;"></h2>
      <p id="demo-drawer-vendor" style="font-size:0.85rem;color:var(--ink-muted);"></p>
    </div>
    <button type="button" class="modal-close-btn" id="demo-drawer-close" aria-label="${esc(dict.motion.close)}" data-i18n-aria="motion.close">${iconClose()}</button>
  </div>
  <div id="demo-drawer-stage"></div>
  <div id="demo-drawer-meta" style="display:flex;flex-wrap:wrap;gap:0.45rem;"></div>
  <div id="demo-drawer-links" style="display:flex;flex-wrap:wrap;gap:0.6rem;margin-top:auto;padding-top:0.75rem;border-top:1px dashed var(--hairline);"></div>
</aside>

<div class="toast-pill" id="toast-pill" role="status" aria-live="polite"></div>
`;

  const clientAgents = agents.map((a) => ({
    id: a.id,
    name: a.name,
    logo: a.logo,
    pastel: a.pastel,
    steward: a.steward,
    docsUrl: a.docsUrl,
    perception: a.perception,
    perceptionNote: a.perceptionNote,
    license: a.license,
    licenseNote: a.licenseNote,
    hosting: a.hosting,
    hostingNote: a.hostingNote,
    mcp: a.mcp,
    mcpNote: a.mcpNote,
    authModel: a.authModel,
    credentials: a.credentials,
    antiBot: a.antiBot,
    antiBotBadge: a.antiBotBadge,
    pricing: a.pricing,
    pricingBadge: a.pricingBadge,
    lastChecked: a.lastChecked,
    unknowns: a.unknowns,
    sources: a.sources.map((s) => s.url),
    video: a.video,
    videoPoster: a.videoPoster,
    videoPosterKind: a.videoPosterKind,
    videoSource: a.videoSource,
    youtubeId: a.youtubeId
  }));

  return renderDocument({
    title: dict.meta.title,
    description: dict.meta.description,
    locale,
    path: "/",
    cssHref: assets.cssHref,
    jsHref: assets.jsHref,
    pageType: "home",
    body,
    inlineScripts: [
      {
        id: "__BROWSLY_DATA__",
        data: { checked, coverage, agents: clientAgents }
      }
    ]
  });
}

function renderDossierMedia(agent, dict) {
  if (agent.youtubeId) {
    return `<div class="media-frame">
      <iframe src="https://www.youtube-nocookie.com/embed/${esc(agent.youtubeId)}?rel=0" title="${esc(agent.name)}" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>
    </div>`;
  }
  if (agent.video || agent.videoPoster) {
    const isDiagram = agent.videoPosterKind === "diagram";
    const posterHtml = agent.videoPoster
      ? `<img src="${esc(agent.videoPoster)}" alt="" class="dossier-poster" style="object-fit:${isDiagram ? "contain" : "cover"};background:${isDiagram ? "#fff" : "transparent"};padding:${isDiagram ? "1rem" : "0"};" onerror="this.style.display='none';">`
      : "";
    const videoHtml = agent.video
      ? `<video id="dossier-video" src="${esc(agent.video)}" controls autoplay muted loop playsinline preload="metadata" onloadeddata="this.classList.add('is-ready')" onerror="this.style.display='none'"></video>`
      : "";
    return `<div class="media-frame" id="dossier-media-frame" style="background:${esc(agent.pastel)}">
      <div class="card-stage-fallback"><div class="card-stage-medallion"><img src="${esc(agent.logo)}" alt=""></div></div>
      ${posterHtml}
      ${videoHtml}
    </div>`;
  }
  return `<div class="media-frame" style="background:${esc(agent.pastel)}">
    <div class="card-stage-fallback">
      <div style="display:flex;flex-direction:column;align-items:center;gap:0.75rem;text-align:center;">
        <div class="card-stage-medallion"><img src="${esc(agent.logo)}" alt=""></div>
        <p style="font-size:0.82rem;color:var(--ink-2);max-width:34ch;" data-i18n="motion.noVideo">${esc(dict.motion.noVideo)}</p>
      </div>
    </div>
  </div>`;
}

export function renderAgentPage(catalog, agent, related, prevNext, locale, dict, assets) {
  const story = getAgentStory(agent, locale);
  const hostingMap = {
    "self-host": dict.detail.selfHost,
    cloud: dict.detail.cloud,
    both: dict.detail.both
  };
  const credKey = getCredentialKey(agent);
  const specRows = [
    ["columns.perception", dict.columns.perception, perceptionLabel(locale, agent.perception), "perception", agent.perception],
    ["detail.hosting", dict.detail.hosting, hostingMap[agent.hosting], "hosting", agent.hosting],
    ["columns.mcp", dict.columns.mcp, mcpLabel(locale, agent.mcp), "mcp", agent.mcp],
    ["columns.credentials", dict.columns.credentials, dict.detail.credential[credKey] || agent.authModel, "auth", agent.authModel],
    ["columns.antiBot", dict.columns.antiBot, agent.antiBotBadge, "antiBot", agent.antiBotBadge],
    ["detail.pricing", dict.detail.pricing, agent.pricingBadge, "pricing", agent.pricingBadge],
    ["columns.license", dict.columns.license, licenseLabel(locale, agent.license), "license", agent.license],
    ["detail.status", dict.detail.status, dict.detail.active, "status", "active"],
    ["detail.checked", dict.detail.checked, agent.lastChecked, "checked", agent.lastChecked]
  ];

  const actionLinks = [];
  const seenUrls = new Set();
  for (const item of [
    { href: agent.docsUrl, key: "docs" },
    { href: agent.github, key: "github" },
    { href: agent.homepage, key: "visit" }
  ]) {
    if (item.href && !seenUrls.has(item.href)) {
      seenUrls.add(item.href);
      actionLinks.push(item);
    }
  }

  const body = `
<div class="scroll-progress" aria-hidden="true"><span></span></div>
${renderHeader({ locale, dict, currentPath: `/agent/${agent.id}` })}
<main class="container dossier-main">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/" data-i18n="detail.breadcrumbMatrix">${esc(dict.detail.breadcrumbMatrix)}</a>
    ${iconChevronRight()}
    <span style="color:var(--ink);font-weight:600;">${esc(agent.name)}</span>
  </nav>

  <section class="dossier-hero">
    <div class="dossier-hero-top">
      <div class="dossier-logo" style="background:${esc(agent.pastel)}">
        <img src="${esc(agent.logo)}" alt="">
      </div>
      <div>
        <h1 class="dossier-h1">${esc(agent.name)}</h1>
        <p class="dossier-vendor">${esc(agent.steward)} · <span class="tabular-nums">${esc(agent.lastChecked)}</span></p>
      </div>
      <div class="dossier-badges" id="dossier-badges">
        ${renderBadge(perceptionLabel(locale, agent.perception), badgeTone("perception", agent.perception))}
        ${renderBadge(agent.pricingBadge, isUncertain("pricing", agent.pricingBadge) ? "unknown" : "lime")}
        ${renderBadge(agent.antiBotBadge, badgeTone("antiBot", agent.antiBotBadge))}
        ${renderBadge(licenseLabel(locale, agent.license), badgeTone("license", agent.license))}
      </div>
    </div>
    <div class="dossier-actions">
      ${actionLinks
        .map(
          (lnk, idx) =>
            `<a href="${esc(lnk.href)}" target="_blank" rel="noreferrer" class="btn ${idx === 0 ? "btn-primary" : "btn-ghost"}">
              <span data-i18n="detail.${esc(lnk.key)}">${esc(dict.detail[lnk.key])}</span>
              ${iconExternal()}
            </a>`
        )
        .join("")}
      <button type="button" class="btn btn-ghost" data-copy="https://browserly.maoxunxing.com/agent/${esc(agent.id)}" data-copy-default="detail.share" data-copy-done="detail.copied">
        ${iconCopy()}
        <span>${esc(dict.detail.share)}</span>
      </button>
    </div>
  </section>

  <div class="dossier-grid">
    <div>
      <div class="dossier-stage">
        ${renderDossierMedia(agent, dict)}
      </div>

      <article class="dossier-card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;margin-bottom:0.85rem;">
          <h2 style="font-size:1.3rem;font-weight:700;letter-spacing:-0.03em;" data-i18n="detail.verdict">${esc(dict.detail.verdict)}</h2>
          <span class="badge badge--neutral" data-i18n="detail.editorialBadge">${esc(dict.detail.editorialBadge)}</span>
        </div>
        <div id="dossier-story">
          <p class="verdict-callout">${esc(story.verdict)}</p>
          ${story.sections
            .map(
              (sec) => `
              <h3 class="dossier-section-h">${esc(dict.columns[sec.key] || dict.detail[sec.key] || sec.key)}</h3>
              <p class="dossier-section-p">${esc(sec.body)}</p>`
            )
            .join("")}
        </div>
      </article>
    </div>

    <aside>
      <div class="dossier-card">
        <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:0.5rem;" data-i18n="detail.specsTitle">${esc(dict.detail.specsTitle)}</h2>
        <div id="dossier-specs">
          ${specRows
            .map(
              ([i18nKey, label, value]) =>
                `<div class="kv-row"><span class="kv-k" data-i18n="${esc(i18nKey)}">${esc(label)}</span><span class="kv-v">${esc(value)}</span></div>`
            )
            .join("")}
        </div>
      </div>

      ${
        agent.unknowns.length > 0
          ? `<div class="dossier-card" style="border-style:dashed;border-color:var(--hairline-strong);">
              <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:0.5rem;" data-i18n="detail.unknownsTitle">${esc(dict.detail.unknownsTitle)}</h2>
              <ul style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.875rem;line-height:1.6;color:var(--ink-2);">
                ${agent.unknowns.map((u) => `<li>• ${esc(u)}</li>`).join("")}
              </ul>
            </div>`
          : ""
      }

      <div class="dossier-card">
        <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:0.5rem;" data-i18n="detail.sources">${esc(dict.detail.sources)}</h2>
        <ul style="display:flex;flex-direction:column;gap:0.4rem;">
          ${agent.sources
            .map(
              (s) =>
                `<li style="padding:0.35rem 0;border-bottom:1px dashed var(--hairline);font-size:0.82rem;word-break:break-all;">
                  <a href="${esc(s.url)}" target="_blank" rel="noreferrer" style="text-decoration:underline;text-decoration-color:var(--hairline-strong);text-underline-offset:3px;">${esc(s.label)}</a>
                </li>`
            )
            .join("")}
        </ul>
        <p style="margin-top:0.75rem;font-size:0.8rem;color:var(--ink-muted);" class="tabular-nums">
          <span data-i18n="detail.checked">${esc(dict.detail.checked)}</span>: ${esc(agent.lastChecked)}
        </p>
      </div>
    </aside>
  </div>

  ${
    related.length > 0
      ? `<section class="dossier-card" style="margin-top:1.5rem;">
          <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="detail.more">${esc(dict.detail.more)}</h2>
          <div class="related-grid">
            ${related
              .map(
                (r) => `<a href="/agent/${esc(r.id)}" class="related-card">
                  <img src="${esc(r.logo)}" alt="" width="28" height="28">
                  <div style="min-width:0;flex:1;">
                    <div style="font-size:0.9rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(r.name)}</div>
                    <div style="font-size:0.78rem;color:var(--ink-muted);">${esc(r.steward)} · ${esc(r.pricingBadge)}</div>
                  </div>
                </a>`
              )
              .join("")}
          </div>
        </section>`
      : ""
  }

  <nav class="prev-next-nav" aria-label="${esc(dict.detail.more)}">
    <a href="/agent/${esc(prevNext.prev.id)}" class="prev-next-card">
      <span style="font-size:0.75rem;font-weight:600;color:var(--ink-muted);" data-i18n="detail.prev">${esc(dict.detail.prev)}</span>
      <span style="font-size:1rem;font-weight:700;">← ${esc(prevNext.prev.name)}</span>
    </a>
    <a href="/agent/${esc(prevNext.next.id)}" class="prev-next-card is-next">
      <span style="font-size:0.75rem;font-weight:600;color:var(--ink-muted);" data-i18n="detail.next">${esc(dict.detail.next)}</span>
      <span style="font-size:1rem;font-weight:700;">${esc(prevNext.next.name)} →</span>
    </a>
  </nav>
</main>
${renderDetailFooter({ dict })}
<div class="toast-pill" id="toast-pill" role="status" aria-live="polite"></div>
`;

  const agentPayload = {
    agent: {
      id: agent.id,
      name: agent.name,
      perception: agent.perception,
      hosting: agent.hosting,
      mcp: agent.mcp,
      authModel: agent.authModel,
      credKey,
      antiBotBadge: agent.antiBotBadge,
      pricingBadge: agent.pricingBadge,
      license: agent.license,
      lastChecked: agent.lastChecked
    },
    stories: getAgentStoriesPayload(agent)
  };

  return renderDocument({
    title: `${agent.name} — ${BRAND_NAME}`,
    description: story.verdict || agent.hostingNote || agent.name,
    locale,
    path: `/agent/${agent.id}`,
    cssHref: assets.cssHref,
    jsHref: assets.jsHref,
    pageType: "agent",
    body,
    inlineScripts: [
      { id: "__BROWSLY_AGENT__", data: agentPayload },
      { id: "__BROWSLY_I18N__", data: { key: "detail", en: DICT.en.detail, zh: DICT.zh.detail } }
    ]
  });
}

export function renderAboutPage(catalog, locale, dict, assets) {
  const { checked, excluded, changelog, coverage, infraNote } = catalog;
  const legendItems = dict.about.legendItems;

  const body = `
<div class="scroll-progress" aria-hidden="true"><span></span></div>
${renderHeader({ locale, dict, currentPath: "/about" })}
<main class="container-narrow page-main">
  <header style="display:flex;flex-direction:column;gap:0.9rem;">
    <h1 class="type-page" data-i18n="about.title">${esc(dict.about.title)}</h1>
    <p style="max-width:65ch;font-size:1.05rem;line-height:1.65;color:var(--ink-2);">
      <span data-i18n="about.lead">${esc(dict.about.lead)}</span>
      <strong class="tabular-nums"> ${esc(checked)}</strong>.
    </p>
  </header>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="about.legendTitle">${esc(dict.about.legendTitle)}</h2>
    <p style="margin-top:0.25rem;font-size:0.9rem;color:var(--ink-muted);" data-i18n="about.legendDesc">${esc(dict.about.legendDesc)}</p>
    <div class="legend-grid" id="about-legend">
      ${legendItems
        .map(
          (item, i) => `<div class="legend-item">
            ${renderBadge(item.label, item.kind)}
            <p style="font-size:0.875rem;line-height:1.55;color:var(--ink-2);" data-i18n="about.legendItems.${i}.desc">${esc(item.desc)}</p>
          </div>`
        )
        .join("")}
    </div>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="about.cellTitle">${esc(dict.about.cellTitle)}</h2>
    <p style="margin-top:0.25rem;font-size:0.875rem;color:var(--ink-muted);" data-i18n="about.cellFile">${esc(dict.about.cellFile)}</p>
    <div style="margin-top:0.85rem;display:flex;flex-direction:column;gap:0.75rem;font-size:0.95rem;line-height:1.7;color:var(--ink-2);">
      <p data-i18n="about.policy">${esc(dict.about.policy)}</p>
      <p data-i18n="about.unknown">${esc(dict.about.unknown)}</p>
      <p data-i18n="about.mcp">${esc(dict.about.mcp)}</p>
    </div>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="about.offTitle">${esc(dict.about.offTitle)}</h2>
    <p style="margin-top:0.25rem;font-size:0.9rem;color:var(--ink-muted);" data-i18n="about.offDesc">${esc(dict.about.offDesc)}</p>
    <ul style="margin-top:0.85rem;display:flex;flex-direction:column;gap:0.7rem;font-size:0.95rem;line-height:1.65;color:var(--ink-2);">
      ${excluded
        .map(
          (item) => `<li><strong style="color:var(--ink);">${esc(item.name)}.</strong> ${esc(item.reason)}</li>`
        )
        .join("")}
      ${
        infraNote
          ? `<li><strong style="color:var(--ink);">${esc(infraNote.name)}.</strong> ${esc(infraNote.note || infraNote.pricing_summary)}</li>`
          : ""
      }
    </ul>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="about.changelogTitle">${esc(dict.about.changelogTitle)}</h2>
    <p style="margin-top:0.25rem;font-size:0.9rem;color:var(--ink-muted);" data-i18n="about.changelogDesc">${esc(dict.about.changelogDesc)}</p>
    <ol class="timeline">
      ${changelog
        .map(
          (entry) => `<li class="timeline-item">
            <div class="timeline-date tabular-nums">${esc(entry.date)}</div>
            <p class="timeline-text">${esc(entry.item)}</p>
            <a href="${esc(entry.source)}" target="_blank" rel="noreferrer" class="timeline-link">${esc(entry.sourceLabel)}</a>
          </li>`
        )
        .join("")}
    </ol>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="about.coverageTitle">${esc(dict.about.coverageTitle)}</h2>
    <div style="margin-top:0.75rem;display:flex;flex-direction:column;gap:0.6rem;font-size:0.95rem;line-height:1.7;color:var(--ink-2);">
      <p lang="zh-CN">${esc(coverage.zh)}</p>
      <p lang="en">${esc(coverage.en)}</p>
    </div>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="about.disclaimerTitle">${esc(dict.about.disclaimerTitle)}</h2>
    <div style="margin-top:0.75rem;display:flex;flex-direction:column;gap:0.6rem;font-size:0.95rem;line-height:1.7;color:var(--ink-2);">
      <p data-i18n="about.disclaimer1">${esc(dict.about.disclaimer1)}</p>
      <p data-i18n="about.disclaimer2">${esc(dict.about.disclaimer2)}</p>
    </div>
  </section>
</main>
${renderSimpleFooter({ coverage, dict })}
<div class="toast-pill" id="toast-pill" role="status" aria-live="polite"></div>
`;

  return renderDocument({
    title: `${dict.about.title} — ${BRAND_NAME}`,
    description: dict.about.description,
    locale,
    path: "/about",
    cssHref: assets.cssHref,
    jsHref: assets.jsHref,
    pageType: "about",
    body,
    inlineScripts: [
      { id: "__BROWSLY_I18N__", data: { key: "about", en: DICT.en.about, zh: DICT.zh.about } }
    ]
  });
}

export function renderSponsorPage(catalog, locale, dict, assets) {
  const { coverage } = catalog;
  const body = `
${renderHeader({ locale, dict, currentPath: "/sponsor" })}
<main class="container-narrow page-main">
  <header style="display:flex;flex-direction:column;gap:0.8rem;">
    <h1 class="type-page" data-i18n="sponsor.title">${esc(dict.sponsor.title)}</h1>
    <p style="max-width:52ch;font-size:1.1rem;line-height:1.65;color:var(--ink);" data-i18n="sponsor.body">${esc(dict.sponsor.body)}</p>
  </header>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="sponsor.promiseTitle">${esc(dict.sponsor.promiseTitle)}</h2>
    <p style="margin-top:0.65rem;font-size:0.95rem;line-height:1.7;color:var(--ink-2);" data-i18n="sponsor.promiseBody">${esc(dict.sponsor.promiseBody)}</p>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="sponsor.contactTitle">${esc(dict.sponsor.contactTitle)}</h2>
    <p style="margin-top:0.5rem;font-size:0.95rem;line-height:1.65;color:var(--ink-2);" data-i18n="sponsor.contactBody">${esc(dict.sponsor.contactBody)}</p>
    <div style="margin-top:0.9rem;">
      <a href="${esc(SUBMIT_URL)}" class="btn btn-primary" data-i18n="home.submit">${esc(dict.home.submit)}</a>
    </div>
    <div>${renderWeChatBlock(dict)}</div>
  </section>
</main>
${renderSimpleFooter({ coverage, dict })}
<div class="toast-pill" id="toast-pill" role="status" aria-live="polite"></div>
`;

  return renderDocument({
    title: `${dict.sponsor.title} — ${BRAND_NAME}`,
    description: dict.sponsor.description,
    locale,
    path: "/sponsor",
    cssHref: assets.cssHref,
    jsHref: assets.jsHref,
    pageType: "sponsor",
    body,
    inlineScripts: [
      { id: "__BROWSLY_I18N__", data: { key: "sponsor", en: DICT.en.sponsor, zh: DICT.zh.sponsor } }
    ]
  });
}

export function renderSkillPage(catalog, locale, dict, assets) {
  const { checked, coverage, agents } = catalog;
  const sp = dict.skillPage;
  const qc = dict.home.quickCopy;
  const rawEndpoints = [
    { path: "/SKILL.md", desc: "English Agent Skill (YAML frontmatter + workflow + offline snapshot)" },
    { path: "/SKILL.zh-CN.md", desc: "简体中文 Agent Skill（完整选型规则 + 17 项离线核验表）" },
    { path: "/api/recommend?useCase=coding-agent&auth=local-session&hosting=self-host&mcp=required&budget=free-oss", desc: "Deterministic 6-axis selection API (JSON + CORS)" },
    { path: "/api/agents", desc: `Verified raw matrix catalog (${agents.length} rows, JSON)` },
    { path: "/llms.txt", desc: "Machine-readable LLM index" }
  ];

  const body = `
<div class="scroll-progress" aria-hidden="true"><span></span></div>
${renderHeader({ locale, dict, currentPath: "/skill" })}
<main class="container-narrow page-main">
  <header style="display:flex;flex-direction:column;gap:0.85rem;align-items:flex-start;">
    <span class="advisor-eyebrow" data-i18n="skillPage.badge">${esc(sp.badge)}</span>
    <h1 class="type-page" data-i18n="skillPage.title">${esc(sp.title)}</h1>
    <p style="max-width:66ch;font-size:1.05rem;line-height:1.68;color:var(--ink-2);" data-i18n="skillPage.lead">${esc(sp.lead)}</p>
    <div style="display:flex;flex-wrap:wrap;gap:0.6rem;margin-top:0.2rem;">
      <a href="/?advisor=1" class="btn btn-lime">
        ${iconSparkles()}
        <span data-i18n="skillPage.tryFinder">${esc(sp.tryFinder)}</span>
      </a>
      <a href="/SKILL.zh-CN.md" target="_blank" rel="noreferrer" class="btn btn-ghost">SKILL.zh-CN.md ${iconExternal()}</a>
      <a href="/SKILL.md" target="_blank" rel="noreferrer" class="btn btn-ghost">SKILL.md ${iconExternal()}</a>
    </div>
  </header>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="skillPage.waysTitle">${esc(sp.waysTitle)}</h2>
    <div class="skill-ways-grid">
      <div class="skill-way-card is-featured">
        <span class="badge badge--lime" data-i18n="skillPage.way1Badge">${esc(sp.way1Badge)}</span>
        <h3 style="font-size:1rem;font-weight:700;" data-i18n="skillPage.way1Title">${esc(sp.way1Title)}</h3>
        <p style="font-size:0.86rem;line-height:1.6;color:var(--ink-2);" data-i18n="skillPage.way1Desc">${esc(sp.way1Desc)}</p>
        <div class="skill-copy-box">
          <code id="skill-page-prompt">${esc(qc.promptText)}</code>
          <button type="button" class="btn btn-lime btn-sm" id="skill-page-prompt-btn" data-copy="${esc(qc.promptText)}" data-copy-default="home.quickCopy.copyBtn" data-copy-done="home.quickCopy.copiedBtn" data-copy-toast="home.quickCopy.copiedToast">
            ${iconCopy()}
            <span>${esc(qc.copyBtn)}</span>
          </button>
        </div>
      </div>
      <div class="skill-way-card">
        <span class="badge badge--info" data-i18n="skillPage.way2Badge">${esc(sp.way2Badge)}</span>
        <h3 style="font-size:1rem;font-weight:700;" data-i18n="skillPage.way2Title">${esc(sp.way2Title)}</h3>
        <p style="font-size:0.86rem;line-height:1.6;color:var(--ink-2);" data-i18n="skillPage.way2Desc">${esc(sp.way2Desc)}</p>
        <div class="skill-copy-box">
          <code>${esc(qc.cliText)}</code>
          <button type="button" class="btn btn-primary btn-sm" data-copy="${esc(qc.cliText)}" data-copy-default="home.quickCopy.copyBtn" data-copy-done="home.quickCopy.copiedBtn" data-copy-toast="home.quickCopy.copiedToast">
            ${iconCopy()}
            <span>${esc(qc.copyBtn)}</span>
          </button>
        </div>
      </div>
    </div>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="skillPage.demoTitle">${esc(sp.demoTitle)}</h2>
    <p style="margin-top:0.25rem;font-size:0.9rem;color:var(--ink-muted);" data-i18n="skillPage.demoDesc">${esc(sp.demoDesc)}</p>
    <ol class="skill-chat" id="skill-demo-steps">
      ${sp.demoSteps
        .map(
          (step, i) => `<li class="skill-chat-item">
            <span class="skill-chat-role" data-i18n="skillPage.demoSteps.${i}.role">${esc(step.role)}</span>
            <p class="skill-chat-text" data-i18n="skillPage.demoSteps.${i}.text">${esc(step.text)}</p>
          </li>`
        )
        .join("")}
    </ol>
  </section>

  <section class="dossier-card">
    <h2 style="font-size:1.15rem;font-weight:700;" data-i18n="skillPage.rawTitle">${esc(sp.rawTitle)}</h2>
    <p style="margin-top:0.25rem;font-size:0.9rem;color:var(--ink-muted);" data-i18n="skillPage.rawDesc">${esc(sp.rawDesc)}</p>
    <p style="margin-top:0.35rem;font-size:0.78rem;color:var(--ink-muted);font-family:var(--font-mono);">as_of: ${esc(checked)} · ${agents.length} verified agents</p>
    <ul class="skill-endpoints">
      ${rawEndpoints
        .map(
          (ep) => `<li class="skill-ep-row">
            <div style="min-width:0;flex:1;">
              <a href="${esc(ep.path)}" target="_blank" rel="noreferrer" class="skill-ep-path">${esc(ep.path)}</a>
              <p style="font-size:0.82rem;color:var(--ink-muted);margin-top:0.15rem;">${esc(ep.desc)}</p>
            </div>
            <div style="display:flex;gap:0.4rem;flex:none;">
              <button type="button" class="btn btn-ghost btn-sm" data-copy="https://browserly.maoxunxing.com${esc(ep.path)}" data-copy-default="apiBand.copy" data-copy-done="apiBand.copied">
                ${iconCopy()}
                <span>${esc(dict.apiBand.copy)}</span>
              </button>
              <a href="${esc(ep.path)}" target="_blank" rel="noreferrer" class="btn btn-ghost btn-sm">
                <span data-i18n="skillPage.openRaw">${esc(sp.openRaw)}</span>
                ${iconExternal()}
              </a>
            </div>
          </li>`
        )
        .join("")}
    </ul>
  </section>
</main>
${renderSimpleFooter({ coverage, dict })}
<div class="toast-pill" id="toast-pill" role="status" aria-live="polite"></div>
`;

  return renderDocument({
    title: `${sp.title} — ${BRAND_NAME}`,
    description: sp.description,
    locale,
    path: "/skill",
    cssHref: assets.cssHref,
    jsHref: assets.jsHref,
    pageType: "skill",
    body,
    inlineScripts: [
      { id: "__BROWSLY_I18N__", data: { key: "skillPage", en: DICT.en.skillPage, zh: DICT.zh.skillPage } }
    ]
  });
}

export function renderNotFoundPage(catalog, locale, dict, assets) {
  const { coverage } = catalog;
  const body = `
${renderHeader({ locale, dict, currentPath: "/404" })}
<main class="container-narrow page-main">
  <section class="dossier-card" style="text-align:center;padding:3rem 1.5rem;">
    <span class="badge badge--warn">${esc(dict.notFound.code)}</span>
    <h1 class="type-page" style="margin-top:0.75rem;" data-i18n="notFound.title">${esc(dict.notFound.title)}</h1>
    <p style="margin-top:0.75rem;color:var(--ink-muted);" data-i18n="notFound.body">${esc(dict.notFound.body)}</p>
    <div style="margin-top:1.5rem;">
      <a href="/" class="btn btn-primary" data-i18n="notFound.back">${esc(dict.notFound.back)}</a>
    </div>
  </section>
</main>
${renderSimpleFooter({ coverage, dict })}
`;

  return renderDocument({
    title: `${dict.notFound.code} — ${BRAND_NAME}`,
    description: dict.notFound.body,
    locale,
    path: "/404",
    cssHref: assets.cssHref,
    jsHref: assets.jsHref,
    pageType: "notFound",
    body
  });
}
