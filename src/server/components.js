import {
  BRAND_NAME,
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
  iconArrowRight,
  iconChevronDown,
  iconClose,
  iconCopy,
  iconPlay,
  iconPlus,
  iconSearch
} from "./icons.js";

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function htmlLang(locale) {
  return locale === "zh" ? "zh-CN" : "en";
}

export function renderDocument({
  title,
  description,
  locale,
  path,
  cssHref,
  jsHref,
  body,
  inlineScripts = [],
  pageType = "page"
}) {
  const canonicalUrl = `https://browserly.maoxunxing.com${path === "/" ? "" : path}`;
  const scriptsHtml = inlineScripts
    .map(({ id, data }) => `<script type="application/json" id="${esc(id)}">${safeJson(data)}</script>`)
    .join("");

  return `<!doctype html>
<html lang="${htmlLang(locale)}" data-locale="${esc(locale)}" data-page="${esc(pageType)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(canonicalUrl)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${esc(cssHref)}">
</head>
<body>
${body}
${scriptsHtml}
<script src="${esc(jsHref)}" defer></script>
</body>
</html>`;
}

export function renderHeader({ locale, dict, currentPath, searchQuery = "" }) {
  const navItems = [
    { href: "/", key: "matrix", active: currentPath === "/" || currentPath.startsWith("/agent/") },
    { href: "/about", key: "method", active: currentPath === "/about" },
    { href: "/sponsor", key: "sponsor", active: currentPath === "/sponsor" }
  ];

  return `<header class="site-header" id="site-header">
  <div class="container header-inner">
    <a href="/" class="brand-link">
      <img src="/browseboard.svg" alt="" width="34" height="34" class="brand-mark">
      <span class="brand-name">${BRAND_NAME}</span>
    </a>
    <nav class="header-nav" aria-label="${BRAND_NAME}">
      ${navItems
        .map(
          (item) =>
            `<a href="${item.href}" class="nav-link"${item.active ? ' aria-current="page"' : ""} data-i18n="nav.${item.key}">${esc(dict.nav[item.key])}</a>`
        )
        .join("")}
    </nav>
    <div class="header-search-wrap">
      ${iconSearch("header-search-icon")}
      <input
        type="search"
        id="global-search"
        class="header-search-input"
        value="${esc(searchQuery)}"
        placeholder="${esc(dict.home.searchPlaceholder)}"
        aria-label="${esc(dict.home.searchLabel)}"
        data-i18n-placeholder="home.searchPlaceholder"
        data-i18n-aria="home.searchLabel"
        autocomplete="off"
      >
      <kbd class="search-kbd" id="search-kbd">⌘K</kbd>
      <button type="button" class="search-clear-btn" id="search-clear-btn" aria-label="${esc(dict.home.clear)}" data-i18n-aria="home.clear"${searchQuery ? "" : " hidden"}>${iconClose()}</button>
    </div>
    <div class="locale-switch" role="group" aria-label="${esc(dict.locale.label)}" data-i18n-aria="locale.label">
      <span class="locale-thumb" aria-hidden="true"></span>
      <button type="button" class="locale-btn" data-set-locale="zh" aria-label="${esc(dict.locale.zh)}" aria-pressed="${locale === "zh" ? "true" : "false"}">中</button>
      <button type="button" class="locale-btn" data-set-locale="en" aria-label="${esc(dict.locale.en)}" aria-pressed="${locale === "en" ? "true" : "false"}">EN</button>
    </div>
  </div>
</header>`;
}

export function renderBadge(text, tone = "neutral", extraClass = "") {
  return `<span class="badge badge--${esc(tone)}${extraClass ? ` ${esc(extraClass)}` : ""}"><span class="badge-dot"></span><span>${esc(text)}</span></span>`;
}

export function renderSpecCell(label, value, tone = "neutral", unknown = false) {
  return `<div class="spec-cell${unknown ? " is-unknown" : ""}">
    <span class="spec-k">${esc(label)}</span>
    <span class="spec-v"><span class="spec-dot spec-dot--${esc(tone)}"></span><span>${esc(value)}</span></span>
  </div>`;
}

