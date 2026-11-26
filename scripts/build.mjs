import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const ASSETS = path.join(ROOT, "assets_current");
const ASSETS_OUT = path.join(ASSETS, "assets");
const PKG_OUT = path.join(ROOT, "pkg", "worker.js");

function sha256Short(buf, len = 10) {
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, len);
}

function sha256Manifest(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 32);
}

function minifyCss(css) {
  let out = "";
  let i = 0;
  const n = css.length;
  let quote = "";
  let inSpace = false;

  while (i < n) {
    const ch = css[i];
    const next = css[i + 1];

    if (quote) {
      out += ch;
      if (ch === "\\" && i + 1 < n) {
        out += next;
        i += 2;
        continue;
      }
      if (ch === quote) quote = "";
      i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(css[i] === "*" && css[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    if (ch === '"' || ch === "'") {
      if (inSpace && out.length > 0 && !"{}:;,(".includes(out[out.length - 1])) {
        out += " ";
      }
      inSpace = false;
      quote = ch;
      out += ch;
      i++;
      continue;
    }

    if (/\s/.test(ch)) {
      inSpace = true;
      i++;
      continue;
    }

    if ("{}:;,>".includes(ch)) {
      out = out.replace(/;$/, (m) => (ch === "}" ? "" : m));
      out += ch;
      inSpace = false;
      i++;
      continue;
    }

    if (inSpace && out.length > 0 && !"{}:;,>(".includes(out[out.length - 1]) && ch !== ")") {
      out += " ";
    }
    inSpace = false;
    out += ch;
    i++;
  }
  return out.trim();
}

/**
 * Safe state-machine JS minifier that strips comments, collapses template HTML
 * tag indentation, and compacts safe whitespace while preserving strings,
 * template expressions, regex literals, and ASI line boundaries.
 */
function stripJsCommentsAndBlankLines(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let lastSig = "";

  const REGEX_PRECEDERS = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "\n"]);
  const PUNCT_STRIP = new Set(["(", ")", "{", "}", "[", "]", ";", ",", ":", "=", "<", ">", "!", "&", "|", "?", "*", "%", "^", "~", '"', "'", "`"]);

  function updateSig(ch) {
    if (!/\s/.test(ch)) lastSig = ch;
  }

  function isRegexStart() {
    if (lastSig === "" || REGEX_PRECEDERS.has(lastSig)) return true;
    const lookback = out.slice(Math.max(0, out.length - 12));
    return /\b(return|case|throw|typeof|void|delete|in|of|else|await|yield)$/.test(lookback);
  }

  function compactTplText(s) {
    return s.replace(/\s*\n\s*/g, " ").replace(/> </g, "><");
  }

  function readTemplate(startIdx) {
    let idx = startIdx + 1;
    let buf = "`";
    while (idx < n) {
      const c = src[idx];
      if (c === "\\" && idx + 1 < n) {
        buf += c + src[idx + 1];
        idx += 2;
        continue;
      }
      if (c === "$" && src[idx + 1] === "{") {
        // Flush literal chunk before ${
        buf = compactTplText(buf);
        buf += "${";
        idx += 2;
        let depth = 1;
        let exprStart = idx;
        while (idx < n && depth > 0) {
          const ec = src[idx];
          if (ec === '"' || ec === "'") {
            const q = ec;
            idx++;
            while (idx < n) {
              if (src[idx] === "\\" && idx + 1 < n) { idx += 2; continue; }
              if (src[idx++] === q) break;
            }
            continue;
          }
          if (ec === "`") {
            const inner = readTemplate(idx);
            idx = inner.nextIdx;
            continue;
          }
          if (ec === "{") depth++;
          else if (ec === "}") {
            depth--;
            if (depth === 0) break;
          }
          idx++;
        }
        const exprCode = src.slice(exprStart, idx);
        buf += stripJsCommentsAndBlankLines(exprCode) + "}";
        idx++;
        continue;
      }
      if (c === "`") {
        buf += "`";
        idx++;
        break;
      }
      buf += c;
      idx++;
    }
    return { text: compactTplText(buf), nextIdx: idx };
  }

  while (i < n) {
    const ch = src[i];
    const next = src[i + 1];

    if (ch === '"' || ch === "'") {
      const q = ch;
      out += ch;
      i++;
      while (i < n) {
        const c = src[i];
        out += c;
        if (c === "\\" && i + 1 < n) {
          out += src[i + 1];
          i += 2;
          continue;
        }
        i++;
        if (c === q) break;
      }
      lastSig = q;
      continue;
    }

    if (ch === "`") {
      const tpl = readTemplate(i);
      out += tpl.text;
      i = tpl.nextIdx;
      lastSig = "`";
      continue;
    }

    if (ch === "/" && next === "/") {
      i += 2;
      while (i < n && src[i] !== "\n") i++;
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i += 2;
      continue;
    }

    if (ch === "/" && isRegexStart()) {
      let inClass = false;
      out += "/";
      i++;
      while (i < n) {
        const c = src[i];
        out += c;
        if (c === "\\" && i + 1 < n) {
          out += src[i + 1];
          i += 2;
          continue;
        }
        if (c === "[") inClass = true;
        else if (c === "]") inClass = false;
        else if (c === "/" && !inClass) {
          i++;
          while (i < n && /[a-z]/i.test(src[i])) {
            out += src[i];
            i++;
          }
          break;
        }
        i++;
      }
      lastSig = "/";
      continue;
    }

    if (ch === " " || ch === "\t" || ch === "\r") {
      while (i < n && (src[i] === " " || src[i] === "\t" || src[i] === "\r")) i++;
      const prevCh = out[out.length - 1] || "";
      const nextCh = src[i] || "";
      if (
        prevCh &&
        nextCh &&
        nextCh !== "\n" &&
        prevCh !== "\n" &&
        !PUNCT_STRIP.has(prevCh) &&
        !PUNCT_STRIP.has(nextCh)
      ) {
        out += " ";
      }
      continue;
    }

    if (ch === "\n") {
      while (i < n && /\s/.test(src[i])) i++;
      const prevCh = out[out.length - 1] || "";
      const nextCh = src[i] || "";
      if (prevCh && nextCh && !";{,(=:?[&|!~^%*/<>".includes(prevCh) && !"}]),.;:?&|=".includes(nextCh)) {
        out += "\n";
      }
      continue;
    }

    out += ch;
    updateSig(ch);
    i++;
  }

  return out.trim();
}

function stripModuleDirectives(code, { keepExportDefault = false } = {}) {
  let result = code.replace(/^import\s[\s\S]*?from\s+["'][^"']+["'](?:\s+with\s*\{[^}]*\})?;\s*/gm, "");
  result = result.replace(/^export\s+(?=(?:async\s+)?function\b|const\b|let\b|var\b|class\b)/gm, "");
  if (!keepExportDefault) {
    result = result.replace(/^export\s+default\s+/gm, "");
  }
  return result;
}

