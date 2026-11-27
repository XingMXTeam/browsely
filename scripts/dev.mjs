import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS_DIR = path.join(ROOT, "assets_current");
const WORKER_FILE = path.join(ROOT, "pkg", "worker.js");

const args = process.argv.slice(2);
const portIdx = args.indexOf("--port");
const PORT = Number(
  (portIdx !== -1 && args[portIdx + 1]) || process.env.PORT || 8787
);

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const { default: worker } = await import(pathToFileURL(WORKER_FILE).href);

const env = {
  ASSETS: {
    async fetch(request) {
      const url = new URL(request.url);
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const resolved = path.resolve(ASSETS_DIR, rel);
      if (!resolved.startsWith(ASSETS_DIR + path.sep) && resolved !== ASSETS_DIR) {
        return new Response("Forbidden", { status: 403 });
      }
      if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
        return new Response("Not Found", { status: 404 });
      }
      const ext = path.extname(resolved).toLowerCase();
      const buf = fs.readFileSync(resolved);
      const isImmutable = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/fonts/");
      return new Response(buf, {
        status: 200,
        headers: {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": isImmutable ? "public, max-age=31536000, immutable" : "public, max-age=3600"
        }
      });
    }
  }
};

const server = http.createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || `127.0.0.1:${PORT}`}`;
    const fullUrl = new URL(req.url || "/", origin);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === "string") headers.set(k, v);
      else if (Array.isArray(v)) headers.set(k, v.join(", "));
    }

    const method = (req.method || "GET").toUpperCase();
    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const ch of req) chunks.push(ch);
      body = Buffer.concat(chunks);
    }

    const request = new Request(fullUrl, { method, headers, body });
    const response = await worker.fetch(request, env);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    if (method === "HEAD") {
      res.end();
      return;
    }
    const ab = await response.arrayBuffer();
    res.end(Buffer.from(ab));
  } catch (err) {
    console.error("Dev server error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Browserly local Worker dev server listening on http://127.0.0.1:${PORT}`);
});