export function renderAgentCard(agent, locale, dict, isOpen = false) {
  const isDiagram = agent.videoPosterKind === "diagram";
  const priceTone = isUncertain("pricing", agent.pricingBadge) ? "unknown" : "lime";
  const detailsHref = `/agent/${agent.id}`;
  const expandLabel = formatTemplate(dict.home.expand, { name: agent.name });
  const playLabel = formatTemplate(dict.motion.play, { name: agent.name });

  const mediaStage = agent.videoPoster
    ? `<img src="${esc(agent.videoPoster)}" alt="" loading="lazy" class="card-stage-media${isDiagram ? " is-diagram" : ""}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
       <div class="card-stage-fallback" style="display:none"><div class="card-stage-medallion"><img src="${esc(agent.logo)}" alt=""></div></div>`
    : `<div class="card-stage-fallback"><div class="card-stage-medallion"><img src="${esc(agent.logo)}" alt=""></div></div>`;

  const specs = [
    [dict.columns.perception, perceptionLabel(locale, agent.perception), badgeTone("perception", agent.perception), isUncertain("perception", agent.perception)],
    [dict.columns.host, hostingLabel(locale, agent.hosting), badgeTone("hosting", agent.hosting), false],
    [dict.columns.mcp, mcpLabel(locale, agent.mcp), badgeTone("mcp", agent.mcp), isUncertain("mcp", agent.mcp)],
    [dict.columns.credentials, authLabel(locale, agent.authModel), badgeTone("auth", agent.authModel), isUncertain("auth", agent.authModel)],
    [dict.columns.antiBot, agent.antiBotBadge, badgeTone("antiBot", agent.antiBotBadge), isUncertain("antiBot", agent.antiBotBadge)],
    [dict.columns.license, licenseLabel(locale, agent.license), badgeTone("license", agent.license), isUncertain("license", agent.license)]
  ];

  return `<li class="card-slot" id="agent-${esc(agent.id)}">
  <article class="agent-card${isOpen ? " is-open" : ""}" data-card="${esc(agent.id)}">
    <div class="card-stage" style="background:${esc(agent.pastel)}">
      <a href="${esc(detailsHref)}" class="card-stage-link" aria-label="${esc(dict.home.details)} ${esc(agent.name)}"></a>
      ${mediaStage}
      ${renderBadge(agent.pricingBadge, priceTone, "stage-price-badge")}
      <button type="button" class="compare-toggle-btn" data-compare-id="${esc(agent.id)}" aria-pressed="false" aria-label="${esc(dict.compare.add)} ${esc(agent.name)}">
        ${iconPlus()}
        <span data-compare-label>${esc(dict.compare.add)}</span>
      </button>
      ${
        agent.video
          ? `<button type="button" class="play-demo-btn" data-play-id="${esc(agent.id)}" aria-label="${esc(playLabel)}">${iconPlay()}</button>`
          : ""
      }
    </div>
    <div class="card-body">
      <div class="card-head">
        <div class="card-logo-box"><img src="${esc(agent.logo)}" alt="" width="32" height="32" loading="lazy"></div>
        <div class="card-title-wrap">
          <a href="${esc(detailsHref)}" class="card-title">${esc(agent.name)}</a>
          <p class="card-vendor">${esc(agent.steward)}</p>
        </div>
        <button type="button" class="expand-btn" data-expand-id="${esc(agent.id)}" aria-expanded="${isOpen ? "true" : "false"}" aria-label="${esc(expandLabel)}">
          ${iconChevronDown()}
        </button>
      </div>
      <div class="spec-grid">
        ${specs.map(([k, v, tone, unk]) => renderSpecCell(k, v, tone, unk)).join("")}
      </div>
      <div class="card-foot">
        <span class="card-date tabular-nums">${esc(agent.lastChecked)}</span>
        <a href="${esc(detailsHref)}" class="card-dossier-link">
          <span data-i18n="home.details">${esc(dict.home.details)}</span>
          ${iconArrowRight()}
        </a>
      </div>
    </div>
  </article>
</li>`;
}

export function renderWeChatBlock(dict) {
  return `<div class="wechat-card">
    <img src="/wechat-qr.jpg" alt="WeChat QR" width="64" height="64" loading="lazy" class="wechat-qr">
    <div class="wechat-meta">
      <div><strong data-i18n="contact.wechatId">${esc(dict.contact.wechatId)}</strong></div>
      <div data-i18n="contact.wechatOa">${esc(dict.contact.wechatOa)}</div>
      <button type="button" class="wechat-copy-btn" data-copy="maoxunxing" data-copy-default="contact.copyId" data-copy-done="contact.copied">
        ${iconCopy()}
        <span>${esc(dict.contact.copyId)}</span>
      </button>
    </div>
  </div>`;
}