// 1. Build hashed CSS
const rawCss = fs.readFileSync(path.join(SRC, "styles", "app.css"), "utf8");
const minCss = minifyCss(rawCss);
const cssHash = sha256Short(Buffer.from(minCss, "utf8"));
const cssFilename = `app.${cssHash}.css`;
const cssHref = `/assets/${cssFilename}`;

// 2. Build hashed Client JS (omit page-only about/sponsor copy from global bundle)
const { DICT: FULL_DICT } = await import(path.join(SRC, "i18n", "dict.js"));
const clientDictObj = {
  en: { ...FULL_DICT.en, about: undefined, sponsor: undefined, skillPage: undefined, detail: undefined, notFound: undefined, meta: { title: FULL_DICT.en.meta.title } },
  zh: { ...FULL_DICT.zh, about: undefined, sponsor: undefined, skillPage: undefined, detail: undefined, notFound: undefined, meta: { title: FULL_DICT.zh.meta.title } }
};
const dictSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "i18n", "dict.js"), "utf8"));
const clientDictSrc = dictSrc.replace(
  /const DICT = \{[\s\S]*?\n\};\n/,
  `const DICT = ${JSON.stringify(clientDictObj)};\n`
);
const clientSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "client", "app.js"), "utf8"));
const combinedClient = `(() => {\n"use strict";\n${clientDictSrc}\n${clientSrc}\n})();\n`;
const minClient = stripJsCommentsAndBlankLines(combinedClient);
const jsHash = sha256Short(Buffer.from(minClient, "utf8"));
const jsFilename = `app.${jsHash}.js`;
const jsHref = `/assets/${jsFilename}`;

// 3. Clean stale assets and write new CSS & JS
fs.rmSync(path.join(ASSETS, "_next"), { recursive: true, force: true });
fs.mkdirSync(ASSETS_OUT, { recursive: true });
for (const f of fs.readdirSync(ASSETS_OUT)) {
  if (/^app\.[a-f0-9]+\.(css|js)$/.test(f)) {
    fs.unlinkSync(path.join(ASSETS_OUT, f));
  }
}
fs.writeFileSync(path.join(ASSETS_OUT, cssFilename), minCss, "utf8");
fs.writeFileSync(path.join(ASSETS_OUT, jsFilename), minClient, "utf8");

// Validate client JS syntax
execFileSync(process.execPath, ["--check", path.join(ASSETS_OUT, jsFilename)], { stdio: "inherit" });

// 4. Bundle Cloudflare Worker (pkg/worker.js)
const seedJson = fs.readFileSync(path.join(SRC, "data", "seed.json"), "utf8").trim();
const storiesJson = fs.readFileSync(path.join(SRC, "data", "stories.json"), "utf8").trim();

const catalogSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "data", "catalog.js"), "utf8"));
const recommenderSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "data", "recommender.js"), "utf8"));
const skillSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "server", "skill.js"), "utf8"));
const iconsSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "server", "icons.js"), "utf8"));
const componentsSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "server", "components.js"), "utf8"));
const pagesSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "server", "pages.js"), "utf8"));
let workerSrc = stripModuleDirectives(fs.readFileSync(path.join(SRC, "server", "worker.js"), "utf8"), {
  keepExportDefault: true
});
workerSrc = workerSrc
  .replace("__ASSET_CSS_HREF__", cssHref)
  .replace("__ASSET_JS_HREF__", jsHref);

const workerBundleRaw = [
  "// Browserly Cloudflare Worker (ESM, zero-dependency)",
  `const seed = ${seedJson};`,
  `const stories = ${storiesJson};`,
  dictSrc,
  catalogSrc,
  recommenderSrc,
  skillSrc,
  iconsSrc,
  componentsSrc,
  pagesSrc,
  workerSrc
].join("\n\n");

const workerBundleMin = stripJsCommentsAndBlankLines(workerBundleRaw) + "\n";
fs.mkdirSync(path.dirname(PKG_OUT), { recursive: true });
fs.writeFileSync(PKG_OUT, workerBundleMin, "utf8");
execFileSync(process.execPath, ["--check", PKG_OUT], { stdio: "inherit" });

// 4b. Sync repo-native installable Agent Skill (skills/momo-browserly-advisor/)
const { getSkillMarkdown } = await import(path.join(SRC, "server", "skill.js"));
const SKILL_OUT_DIR = path.join(ROOT, "skills", "momo-browserly-advisor");
const SKILL_EVAL_CASES = {
  version: 1,
  skill: "momo-browserly-advisor",
  note: "Trigger-precision golden cases compatible with XingMXTeam/agent-skills `harness skills eval` (~75% should-trigger, ~25% should-not-trigger).",
  cases: [
    {
      id: "BA1",
      prompt: "Which browser MCP server should I connect to Claude Code if I need to reuse my already logged-in Chrome tabs locally?",
      expect: "momo-browserly-advisor"
    },
    {
      id: "BA2",
      prompt: "Compare Browser Use, Stagehand, and Skyvern for an unattended cloud scraping pipeline behind Cloudflare.",
      expect: "momo-browserly-advisor"
    },
    {
      id: "BA3",
      prompt: "帮我选一个免费的开源浏览器 Agent，要求数据不出内网、MIT/Apache-2.0 协议且支持 MCP。",
      expect: "momo-browserly-advisor"
    },
    {
      id: "BA4",
      prompt: "Our target site is mostly canvas/complex visual UI — what vision or hybrid browser agent fits best?",
      expect: "momo-browserly-advisor"
    },
    {
      id: "BA5",
      prompt: "We need an AI agent to operate our logged-in WeChat / ERP backend without uploading passwords to the cloud.",
      expect: "momo-browserly-advisor"
    },
    {
      id: "BA6",
      prompt: "Run our existing e2e-cases.json Playwright suite and score the rubric for checkout cycle 2.",
      expect: "e2e-testing"
    },
    {
      id: "BA7",
      prompt: "Verify our REST API response schema and status codes for POST /api/orders.",
      expect: "api-testing"
    }
  ]
};
fs.mkdirSync(SKILL_OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(SKILL_OUT_DIR, "SKILL.md"), getSkillMarkdown("en"), "utf8");
fs.writeFileSync(path.join(SKILL_OUT_DIR, "SKILL.zh-CN.md"), getSkillMarkdown("zh"), "utf8");
fs.writeFileSync(path.join(SKILL_OUT_DIR, "eval-cases.json"), JSON.stringify(SKILL_EVAL_CASES, null, 2) + "\n", "utf8");

// 5. Rebuild manifest_raw.json for Cloudflare Workers Static Assets
fs.rmSync(path.join(ASSETS, "api"), { recursive: true, force: true });
fs.rmSync(path.join(ASSETS, "llms.txt"), { force: true });
fs.rmSync(path.join(ASSETS, "seen.json"), { force: true });

const MIME_BY_EXT = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

const SKIP_PATHS = new Set(["/manifest_raw.json", "/icon.svg"]);
const manifest = {};

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else {
      const rel = "/" + path.relative(ASSETS, full).split(path.sep).join("/");
      if (SKIP_PATHS.has(rel)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      const buf = fs.readFileSync(full);
      manifest[rel] = {
        hash: sha256Manifest(buf),
        size: buf.length,
        content_type: MIME_BY_EXT[ext] || "application/octet-stream"
      };
    }
  }
}
walk(ASSETS);
fs.writeFileSync(path.join(ASSETS, "manifest_raw.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log(`Built CSS:    ${cssHref} (${minCss.length} B)`);
console.log(`Built JS:     ${jsHref} (${minClient.length} B)`);
console.log(`Built Worker: pkg/worker.js (${workerBundleMin.length} B)`);
console.log(`Manifest:     ${Object.keys(manifest).length} static assets`);
