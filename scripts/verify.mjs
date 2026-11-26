import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS_DIR = path.join(ROOT, "assets_current");
const WORKER_FILE = path.join(ROOT, "pkg", "worker.js");

const MIME = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

const env = {
  ASSETS: {
    async fetch(request) {
      const url = new URL(request.url);
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const resolved = path.resolve(ASSETS_DIR, rel);
      if (!resolved.startsWith(ASSETS_DIR + path.sep)) {
        return new Response("Forbidden", { status: 403 });
      }
      if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
        return new Response("Not Found", { status: 404 });
      }
      const ext = path.extname(resolved).toLowerCase();
      return new Response(fs.readFileSync(resolved), {
        status: 200,
        headers: { "Content-Type": MIME[ext] || "application/octet-stream" }
      });
    }
  }
};

const { default: worker } = await import(pathToFileURL(WORKER_FILE).href);
const manifest = JSON.parse(fs.readFileSync(path.join(ASSETS_DIR, "manifest_raw.json"), "utf8"));

async function req(p, opts = {}) {
  const headers = new Headers(opts.headers || {});
  const r = new Request(`https://browserly.maoxunxing.com${p}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body
  });
  return worker.fetch(r, env);
}

let checks = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  checks++;
}

// 1. Data-layer invariants (src/data/seed.json & src/data/stories.json)
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "seed.json"), "utf8"));
const stories = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", "stories.json"), "utf8"));
const { LOGO_MAP } = await import(pathToFileURL(path.join(ROOT, "src", "data", "catalog.js")).href);
const activeSeedIds = new Set();
for (const entry of seed.entries) {
  if (entry.include_in_matrix === false) continue;
  activeSeedIds.add(entry.id);
  const logoRel = LOGO_MAP[entry.id];
  ok(Boolean(logoRel), `Agent ${entry.id} missing from LOGO_MAP in src/data/catalog.js`);
  const logoDisk = path.join(ASSETS_DIR, logoRel.replace(/^\/+/, ""));
  ok(fs.existsSync(logoDisk), `Logo file missing on disk for ${entry.id}: ${logoRel}`);
}
for (const storyId of Object.keys(stories)) {
  ok(activeSeedIds.has(storyId), `Story key ${storyId} in src/data/stories.json is not an active agent in seed.json`);
}

// 2. Manifest integrity
for (const [assetPath, meta] of Object.entries(manifest)) {
  const disk = path.join(ASSETS_DIR, assetPath.replace(/^\/+/, ""));
  ok(fs.existsSync(disk), `Asset missing on disk: ${assetPath}`);
  const buf = fs.readFileSync(disk);
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 32);
  ok(buf.length === meta.size, `Size mismatch for ${assetPath}: ${buf.length} != ${meta.size}`);
  ok(hash === meta.hash, `Hash mismatch for ${assetPath}`);
}

// 2. /api/agents schema
const apiRes = await req("/api/agents");
ok(apiRes.status === 200, "/api/agents status 200");
ok(apiRes.headers.get("content-type")?.includes("application/json"), "/api/agents content-type");
const apiJson = await apiRes.json();
ok(Array.isArray(apiJson) && apiJson.length === 17, `Expected 17 agents from /api/agents, got ${apiJson.length}`);

const requiredKeys = [
  "id", "name", "vendor", "urls", "perception", "host", "mcp",
  "credentials", "antiBot", "license", "lastChecked", "pricing",
  "logo", "detail", "sources"
];
for (const item of apiJson) {
  for (const k of requiredKeys) {
    ok(k in item, `Missing key ${k} on ${item.id}`);
  }
  ok(item.perception === item.perception.toLowerCase(), `Perception not lowercased on ${item.id}: ${item.perception}`);
  ok(item.logo in manifest, `Logo ${item.logo} missing from manifest`);
}

// 3. /llms.txt, /api/recommend, /SKILL.md, /SKILL.zh-CN.md, and /icon.svg
const llmsRes = await req("/llms.txt");
ok(llmsRes.status === 200, "/llms.txt status 200");
const llmsText = await llmsRes.text();
ok(
  llmsText.includes("# Browserly") &&
    llmsText.includes("/api/agents") &&
    llmsText.includes("/api/recommend") &&
    llmsText.includes("/SKILL.md"),
  "/llms.txt exposes catalog, recommend API, and SKILL.md"
);

// 3b. /api/recommend deterministic scenarios, hard exclusions, caveats, and relaxation
const recCodingRes = await req(
  "/api/recommend?useCase=coding-agent&auth=local-session&hosting=self-host&mcp=required&antiBot=none&budget=free-oss&locale=en"
);
ok(recCodingRes.status === 200, "/api/recommend coding-agent status 200");
ok(recCodingRes.headers.get("access-control-allow-origin") === "*", "/api/recommend CORS header");
const recCoding = await recCodingRes.json();
ok(recCoding.totalCatalogCount === 17, "/api/recommend reports 17 total agents");
ok(recCoding.picks.length === 3, "/api/recommend returns default 3 picks");
ok(recCoding.picks[0].id === "playwright-mcp", `Expected playwright-mcp #1 for coding-agent, got ${recCoding.picks[0]?.id}`);
ok(recCoding.picks.every((p) => p.specs.hosting !== "cloud" && p.specs.mcp !== "no"), "Hard hosting/mcp constraints respected");
ok(recCoding.excluded.some((e) => e.reasonCode === "cloud_only" || e.reasonCode === "no_local_session"), "Exclusions include hard reason codes");
ok(recCoding.stackAdvice.length >= 1, "Stack advice present");

const recCloudRes = await req(
  "/api/recommend?useCase=headless-pipeline&auth=cloud-vault&hosting=cloud&mcp=preferred&antiBot=stealth-captcha&budget=paid-ok&locale=zh"
);
ok(recCloudRes.status === 200, "/api/recommend cloud pipeline zh status 200");
const recCloud = await recCloudRes.json();
ok(recCloud.locale === "zh", "/api/recommend zh locale respected");
ok(["notte", "skyvern"].includes(recCloud.picks[0]?.id), `Expected notte/skyvern #1 for cloud vault + captcha, got ${recCloud.picks[0]?.id}`);
ok(recCloud.picks[0].caveats.length >= 1, "Copyleft / anti-bot caveats surfaced honestly");

const recStagehandRes = await req(
  "/api/recommend?useCase=headless-pipeline&auth=isolated-profile&mcp=sdk-cli&budget=free-oss&locale=en"
);
const recStagehand = await recStagehandRes.json();
ok(recStagehand.picks[0]?.id === "stagehand", `Expected stagehand #1 for isolated SDK/CLI pipeline, got ${recStagehand.picks[0]?.id}`);
ok(recStagehand.stackAdvice.some((s) => s.includes("Browserbase")), "Stagehand pick surfaces Browserbase infra note");

const recEmptyRes = await req("/api/recommend?hosting=cloud&auth=local-session&perception=dom&locale=zh");
const recEmpty = await recEmptyRes.json();
ok(recEmpty.matchedCount === 0 && recEmpty.picks.length === 0, "Impossible combination returns 0 picks cleanly");
ok(recEmpty.relaxedSuggestions.length >= 1, "Impossible combination returns actionable relaxedSuggestions");

// 3c. /SKILL.md, /SKILL.zh-CN.md, alias routes, and repo-native skills/momo-browserly-advisor/ sync
const skillEnRes = await req("/SKILL.md");
ok(skillEnRes.status === 200, "/SKILL.md status 200");
ok(skillEnRes.headers.get("content-type")?.includes("text/markdown"), "/SKILL.md markdown content-type");
const skillEnText = await skillEnRes.text();
ok(skillEnText.startsWith("---\nname: momo-browserly-advisor\n"), "/SKILL.md has valid YAML frontmatter with newlines preserved");
ok(skillEnText.includes("/api/recommend") && skillEnText.includes("e2e-testing"), "/SKILL.md includes API and e2e-testing boundary");
for (const a of apiJson) {
  ok(skillEnText.includes(`\`${a.id}\``), `/SKILL.md offline snapshot missing agent ${a.id}`);
}

const skillZhRes = await req("/SKILL.zh-CN.md");
ok(skillZhRes.status === 200, "/SKILL.zh-CN.md status 200");
const skillZhText = await skillZhRes.text();
ok(skillZhText.startsWith("---\nname: momo-browserly-advisor\n") && skillZhText.includes("离线兜底"), "/SKILL.zh-CN.md valid zh markdown");

const skillAliasEn = await req("/skills/momo-browserly-advisor/SKILL.md");
const skillAliasZh = await req("/skills/momo-browserly-advisor/SKILL.zh-CN.md");
ok(skillAliasEn.status === 200 && skillAliasZh.status === 200, "Alias /skills/momo-browserly-advisor/* routes return 200");

const diskSkillEn = fs.readFileSync(path.join(ROOT, "skills", "momo-browserly-advisor", "SKILL.md"), "utf8");
const diskSkillZh = fs.readFileSync(path.join(ROOT, "skills", "momo-browserly-advisor", "SKILL.zh-CN.md"), "utf8");
const diskEval = JSON.parse(fs.readFileSync(path.join(ROOT, "skills", "momo-browserly-advisor", "eval-cases.json"), "utf8"));
ok(diskSkillEn === skillEnText, "Repo skills/momo-browserly-advisor/SKILL.md matches Worker /SKILL.md byte-for-byte");
ok(diskSkillZh === skillZhText, "Repo skills/momo-browserly-advisor/SKILL.zh-CN.md matches Worker /SKILL.zh-CN.md byte-for-byte");
ok(Array.isArray(diskEval.cases) && diskEval.cases.length >= 6, "eval-cases.json contains golden trigger cases");

const iconRes = await req("/icon.svg");
ok(iconRes.status === 200 && iconRes.headers.get("content-type")?.includes("image/svg+xml"), "/icon.svg status & type");

// 4. POST endpoints
const nlRes = await req("/api/newsletter", { method: "POST" });
ok(nlRes.status === 501, "/api/newsletter returns 501");

const spBad = await req("/api/sponsor", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "", email: "bad", note: "short" })
});
ok(spBad.status === 400, "/api/sponsor returns 400 on invalid payload");

