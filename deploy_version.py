import json, sys, urllib.request, urllib.error
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_json_response
BASE="https://api.cloudflare.com/client/v4"; ACCT="8de20a34e647448bf1dad9edec8eb655"; NAME="browseboard"
class NR(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*a): raise RuntimeError("no redirect")
vid=sys.argv[1]
payload={"versions":[{"version_id":vid,"percentage":100}],"annotations":{"workers/message":"restore hero title 'Browser-driving agents' on top of PR10 (a9224f8d); preview-verified"}}
req=urllib.request.Request(BASE+f"/accounts/{ACCT}/workers/scripts/{NAME}/deployments", data=json.dumps(payload).encode(), method="POST", headers={"Content-Type":"application/json"})
add_surrogate_to_request(req,"custom.cloudflare-workers",allowed_hosts=["api.cloudflare.com"])
try:
    with urllib.request.build_opener(NR()).open(req,timeout=120) as r:
        d=read_json_response(r); print(r.status, json.dumps(d,ensure_ascii=False)[:800])
except urllib.error.HTTPError as e:
    print("HTTP",e.code,e.read()[:1500].decode('utf8','replace'))
