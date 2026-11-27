import {
  DICT,
  LOCALE_COOKIE,
  authLabel,
  badgeTone,
  formatTemplate,
  hostingLabel,
  isUncertain,
  licenseLabel,
  mcpLabel,
  perceptionLabel
} from "../i18n/dict.js";

const svg = (w, d, fill) =>
  `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="${fill ? "currentColor" : "none"}"${fill ? "" : ' stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'} aria-hidden="true">${d}</svg>`;

const SVG_ICONS = {
  play: svg(16, '<path d="M6 4.75a1.25 1.25 0 0 1 1.9-.1l11.5 7.25a1.25 1.25 0 0 1 0 2.1l-11.5 7.25A1.25 1.25 0 0 1 6 20.2V4.75Z"/>', true),
  plus: svg(12, '<path d="M12 5v14M5 12h14"/>'),
  check: svg(12, '<path d="M20 6 9 17l-5-5"/>'),
  chevronDown: svg(16, '<path d="m6 9 6 6 6-6"/>'),
  chevronRight: svg(16, '<path d="m9 18 6-6-6-6"/>'),
  arrowRight: svg(14, '<path d="M5 12h14m-7-7 7 7-7 7"/>'),
  close: svg(13, '<path d="M18 6 6 18M6 6l12 12"/>'),
  external: svg(13, '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>')
};

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getByPath(obj, path) {
  let cur = obj;
  for (const part of path.split(".")) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function badgeHtml(text, tone = "neutral", extraClass = "") {
  return `<span class="badge badge--${esc(tone)}${extraClass ? ` ${esc(extraClass)}` : ""}"><span class="badge-dot" aria-hidden="true"></span><span>${esc(text)}</span></span>`;
}

function specCellHtml(k, v, tone, unk) {
  return `<div class="spec-cell${unk ? " is-unknown" : ""}">
    <span class="spec-k">${esc(k)}</span>
    <span class="spec-v"><span class="spec-dot spec-dot--${esc(tone)}" aria-hidden="true"></span><span>${esc(v)}</span></span>
  </div>`;
}

function parseJsonScript(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent || "");
  } catch {
    return null;
  }
}