const spOk = await req("/api/sponsor", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Test",
    email: "test@example.com",
    url: "https://example.com",
    note: "Interested in supporting Browserly."
  })
});
ok(spOk.status === 200, "/api/sponsor returns 200 on valid payload");
const spOkBody = await spOk.json();
ok(spOkBody.ok === true && spOkBody.stored === "noop", "/api/sponsor payload matches");

// 5. All 21 HTML routes in EN and ZH
const htmlRoutes = ["/", "/skill", "/about", "/sponsor", ...apiJson.map((a) => `/agent/${a.id}`)];
const localAssetRefs = new Set();

for (const route of htmlRoutes) {
  for (const loc of ["en", "zh"]) {
    const res = await req(route, { headers: { Cookie: `bb-locale=${loc}` } });
    ok(res.status === 200, `${route} [${loc}] returned ${res.status}`);
    ok(res.headers.get("content-type")?.includes("text/html"), `${route} [${loc}] content-type`);
    const html = await res.text();
    ok(html.startsWith("<!doctype html>"), `${route} [${loc}] missing doctype`);
    ok(html.includes(loc === "zh" ? 'lang="zh-CN"' : 'lang="en"'), `${route} [${loc}] wrong html lang`);
    ok(!html.includes("undefined") && !html.includes("[object Object]"), `${route} [${loc}] leaked undefined/object`);

    if (route === "/") {
      ok(
        html.includes(loc === "zh" ? "驱动浏览器的智能体" : "Browser-driving agents"),
        `Home [${loc}] missing restored hero title`
      );
      ok(
        html.includes('id="hero-quickcopy"') &&
          html.includes('id="hero-qc-copy"') &&
          html.includes('href="/skill"') &&
          html.includes('id="open-advisor-btn"') &&
          html.includes('id="advisor-modal-backdrop"') &&
          html.includes("npx skills add XingMXTeam/browsely"),
        `Home [${loc}] missing Hero quick-copy bar, /skill nav, Solution Finder, and Skill showcase`
      );
    }
    if (route === "/skill") {
      ok(
        html.includes('id="skill-page-prompt"') &&
          html.includes("npx skills add XingMXTeam/browsely") &&
          html.includes("/SKILL.md") &&
          html.includes("/api/recommend"),
        `/skill [${loc}] missing quick-copy prompt, CLI command, or raw doc links`
      );
    }
    if (route === "/" || route === "/skill" || route === "/about" || route === "/sponsor") {
      ok(
        html.includes("maoxunxing") && html.includes("毛毛星") && html.includes("/wechat-qr.jpg"),
        `${route} [${loc}] missing WeChat contact block`
      );
    }
    if (route === "/about") {
      ok(html.includes("2026-11-02") && html.includes("LaVague"), `/about [${loc}] missing changelog/exclusions`);
    }

    for (const m of html.matchAll(/(?:href|src)="(\/(?:assets|fonts|logos|posters|browseboard\.svg|wechat-qr\.jpg)[^"]*)"/g)) {
      localAssetRefs.add(m[1]);
    }
  }
}

