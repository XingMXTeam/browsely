#!/usr/bin/env python3
"""为 browseboard 创建资产上传会话、上传变更文件、拿到 completion JWT，
再用最新 worker.js（已打标题补丁）上传一个新版本（不部署），打印 version_id。

用法: upload_and_version.py [--deploy]
带 --deploy 时在版本上传成功后直接 100% 部署。
"""
import base64, hashlib, json, os, sys, urllib.request, urllib.error, uuid
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response

BASE = "https://api.cloudflare.com/client/v4"
ACCT = "8de20a34e647448bf1dad9edec8eb655"
NAME = "browseboard"
ROOT = os.path.expanduser("~/workspace/browseboard-latest")
ASSETS_DIR = os.path.join(ROOT, "assets_current")

raw = json.load(open(os.path.join(ASSETS_DIR, "manifest_raw.json")))
manifest, files = {}, {}
for p, v in raw.items():
    data = open(os.path.join(ASSETS_DIR, p.lstrip("/")), "rb").read()
    manifest[p] = {"hash": hashlib.sha256(data).hexdigest()[:32], "size": len(data)}
    files[p] = (data, (v.get("content_type") or "application/octet-stream").split(";")[0].strip())
hash_to_path = {v["hash"]: p for p, v in manifest.items()}
print(f"清单共 {len(manifest)} 个文件", file=sys.stderr)

class NR(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a): raise RuntimeError("拒绝重定向")

def api_req(path, data=None, method="POST", ctype="application/json", use_surrogate=True, extra_headers=None):
    req = urllib.request.Request(BASE + path, data=data, method=method,
                                 headers={"Content-Type": ctype, **(extra_headers or {})})
    if use_surrogate:
        add_surrogate_to_request(req, "custom.cloudflare-workers", allowed_hosts=["api.cloudflare.com"])
    with urllib.request.build_opener(NR()).open(req, timeout=300) as r:
        return r.status, read_json_response(r)

# 1) 上传会话
status, data = api_req(f"/accounts/{ACCT}/workers/scripts/{NAME}/assets-upload-session",
                       json.dumps({"manifest": manifest}).encode())
print("会话创建:", status, file=sys.stderr)
if not data.get("success"):
    print(json.dumps(data, ensure_ascii=False)[:2000]); sys.exit(1)
result = data["result"]
jwt = result["jwt"]; buckets = result.get("buckets") or []
print(f"需上传 buckets: {[len(b) for b in buckets]}", file=sys.stderr)

def post_bucket(jwt_token, hashes):
    boundary = "----asset" + uuid.uuid4().hex
    body = b""
    for h in hashes:
        p = hash_to_path[h]
        content, ctype = files[p]
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{h}"\r\n'.encode()
        body += f"Content-Type: {ctype}\r\n\r\n".encode()
        body += base64.b64encode(content) + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    req = urllib.request.Request(BASE + f"/accounts/{ACCT}/workers/assets/upload?base64=true",
                                 data=body, method="POST",
                                 headers={"Content-Type": f"multipart/form-data; boundary={boundary}",
                                          "Authorization": f"Bearer {jwt_token}"})
    try:
        with urllib.request.build_opener(NR()).open(req, timeout=300) as r:
            return r.status, read_json_response(r)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())

completion = jwt if not buckets else None
for bucket in buckets:
    st, resp = post_bucket(jwt, bucket)
    print("bucket 上传:", st, json.dumps(resp, ensure_ascii=False)[:200], file=sys.stderr)
    if resp.get("result", {}).get("jwt"):
        completion = resp["result"]["jwt"]
if not completion:
    print("未拿到 completion JWT", file=sys.stderr); sys.exit(1)
open(os.path.join(ROOT, "completion.jwt"), "w").write(completion)
print("completion JWT 已保存", file=sys.stderr)

# 2) 上传新版本（不部署）
code = open(os.path.join(ROOT, "pkg", "worker.js"), "rb").read()
metadata = {
    "main_module": "worker.js",
    "compatibility_date": "2026-10-19",
    "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
    "assets": {"jwt": completion},
    "bindings": [
        {"name": "ASSETS", "type": "assets"},
        {"name": "WORKER_SELF_REFERENCE", "type": "service", "service": "browseboard", "environment": "production"},
    ],
    "annotations": {"workers/message": "restore footer copy (brand paragraphs, about/sponsor footer, detail line) removed by PR9, on top of v45 title restore"},
}
boundary = "----cfver" + uuid.uuid4().hex
body = b""
def part(name, filename, ctype, data):
    global body
    body += f"--{boundary}\r\n".encode()
    disp = f'Content-Disposition: form-data; name="{name}"'
    if filename: disp += f'; filename="{filename}"'
    body += (disp + "\r\n").encode()
    body += f"Content-Type: {ctype}\r\n\r\n".encode()
    body += data + b"\r\n"
part("metadata", None, "application/json", json.dumps(metadata).encode())
part("worker.js", "worker.js", "application/javascript+module", code)
body += f"--{boundary}--\r\n".encode()
try:
    status, data = api_req(f"/accounts/{ACCT}/workers/scripts/{NAME}/versions",
                           body, ctype=f"multipart/form-data; boundary={boundary}")
except urllib.error.HTTPError as e:
    print("版本上传 HTTPError", e.code, e.read()[:2000].decode("utf8", "replace")); sys.exit(1)
print("版本上传:", status, json.dumps(data, ensure_ascii=False)[:600])
if not data.get("success"):
    sys.exit(1)
version_id = data["result"]["id"]
print("VERSION_ID:", version_id)

if "--deploy" in sys.argv:
    payload = {"versions": [{"version_id": version_id, "percentage": 100}],
               "annotations": {"workers/message": "restore hero title on PR10 base"}}
    try:
        status, data = api_req(f"/accounts/{ACCT}/workers/scripts/{NAME}/deployments",
                               json.dumps(payload).encode())
        print("部署:", status, json.dumps(data, ensure_ascii=False)[:600])
    except urllib.error.HTTPError as e:
        print("部署 HTTPError", e.code, e.read()[:2000].decode("utf8", "replace")); sys.exit(1)
