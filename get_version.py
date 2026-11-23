#!/usr/bin/env python3
"""查询指定 version_id 的详情。"""
import json, sys, urllib.error
from upload_and_version import ACCT, NAME, api_req

if len(sys.argv) < 2:
    print("用法: python3 get_version.py <version_id>", file=sys.stderr)
    sys.exit(1)

vid = sys.argv[1]
try:
    status, data = api_req(
        f"/accounts/{ACCT}/workers/scripts/{NAME}/versions/{vid}",
        method="GET",
    )
    print(json.dumps(data, ensure_ascii=False, indent=2)[:4000])
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:1500].decode("utf8", "replace"))
    sys.exit(1)
