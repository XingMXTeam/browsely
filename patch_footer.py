#!/usr/bin/env python3
"""在当前线上代码（版本 #45，含已恢复的 hero 标题）上补回 PR9 删掉的页脚说明：
- 首页页脚品牌区三段（tag/built/coverage）+ 底部 rights 行
- /about、/sponsor 的简易页脚（docs + coverage 中英两段 + 链接行）
- 详情页页脚一行（detail.line）
原文（中英）从旧版 Nov 2 构建的词典 chunk 程序化提取，不手抄。
任何一处计数不符即中止。
"""
import os, re, shutil, sys

ROOT = os.path.expanduser("~/workspace/browseboard-latest")

def load(p):
    with open(p, encoding="utf-8") as f: return f.read()

def save(p, s):
    with open(p, "w", encoding="utf-8") as f: f.write(s)

def rep(text, old, new, expect, label):
    n = text.count(old)
    if n != expect:
        print(f"中止：{label} 期望 {expect} 处，实际 {n} 处"); sys.exit(1)
    print(f"{label}: {n} 处已替换")
    return text.replace(old, new)

def backup(p):
    b = os.path.join(ROOT, "orig", p.replace("/", "__") + ".pre-footer")
    if not os.path.exists(b): shutil.copy(p, b)

def esc(s):
    """转义成 worker.js 词典风格：非 ASCII 用 \\uXXXX。"""
    out = []
    for ch in s:
        o = ord(ch)
        if ch == '"': out.append('\\"')
        elif ch == '\\': out.append('\\\\')
        elif o < 128: out.append(ch)
        else: out.append('\\u%04X' % o)
    return ''.join(out)

# ---------- 从旧版词典提取原文 ----------
old_dict = load(os.path.join(ROOT, "oldchunk-3ok5e0v31tbak.js"))
footers = re.findall(r'footer:\{docs:"(.*?)",tag:"(.*?)",built:"(.*?)"', old_dict)
rights = re.findall(r'rights:"(.*?)"', old_dict)
lines = re.findall(r'line:"(Browserly [^"]*)"', old_dict)
assert len(footers) == 2 and len(rights) == 2 and len(lines) == 2, (len(footers), len(rights), len(lines))
EN = {"docs": footers[0][0], "tag": footers[0][1], "built": footers[0][2], "rights": rights[0], "line": lines[0]}
ZH = {"docs": footers[1][0], "tag": footers[1][1], "built": footers[1][2], "rights": rights[1], "line": lines[1]}
print("旧版原文 EN tag:", EN["tag"][:60], "...")
print("旧版原文 ZH tag:", ZH["tag"][:30], "...")
print("旧版原文 EN line:", EN["line"][:60], "...")

# ---------- 1) worker.js ----------
wp = os.path.join(ROOT, "pkg", "worker.js")
backup(wp)
w = load(wp)

# 调用点补 coverage 入参
w = rep(w, '(0, b.jsx)(g.FooterBar, { agents: (0, h.f)().agents })',
           '(0, b.jsx)(g.FooterBar, { agents: (0, h.f)().agents, coverage: (0, h.f)().coverage })', 1, "worker 调用点")

# FooterBar 签名 + 分支（agent 页脚 / 非首页简易页脚）
old_head = '["FooterBar", 0, function({ agents: a2 }) {'
w = rep(w, old_head, '["FooterBar", 0, function({ coverage: a3, agents: a2 }) {', 1, "worker FooterBar 签名")
old_branch = '{ t: i } = (0, f.useLocale)();\n            if (h.startsWith("/agent/")) return null;'
new_branch = ('{ locale: loc, t: i } = (0, f.useLocale)();\n'
              '            if (h.startsWith("/agent/")) return (0, b.jsx)("footer", { className: "bbd-footer", children: i.detail.line });\n'
              '            if ("/" !== h) return (0, b.jsx)("footer", { className: "border-t border-hairline", children: (0, b.jsxs)("div", { className: "mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 py-14 text-[15px] leading-relaxed text-ink/70 sm:px-6 sm:py-16", children: [(0, b.jsx)("p", { children: i.footer.docs }), (0, b.jsx)("p", { lang: "zh-CN", children: a3.zh }), (0, b.jsx)("p", { lang: "en", children: a3.en }), (0, b.jsxs)("div", { className: "flex gap-5", children: [(0, b.jsx)(d.default, { href: "/about", className: "font-semibold text-ink", children: i.nav.method }), (0, b.jsx)(d.default, { href: "/sponsor", className: "font-semibold text-ink", children: i.nav.sponsor })] })] }) });')
w = rep(w, old_branch, new_branch, 1, "worker FooterBar 分支")

