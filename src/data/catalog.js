import seed from "./seed.json" with { type: "json" };
import stories from "./stories.json" with { type: "json" };

export const LOGO_MAP = {
  "browser-use": "/logos/browser-use.png",
  stagehand: "/logos/stagehand.svg",
  skyvern: "/logos/skyvern.png",
  "playwright-mcp": "/logos/playwright.svg",
  "claude-in-chrome": "/logos/claude.png",
  notte: "/logos/notte.png",
  "openai-computer-use": "/logos/openai.png",
  smooth: "/logos/smooth.svg",
  "ego-lite": "/logos/ego-lite.svg",
  xbrowser: "/logos/xbrowser.png",
  "agent-browser": "/logos/agent-browser.png",
  "huashu-chrome": "/logos/huashu-chrome.jpg",
  "opencode-browse": "/logos/opencode-browse.svg",
  "foundry-browser-automation": "/logos/foundry-browser-automation.png",
  "auto-browser": "/logos/auto-browser.png",
  browsentic: "/logos/browsentic.png",
  "better-browser-mcp": "/logos/better-browser-mcp.svg"
};

export const PASTEL_PALETTE = [
  "#f0d2cc",
  "#d5e4cf",
  "#f3e1c4",
  "#d4e3f2",
  "#f0d4c4",
  "#e4d8ef",
  "#d7ebe4",
  "#f3ddc8",
  "#d9e2f0",
  "#e7e3d4",
  "#f0d5df",
  "#dcead8"
];

const VALID_PERCEPTIONS = new Set(["dom", "vision", "hybrid", "unknown"]);
const VALID_HOSTING = new Set(["self-host", "cloud", "both"]);
const VALID_MCP = new Set(["yes", "partial", "no", "unknown"]);
const VALID_AUTH = new Set([
  "user_browser",
  "agent_runtime",
  "cloud_vault",
  "both_user_browser_and_runtime",
  "app_owned",
  "browser_profile",
  "unknown"
]);
const VALID_VIDEO_KINDS = new Set(["mp4", "webm", "youtube"]);

const CREDENTIAL_LABEL_TO_KEY = {
  "Your own browser session": "user",
  "Browser session + runtime": "both",
  "Cloud vault": "vault",
  "Agent runtime vault": "runtime",
  "App-owned account": "app",
  "Browser profile": "profile",
  Unknown: "unknown"
};

const AUTH_TO_CREDENTIAL_KEY = {
  user_browser: "user",
  agent_runtime: "runtime",
  cloud_vault: "vault",
  both_user_browser_and_runtime: "both",
  app_owned: "app",
  browser_profile: "profile",
  unknown: "unknown"
};

const STORY_SECTION_KEYS = ["perception", "mcp", "credentials", "antiBot", "pricing"];