(function initApp() {
  const pageType = document.documentElement.dataset.page || "page";
  let locale = document.documentElement.dataset.locale === "zh" ? "zh" : "en";

  const homeData = parseJsonScript("__BROWSLY_DATA__");
  const agentData = parseJsonScript("__BROWSLY_AGENT__");
  const pageI18n = parseJsonScript("__BROWSLY_I18N__");
  if (pageI18n && pageI18n.key) {
    DICT.en[pageI18n.key] = pageI18n.en;
    DICT.zh[pageI18n.key] = pageI18n.zh;
  }
  const agentMap = new Map((homeData?.agents || []).map((a) => [a.id, a]));

  const state = {
    query: new URLSearchParams(window.location.search).get("q") || "",
    preset: "all",
    perception: new Set(),
    hosting: new Set(),
    mcp: new Set(),
    credentials: new Set(),
    hasDemo: false,
    openOnly: false,
    sort: "curated",
    view: "cards",
    expandedId: null,
    spotlightId: null,
    compareIds: [],
    demoAgentId: null,
    lastFocusEl: null
  };

  const toastEl = document.getElementById("toast-pill");
  let toastTimer = 0;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
  }

  /* ---------- Scroll Elevation, Progress Hairline & Back-to-Top ---------- */
  const headerEl = document.getElementById("site-header");
  const hasProgress = Boolean(document.querySelector(".scroll-progress"));
  const backTopBtn = document.getElementById("back-to-top");
  let scrollRaf = 0;
  function updateScrollUi() {
    scrollRaf = 0;
    const y = window.scrollY || window.pageYOffset || 0;
    if (headerEl) {
      headerEl.dataset.scrolled = y > 8 ? "true" : "false";
    }
    if (backTopBtn) {
      backTopBtn.classList.toggle("is-visible", y > 680);
    }
    if (hasProgress) {
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, y / max));
      doc.style.setProperty("--scroll-progress", ratio.toFixed(4));
    }
  }
  backTopBtn?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollRaf) scrollRaf = window.requestAnimationFrame(updateScrollUi);
    },
    { passive: true }
  );
  updateScrollUi();

  /* ---------- Restrained Below-the-Fold Scroll Reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length > 0 && !prefersReducedMotion() && "IntersectionObserver" in window) {
    document.documentElement.classList.add("has-reveal");
    const ro = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            ro.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
    );
    revealEls.forEach((el) => ro.observe(el));
  }

  /* ---------- Locale Switching (Zero Reload) ---------- */
  function readStoredLocale() {
    try {
      const ls = window.localStorage.getItem(LOCALE_COOKIE);
      if (ls === "zh" || ls === "en") return ls;
    } catch {}
    const prefix = `${LOCALE_COOKIE}=`;
    const match = document.cookie.split("; ").find((c) => c.startsWith(prefix));
    const ck = match ? decodeURIComponent(match.slice(prefix.length)) : null;
    return ck === "zh" || ck === "en" ? ck : null;
  }

  function applyStaticTranslations(nextLocale) {
    const dict = DICT[nextLocale];
    document.documentElement.lang = nextLocale === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.locale = nextLocale;

    document.querySelectorAll("[data-set-locale]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.setLocale === nextLocale ? "true" : "false");
    });

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = getByPath(dict, el.dataset.i18n);
      if (typeof val === "string") el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const val = getByPath(dict, el.dataset.i18nPlaceholder);
      if (typeof val === "string") el.setAttribute("placeholder", val);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const val = getByPath(dict, el.dataset.i18nAria);
      if (typeof val === "string") el.setAttribute("aria-label", val);
    });

    document.querySelectorAll("[data-copy-default]").forEach((btn) => {
      if (!btn.classList.contains("is-copied")) {
        const val = getByPath(dict, btn.dataset.copyDefault);
        const span = btn.querySelector("span");
        if (typeof val === "string" && span) span.textContent = val;
      }
    });

    const covEl = document.querySelector("[data-coverage-text]");
    if (covEl && !homeData) {
      const cVal = nextLocale === "zh" ? covEl.dataset.coverageZh : covEl.dataset.coverageEn;
      if (cVal) covEl.textContent = cVal;
    }

    if (homeData) {
      const eyebrow = document.querySelector("[data-hero-eyebrow]");
      if (eyebrow) eyebrow.textContent = formatTemplate(dict.home.eyebrow, { date: homeData.checked });

      const tag = document.querySelector("[data-footer-tag]");
      if (tag) tag.textContent = formatTemplate(dict.footer.tag, { count: homeData.agents.length });

      const cov = document.querySelector("[data-coverage-text]");
      if (cov) cov.textContent = nextLocale === "zh" ? homeData.coverage.zh : homeData.coverage.en;

      const skillFile = nextLocale === "zh" ? "SKILL.zh-CN.md" : "SKILL.md";
      const skillCopy = document.getElementById("api-skill-copy-btn");
      if (skillCopy) skillCopy.dataset.copy = `https://browserly.maoxunxing.com/${skillFile}`;
      syncHeroQuickCopy(nextLocale);

      document.querySelectorAll("[data-filter-group]").forEach((input) => {
        const grp = input.dataset.filterGroup;
        const val = input.value;
        const labelEl = input.closest("label")?.querySelector(".filter-label");
        if (!labelEl) return;
        if (grp === "perception") labelEl.textContent = perceptionLabel(nextLocale, val);
        else if (grp === "hosting") labelEl.textContent = hostingLabel(nextLocale, val);
        else if (grp === "mcp") labelEl.textContent = mcpLabel(nextLocale, val);
        else if (grp === "credentials") labelEl.textContent = authLabel(nextLocale, val);
      });

      document.title = dict.meta.title;
    } else if (pageType === "skill") {
      document.title = `${dict.skillPage.title} — Browserly`;
      const spPrompt = document.getElementById("skill-page-prompt");
      const spBtn = document.getElementById("skill-page-prompt-btn");
      if (spPrompt) spPrompt.textContent = dict.home.quickCopy.promptText;
      if (spBtn) spBtn.dataset.copy = dict.home.quickCopy.promptText;
    } else if (pageType === "about") {
      document.title = `${dict.about.title} — Browserly`;
      const legendBadges = document.querySelectorAll("#about-legend .badge span:last-child");
      dict.about.legendItems.forEach((item, idx) => {
        if (legendBadges[idx]) legendBadges[idx].textContent = item.label;
      });
    } else if (pageType === "sponsor") {
      document.title = `${dict.sponsor.title} — Browserly`;
    } else if (pageType === "agent" && agentData) {
      document.title = `${agentData.agent.name} — Browserly`;
      renderAgentDossierDynamic(nextLocale);
    }
  }

  function setLocale(nextLocale, persist = true) {
    if (nextLocale !== "zh" && nextLocale !== "en") return;
    locale = nextLocale;
    if (persist) {
      try {
        window.localStorage.setItem(LOCALE_COOKIE, nextLocale);
      } catch {}
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    }
    applyStaticTranslations(nextLocale);
    if (homeData) {
      renderCatalog();
      renderCompareDock();
      if (isCompareModalOpen()) renderCompareModal();
      if (isAdvisorModalOpen()) {
        renderAdvisorControls();
        fetchAdvisorResults();
      }
      if (state.demoAgentId) renderDemoDrawer(state.demoAgentId);
    }
  }

  document.querySelectorAll("[data-set-locale]").forEach((btn) => {
    btn.addEventListener("click", () => setLocale(btn.dataset.setLocale, true));
  });

  let heroQcMode = "prompt";
  function syncHeroQuickCopy(loc = locale) {
    const qc = DICT[loc].home.quickCopy;
    const codeEl = document.getElementById("hero-qc-code");
    const copyEl = document.getElementById("hero-qc-copy");
    const hintEl = document.getElementById("hero-qc-hint");
    if (!codeEl || !copyEl || !hintEl) return;
    const isCli = heroQcMode === "cli";
    const text = isCli ? qc.cliText : qc.promptText;
    codeEl.textContent = text;
    copyEl.dataset.copy = text;
    hintEl.textContent = isCli ? qc.hintCli : qc.hintPrompt;
    document.querySelectorAll("[data-qc-mode]").forEach((btn) => {
      btn.setAttribute("aria-selected", btn.dataset.qcMode === heroQcMode ? "true" : "false");
    });
  }
  document.querySelectorAll("[data-qc-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      heroQcMode = btn.dataset.qcMode === "cli" ? "cli" : "prompt";
      syncHeroQuickCopy(locale);
    });
  });

  /* ---------- Copy Buttons ---------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  document.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.dataset.copy;
    if (!text) return;
    await copyText(text);
    const dict = DICT[locale];
    const span = btn.querySelector("span");
    const doneKey = btn.dataset.copyDone;
    const defKey = btn.dataset.copyDefault;
    const toastKey = btn.dataset.copyToast;
    if (span && doneKey) {
      span.textContent = getByPath(dict, doneKey) || "Copied";
    }
    if (toastKey) {
      const msg = getByPath(dict, toastKey);
      if (typeof msg === "string") showToast(msg);
    }
    const oldSvg = btn.querySelector("svg");
    const origSvgHtml = oldSvg && !btn.dataset.origSvg ? oldSvg.outerHTML : btn.dataset.origSvg;
    if (oldSvg && origSvgHtml) {
      btn.dataset.origSvg = origSvgHtml;
      oldSvg.outerHTML = SVG_ICONS.check;
    }
    btn.classList.add("is-copied");
    window.clearTimeout(Number(btn.dataset.copyTimer || 0));
    btn.dataset.copyTimer = String(
      window.setTimeout(() => {
        btn.classList.remove("is-copied");
        if (span && defKey) {
          span.textContent = getByPath(DICT[locale], defKey) || span.textContent;
        }
        const curSvg = btn.querySelector("svg");
        if (curSvg && btn.dataset.origSvg) {
          curSvg.outerHTML = btn.dataset.origSvg;
        }
      }, 1800)
    );
  });

  /* ---------- Search & Global Shortcuts ---------- */
  const searchInput = document.getElementById("global-search");
  const searchClearBtn = document.getElementById("search-clear-btn");
  const searchKbd = document.getElementById("search-kbd");

  function syncSearchAffordance() {
    if (!searchInput) return;
    const hasVal = searchInput.value.trim().length > 0;
    if (searchClearBtn) searchClearBtn.hidden = !hasVal;
    if (searchKbd) searchKbd.style.display = hasVal ? "none" : "";
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value;
      syncSearchAffordance();
      if (homeData) {
        renderCatalog();
        const url = new URL(window.location.href);
        if (state.query.trim()) url.searchParams.set("q", state.query.trim());
        else url.searchParams.delete("q");
        window.history.replaceState(null, "", url.toString());
      }
    });

    searchInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !homeData) {
        const q = searchInput.value.trim();
        window.location.href = q ? `/?q=${encodeURIComponent(q)}#catalog` : "/";
      } else if (ev.key === "Escape") {
        if (searchInput.value) {
          searchInput.value = "";
          state.query = "";
          syncSearchAffordance();
          if (homeData) renderCatalog();
        } else {
          searchInput.blur();
        }
      }
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener("click", () => {
      searchInput.value = "";
      state.query = "";
      syncSearchAffordance();
      if (homeData) {
        const url = new URL(window.location.href);
        url.searchParams.delete("q");
        window.history.replaceState(null, "", url.toString());
        renderCatalog();
      }
      searchInput.focus();
    });
  }

  window.addEventListener("keydown", (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "k") {
      if (searchInput) {
        ev.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    } else if (
      ev.key === "/" &&
      !ev.metaKey &&
      !ev.ctrlKey &&
      !ev.altKey &&
      document.activeElement &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    ) {
      if (searchInput) {
        ev.preventDefault();
        searchInput.focus();
      }
    } else if (ev.key === "Escape" && homeData) {
      if (isAdvisorModalOpen()) closeAdvisorModal();
      else if (isCompareModalOpen()) closeCompareModal();
      else if (state.demoAgentId) closeDemoDrawer();
    } else if (ev.key === "Tab" && homeData) {
      const activeModal = isAdvisorModalOpen()
        ? advisorBackdrop
        : isCompareModalOpen()
          ? compareBackdrop
          : state.demoAgentId
            ? demoDrawer
            : null;
      if (activeModal) {
        const focusables = [...activeModal.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(
          (el) => el.offsetParent !== null
        );
        if (focusables.length > 0) {
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (ev.shiftKey && document.activeElement === first) {
            ev.preventDefault();
            last.focus();
          } else if (!ev.shiftKey && document.activeElement === last) {
            ev.preventDefault();
            first.focus();
          }
        }
      }
    }
  });

  syncSearchAffordance();

  /* ---------- Agent Dossier Dynamic Locale Support & Video Resilience ---------- */
  function renderAgentDossierDynamic(loc) {
    if (!agentData) return;
    const dict = DICT[loc];
    const a = agentData.agent;
    const story = agentData.stories[loc] || agentData.stories.en;

    const badgesEl = document.getElementById("dossier-badges");
    if (badgesEl) {
      badgesEl.innerHTML = [
        badgeHtml(perceptionLabel(loc, a.perception), badgeTone("perception", a.perception)),
        badgeHtml(a.pricingBadge, isUncertain("pricing", a.pricingBadge) ? "unknown" : "lime"),
        badgeHtml(a.antiBotBadge, badgeTone("antiBot", a.antiBotBadge)),
        badgeHtml(licenseLabel(loc, a.license), badgeTone("license", a.license))
      ].join("");
    }

    const storyEl = document.getElementById("dossier-story");
    if (storyEl && story) {
      const sectionsHtml = story.sections
        .map(
          (sec) =>
            `<h3 class="dossier-section-h">${esc(dict.columns[sec.key] || dict.detail[sec.key] || sec.key)}</h3>` +
            `<p class="dossier-section-p">${esc(sec.body)}</p>`
        )
        .join("");
      storyEl.innerHTML = `<p class="verdict-callout">${esc(story.verdict)}</p>${sectionsHtml}`;
    }

    const specsEl = document.getElementById("dossier-specs");
    if (specsEl) {
      const hostMap = {
        "self-host": dict.detail.selfHost,
        cloud: dict.detail.cloud,
        both: dict.detail.both
      };
      const rows = [
        [dict.columns.perception, perceptionLabel(loc, a.perception)],
        [dict.detail.hosting, hostMap[a.hosting]],
        [dict.columns.mcp, mcpLabel(loc, a.mcp)],
        [dict.columns.credentials, dict.detail.credential[a.credKey] || a.authModel],
        [dict.columns.antiBot, a.antiBotBadge],
        [dict.detail.pricing, a.pricingBadge],
        [dict.columns.license, licenseLabel(loc, a.license)],
        [dict.detail.status, dict.detail.active],
        [dict.detail.checked, a.lastChecked]
      ];
      specsEl.innerHTML = rows
        .map(([k, v]) => `<div class="kv-row"><span class="kv-k">${esc(k)}</span><span class="kv-v">${esc(v)}</span></div>`)
        .join("");
    }
  }

  const dossierVideo = document.getElementById("dossier-video");
  if (dossierVideo) {
    if (prefersReducedMotion()) dossierVideo.pause();
    if (dossierVideo.readyState >= 2) dossierVideo.classList.add("is-ready");
    dossierVideo.addEventListener("loadeddata", () => dossierVideo.classList.add("is-ready"));
    dossierVideo.addEventListener("error", () => {
      dossierVideo.style.display = "none";
    });
    window.setTimeout(() => {
      if (dossierVideo.readyState === 0) dossierVideo.style.display = "none";
    }, 6000);
  }

  /* ---------- Homepage Catalog, Compare, Demo Drawer ---------- */
  if (!homeData) {
    const stored = readStoredLocale();
    if (stored && stored !== locale) setLocale(stored, false);
    return;
  }

  const cardsGrid = document.getElementById("cards-grid");
  const tableContainer = document.getElementById("table-container");
  const emptyState = document.getElementById("empty-state");
  const showingCountEl = document.getElementById("showing-count");
  const activeChipsEl = document.getElementById("active-chips");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  const mobileFilterToggle = document.getElementById("mobile-filter-toggle");
  const filterSidebar = document.getElementById("filter-sidebar");
  const mobileFilterCount = document.getElementById("mobile-filter-count");
  const viewSwitchEl = document.getElementById("view-switch");

  function matchesPreset(agent, preset) {
    if (preset === "local-free") {
      return agent.hosting !== "cloud" && (agent.pricingBadge === "Free" || agent.pricingBadge === "OSS");
    }
    if (preset === "mcp") return agent.mcp === "yes";
    if (preset === "cloud-stealth") {
      return agent.hosting !== "self-host" && (agent.antiBotBadge === "Stealth" || agent.antiBotBadge === "CAPTCHA");
    }
    if (preset === "demo") return Boolean(agent.video);
    if (preset === "hybrid") return agent.perception === "hybrid";
    if (preset === "open") return agent.unknowns.length > 0;
    return true;
  }

  function matchesSearch(agent, qRaw) {
    const q = qRaw.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      agent.name,
      agent.steward,
      agent.license,
      licenseLabel(locale, agent.license),
      perceptionLabel(locale, agent.perception),
      hostingLabel(locale, agent.hosting),
      mcpLabel(locale, agent.mcp),
      authLabel(locale, agent.authModel),
      agent.antiBotBadge,
      agent.pricingBadge,
      agent.hostingNote,
      agent.pricing
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  }

  function matchesFacets(agent, skipFacet = null) {
    if (skipFacet !== "preset" && !matchesPreset(agent, state.preset)) return false;
    if (skipFacet !== "perception" && state.perception.size > 0 && !state.perception.has(agent.perception)) return false;
    if (skipFacet !== "hosting" && state.hosting.size > 0 && !state.hosting.has(agent.hosting)) return false;
    if (skipFacet !== "mcp" && state.mcp.size > 0 && !state.mcp.has(agent.mcp)) return false;
    if (skipFacet !== "credentials" && state.credentials.size > 0 && !state.credentials.has(agent.authModel)) return false;
    if (skipFacet !== "demo" && state.hasDemo && !agent.video) return false;
    if (skipFacet !== "open" && state.openOnly && agent.unknowns.length === 0) return false;
    return matchesSearch(agent, state.query);
  }

  function getFilteredAgents() {
    const rows = homeData.agents.filter((a) => matchesFacets(a));
    if (state.sort === "name") {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sort === "checked") {
      rows.sort((a, b) => b.lastChecked.localeCompare(a.lastChecked));
    }
    return rows;
  }

  function updateSidebarCounts() {
    const all = homeData.agents;
    document.querySelectorAll("[data-count-for]").forEach((el) => {
      const [grp, val] = el.dataset.countFor.split(":");
      const n = all.filter((a) => {
        if (!matchesFacets(a, grp)) return false;
        if (grp === "perception") return a.perception === val;
        if (grp === "hosting") return a.hosting === val;
        if (grp === "mcp") return a.mcp === val;
        if (grp === "credentials") return a.authModel === val;
        return false;
      }).length;
      el.textContent = String(n);
      const label = el.closest("label");
      if (label) label.classList.toggle("is-disabled", n === 0);
    });
    const demoEl = document.getElementById("count-demo");
    if (demoEl) demoEl.textContent = String(all.filter((a) => matchesFacets(a, "demo") && Boolean(a.video)).length);
    const openEl = document.getElementById("count-open");
    if (openEl) openEl.textContent = String(all.filter((a) => matchesFacets(a, "open") && a.unknowns.length > 0).length);
  }

  function renderEvidenceMedia(agent, autoplay) {
    const dict = DICT[locale];
    const startLabel = formatTemplate(dict.motion.start, { name: agent.name });
    const linkHref = agent.video ? agent.videoSource || agent.docsUrl : agent.docsUrl;
    const linkLabel = agent.video ? dict.motion.source : dict.motion.docs;

    let stage = "";
    if (agent.youtubeId && autoplay) {
      stage = `<iframe title="${esc(startLabel)}" src="https://www.youtube-nocookie.com/embed/${esc(agent.youtubeId)}?autoplay=1&mute=1&loop=1&playlist=${esc(agent.youtubeId)}&playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe>`;
    } else if (agent.video && autoplay) {
      stage = `<video src="${esc(agent.video)}" poster="${esc(agent.videoPoster || "")}" muted loop playsinline autoplay controls onloadeddata="this.classList.add('is-ready')" onerror="this.style.display='none';"></video>`;
    } else if (agent.videoPoster) {
      const isDiag = agent.videoPosterKind === "diagram";
      stage = `<img src="${esc(agent.videoPoster)}" alt="" style="object-fit:${isDiag ? "contain" : "cover"};background:${isDiag ? "#fff" : "transparent"};padding:${isDiag ? "0.75rem" : "0"}" onerror="this.style.display='none';">`;
    }

    const gateBtn =
      agent.video && !autoplay
        ? `<button type="button" class="media-gate-btn" data-play-inline="${esc(agent.id)}" aria-label="${esc(startLabel)}"><span>${SVG_ICONS.play}</span></button>`
        : "";

    return `<div class="evidence-media-col">
      <div class="media-frame" style="background:${esc(agent.pastel)}">
        <div class="card-stage-fallback"><div class="card-stage-medallion"><img src="${esc(agent.logo)}" alt=""></div></div>
        ${stage}
        ${gateBtn}
      </div>
      <a href="${esc(linkHref)}" target="_blank" rel="noreferrer" class="ev-src-link">
        <span>${esc(linkLabel)}</span>
        ${SVG_ICONS.external}
      </a>
    </div>`;
  }

function sourceLabel(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "");
    const p = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return p ? `${host}${p}` : host;
  } catch {
    return rawUrl;
  }
}