# 首页品牌区：logo 外包 div + 三段
old_top = '(0, b.jsxs)("div", { className: "bbf-top", children: [(0, b.jsxs)(d.default, { href: "/", className: "bbf-logo", children: [(0, b.jsx)(c.default, { src: "/browseboard.svg", alt: "", width: 36, height: 36, unoptimized: true }), (0, b.jsx)("span", { children: g.L })] }), (0, b.jsxs)("nav", { className: "bbf-cols", "aria-label": g.L,'
new_top = ('(0, b.jsxs)("div", { className: "bbf-top", children: [(0, b.jsxs)("div", { children: [(0, b.jsxs)(d.default, { href: "/", className: "bbf-logo", children: [(0, b.jsx)(c.default, { src: "/browseboard.svg", alt: "", width: 36, height: 36, unoptimized: true }), (0, b.jsx)("span", { children: g.L })] }), '
           '(0, b.jsx)("p", { className: "bbf-tag", children: i.footer.tag.replace("{count}", String(a2.length)) }), '
           '(0, b.jsx)("p", { className: "bbf-note", children: i.footer.built }), '
           '(0, b.jsx)("p", { className: "bbf-note", children: "zh" === loc ? a3.zh : a3.en })] }), (0, b.jsxs)("nav", { className: "bbf-cols", "aria-label": g.L,')
w = rep(w, old_top, new_top, 1, "worker 首页品牌区")

# 底部 rights 行
w = rep(w, '(0, b.jsx)("span", { children: i.footer.copy }), (0, b.jsxs)("span", { className: "bbf-blinks",',
           '(0, b.jsx)("span", { children: i.footer.copy }), (0, b.jsx)("span", { children: i.footer.rights }), (0, b.jsxs)("span", { className: "bbf-blinks",', 1, "worker 底部 rights")

# 词典 EN（×2）
w = rep(w, 'footer: { explore: "Explore",',
           f'footer: {{ docs: "{esc(EN["docs"])}", tag: "{esc(EN["tag"])}", built: "{esc(EN["built"])}", explore: "Explore",', 2, "worker EN footer 词典")
w = rep(w, 'coverage: "Coverage", top: "Back to top",',
           f'coverage: "Coverage", rights: "{esc(EN["rights"])}", top: "Back to top",', 2, "worker EN rights")
# 词典 ZH（×2）
w = rep(w, 'footer: { explore: "\\u63A2\\u7D22",',
           f'footer: {{ docs: "{esc(ZH["docs"])}", tag: "{esc(ZH["tag"])}", built: "{esc(ZH["built"])}", explore: "\\u63A2\\u7D22",', 2, "worker ZH footer 词典")
zh_cov = 'coverage: "\\u8986\\u76D6\\u8303\\u56F4",'
assert w.count(zh_cov) == 2, w.count(zh_cov)
w = rep(w, zh_cov + ' top: "\\u56DE\\u5230\\u9876\\u90E8",',
           zh_cov + f' rights: "{esc(ZH["rights"])}", top: "\\u56DE\\u5230\\u9876\\u90E8",', 2, "worker ZH rights")
# detail.line（×2 ×2）
w = rep(w, 'docs: "Docs", credential:', f'docs: "Docs", line: "{esc(EN["line"])}", credential:', 2, "worker EN detail.line")
w = rep(w, 'docs: "\\u6587\\u6863", credential:', f'docs: "\\u6587\\u6863", line: "{esc(ZH["line"])}", credential:', 2, "worker ZH detail.line")
save(wp, w)

# ---------- 2) 客户端 FooterBar chunk ----------
cp = os.path.join(ROOT, "assets_current/_next/static/chunks/0b-0uenmbm1pe.js")
backup(cp)
c = load(cp)
old_head_c = 'function({agents:e}){let u=(0,l.usePathname)(),{t:i}=(0,a.useLocale)();if(u.startsWith("/agent/"))return null;'
new_head_c = ('function({coverage:cov,agents:e}){let u=(0,l.usePathname)(),{locale:loc,t:i}=(0,a.useLocale)();'
              'if(u.startsWith("/agent/"))return(0,t.jsx)("footer",{className:"bbd-footer",children:i.detail.line});'
              'if("/"!==u)return(0,t.jsx)("footer",{className:"border-t border-hairline",children:(0,t.jsxs)("div",{className:"mx-auto flex w-full max-w-[90rem] flex-col gap-4 px-4 py-14 text-[15px] leading-relaxed text-ink/70 sm:px-6 sm:py-16",children:[(0,t.jsx)("p",{children:i.footer.docs}),(0,t.jsx)("p",{lang:"zh-CN",children:cov.zh}),(0,t.jsx)("p",{lang:"en",children:cov.en}),(0,t.jsxs)("div",{className:"flex gap-5",children:[(0,t.jsx)(n.default,{href:"/about",className:"font-semibold text-ink",children:i.nav.method}),(0,t.jsx)(n.default,{href:"/sponsor",className:"font-semibold text-ink",children:i.nav.sponsor})]})]})});')