export function extractYoutubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      const tail = u.pathname.split("/").filter(Boolean).at(-1) ?? "";
      const id = v || tail;
      return /^[\w-]{11}$/.test(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

function formatSource(rawUrl) {
  const u = new URL(rawUrl);
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
  return {
    label: path ? `${host}${path}` : host,
    host,
    url: rawUrl
  };
}

function isSafeUrlOrPath(v) {
  return typeof v === "string" && (v.startsWith("https://") || v.startsWith("/"));
}

function normalizeVideo(entry) {
  const video = entry.video ?? null;
  const poster = entry.video_poster ?? null;
  const source = entry.video_source ?? null;
  const posterKind = entry.video_poster_kind ?? null;

  if (posterKind && posterKind !== "diagram") {
    throw new Error(`${entry.id} has invalid video_poster_kind ${posterKind}`);
  }
  if (poster && !isSafeUrlOrPath(poster)) {
    throw new Error(`${entry.id} poster must be local path or https URL`);
  }
  if (!video) {
    if (entry.video_kind) throw new Error(`${entry.id} has video_kind without video`);
    return {
      video: null,
      videoPoster: poster,
      videoPosterKind: posterKind === "diagram" ? "diagram" : null,
      videoKind: null,
      videoSource: null,
      youtubeId: null
    };
  }
  if (!entry.video_kind || !VALID_VIDEO_KINDS.has(entry.video_kind)) {
    throw new Error(`${entry.id} has invalid video_kind ${entry.video_kind}`);
  }
  if (!video.startsWith("https://")) {
    throw new Error(`${entry.id} video must be https`);
  }
  const youtubeId = entry.video_kind === "youtube" ? extractYoutubeId(video) : null;
  if (entry.video_kind === "youtube" && !youtubeId) {
    throw new Error(`${entry.id} youtube URL has no valid video id`);
  }
  if (source && !source.startsWith("https://")) {
    throw new Error(`${entry.id} video_source must be https`);
  }
  return {
    video,
    videoPoster: poster,
    videoPosterKind: null,
    videoKind: entry.video_kind,
    videoSource: source,
    youtubeId
  };
}

function normalizeEntry(entry, index) {
  const perception = String(entry.perception || "").toLowerCase();
  if (!VALID_PERCEPTIONS.has(perception)) {
    throw new Error(`${entry.id} has invalid perception ${entry.perception}`);
  }
  if (!VALID_HOSTING.has(entry.hosting)) {
    throw new Error(`${entry.id} has invalid hosting ${entry.hosting}`);
  }
  if (!VALID_MCP.has(entry.mcp)) {
    throw new Error(`${entry.id} has invalid mcp ${entry.mcp}`);
  }
  const authModel = entry.auth_model ?? "unknown";
  if (!VALID_AUTH.has(authModel)) {
    throw new Error(`${entry.id} has invalid auth_model ${entry.auth_model}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.last_checked)) {
    throw new Error(`${entry.id} last_checked is not YYYY-MM-DD`);
  }
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
    throw new Error(`${entry.id} needs sources`);
  }
  if (!entry.anti_bot_badge || !entry.pricing_badge) {
    throw new Error(`${entry.id} needs short badges`);
  }
  const logo = LOGO_MAP[entry.id];
  if (!logo) {
    throw new Error(`${entry.id} is missing from LOGO_MAP`);
  }
  const docsUrl = entry.docs || entry.homepage || entry.sources[0];
  if (!docsUrl) {
    throw new Error(`${entry.id} needs a docs link`);
  }
  const pricing = entry.pricing_summary ?? "unknown";
  const media = normalizeVideo(entry);
  const licenseNote =
    entry.license === "proprietary_api_mit_sample"
      ? "Computer Use is a proprietary Responses API. The openai-cua-sample-app LICENSE file, read 2026-10-24, is the MIT License, Copyright (c) 2025 OpenAI."
      : entry.license === "unknown"
        ? "No public LICENSE file. smooth-sdk pyproject.toml declares no license (read 2026-10-24)."
        : `Recorded as ${entry.license} from the public sources on this row.`;

  const unknowns = [];
  if (perception === "unknown" && entry.perception_note) {
    unknowns.push(entry.perception_note);
  }
  if (authModel === "unknown" && entry.auth_model_detail) {
    unknowns.push(entry.auth_model_detail);
  }
  if (entry.license === "unknown") {
    unknowns.push("No public LICENSE file on the linked repository.");
  }
  if (entry.pricing_summary && /unknown/i.test(entry.pricing_summary) && entry.id !== "browserbase-stagehand-note") {
    unknowns.push(entry.pricing_summary);
  }

  return {
    index,
    id: entry.id,
    name: entry.name,
    logo,
    pastel: PASTEL_PALETTE[index % PASTEL_PALETTE.length],
    steward: entry.org,
    homepage: entry.homepage || null,
    github: entry.github || null,
    summary: entry.hosting_note ?? "",
    perception,
    perceptionNote: entry.perception_note ?? "",
    license: entry.license,
    licenseNote,
    hosting: entry.hosting,
    hostingNote: entry.hosting_note ?? "",
    mcp: entry.mcp,
    mcpNote: entry.mcp_note ?? "",
    authModel,
    credentials: entry.auth_model_detail ?? "unknown",
    antiBot: entry.anti_bot ?? "unknown",
    antiBotBadge: entry.anti_bot_badge,
    pricing,
    pricingBadge: entry.pricing_badge,
    pricingDetail: pricing,
    sources: entry.sources.map(formatSource),
    lastChecked: entry.last_checked,
    unknowns,
    docsUrl,
    ...media
  };
}

let cachedCatalog = null;

export function getCatalog() {
  if (cachedCatalog) return cachedCatalog;
  const activeEntries = seed.entries.filter((e) => e.include_in_matrix !== false);
  const agents = activeEntries.map((entry, idx) => normalizeEntry(entry, idx));
  if (agents.length !== 17) {
    throw new Error(`Expected 17 matrix rows, found ${agents.length}`);
  }
  const infraNote = seed.entries.find((e) => e.include_in_matrix === false) ?? null;
  const excluded = (seed.excluded_or_deferred || []).map((e) => ({
    name: e.name,
    reason: e.reason
  }));
  const changelog = (seed.changelog_seed || []).map((item) => ({
    date: item.date,
    item: item.item,
    source: item.source,
    sourceLabel: formatSource(item.source).label
  }));

  cachedCatalog = {
    checked: seed.meta.as_of,
    timezoneNote: seed.meta.timezone_note,
    disclaimer: seed.meta.disclaimer,
    coverage: seed.meta.coverage,
    agents,
    changelog,
    excluded,
    infraNote
  };
  return cachedCatalog;
}

export function getAgentStory(agent, locale = "en") {
  const curated = stories[agent.id];
  if (locale === "zh" && curated) {
    return {
      verdict: curated.verdict || agent.hostingNote || agent.summary,
      sections: STORY_SECTION_KEYS.map((key) => ({
        key,
        body: curated[key] || ""
      })).filter((s) => s.body.trim().length > 0),
      isCuratedZh: true
    };
  }
  const noteMap = {
    perception: agent.perceptionNote,
    mcp: agent.mcpNote,
    credentials: agent.credentials,
    antiBot: agent.antiBot,
    pricing: agent.pricing
  };
  return {
    verdict: agent.hostingNote || agent.summary || agent.name,
    sections: STORY_SECTION_KEYS.map((key) => ({
      key,
      body: noteMap[key] || ""
    })).filter((s) => s.body.trim().length > 0),
    isCuratedZh: false
  };
}

export function getCredentialKey(agent) {
  const label = stories[agent.id]?.credentialLabel;
  if (label && label in CREDENTIAL_LABEL_TO_KEY) {
    return CREDENTIAL_LABEL_TO_KEY[label];
  }
  return AUTH_TO_CREDENTIAL_KEY[agent.authModel] || "unknown";
}

export function getAgentStoriesPayload(agent) {
  return {
    zh: getAgentStory(agent, "zh"),
    en: getAgentStory(agent, "en")
  };
}

export function getRelatedAgents(agentId, agents) {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const ids = stories[agentId]?.related ?? [];
  const picked = ids
    .map((id) => byId.get(id))
    .filter((a) => Boolean(a && a.id !== agentId));
  if (picked.length > 0) return picked.slice(0, 4);

  const target = byId.get(agentId);
  const peers = agents
    .filter((a) => a.id !== agentId)
    .sort((a, b) => {
      const scoreA =
        (a.perception === target?.perception ? 2 : 0) +
        (a.hosting === target?.hosting ? 1 : 0) +
        (a.mcp === target?.mcp ? 1 : 0);
      const scoreB =
        (b.perception === target?.perception ? 2 : 0) +
        (b.hosting === target?.hosting ? 1 : 0) +
        (b.mcp === target?.mcp ? 1 : 0);
      return scoreB - scoreA;
    });
  return peers.slice(0, 4);
}

export function getCatalogStats(agents) {
  return {
    total: agents.length,
    withDemo: agents.filter((a) => Boolean(a.video)).length,
    selfHostable: agents.filter((a) => a.hosting === "self-host" || a.hosting === "both").length,
    mcpReady: agents.filter((a) => a.mcp === "yes").length,
    openSource: agents.filter(
      (a) => a.license !== "proprietary" && a.license !== "proprietary_api_mit_sample" && a.license !== "unknown"
    ).length
  };
}

export function toApiAgentsJson(agents) {
  return agents.map((a) => ({
    id: a.id,
    name: a.name,
    vendor: a.steward,
    urls: {
      homepage: a.homepage,
      repository: a.github,
      docs: a.docsUrl
    },
    perception: a.perception,
    host: a.hosting,
    mcp: a.mcp,
    credentials: a.authModel,
    antiBot: a.antiBotBadge,
    license: a.license,
    lastChecked: a.lastChecked,
    pricing: a.pricing,
    logo: a.logo,
    detail: `/agent/${a.id}`,
    sources: a.sources.map((s) => s.url)
  }));
}

export function getLlmsTxt() {
  return [
    "# Browserly",
    "",
    "> Comparison matrix of browser-driving agents and frameworks. Rows are read from public docs and dated. Not a cloud-browser hourly pricing board.",
    "",
    "The HTML pages are the source of truth for people. This file and the JSON catalog describe the same seed. The pages do not fetch the JSON.",
    "",
    "## Catalog",
    "",
    "- [JSON catalog](/api/agents): array of the agents on the homepage",
    "- [Method](/about): what is in scope, how a cell is filled, and what stays off the board",
    "- Agent page: `/agent/{id}` (the `detail` field)",
    "",
    "Fields: `id`, `name`, `vendor`, `urls.homepage`, `urls.repository`, `urls.docs`, `perception`, `host`, `mcp`, `credentials`, `antiBot`, `license`, `lastChecked`, `pricing`, `logo`, `detail`, `sources`.",
    "",
    "`perception` is `dom`, `vision`, `hybrid`, or `unknown`. `host` is `self-host`, `cloud`, or `both`. `mcp` is `yes`, `partial`, `no`, or `unknown`. `credentials` is `user_browser`, `agent_runtime`, `cloud_vault`, `both_user_browser_and_runtime`, `app_owned`, `browser_profile`, or `unknown`.",
    "",
    "## Dates and unknown",
    "",
    "Cite a row with its `lastChecked` date (`YYYY-MM-DD`) and its `sources`. That date is when those pages were read.",
    "",
    "`unknown` means not yet verified from public docs. It is not a guess and not a no.",
    "",
    "## Contributing",
    "",
    "Add a row in `data/browseboard-seed.json`. Field notes for humans and coding agents are in `docs/catalog.md` in the repository.",
    ""
  ].join("\n");
}