for (const ref of localAssetRefs) {
  ok(ref in manifest, `Referenced local asset not in manifest: ${ref}`);
}

// Check CSS asset references
const cssEntry = Object.keys(manifest).find((k) => k.startsWith("/assets/app.") && k.endsWith(".css"));
const jsEntry = Object.keys(manifest).find((k) => k.startsWith("/assets/app.") && k.endsWith(".js"));
ok(Boolean(cssEntry && jsEntry), "Hashed CSS and JS entries present in manifest");
const cssText = fs.readFileSync(path.join(ASSETS_DIR, cssEntry.slice(1)), "utf8");
for (const m of cssText.matchAll(/url\((["']?)(\/[^"')]+)\1\)/g)) {
  ok(m[2] in manifest, `CSS references missing manifest asset: ${m[2]}`);
}

// 6. 404 route
const res404 = await req("/agent/nonexistent");
ok(res404.status === 404, "/agent/nonexistent returns 404");

// 7. Performance & Size Budgets
const workerSize = fs.statSync(WORKER_FILE).size;
const cssBuf = fs.readFileSync(path.join(ASSETS_DIR, cssEntry.slice(1)));
const jsBuf = fs.readFileSync(path.join(ASSETS_DIR, jsEntry.slice(1)));
const cssSize = cssBuf.length;
const jsSize = jsBuf.length;
const cssGz = gzipSync(cssBuf, { level: 9 }).length;
const jsGz = gzipSync(jsBuf, { level: 9 }).length;

const homeHtml = await (await req("/")).text();
const homeBuf = Buffer.from(homeHtml, "utf8");
const homeBytes = homeBuf.length;
const homeGz = gzipSync(homeBuf, { level: 9 }).length;

ok(workerSize < 190 * 1024, `pkg/worker.js size ${workerSize} exceeds 190 KB budget`);
ok(cssSize < 54 * 1024, `CSS size ${cssSize} exceeds 54 KB budget`);
ok(cssGz < 10.5 * 1024, `CSS gzip ${cssGz} exceeds 10.5 KB budget`);
ok(jsSize < 72 * 1024, `Client JS size ${jsSize} exceeds 72 KB budget`);
ok(jsGz < 21 * 1024, `Client JS gzip ${jsGz} exceeds 21 KB budget`);
ok(homeBytes < 148 * 1024, `Homepage HTML size ${homeBytes} exceeds 148 KB budget`);
ok(homeGz < 25 * 1024, `Homepage HTML gzip ${homeGz} exceeds 25 KB budget`);

console.log(`ALL ${checks} CHECKS PASSED!`);
console.log(`  pkg/worker.js: ${(workerSize / 1024).toFixed(1)} KB (was 8056 KB)`);
console.log(`  CSS bundle:    ${(cssSize / 1024).toFixed(1)} KB raw / ${(cssGz / 1024).toFixed(1)} KB gzip (was 65.3 KB)`);
console.log(`  Client JS:     ${(jsSize / 1024).toFixed(1)} KB raw / ${(jsGz / 1024).toFixed(1)} KB gzip (was 669 KB across chunks)`);
console.log(`  Homepage HTML: ${(homeBytes / 1024).toFixed(1)} KB raw / ${(homeGz / 1024).toFixed(1)} KB gzip (was 225 KB)`);