c = rep(c, old_head_c, new_head_c, 1, "client FooterBar 分支")
old_top_c = '(0,t.jsxs)("div",{className:"bbf-top",children:[(0,t.jsxs)(n.default,{href:"/",className:"bbf-logo",children:[(0,t.jsx)(r.default,{src:"/browseboard.svg",alt:"",width:36,height:36,unoptimized:!0}),(0,t.jsx)("span",{children:o.L})]}),(0,t.jsxs)("nav",{className:"bbf-cols","aria-label":o.L,'
new_top_c = ('(0,t.jsxs)("div",{className:"bbf-top",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)(n.default,{href:"/",className:"bbf-logo",children:[(0,t.jsx)(r.default,{src:"/browseboard.svg",alt:"",width:36,height:36,unoptimized:!0}),(0,t.jsx)("span",{children:o.L})]}),'
             '(0,t.jsx)("p",{className:"bbf-tag",children:i.footer.tag.replace("{count}",String(e.length))}),'
             '(0,t.jsx)("p",{className:"bbf-note",children:i.footer.built}),'
             '(0,t.jsx)("p",{className:"bbf-note",children:"zh"===loc?cov.zh:cov.en})]}),(0,t.jsxs)("nav",{className:"bbf-cols","aria-label":o.L,')
c = rep(c, old_top_c, new_top_c, 1, "client 首页品牌区")
c = rep(c, '(0,t.jsx)("span",{children:i.footer.copy}),(0,t.jsxs)("span",{className:"bbf-blinks",',
           '(0,t.jsx)("span",{children:i.footer.copy}),(0,t.jsx)("span",{children:i.footer.rights}),(0,t.jsxs)("span",{className:"bbf-blinks",', 1, "client 底部 rights")
save(cp, c)

# ---------- 3) 客户端词典 chunk ----------
dp = os.path.join(ROOT, "assets_current/_next/static/chunks/42jrnv_t82twh.js")
backup(dp)
d = load(dp)
d = rep(d, 'footer:{explore:"Explore",',
           f'footer:{{docs:"{EN["docs"]}",tag:"{EN["tag"]}",built:"{EN["built"]}",explore:"Explore",', 1, "client EN footer 词典")
d = rep(d, 'coverage:"Coverage",top:"Back to top",',
           f'coverage:"Coverage",rights:"{EN["rights"]}",top:"Back to top",', 1, "client EN rights")
d = rep(d, 'footer:{explore:"探索",',
           f'footer:{{docs:"{ZH["docs"]}",tag:"{ZH["tag"]}",built:"{ZH["built"]}",explore:"探索",', 1, "client ZH footer 词典")
d = rep(d, 'coverage:"覆盖范围",top:"回到顶部",',
           f'coverage:"覆盖范围",rights:"{ZH["rights"]}",top:"回到顶部",', 1, "client ZH rights")
d = rep(d, 'docs:"Docs",credential:', f'docs:"Docs",line:"{EN["line"]}",credential:', 1, "client EN detail.line")
d = rep(d, 'docs:"文档",credential:', f'docs:"文档",line:"{ZH["line"]}",credential:', 1, "client ZH detail.line")
save(dp, d)

# ---------- 4) CSS ----------
sp = os.path.join(ROOT, "assets_current/_next/static/chunks/4583qnkd2m-l1.css")
backup(sp)
css = load(sp)
old_css = load(os.path.join(ROOT, "old.css"))
rules = []
for pat in [r'\.bbf-tag\{[^}]*\}', r'\.bbf-note\{[^}]*\}', r'\.bbd-footer\{[^}]*\}',
            r'\.py-14\{[^}]*\}', r'\.sm\\:py-16\{[^}]*\}']:
    m = re.search(pat, old_css)
    if not m:
        print("中止：旧 CSS 找不到规则", pat); sys.exit(1)
    rules.append(m.group(0))
rules.append('@media (min-width:900px){.bbf-top{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:4rem}}')
for cls in ['.bbf-tag', '.bbf-note', '.bbd-footer']:
    if cls + '{' in css or cls + ' ' in css:
        print("中止：现 CSS 已含", cls); sys.exit(1)
css += "\n/* restored footer copy styles (was removed in PR9/PR10) */\n" + "".join(rules) + "\n"
save(sp, css)
print("CSS 已追加规则:", len(rules), "条")
print("全部页脚补丁完成")
