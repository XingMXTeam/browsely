#!/usr/bin/env python3
"""爬取当前线上（browserly.maoxunxing.com）的全部静态资产，生成清单。
判别：带 x-opennext 头的是 Worker 生成页，不进资产清单；其余 200 的文件型路径进清单。
"""
import hashlib, json, os, re, subprocess, sys

BASE = "https://browserly.maoxunxing.com"
OUT = os.path.expanduser("~/workspace/browseboard-latest/assets_current")
os.makedirs(OUT, exist_ok=True)

def fetch(path):
    r = subprocess.run(["curl", "-s", "-A", "Mozilla/5.0", "-D", "-", BASE + path],
                       capture_output=True, timeout=90)
    raw = r.stdout
    # split headers (could be two blocks due to proxy CONNECT)
    parts = raw.split(b"\r\n\r\n")
    body = parts[-1]
    headers = parts[-2].decode("utf8", "replace") if len(parts) >= 2 else ""
    # If redirect blocks exist, last header block corresponds to final response; body is after it.
    m = re.search(r"HTTP/[\d.]+ (\d+)", headers)
    code = int(m.group(1)) if m else -1
    ct = ""
    m2 = re.search(r"(?im)^content-type:\s*(.+)$", headers)
    if m2: ct = m2.group(1).strip()
    opennext = "x-opennext" in headers.lower()
    etag = ""
    m3 = re.search(r"(?im)^etag:\s*(.+)$", headers)
    if m3: etag = m3.group(1).strip()
    return code, ct, opennext, etag, body

# agent ids from API (worker-generated JSON, only for enumerating pages)
code, ct, on, et, body = fetch("/api/agents")
agent_ids = []
try:
    data = json.loads(body)
    items = data if isinstance(data, list) else data.get("agents", [])
    agent_ids = [a["id"] for a in items if isinstance(a, dict) and a.get("id")]
except Exception as e:
    print("api/agents 解析失败:", e, file=sys.stderr)
print("agent 数:", len(agent_ids), file=sys.stderr)

pages = ["/", "/about", "/sponsor"] + [f"/agent/{i}" for i in agent_ids]
seen = {}   # path -> dict(status, ctype, opennext, size, kind)
queue = list(pages)
page_set = set(pages)

REF_RES = [
    re.compile(r"""(?:src|href)="(/[^"#]+)"""),
    re.compile(r"""(/_next/static/[^"'()\s\\]+)"""),
    re.compile(r"""(/(?:logos|posters|fonts?)/[^"'()\s\\]+)"""),
]

while queue:
    path = queue.pop().split("#")[0].split("?")[0]
    if not path or path in seen: continue
    code, ct, on, etag, body = fetch(path)
    is_page = path in page_set
    seen[path] = {"status": code, "ctype": ct, "opennext": on, "size": len(body), "page": is_page}
    if code != 200: continue
    if not is_page:
        local = os.path.join(OUT, path.lstrip("/"))
        os.makedirs(os.path.dirname(local), exist_ok=True)
        open(local, "wb").write(body)
    # extract references from pages and text-like assets
    if is_page or any(path.endswith(x) for x in (".js", ".css", ".json", ".txt", ".html")):
        text = body.decode("utf8", "replace")
        for rx in REF_RES:
            for m in rx.findall(text):
                p = m.replace("\\u002F", "/").rstrip("\\")
                if p and p not in seen and not p.startswith("//"):
                    queue.append(p)

assets = {}
for p, v in sorted(seen.items()):
    if v["page"] or v["status"] != 200: continue
    if v["opennext"]:
        print("跳过 Worker 生成:", p, file=sys.stderr); continue
    data = open(os.path.join(OUT, p.lstrip("/")), "rb").read()
    assets[p] = {"hash": hashlib.sha256(data).hexdigest()[:32], "size": len(data), "content_type": v["ctype"]}
    print("资产", p, len(data), v["ctype"][:40])
gen = {p: v for p, v in seen.items() if v["opennext"]}
print("\nWorker 生成（不进清单）:", ", ".join(sorted(gen)))
bad = {p: v["status"] for p, v in seen.items() if v["status"] != 200}
print("非200:", bad)
print(f"\n资产共 {len(assets)} 个")
json.dump(assets, open(os.path.join(OUT, "manifest_raw.json"), "w"), indent=1)
json.dump(seen, open(os.path.join(OUT, "seen.json"), "w"), indent=1, default=str)