function renderEvidencePanel(agent, showTitle = true) {
    const dict = DICT[locale];
    const facts = [
      [dict.columns.perception, agent.perceptionNote],
      [dict.columns.license, agent.licenseNote],
      [dict.columns.host, agent.hostingNote],
      [dict.columns.mcp, agent.mcpNote],
      [dict.columns.credentials, agent.credentials],
      [dict.columns.antiBot, agent.antiBot],
      [dict.columns.price, agent.pricing]
    ].filter(([, v]) => Boolean(v));

    const canAutoplay = Boolean(agent.video) && !prefersReducedMotion();

    return `<div class="evidence-card" data-evidence-for="${esc(agent.id)}">
      <div class="evidence-layout">
        ${renderEvidenceMedia(agent, canAutoplay)}
        <div class="evidence-facts-col">
          <div class="evidence-head">
            ${showTitle ? `<h3 class="evidence-title">${esc(agent.name)}</h3>` : "<span></span>"}
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              <a href="/agent/${esc(agent.id)}" class="btn btn-lime btn-sm">
                <span>${esc(dict.home.details)}</span>
                ${SVG_ICONS.arrowRight}
              </a>
              <button type="button" class="btn btn-ghost btn-sm" data-expand-id="${esc(agent.id)}">
                ${esc(dict.motion.close)}
              </button>
            </div>
          </div>
          <dl class="facts-dl">
            ${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}
          </dl>
          <div class="sources-row">
            <ul class="source-links">
              ${agent.sources
                .map((url) => `<li><a href="${esc(url)}" target="_blank" rel="noreferrer">${esc(sourceLabel(url))}</a></li>`)
                .join("")}
            </ul>
            <span class="card-date tabular-nums">${esc(agent.lastChecked)}</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderCardItem(agent) {
    const dict = DICT[locale];
    const isOpen = state.expandedId === agent.id;
    const isSpot = state.spotlightId === agent.id;
    const isCompared = state.compareIds.includes(agent.id);
    const isDiag = agent.videoPosterKind === "diagram";
    const priceTone = isUncertain("pricing", agent.pricingBadge) ? "unknown" : "lime";
    const detailsHref = `/agent/${agent.id}`;
    const expandLabel = formatTemplate(dict.home.expand, { name: agent.name });
    const playLabel = formatTemplate(dict.motion.play, { name: agent.name });

    const mediaStage = agent.videoPoster
      ? `<img src="${esc(agent.videoPoster)}" alt="" width="640" height="380" loading="lazy" decoding="async" class="card-stage-media${isDiag ? " is-diagram" : ""}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div class="card-stage-fallback" style="display:none;background:${esc(agent.pastel)}"><div class="card-stage-medallion"><img src="${esc(agent.logo)}" alt="" width="48" height="48" loading="lazy" decoding="async"></div></div>`
      : `<div class="card-stage-fallback" style="background:${esc(agent.pastel)}"><div class="card-stage-medallion"><img src="${esc(agent.logo)}" alt="" width="48" height="48" loading="lazy" decoding="async"></div></div>`;

    const specs = [
      [dict.columns.perception, perceptionLabel(locale, agent.perception), badgeTone("perception", agent.perception), isUncertain("perception", agent.perception)],
      [dict.columns.host, hostingLabel(locale, agent.hosting), badgeTone("hosting", agent.hosting), false],
      [dict.columns.mcp, mcpLabel(locale, agent.mcp), badgeTone("mcp", agent.mcp), isUncertain("mcp", agent.mcp)],
      [dict.columns.credentials, authLabel(locale, agent.authModel), badgeTone("auth", agent.authModel), isUncertain("auth", agent.authModel)],
      [dict.columns.antiBot, agent.antiBotBadge, badgeTone("antiBot", agent.antiBotBadge), isUncertain("antiBot", agent.antiBotBadge)],
      [dict.columns.license, licenseLabel(locale, agent.license), badgeTone("license", agent.license), isUncertain("license", agent.license)]
    ];

    return `<li class="card-slot" id="agent-${esc(agent.id)}" data-agent-id="${esc(agent.id)}">
      <article class="agent-card${isOpen ? " is-open" : ""}${isSpot ? " is-spotlight" : ""}" data-card="${esc(agent.id)}">
        <div class="card-stage${agent.videoPoster && !isDiag ? " has-photo" : ""}" style="background:${esc(agent.pastel)}">
          <a href="${esc(detailsHref)}" class="card-stage-link" aria-label="${esc(dict.home.details)} ${esc(agent.name)}"></a>
          ${mediaStage}
          ${badgeHtml(agent.pricingBadge, priceTone, "stage-price-badge")}
          <button type="button" class="compare-toggle-btn" data-compare-id="${esc(agent.id)}" aria-pressed="${isCompared ? "true" : "false"}" aria-label="${esc(isCompared ? dict.compare.added : dict.compare.add)} ${esc(agent.name)}">
            ${isCompared ? SVG_ICONS.check : SVG_ICONS.plus}
            <span>${esc(isCompared ? dict.compare.added : dict.compare.add)}</span>
          </button>
          ${
            agent.video
              ? `<button type="button" class="play-demo-btn" data-play-id="${esc(agent.id)}" aria-label="${esc(playLabel)}">${SVG_ICONS.play}</button>`
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
              ${SVG_ICONS.chevronDown}
            </button>
          </div>
          <div class="spec-grid">
            ${specs.map(([k, v, tone, unk]) => specCellHtml(k, v, tone, unk)).join("")}
          </div>
          <div class="card-foot">
            <span class="card-date tabular-nums">${esc(agent.lastChecked)}</span>
            <a href="${esc(detailsHref)}" class="card-dossier-link">
              <span>${esc(dict.home.details)}</span>
              ${SVG_ICONS.arrowRight}
            </a>
          </div>
        </div>
      </article>
    </li>`;
  }

  function getGridCols() {
    return window.innerWidth >= 1280 ? 3 : window.innerWidth >= 640 ? 2 : 1;
  }

  let tableCueCleanup = null;

  function renderTableView(rows) {
    if (tableCueCleanup) {
      tableCueCleanup();
      tableCueCleanup = null;
    }
    const dict = DICT[locale];
    const cols = [
      dict.columns.perception,
      dict.columns.license,
      dict.columns.host,
      dict.columns.mcp,
      dict.columns.credentials,
      dict.columns.antiBot,
      dict.columns.price
    ];

    const bodyRows = rows
      .map((a) => {
        const isOpen = state.expandedId === a.id;
        const isCompared = state.compareIds.includes(a.id);
        const cells = [
          [perceptionLabel(locale, a.perception), badgeTone("perception", a.perception)],
          [licenseLabel(locale, a.license), badgeTone("license", a.license)],
          [hostingLabel(locale, a.hosting), badgeTone("hosting", a.hosting)],
          [mcpLabel(locale, a.mcp), badgeTone("mcp", a.mcp)],
          [authLabel(locale, a.authModel), badgeTone("auth", a.authModel)],
          [a.antiBotBadge, badgeTone("antiBot", a.antiBotBadge)],
          [a.pricingBadge, isUncertain("pricing", a.pricingBadge) ? "unknown" : "lime"]
        ];

        const mainRow = `<tr class="matrix-row" data-row-id="${esc(a.id)}">
          <th scope="row" class="sticky-col">
            <div class="table-agent-cell">
              <div class="card-logo-box tbl-logo"><img src="${esc(a.logo)}" alt="" width="24" height="24"></div>
              <div class="tbl-meta">
                <div class="tbl-name">${esc(a.name)}</div>
                <div class="tbl-vendor">${esc(a.steward)}</div>
                <div class="tbl-actions">
                  <a href="/agent/${esc(a.id)}" class="tbl-link">${esc(dict.home.shortDetails)}</a>
                  <button type="button" data-compare-id="${esc(a.id)}" aria-pressed="${isCompared ? "true" : "false"}" class="tbl-cmp${isCompared ? " is-on" : ""}">${isCompared ? "✓ " + esc(dict.compare.added) : "+ " + esc(dict.compare.add)}</button>
                </div>
              </div>
              ${
                a.video
                  ? `<button type="button" class="expand-btn tbl-icon" data-play-id="${esc(a.id)}" aria-label="${esc(formatTemplate(dict.motion.play, { name: a.name }))}">${SVG_ICONS.play}</button>`
                  : ""
              }
              <button type="button" class="expand-btn tbl-icon" data-expand-id="${esc(a.id)}" aria-expanded="${isOpen ? "true" : "false"}" aria-label="${esc(formatTemplate(dict.home.expand, { name: a.name }))}">
                ${SVG_ICONS.chevronDown}
              </button>
            </div>
          </th>
          ${cells.map(([t, tone]) => `<td>${badgeHtml(t, tone)}</td>`).join("")}
        </tr>`;

        if (!isOpen) return mainRow;
        return `${mainRow}<tr><td colspan="${cols.length + 1}" class="tbl-exp-td">${renderEvidencePanel(a, false)}</td></tr>`;
      })
      .join("");

    tableContainer.innerHTML = `<div class="table-shell">
      <div class="table-scroll" id="table-scroll" tabindex="0" aria-label="${esc(dict.home.comparison)}">
        <table class="matrix-table">
          <colgroup><col style="width:240px;"><col span="${cols.length}"></colgroup>
          <thead>
            <tr>
              <th scope="col" class="sticky-col">${esc(dict.columns.agent)}</th>
              ${cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
      <div class="table-scroll-cue-left" id="table-cue-left" hidden aria-hidden="true"></div>
      <div class="table-scroll-cue-right" id="table-cue-right" hidden aria-hidden="true">${SVG_ICONS.chevronRight}</div>
    </div>`;

    const scroller = document.getElementById("table-scroll");
    const cueL = document.getElementById("table-cue-left");
    const cueR = document.getElementById("table-cue-right");
    if (scroller && cueL && cueR) {
      const updateCues = () => {
        const max = scroller.scrollWidth - scroller.clientWidth;
        cueL.hidden = scroller.scrollLeft <= 2;
        cueR.hidden = !(max > 2 && scroller.scrollLeft < max - 2);
      };
      updateCues();
      scroller.addEventListener("scroll", updateCues, { passive: true });
      const ro = new ResizeObserver(updateCues);
      ro.observe(scroller);
      tableCueCleanup = () => {
        scroller.removeEventListener("scroll", updateCues);
        ro.disconnect();
      };
    }
  }

  function renderActiveChips() {
    const dict = DICT[locale];
    const chips = [];
    if (state.preset !== "all") {
      const keyMap = {
        "local-free": "localFree",
        mcp: "mcpReady",
        "cloud-stealth": "cloudStealth",
        demo: "hasDemo",
        hybrid: "hybrid",
        open: "needsCheck"
      };
      const k = keyMap[state.preset];
      chips.push({ type: "preset", val: state.preset, label: dict.home.presets[k] || state.preset });
    }
    if (state.query.trim()) {
      chips.push({ type: "query", val: state.query.trim(), label: `“${state.query.trim()}”` });
    }
    for (const v of state.perception) chips.push({ type: "perception", val: v, label: `${dict.columns.perception}: ${perceptionLabel(locale, v)}` });
    for (const v of state.hosting) chips.push({ type: "hosting", val: v, label: `${dict.columns.host}: ${hostingLabel(locale, v)}` });
    for (const v of state.mcp) chips.push({ type: "mcp", val: v, label: `${dict.columns.mcp}: ${mcpLabel(locale, v)}` });
    for (const v of state.credentials) chips.push({ type: "credentials", val: v, label: `${dict.columns.credentials}: ${authLabel(locale, v)}` });
    if (state.hasDemo) chips.push({ type: "demo", val: "1", label: dict.home.hasDemo });
    if (state.openOnly) chips.push({ type: "open", val: "1", label: dict.home.open });

    activeChipsEl.innerHTML = chips
      .map(
        (c) =>
          `<button type="button" class="active-chip" data-remove-chip="${esc(c.type)}" data-chip-val="${esc(c.val)}"><span>${esc(c.label)}</span>${SVG_ICONS.close}</button>`
      )
      .join("");

    const facetCount =
      state.perception.size +
      state.hosting.size +
      state.mcp.size +
      state.credentials.size +
      (state.hasDemo ? 1 : 0) +
      (state.openOnly ? 1 : 0);

    if (clearFiltersBtn) clearFiltersBtn.hidden = facetCount === 0 && state.preset === "all";
    if (mobileFilterCount) {
      mobileFilterCount.hidden = facetCount === 0;
      mobileFilterCount.textContent = String(facetCount);
    }
  }

  function syncFilterInputs() {
    document.querySelectorAll("[data-filter-group]").forEach((cb) => {
      cb.checked = state[cb.dataset.filterGroup]?.has(cb.value) ?? false;
    });
    const demoCb = document.getElementById("filter-demo");
    if (demoCb) demoCb.checked = state.hasDemo;
    const openCb = document.getElementById("filter-open");
    if (openCb) openCb.checked = state.openOnly;

    document.querySelectorAll("[data-preset]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.preset === state.preset ? "true" : "false");
    });
    document.querySelectorAll("[data-sort]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.sort === state.sort ? "true" : "false");
    });
    if (viewSwitchEl) {
      viewSwitchEl.dataset.index = state.view === "table" ? "1" : "0";
      viewSwitchEl.querySelectorAll("[data-view]").forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.dataset.view === state.view ? "true" : "false");
      });
    }
  }

  function renderCatalog() {
    const dict = DICT[locale];
    const rows = getFilteredAgents();
    if (showingCountEl) {
      showingCountEl.textContent = formatTemplate(dict.home.showing, {
        shown: rows.length,
        total: homeData.agents.length
      });
    }
    syncFilterInputs();
    updateSidebarCounts();
    renderActiveChips();

    if (rows.length === 0) {
      cardsGrid.hidden = true;
      tableContainer.hidden = true;
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    if (state.view === "cards") {
      tableContainer.hidden = true;
      cardsGrid.hidden = false;
      const cols = getGridCols();
      const expIdx = state.expandedId ? rows.findIndex((a) => a.id === state.expandedId) : -1;
      const insertAfterIdx =
        expIdx !== -1 ? Math.min(rows.length - 1, Math.floor(expIdx / cols) * cols + cols - 1) : -1;
      cardsGrid.innerHTML = rows
        .map((a, idx) => {
          const card = renderCardItem(a);
          if (idx === insertAfterIdx) {
            const expAgent = rows[expIdx];
            return `${card}<li class="evidence-slot"><div class="evidence-shell is-expanded"><div class="evidence-inner">${renderEvidencePanel(expAgent, true)}</div></div></li>`;
          }
          return card;
        })
        .join("");
    } else {
      cardsGrid.hidden = true;
      tableContainer.hidden = false;
      renderTableView(rows);
    }
  }

  let lastCols = getGridCols();
  window.addEventListener("resize", () => {
    const nextCols = getGridCols();
    if (nextCols !== lastCols) {
      lastCols = nextCols;
      if (state.view === "cards" && state.expandedId) renderCatalog();
    }
  });

  function resetAllFilters() {
    state.preset = "all";
    state.perception.clear();
    state.hosting.clear();
    state.mcp.clear();
    state.credentials.clear();
    state.hasDemo = false;
    state.openOnly = false;
    state.query = "";
    if (searchInput) searchInput.value = "";
    syncSearchAffordance();
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());
    renderCatalog();
  }

  /* ---------- Sidebar, Presets, View, Sort & Card Delegation ---------- */
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.preset = btn.dataset.preset || "all";
      renderCatalog();
    });
  });

  document.querySelectorAll("[data-quick-stat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      resetAllFilters();
      if (btn.dataset.quickStat === "demo") state.preset = "demo";
      renderCatalog();
      document.getElementById("catalog")?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  document.querySelectorAll("[data-filter-group]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const set = state[cb.dataset.filterGroup];
      if (!set) return;
      if (cb.checked) set.add(cb.value);
      else set.delete(cb.value);
      renderCatalog();
    });
  });

  document.getElementById("filter-demo")?.addEventListener("change", (ev) => {
    state.hasDemo = Boolean(ev.target.checked);
    renderCatalog();
  });

  document.getElementById("filter-open")?.addEventListener("change", (ev) => {
    state.openOnly = Boolean(ev.target.checked);
    renderCatalog();
  });

  clearFiltersBtn?.addEventListener("click", resetAllFilters);
  document.getElementById("empty-reset-btn")?.addEventListener("click", resetAllFilters);

  if (mobileFilterToggle && filterSidebar) {
    mobileFilterToggle.addEventListener("click", () => {
      const open = mobileFilterToggle.getAttribute("aria-expanded") === "true";
      mobileFilterToggle.setAttribute("aria-expanded", open ? "false" : "true");
      filterSidebar.classList.toggle("is-open", !open);
    });
  }

  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view === "table" ? "table" : "cards";
      renderCatalog();
    });
  });

  document.querySelectorAll("[data-sort]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.sort;
      state.sort = state.sort === next && next !== "curated" ? "curated" : next;
      renderCatalog();
    });
  });

  activeChipsEl?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-remove-chip]");
    if (!btn) return;
    const type = btn.dataset.removeChip;
    const val = btn.dataset.chipVal;
    if (type === "preset") state.preset = "all";
    else if (type === "query") {
      state.query = "";
      if (searchInput) searchInput.value = "";
      syncSearchAffordance();
    } else if (type === "demo") state.hasDemo = false;
    else if (type === "open") state.openOnly = false;
    else if (state[type]) state[type].delete(val);
    renderCatalog();
  });

  document.addEventListener("click", (ev) => {
    const focusBtn = ev.target.closest("[data-focus-agent]");
    if (focusBtn) {
      const id = focusBtn.dataset.focusAgent;
      resetAllFilters();
      state.view = "cards";
      state.expandedId = id;
      state.spotlightId = id;
      renderCatalog();
      const target = document.getElementById(`agent-${id}`);
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
      }
      window.setTimeout(() => {
        state.spotlightId = null;
        document.querySelector(`[data-card="${id}"]`)?.classList.remove("is-spotlight");
      }, 1800);
      return;
    }

    const expandBtn = ev.target.closest("[data-expand-id]");
    if (expandBtn) {
      ev.stopPropagation();
      const id = expandBtn.dataset.expandId;
      state.expandedId = state.expandedId === id ? null : id;
      renderCatalog();
      return;
    }

    const playBtn = ev.target.closest("[data-play-id]");
    if (playBtn) {
      ev.stopPropagation();
      openDemoDrawer(playBtn.dataset.playId, playBtn);
      return;
    }

    const playInline = ev.target.closest("[data-play-inline]");
    if (playInline) {
      const id = playInline.dataset.playInline;
      const a = agentMap.get(id);
      const col = playInline.closest(".evidence-media-col");
      if (a && col) {
        col.outerHTML = renderEvidenceMedia(a, true);
      }
      return;
    }

    const compareBtn = ev.target.closest("[data-compare-id]");
    if (compareBtn) {
      ev.stopPropagation();
      toggleCompare(compareBtn.dataset.compareId);
      return;
    }

    const tableRow = ev.target.closest("tr[data-row-id]");
    if (tableRow && !ev.target.closest("a, button")) {
      const id = tableRow.dataset.rowId;
      state.expandedId = state.expandedId === id ? null : id;
      renderCatalog();
    }
  });

  /* ---------- Compare Dock & Modal ---------- */
  const compareDock = document.getElementById("compare-dock");
  const dockItems = document.getElementById("dock-items");
  const dockOpenBtn = document.getElementById("dock-open-btn");
  const dockClearBtn = document.getElementById("dock-clear-btn");
  const compareBackdrop = document.getElementById("compare-modal-backdrop");
  const compareBody = document.getElementById("compare-modal-body");
  const compareCloseBtn = document.getElementById("compare-modal-close");

  function syncCompareButtons() {
    const dict = DICT[locale];
    document.querySelectorAll("[data-compare-id]").forEach((btn) => {
      if (btn.closest(".dock-chip")) return;
      const id = btn.dataset.compareId;
      const active = state.compareIds.includes(id);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      if (btn.classList.contains("compare-toggle-btn")) {
        btn.innerHTML = `${active ? SVG_ICONS.check : SVG_ICONS.plus}<span>${esc(active ? dict.compare.added : dict.compare.add)}</span>`;
        const a = agentMap.get(id);
        if (a) btn.setAttribute("aria-label", `${active ? dict.compare.added : dict.compare.add} ${a.name}`);
      } else {
        btn.classList.toggle("is-on", active);
        btn.textContent = (active ? "✓ " + dict.compare.added : "+ " + dict.compare.add);
      }
    });
  }

  function toggleCompare(id) {
    const idx = state.compareIds.indexOf(id);
    if (idx !== -1) {
      state.compareIds.splice(idx, 1);
    } else {
      if (state.compareIds.length >= 4) {
        showToast(DICT[locale].compare.limitReached);
        return;
      }
      state.compareIds.push(id);
    }
    syncCompareButtons();
    renderCompareDock();
    if (isCompareModalOpen()) {
      if (state.compareIds.length === 0) closeCompareModal();
      else renderCompareModal();
    }
  }

  function renderCompareDock() {
    if (!compareDock || !dockItems || !dockOpenBtn) return;
    const dict = DICT[locale];
    if (state.compareIds.length === 0) {
      compareDock.classList.remove("is-visible");
      compareDock.setAttribute("aria-hidden", "true");
      backTopBtn?.classList.remove("has-dock");
      return;
    }
    compareDock.classList.add("is-visible");
    compareDock.setAttribute("aria-hidden", "false");
    backTopBtn?.classList.add("has-dock");
    dockItems.innerHTML = state.compareIds
      .map((id) => {
        const a = agentMap.get(id);
        if (!a) return "";
        return `<span class="dock-chip">
          <img src="${esc(a.logo)}" alt="" width="20" height="20">
          <span>${esc(a.name)}</span>
          <button type="button" data-compare-id="${esc(a.id)}" aria-label="${esc(formatTemplate(dict.compare.remove, { name: a.name }))}">${SVG_ICONS.close}</button>
        </span>`;
      })
      .join("");
    dockOpenBtn.textContent = formatTemplate(dict.compare.open, { count: state.compareIds.length });
  }

  function isCompareModalOpen() {
    return Boolean(compareBackdrop && compareBackdrop.classList.contains("is-open"));
  }

  function renderCompareModal() {
    if (!compareBody) return;
    const dict = DICT[locale];
    const items = state.compareIds.map((id) => agentMap.get(id)).filter(Boolean);
    if (items.length === 0) {
      compareBody.innerHTML = "";
      return;
    }

    const note = (t) => `<p class="compare-note">${esc(t)}</p>`;
    const attrs = [
      [dict.columns.perception, (a) => a.perception, (a) => badgeHtml(perceptionLabel(locale, a.perception), badgeTone("perception", a.perception)) + note(a.perceptionNote)],
      [dict.columns.host, (a) => a.hosting, (a) => badgeHtml(hostingLabel(locale, a.hosting), badgeTone("hosting", a.hosting)) + note(a.hostingNote)],
      [dict.columns.mcp, (a) => a.mcp, (a) => badgeHtml(mcpLabel(locale, a.mcp), badgeTone("mcp", a.mcp)) + note(a.mcpNote)],
      [dict.columns.credentials, (a) => a.authModel, (a) => badgeHtml(authLabel(locale, a.authModel), badgeTone("auth", a.authModel)) + note(a.credentials)],
      [dict.columns.antiBot, (a) => a.antiBotBadge, (a) => badgeHtml(a.antiBotBadge, badgeTone("antiBot", a.antiBotBadge)) + note(a.antiBot)],
      [dict.columns.price, (a) => a.pricingBadge, (a) => badgeHtml(a.pricingBadge, isUncertain("pricing", a.pricingBadge) ? "unknown" : "lime") + note(a.pricing)],
      [dict.columns.license, (a) => a.license, (a) => badgeHtml(licenseLabel(locale, a.license), badgeTone("license", a.license))],
      [dict.columns.checked, (a) => a.lastChecked, (a) => `<span class="tabular-nums" style="font-family:var(--font-mono);font-size:0.8rem;">${esc(a.lastChecked)}</span>`]
    ];

    compareBody.innerHTML = `<table class="compare-table">
      <thead>
        <tr>
          <th class="compare-attr-col">${esc(dict.compare.attribute)}</th>
          ${items
            .map(
              (a) => `<th style="min-width:210px;text-align:left;">
                <div style="display:flex;align-items:center;gap:0.6rem;">
                  <div class="card-logo-box" style="width:34px;height:34px;"><img src="${esc(a.logo)}" alt="" width="24" height="24"></div>
                  <div style="min-width:0;flex:1;">
                    <a href="/agent/${esc(a.id)}" style="font-weight:700;font-size:0.95rem;text-decoration:underline;text-underline-offset:3px;">${esc(a.name)}</a>
                    <div style="font-size:0.75rem;font-weight:500;color:var(--ink-muted);">${esc(a.steward)}</div>
                  </div>
                </div>
                <div style="margin-top:0.55rem;display:flex;gap:0.45rem;flex-wrap:wrap;">
                  <a href="${esc(a.docsUrl)}" target="_blank" rel="noreferrer" style="font-size:0.75rem;font-weight:600;text-decoration:underline;">${esc(dict.motion.docs)}</a>
                  ${a.video ? `<button type="button" data-play-id="${esc(a.id)}" style="font-size:0.75rem;font-weight:600;cursor:pointer;text-decoration:underline;">${esc(dict.compare.watchDemo)}</button>` : ""}
                </div>
              </th>`
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${attrs
          .map(([label, keyFn, renderVal]) => {
            const isDiff = items.length > 1 && new Set(items.map(keyFn)).size > 1;
            return `<tr${isDiff ? ' class="is-diff"' : ""}>
              <th scope="row" class="compare-attr-col">${esc(label)}</th>
              ${items.map((a) => `<td>${renderVal(a)}</td>`).join("")}
            </tr>`;
          })
          .join("")}
      </tbody>
    </table>`;
  }

  function openCompareModal(triggerEl = null) {
    if (!compareBackdrop || state.compareIds.length === 0) return;
    state.lastFocusEl = triggerEl || document.activeElement;
    renderCompareModal();
    compareBackdrop.classList.add("is-open");
    compareBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    compareCloseBtn?.focus();
  }

  function closeCompareModal() {
    if (!compareBackdrop) return;
    compareBackdrop.classList.remove("is-open");
    compareBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (state.lastFocusEl instanceof HTMLElement) state.lastFocusEl.focus();
  }

  dockOpenBtn?.addEventListener("click", () => openCompareModal(dockOpenBtn));
  dockClearBtn?.addEventListener("click", () => {
    state.compareIds = [];
    syncCompareButtons();
    renderCompareDock();
  });
  compareCloseBtn?.addEventListener("click", closeCompareModal);
  compareBackdrop?.addEventListener("click", (ev) => {
    if (ev.target === compareBackdrop) closeCompareModal();
  });

  document.getElementById("compare-top-btn")?.addEventListener("click", (ev) => {
    state.compareIds = ["browser-use", "stagehand", "skyvern", "playwright-mcp"].filter((id) => agentMap.has(id));
    syncCompareButtons();
    renderCompareDock();
    openCompareModal(ev.currentTarget);
  });

  /* ---------- Slide-Over Demo Drawer ---------- */
  const demoBackdrop = document.getElementById("demo-backdrop");
  const demoDrawer = document.getElementById("demo-drawer");
  const demoTitle = document.getElementById("demo-drawer-title");
  const demoVendor = document.getElementById("demo-drawer-vendor");
  const demoStage = document.getElementById("demo-drawer-stage");
  const demoMeta = document.getElementById("demo-drawer-meta");
  const demoLinks = document.getElementById("demo-drawer-links");
  const demoCloseBtn = document.getElementById("demo-drawer-close");

  function renderDemoDrawer(id) {
    const a = agentMap.get(id);
    if (!a || !demoStage) return;
    const dict = DICT[locale];
    demoTitle.textContent = a.name;
    demoVendor.textContent = `${a.steward} · ${a.lastChecked}`;
    demoStage.innerHTML = `<div class="evidence-media-col" style="max-width:none;">${renderEvidenceMedia(a, !prefersReducedMotion())}</div>`;
    demoMeta.innerHTML = [
      badgeHtml(perceptionLabel(locale, a.perception), badgeTone("perception", a.perception)),
      badgeHtml(a.pricingBadge, isUncertain("pricing", a.pricingBadge) ? "unknown" : "lime"),
      badgeHtml(mcpLabel(locale, a.mcp), badgeTone("mcp", a.mcp)),
      badgeHtml(a.antiBotBadge, badgeTone("antiBot", a.antiBotBadge))
    ].join("");
    demoLinks.innerHTML = `
      <a href="/agent/${esc(a.id)}" class="btn btn-lime" style="flex:1;">${esc(dict.home.details)} ${SVG_ICONS.arrowRight}</a>
      <a href="${esc(a.docsUrl)}" target="_blank" rel="noreferrer" class="btn btn-ghost">${esc(dict.motion.docs)} ${SVG_ICONS.external}</a>
    `;
  }

  function openDemoDrawer(id, triggerEl = null) {
    if (!demoBackdrop || !demoDrawer) return;
    state.demoAgentId = id;
    state.lastFocusEl = triggerEl || document.activeElement;
    renderDemoDrawer(id);
    demoBackdrop.classList.add("is-open");
    demoBackdrop.setAttribute("aria-hidden", "false");
    demoDrawer.classList.add("is-open");
    demoDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    demoCloseBtn?.focus();
  }

  function closeDemoDrawer() {
    if (!demoBackdrop || !demoDrawer) return;
    state.demoAgentId = null;
    demoBackdrop.classList.remove("is-open");
    demoBackdrop.setAttribute("aria-hidden", "true");
    demoDrawer.classList.remove("is-open");
    demoDrawer.setAttribute("aria-hidden", "true");
    if (demoStage) demoStage.innerHTML = "";
    if (!isCompareModalOpen()) document.body.style.overflow = "";
    if (state.lastFocusEl instanceof HTMLElement) state.lastFocusEl.focus();
  }

  demoCloseBtn?.addEventListener("click", closeDemoDrawer);
  demoBackdrop?.addEventListener("click", closeDemoDrawer);

  /* ---------- API Showcase Tabs & 30s Solution Finder ---------- */
  document.querySelectorAll("[data-api-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.apiTab;
      document.querySelectorAll("[data-api-tab]").forEach((t) => {
        t.setAttribute("aria-selected", t.dataset.apiTab === target ? "true" : "false");
      });
      document.querySelectorAll("[data-api-panel]").forEach((p) => {
        p.hidden = p.dataset.apiPanel !== target;
      });
    });
  });

  const advisorBackdrop = document.getElementById("advisor-modal-backdrop");
  const advisorControlsEl = document.getElementById("advisor-controls");
  const advisorResultsEl = document.getElementById("advisor-results");
  const advisorCloseBtn = document.getElementById("advisor-modal-close");

  const ADVISOR_AXES = [
    ["useCase", ["coding-agent", "logged-in-ops", "headless-pipeline", "visual-canvas", "hard-antibot", "any"]],
    ["auth", ["any", "local-session", "isolated-profile", "cloud-vault"]],
    ["hosting", ["any", "self-host", "cloud"]],
    ["mcp", ["any", "required", "preferred", "sdk-cli"]],
    ["antiBot", ["any", "none", "login-reuse", "stealth-captcha"]],
    ["budget", ["any", "free-oss", "oss-any", "paid-ok"]]
  ];

  const ADVISOR_PRESETS = {
    "coding-agent": { auth: "local-session", hosting: "self-host", mcp: "required", antiBot: "none", budget: "free-oss" },
    "logged-in-ops": { auth: "local-session", hosting: "self-host", mcp: "preferred", antiBot: "login-reuse", budget: "free-oss" },
    "headless-pipeline": { auth: "cloud-vault", hosting: "cloud", mcp: "preferred", antiBot: "stealth-captcha", budget: "paid-ok" },
    "visual-canvas": { auth: "any", hosting: "any", mcp: "any", antiBot: "any", budget: "paid-ok" },
    "hard-antibot": { auth: "any", hosting: "any", mcp: "any", antiBot: "stealth-captcha", budget: "any" },
    any: { auth: "any", hosting: "any", mcp: "any", antiBot: "any", budget: "any" }
  };

  const advisorState = {
    useCase: "coding-agent",
    auth: "local-session",
    hosting: "self-host",
    mcp: "required",
    antiBot: "none",
    budget: "free-oss"
  };
  let advisorReqSeq = 0;
  let advisorLastPicks = [];
  let advisorLastApiUrl = "https://browserly.maoxunxing.com/api/recommend";

  function buildAdvisorAiPrompt() {
    const adv = DICT[locale].advisor;
    const active = ADVISOR_AXES.filter(([axis]) => advisorState[axis] && advisorState[axis] !== "any").map(
      ([axis]) => adv.opts[axis][advisorState[axis]] || advisorState[axis]
    );
    const pickNames = advisorLastPicks.map((id) => agentMap.get(id)?.name || id).join(", ");
    if (locale === "zh") {
      return `我刚刚在 Browserly 按【${active.join(" / ") || "全部条件"}】筛出候选方案（${pickNames || "详见接口"}），完整一手核验与避坑数据见：${advisorLastApiUrl}（规范见 https://browserly.maoxunxing.com/SKILL.zh-CN.md ）。请结合我当前项目环境帮我最终拍板，并给出最小可跑通的接入步骤。`;
    }
    return `I shortlisted browser agents on Browserly for [${active.join(" / ") || "all criteria"}] (${pickNames || "see API"}). Full verified specs, exclusions & caveats: ${advisorLastApiUrl} (playbook: https://browserly.maoxunxing.com/SKILL.md). Inspect my current workspace, help me finalize the choice, and give me the minimal setup steps.`;
  }

  function isAdvisorModalOpen() {
    return Boolean(advisorBackdrop && advisorBackdrop.classList.contains("is-open"));
  }

  function renderAdvisorControls() {
    if (!advisorControlsEl) return;
    const adv = DICT[locale].advisor;
    const groups = ADVISOR_AXES.map(([axis, opts]) => {
      const pills = opts
        .map(
          (val) =>
            `<button type="button" class="advisor-pill" data-adv-axis="${esc(axis)}" data-adv-val="${esc(val)}" aria-pressed="${advisorState[axis] === val ? "true" : "false"}">${esc(adv.opts[axis][val] || val)}</button>`
        )
        .join("");
      return `<div><div class="advisor-group-title">${esc(adv.axes[axis])}</div><div class="advisor-pills">${pills}</div></div>`;
    }).join("");

    advisorControlsEl.innerHTML = `${groups}
      <div class="advisor-ctrl-foot">
        <button type="button" class="btn btn-ghost btn-sm" id="advisor-reset-btn">${esc(adv.reset)}</button>
        <button type="button" class="btn btn-primary btn-sm" id="advisor-copy-prompt-btn">${esc(adv.copyForAi)}</button>
      </div>`;
  }

  function renderAdvisorData(data) {
    if (!advisorResultsEl) return;
    const dict = DICT[locale];
    const adv = dict.advisor;
    advisorLastPicks = (data.picks || []).map((p) => p.id);
    advisorLastApiUrl = data.meta?.queryUrl || "https://browserly.maoxunxing.com/api/recommend";

    const metaLine = formatTemplate(adv.matchedMeta, {
      matched: data.matchedCount,
      excluded: data.excludedCount
    });

    const compareBtn =
      advisorLastPicks.length >= 2
        ? `<button type="button" class="btn btn-lime btn-sm" id="advisor-compare-btn">${esc(adv.comparePicks)} (${advisorLastPicks.length})</button>`
        : "";

    let mainHtml = "";
    if (!data.picks || data.picks.length === 0) {
      const relaxBtns = (data.relaxedSuggestions || [])
        .map(
          (s) =>
            `<button type="button" class="btn btn-primary btn-sm" data-relax-axis="${esc(s.relaxAxis)}">${esc(formatTemplate(adv.relaxAxis, { axis: adv.axes[s.relaxAxis]?.replace(/^\d+\.\s*/, "") || s.relaxAxis, count: s.unlockedCount }))}</button>`
        )
        .join("");
      mainHtml = `<div class="empty-box" style="margin-top:0;">
        <h3>${esc(adv.emptyTitle)}</h3>
        <p>${esc(adv.emptyHint)}</p>
        <div style="margin-top:0.85rem;display:flex;flex-wrap:wrap;justify-content:center;gap:0.5rem;">${relaxBtns}</div>
      </div>`;
    } else {
      mainHtml = data.picks
        .map((p) => {
          const sp = p.specs;
          const badges = [
            badgeHtml(perceptionLabel(locale, sp.perception), badgeTone("perception", sp.perception)),
            badgeHtml(hostingLabel(locale, sp.hosting), badgeTone("hosting", sp.hosting)),
            badgeHtml(`MCP: ${mcpLabel(locale, sp.mcp)}`, badgeTone("mcp", sp.mcp)),
            badgeHtml(authLabel(locale, sp.credentials), badgeTone("auth", sp.credentials)),
            badgeHtml(sp.antiBot, badgeTone("antiBot", sp.antiBot)),
            badgeHtml(sp.pricing, isUncertain("pricing", sp.pricing) ? "unknown" : "lime"),
            badgeHtml(licenseLabel(locale, sp.license), badgeTone("license", sp.license))
          ].join("");
          const reasons = (p.matchedReasons || []).map((r) => `<li><span>${esc(r)}</span></li>`).join("");
          const caveats =
            p.caveats && p.caveats.length > 0
              ? `<div class="advisor-caveats"><strong>${esc(adv.caveats)}:</strong>${p.caveats.map((c) => `<span>• ${esc(c)}</span>`).join("")}</div>`
              : "";
          return `<article class="advisor-pick${p.rank === 1 ? " is-primary" : ""}">
            <div class="advisor-pick-head">
              <div class="card-logo-box" style="width:36px;height:36px;"><img src="${esc(p.logo)}" alt="" width="24" height="24"></div>
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
                  <span class="advisor-tier">#${p.rank} · ${esc(adv.tiers[p.tier] || p.tier)}</span>
                  <a href="${esc(p.urls.detail)}" style="font-weight:700;font-size:1rem;letter-spacing:-0.02em;">${esc(p.name)}</a>
                </div>
                <div style="font-size:0.78rem;color:var(--ink-muted);">${esc(p.vendor)} · ${esc(p.lastChecked)}</div>
              </div>
              <span class="advisor-score tabular-nums">${esc(adv.scoreLabel)} ${p.score}%</span>
            </div>
            <div class="advisor-badges">${badges}</div>
            <ul class="advisor-reasons">${reasons}</ul>
            ${caveats}
            <div class="advisor-pick-foot">
              <a href="${esc(p.urls.detail)}" class="btn btn-primary btn-sm">${esc(adv.openDossier)} ${SVG_ICONS.arrowRight}</a>
              <a href="${esc(p.urls.docs)}" target="_blank" rel="noreferrer" class="btn btn-ghost btn-sm">${esc(adv.docs)} ${SVG_ICONS.external}</a>
            </div>
          </article>`;
        })
        .join("");
    }

    const adviceHtml =
      data.stackAdvice && data.stackAdvice.length > 0
        ? `<div class="advisor-box"><h4>${esc(adv.adviceTitle)}</h4><ul class="advisor-excl-list">${data.stackAdvice.map((a) => `<li>• ${esc(a)}</li>`).join("")}</ul></div>`
        : "";

    const exclHtml =
      data.excluded && data.excluded.length > 0
        ? `<div class="advisor-box"><h4>${esc(adv.excludedTitle)} (${data.excludedCount})</h4><ul class="advisor-excl-list">${data.excluded.slice(0, 5).map((e) => `<li><strong>${esc(e.name)}</strong> — ${esc(e.reason)}</li>`).join("")}</ul></div>`
        : "";

    const apiUrl = data.meta?.queryUrl || "";
    const apiBar = apiUrl
      ? `<div class="advisor-api-bar"><code>${esc(apiUrl)}</code><button type="button" class="api-copy-btn" data-copy="${esc(apiUrl)}" data-copy-default="advisor.copyApi" data-copy-done="advisor.copied"><span>${esc(adv.copyApi)}</span></button></div>`
      : "";

    advisorResultsEl.innerHTML = `<div class="advisor-res-bar">
        <span class="advisor-res-meta tabular-nums">${esc(metaLine)}</span>
        <div class="advisor-res-actions">${compareBtn}</div>
      </div>
      ${mainHtml}
      ${adviceHtml}
      ${exclHtml}
      ${apiBar}`;
  }

  async function fetchAdvisorResults() {
    if (!advisorResultsEl) return;
    const seq = ++advisorReqSeq;
    const sp = new URLSearchParams();
    for (const [axis] of ADVISOR_AXES) {
      if (advisorState[axis] && advisorState[axis] !== "any") sp.set(axis, advisorState[axis]);
    }
    sp.set("locale", locale);
    if (!advisorResultsEl.innerHTML.trim()) {
      advisorResultsEl.innerHTML = `<p style="font-size:0.88rem;color:var(--ink-muted);padding:1rem 0;">${esc(DICT[locale].advisor.loading)}</p>`;
    }
    try {
      const res = await fetch(`/api/recommend?${sp.toString()}`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (seq !== advisorReqSeq) return;
      renderAdvisorData(data);
    } catch {
      if (seq !== advisorReqSeq) return;
      advisorResultsEl.innerHTML = `<p style="font-size:0.88rem;color:var(--sem-warn-fg);padding:1rem 0;">${esc(DICT[locale].advisor.error)}</p>`;
    }
  }

  function openAdvisorModal(triggerEl = null) {
    if (!advisorBackdrop) return;
    state.lastFocusEl = triggerEl || document.activeElement;
    renderAdvisorControls();
    advisorBackdrop.classList.add("is-open");
    advisorBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    advisorCloseBtn?.focus();
    fetchAdvisorResults();
  }

  function closeAdvisorModal() {
    if (!advisorBackdrop) return;
    advisorBackdrop.classList.remove("is-open");
    advisorBackdrop.setAttribute("aria-hidden", "true");
    if (!isCompareModalOpen() && !state.demoAgentId) document.body.style.overflow = "";
    if (state.lastFocusEl instanceof HTMLElement) state.lastFocusEl.focus();
  }

  document.querySelectorAll("[data-open-advisor]").forEach((btn) => {
    btn.addEventListener("click", () => openAdvisorModal(btn));
  });
  advisorCloseBtn?.addEventListener("click", closeAdvisorModal);
  advisorBackdrop?.addEventListener("click", (ev) => {
    if (ev.target === advisorBackdrop) closeAdvisorModal();
  });

  advisorControlsEl?.addEventListener("click", async (ev) => {
    const copyAiBtn = ev.target.closest("#advisor-copy-prompt-btn");
    if (copyAiBtn) {
      await copyText(buildAdvisorAiPrompt());
      showToast(DICT[locale].advisor.copiedForAi);
      return;
    }
    const resetBtn = ev.target.closest("#advisor-reset-btn");
    if (resetBtn) {
      Object.assign(advisorState, { useCase: "any", auth: "any", hosting: "any", mcp: "any", antiBot: "any", budget: "any" });
      renderAdvisorControls();
      fetchAdvisorResults();
      return;
    }
    const pill = ev.target.closest("[data-adv-axis]");
    if (!pill) return;
    const axis = pill.dataset.advAxis;
    const val = pill.dataset.advVal;
    advisorState[axis] = val;
    if (axis === "useCase" && ADVISOR_PRESETS[val]) {
      Object.assign(advisorState, ADVISOR_PRESETS[val]);
    }
    renderAdvisorControls();
    fetchAdvisorResults();
  });

  advisorResultsEl?.addEventListener("click", (ev) => {
    const cmpBtn = ev.target.closest("#advisor-compare-btn");
    if (cmpBtn && advisorLastPicks.length > 0) {
      state.compareIds = advisorLastPicks.filter((id) => agentMap.has(id)).slice(0, 4);
      closeAdvisorModal();
      syncCompareButtons();
      renderCompareDock();
      openCompareModal(cmpBtn);
      return;
    }
    const relaxBtn = ev.target.closest("[data-relax-axis]");
    if (relaxBtn) {
      const axis = relaxBtn.dataset.relaxAxis;
      if (axis in advisorState) {
        advisorState[axis] = "any";
        renderAdvisorControls();
        fetchAdvisorResults();
      }
    }
  });

  /* ---------- Initial Sync ---------- */
  const stored = readStoredLocale();
  if (stored && stored !== locale) {
    setLocale(stored, false);
  } else if (state.query.trim()) {
    renderCatalog();
  } else {
    updateSidebarCounts();
  }
  if (new URLSearchParams(window.location.search).get("advisor") === "1") {
    openAdvisorModal();
  }
})();
