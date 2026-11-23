#!/usr/bin/env python3
"""在最新版代码（version a9224f8d / PR10）上只补回首页标题行 'Browser-driving agents'。
- worker.js（服务端）：hero 结构 + 中英词典 home.title（各 2 处）
- 客户端 chunk 1_rvcu46_4k20.js：hero 结构
- 客户端词典 chunk 42jrnv_t82twh.js：中英 home.title
- CSS chunk 4583qnkd2m-l1.css：追加旧版 .type-hero 四条规则（从旧版 CSS 原文提取）
任何一处计数不符即中止，不写文件。
"""
import os, re, shutil, sys

ROOT = os.path.expanduser("~/workspace/browseboard-latest")
os.makedirs(os.path.join(ROOT, "orig"), exist_ok=True)

def load(p):
    with open(p, encoding="utf-8", errors="strict") as f: return f.read()

def save(p, s):
    with open(p, "w", encoding="utf-8") as f: f.write(s)

def rep(text, old, new, expect, label):
    n = text.count(old)
    if n != expect:
        print(f"中止：{label} 期望 {expect} 处，实际 {n} 处"); sys.exit(1)
    print(f"{label}: {n} 处已替换")
    return text.replace(old, new)

def backup(p):
    b = os.path.join(ROOT, "orig", p.replace("/", "__"))
    if not os.path.exists(b): shutil.copy(p, b)

# ---------- 1) worker.js ----------
wp = os.path.join(ROOT, "pkg", "worker.js")
backup(wp)
w = load(wp)

hero_old = '(0, b.jsx)("header", { className: "bb-hero pt-8 text-center sm:pt-12 lg:pt-16", children: (0, b.jsx)("h1", { className: "bb-wordmark", children: L.L }) })'
hero_new = '(0, b.jsxs)("header", { className: "bb-hero pt-8 text-center sm:pt-12 lg:pt-16", children: [(0, b.jsx)("p", { className: "bb-wordmark", children: L.L }), (0, b.jsx)("h1", { className: "type-hero mx-auto max-w-5xl text-ink", children: c2.home.title })] })'
w = rep(w, hero_old, hero_new, 1, "worker.js hero")

w = rep(w, 'home: { changelog: "Changelog",',
           'home: { title: "Browser-driving agents", changelog: "Changelog",', 2, "worker.js EN dict")

zh_old = 'home: { changelog: "\\u66F4\\u65B0\\u8BB0\\u5F55",'
zh_new = 'home: { title: "\\u9A71\\u52A8\\u6D4F\\u89C8\\u5668\\u7684\\u667A\\u80FD\\u4F53", changelog: "\\u66F4\\u65B0\\u8BB0\\u5F55",'
w = rep(w, zh_old, zh_new, 2, "worker.js ZH dict")
save(wp, w)

# ---------- 2) client HomeView chunk ----------
cp = os.path.join(ROOT, "assets_current/_next/static/chunks/1_rvcu46_4k20.js")
backup(cp)
c = load(cp)
che_old = '(0,t.jsx)("header",{className:"bb-hero pt-8 text-center sm:pt-12 lg:pt-16",children:(0,t.jsx)("h1",{className:"bb-wordmark",children:U.L})})'
che_new = '(0,t.jsxs)("header",{className:"bb-hero pt-8 text-center sm:pt-12 lg:pt-16",children:[(0,t.jsx)("p",{className:"bb-wordmark",children:U.L}),(0,t.jsx)("h1",{className:"type-hero mx-auto max-w-5xl text-ink",children:n.home.title})]})'
c = rep(c, che_old, che_new, 1, "client hero")
save(cp, c)

# ---------- 3) client dict chunk ----------
dp = os.path.join(ROOT, "assets_current/_next/static/chunks/42jrnv_t82twh.js")
backup(dp)
d = load(dp)
d = rep(d, 'home:{changelog:"Changelog",', 'home:{title:"Browser-driving agents",changelog:"Changelog",', 1, "client EN dict")
d = rep(d, 'home:{changelog:"更新记录",', 'home:{title:"驱动浏览器的智能体",changelog:"更新记录",', 1, "client ZH dict")
save(dp, d)

# ---------- 4) CSS ----------
sp = os.path.join(ROOT, "assets_current/_next/static/chunks/4583qnkd2m-l1.css")
backup(sp)
css = load(sp)
old_css = load(os.path.join(ROOT, "old.css"))
rules = []
for pat in [r'\.type-hero\{letter-spacing[^}]*\}',
            r'\.type-hero\{text-shadow[^}]*\}',
            r'\.type-hero:after\{[^}]*\}',
            r'\.bb-hero \.type-hero\{[^}]*\}']:
    m = re.search(pat, old_css)
    if not m:
        print("中止：旧 CSS 找不到规则", pat); sys.exit(1)
    rules.append(m.group(0))
addition = "\n/* restored hero title (was removed in PR9/PR10) */\n" + "".join(rules) + "\n"
if ".type-hero" in css:
    print("中止：现 CSS 已含 .type-hero"); sys.exit(1)
css = css + addition
save(sp, css)
print("CSS 已追加规则:", len(addition), "字节")
print("全部补丁完成")