export function renderHomeFooter({ agents, coverage, locale, dict }) {
  const popular = agents.slice(0, 5);
  const tagText = formatTemplate(dict.footer.tag, { count: agents.length });
  const covText = locale === "zh" ? coverage.zh : coverage.en;

  return `<footer class="bb-footer">
  <div class="container bbf-wrap">
    <div class="bbf-top">
      <div>
        <a href="/" class="bbf-logo">
          <img src="/browseboard.svg" alt="" width="36" height="36">
          <span>${BRAND_NAME}</span>
        </a>
        <p class="bbf-tag" data-footer-tag>${esc(tagText)}</p>
        <p class="bbf-note" data-i18n="footer.built">${esc(dict.footer.built)}</p>
        <p class="bbf-note" data-coverage-text>${esc(covText)}</p>
        ${renderWeChatBlock(dict)}
      </div>
      <nav class="bbf-cols" aria-label="${BRAND_NAME}">
        <div class="bbf-col">
          <h2 data-i18n="footer.explore">${esc(dict.footer.explore)}</h2>
          <a href="/#catalog" data-i18n="footer.all">${esc(dict.footer.all)}</a>
          <a href="/about" data-i18n="nav.method">${esc(dict.nav.method)}</a>
          <a href="/sponsor" data-i18n="nav.sponsor">${esc(dict.nav.sponsor)}</a>
        </div>
        <div class="bbf-col">
          <h2 data-i18n="footer.popular">${esc(dict.footer.popular)}</h2>
          ${popular.map((a) => `<a href="/agent/${esc(a.id)}">${esc(a.name)}</a>`).join("")}
        </div>
        <div class="bbf-col">
          <h2 data-i18n="footer.contribute">${esc(dict.footer.contribute)}</h2>
          <a href="${esc(SUBMIT_URL)}" data-i18n="footer.submit">${esc(dict.footer.submit)}</a>
          <a href="/sponsor" data-i18n="footer.sponsorship">${esc(dict.footer.sponsorship)}</a>
          <a href="/about" data-i18n="footer.coverage">${esc(dict.footer.coverage)}</a>
        </div>
      </nav>
    </div>
    <div class="bbf-bottom">
      <span data-i18n="footer.copy">${esc(dict.footer.copy)}</span>
      <span data-i18n="footer.rights">${esc(dict.footer.rights)}</span>
      <span class="bbf-blinks">
        <a href="/about" data-i18n="nav.method">${esc(dict.nav.method)}</a>
        <a href="/sponsor" data-i18n="nav.sponsor">${esc(dict.nav.sponsor)}</a>
        <a href="#top" data-i18n="footer.top">${esc(dict.footer.top)}</a>
      </span>
    </div>
  </div>
</footer>`;
}

export function renderSimpleFooter({ coverage, dict }) {
  return `<footer class="simple-footer">
  <div class="container" style="display:flex;flex-direction:column;gap:0.9rem;color:var(--ink-2);font-size:0.9375rem;line-height:1.65;">
    <p data-i18n="footer.docs">${esc(dict.footer.docs)}</p>
    <p lang="zh-CN">${esc(coverage.zh)}</p>
    <p lang="en">${esc(coverage.en)}</p>
    <div style="display:flex;gap:1.25rem;">
      <a href="/about" style="font-weight:700;color:var(--ink)" data-i18n="nav.method">${esc(dict.nav.method)}</a>
      <a href="/sponsor" style="font-weight:700;color:var(--ink)" data-i18n="nav.sponsor">${esc(dict.nav.sponsor)}</a>
      <a href="/" style="font-weight:700;color:var(--ink)" data-i18n="nav.matrix">${esc(dict.nav.matrix)}</a>
    </div>
    <div>${renderWeChatBlock(dict)}</div>
  </div>
</footer>`;
}

export function renderDetailFooter({ dict }) {
  return `<footer class="bbd-footer">
  <span data-i18n="detail.line">${esc(dict.detail.line)}</span>
</footer>`;
}
