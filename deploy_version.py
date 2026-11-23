#!/usr/bin/env python3
"""将指定 version_id 以 100% 流量部署到 browseboard Worker。"""
import json, os, sys, urllib.request, urllib.error
from upload_and_version import ACCT, BASE, NAME, api_req

if len(sys.argv) < 2:
    print("用法: python3 deploy_version.py <version_id>", file=sys.stderr)
    sys.exit(1)

vid = sys.argv[1]
payload = {
    "versions": [{"version_id": vid, "percentage": 100}],
    "annotations": {"workers/message": f"Deploy version {vid}"},
}
try:
    status, data = api_req(
        f"/accounts/{ACCT}/workers/scripts/{NAME}/deployments",
        json.dumps(payload).encode(),
    )
    print(status, json.dumps(data, ensure_ascii=False)[:800])
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:1500].decode("utf8", "replace"))
    sys.exit(1)
