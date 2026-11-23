#!/usr/bin/env python3
"""给 Browserly 页脚加联系方式块（微信二维码 + 微信号 maoxunxing + 公众号「毛毛星」）：
- 首页页脚品牌区（coverage 段之后）加联系块：QR 小图 + 两行文字（按 locale 中英切换）
- /about、/sponsor 简易页脚链接行之后加同一联系块
- 详情页页脚保持一行（原设计），不动
SSR（pkg/worker.js）与客户端 chunk（0b-…js）必须同步改，保证 hydration 树一致。
任何一处计数不符即中止。备份后缀 .pre-contact。
"""
import json, os, shutil, sys

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
    b = os.path.join(ROOT, "orig", p.replace("/", "__") + ".pre-contact")
    if not os.path.exists(b): shutil.copy(p, b)

def esc(s):
    """转义成 JS 字符串字面量：非 ASCII 用 \\uXXXX。"""
    out = []
    for ch in s:
        o = ord(ch)
        if ch == '"': out.append('\\"')
        elif ch == '\\': out.append('\\\\')
        elif o < 128: out.append(ch)
        else: out.append('\\u%04X' % o)
    return ''.join(out)

ZH_ID = esc("微信号：maoxunxing")
EN_ID = "WeChat: maoxunxing"
ZH_OA = esc("公众号「毛毛星」，微信搜索关注")
EN_OA = "WeChat official account: " + esc("毛毛星") + " \\u2014 search to follow"

def block(j, note_cls):
    """j = jsx 工厂前缀（worker: '(0, b.' / client: '(0, t.'），note_cls = 文字段落 class 或 None。"""
    p_attrs = ('{ className: "bbf-note", style: { margin: 0 }, children: ' if note_cls
               else '{ style: { margin: 0 }, children: ')
    if j == "(0, b.":
        return ('(0, b.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 12, marginTop: 14 }, children: ['
                '(0, b.jsx)("img", { src: "/wechat-qr.jpg", alt: "WeChat QR", width: 64, height: 64, loading: "lazy", style: { borderRadius: 8, flex: "none" } }), '
                f'(0, b.jsxs)("p", {p_attrs}["zh" === loc ? "{ZH_ID}" : "{EN_ID}", (0, b.jsx)("br", {{}}), "zh" === loc ? "{ZH_OA}" : "{EN_OA}"] }})] }})')
    else:
        return ('(0,t.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:12,marginTop:14},children:['
                '(0,t.jsx)("img",{src:"/wechat-qr.jpg",alt:"WeChat QR",width:64,height:64,loading:"lazy",style:{borderRadius:8,flex:"none"}}),'
                f'(0,t.jsxs)("p",{{className:"bbf-note",style:{{margin:0}},children:["zh"===loc?"{ZH_ID}":"{EN_ID}",(0,t.jsx)("br",{{}}),"zh"===loc?"{ZH_OA}":"{EN_OA}"]}})]}})')

# ---------- 1) worker.js（SSR） ----------
wp = os.path.join(ROOT, "pkg", "worker.js")
backup(wp)
w = load(wp)

# 首页品牌区：coverage 段后追加联系块
w = rep(w,
        '(0, b.jsx)("p", { className: "bbf-note", children: "zh" === loc ? a3.zh : a3.en })] }), (0, b.jsxs)("nav", { className: "bbf-cols"',
        '(0, b.jsx)("p", { className: "bbf-note", children: "zh" === loc ? a3.zh : a3.en }), ' + block("(0, b.", True) + '] }), (0, b.jsxs)("nav", { className: "bbf-cols"',
        1, "worker 首页品牌区联系块")

# 简易页脚（about/sponsor）：链接行后追加联系块（无 bbf-note class，用尾随样式继承）
old_simple_tail = '(0, b.jsx)(d.default, { href: "/sponsor", className: "font-semibold text-ink", children: i.nav.sponsor })] })] }) });'
simple_block = ('(0, b.jsxs)("div", { className: "flex items-center gap-3", children: ['
                '(0, b.jsx)("img", { src: "/wechat-qr.jpg", alt: "WeChat QR", width: 64, height: 64, loading: "lazy", style: { borderRadius: 8, flex: "none" } }), '
                f'(0, b.jsxs)("p", {{ style: {{ margin: 0 }}, children: ["zh" === loc ? "{ZH_ID}" : "{EN_ID}", (0, b.jsx)("br", {{}}), "zh" === loc ? "{ZH_OA}" : "{EN_OA}"] }})] }})')
w = rep(w, old_simple_tail,
        '(0, b.jsx)(d.default, { href: "/sponsor", className: "font-semibold text-ink", children: i.nav.sponsor })] }), ' + simple_block + '] }) });',
        1, "worker 简易页脚联系块")
save(wp, w)

# ---------- 2) 客户端 chunk 0b（hydration 必须同构） ----------
cp = os.path.join(ROOT, "assets_current/_next/static/chunks/0b-0uenmbm1pe.js")
backup(cp)
c = load(cp)

c = rep(c,
        '(0,t.jsx)("p",{className:"bbf-note",children:"zh"===loc?cov.zh:cov.en})]}),(0,t.jsxs)("nav",{className:"bbf-cols"',
        '(0,t.jsx)("p",{className:"bbf-note",children:"zh"===loc?cov.zh:cov.en}),' + block("(0, t.", True) + ']}),(0,t.jsxs)("nav",{className:"bbf-cols"',
        1, "client 首页品牌区联系块")

old_simple_tail_c = '(0,t.jsx)(n.default,{href:"/sponsor",className:"font-semibold text-ink",children:i.nav.sponsor})]})]})});'
simple_block_c = ('(0,t.jsxs)("div",{className:"flex items-center gap-3",children:['
                  '(0,t.jsx)("img",{src:"/wechat-qr.jpg",alt:"WeChat QR",width:64,height:64,loading:"lazy",style:{borderRadius:8,flex:"none"}}),'
                  f'(0,t.jsxs)("p",{{style:{{margin:0}},children:["zh"===loc?"{ZH_ID}":"{EN_ID}",(0,t.jsx)("br",{{}}),"zh"===loc?"{ZH_OA}":"{EN_OA}"]}})]}})')

c = rep(c, old_simple_tail_c,
        '(0,t.jsx)(n.default,{href:"/sponsor",className:"font-semibold text-ink",children:i.nav.sponsor})]}),' + simple_block_c + ']})});',
        1, "client 简易页脚联系块")
save(cp, c)

# ---------- 3) manifest 注册新图 ----------
mp = os.path.join(ROOT, "assets_current", "manifest_raw.json")
backup(mp)
manifest = json.load(open(mp, encoding="utf-8"))
if "/wechat-qr.jpg" not in manifest:
    manifest["/wechat-qr.jpg"] = {"content_type": "image/jpeg"}
    with open(mp, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("manifest 已注册 /wechat-qr.jpg")
else:
    print("manifest 已有 /wechat-qr.jpg，跳过")
print("联系方式补丁完成")