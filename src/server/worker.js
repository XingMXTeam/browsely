import {
  getCatalog,
  getLlmsTxt,
  getRelatedAgents,
  toApiAgentsJson
} from "../data/catalog.js";
import { DICT, LOCALE_COOKIE } from "../i18n/dict.js";
import {
  renderAboutPage,
  renderAgentPage,
  renderHomePage,
  renderNotFoundPage,
  renderSponsorPage
} from "./pages.js";

const ASSET_URLS = {
  cssHref: "__ASSET_CSS_HREF__",
  jsHref: "__ASSET_JS_HREF__"
};

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="#121313"/>
  <rect x="6.5" y="7.5" width="19" height="17" rx="3.5" stroke="#fbfaf6" stroke-width="2"/>
  <path d="M6.5 12.5h19" stroke="#fbfaf6" stroke-width="2"/>
  <circle cx="9.8" cy="10" r="1.1" fill="#e9a78b"/>
  <path d="M13.6 15.4v6.2c0 .8.9 1.3 1.6.9l4.6-3.1c.6-.4.6-1.3 0-1.7l-4.6-3.1c-.7-.5-1.6 0-1.6.8Z" fill="#f4ff71"/>
</svg>`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCookies(header) {
  const out = Object.create(null);
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function negotiateLocale(request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieVal = cookies[LOCALE_COOKIE];
  if (cookieVal === "zh" || cookieVal === "en") return cookieVal;

  const accept = request.headers.get("accept-language");
  if (!accept) return "en";
  const langs = accept
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qPart = params.find((p) => p.trim().startsWith("q="));
      const q = qPart ? Number(qPart.trim().slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const item of langs) {
    if (item.tag.startsWith("zh")) return "zh";
    if (item.tag.startsWith("en")) return "en";
  }
  return "en";
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      Vary: "Cookie, Accept-Language",
      "Cache-Control": status === 200 ? "private, no-cache" : "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  });
}

function trimField(val, maxLen) {
  return typeof val === "string" ? val.trim().slice(0, maxLen) : "";
}

async function handleSponsorPost(request) {
  let body = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const obj = body && typeof body === "object" ? body : {};
  const name = trimField(obj.name, 120);
  const emailRaw = typeof obj.email === "string" ? obj.email.trim().toLowerCase() : "";
  const email = EMAIL_RE.test(emailRaw) && emailRaw.length <= 200 ? emailRaw : null;
  const url = trimField(obj.url, 300);
  const note = trimField(obj.note, 2000);

  if (!name || !email || note.length < 8) {
    return Response.json(
      { ok: false, error: "Name, a valid email, and a short note are required." },
      { status: 400 }
    );
  }
  if (url && !/^https?:\/\//i.test(url)) {
    return Response.json(
      { ok: false, error: "Site should start with http:// or https://." },
      { status: 400 }
    );
  }
  return Response.json({ ok: true, stored: "noop" });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.length > 1 && url.pathname.endsWith("/")
      ? url.pathname.slice(0, -1)
      : url.pathname;
    const method = request.method.toUpperCase();

    if (pathname === "/api/agents" && (method === "GET" || method === "HEAD")) {
      const catalog = getCatalog();
      return Response.json(toApiAgentsJson(catalog.agents), {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (pathname === "/llms.txt" && (method === "GET" || method === "HEAD")) {
      return new Response(getLlmsTxt(), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    if (pathname === "/icon.svg" && (method === "GET" || method === "HEAD")) {
      return new Response(ICON_SVG, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=86400"
        }
      });
    }

    if (pathname === "/api/newsletter" && method === "POST") {
      return Response.json({ ok: false, error: "Newsletter is not configured." }, { status: 501 });
    }

    if (pathname === "/api/sponsor" && method === "POST") {
      return handleSponsorPost(request);
    }

    if (method === "GET" || method === "HEAD") {
      const catalog = getCatalog();
      const locale = negotiateLocale(request);
      const dict = DICT[locale];

      if (pathname === "/") {
        const q = url.searchParams.get("q") || "";
        return htmlResponse(renderHomePage(catalog, locale, dict, ASSET_URLS, q), 200);
      }

      if (pathname === "/about") {
        return htmlResponse(renderAboutPage(catalog, locale, dict, ASSET_URLS), 200);
      }

      if (pathname === "/sponsor") {
        return htmlResponse(renderSponsorPage(catalog, locale, dict, ASSET_URLS), 200);
      }

      if (pathname.startsWith("/agent/")) {
        const id = decodeURIComponent(pathname.slice("/agent/".length));
        const idx = catalog.agents.findIndex((a) => a.id === id);
        if (idx === -1) {
          return htmlResponse(renderNotFoundPage(catalog, locale, dict, ASSET_URLS), 404);
        }
        const agent = catalog.agents[idx];
        const related = getRelatedAgents(agent.id, catalog.agents);
        const total = catalog.agents.length;
        const prevNext = {
          prev: catalog.agents[(idx - 1 + total) % total],
          next: catalog.agents[(idx + 1) % total]
        };
        return htmlResponse(
          renderAgentPage(catalog, agent, related, prevNext, locale, dict, ASSET_URLS),
          200
        );
      }

      if (env && env.ASSETS) {
        const assetResp = await env.ASSETS.fetch(request);
        if (assetResp.status !== 404) {
          return assetResp;
        }
      }

      const accept = request.headers.get("accept") || "";
      if (accept.includes("text/html") || !pathname.includes(".")) {
        return htmlResponse(renderNotFoundPage(catalog, locale, dict, ASSET_URLS), 404);
      }
      return new Response("Not Found", { status: 404 });
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
};
