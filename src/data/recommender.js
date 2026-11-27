import { getCatalog } from "./catalog.js";
import { authLabel, hostingLabel, licenseLabel, mcpLabel, perceptionLabel } from "../i18n/dict.js";

export const REC_OPTIONS = {
  useCase: ["any", "coding-agent", "logged-in-ops", "headless-pipeline", "visual-canvas", "hard-antibot"],
  auth: ["any", "local-session", "isolated-profile", "cloud-vault"],
  hosting: ["any", "self-host", "cloud"],
  mcp: ["any", "required", "preferred", "sdk-cli"],
  antiBot: ["any", "none", "login-reuse", "stealth-captcha"],
  budget: ["any", "free-oss", "oss-any", "paid-ok"],
  perception: ["any", "dom", "hybrid", "vision"]
};

const REC_PERMISSIVE_LICENSES = new Set(["MIT", "Apache-2.0"]);
const REC_COPYLEFT_LICENSES = new Set(["AGPL-3.0", "SSPL-1.0"]);
const REC_LOCAL_SESSION_AUTH = new Set(["user_browser", "both_user_browser_and_runtime"]);
const REC_ISOLATED_AUTH = new Set(["browser_profile", "agent_runtime", "both_user_browser_and_runtime", "app_owned"]);
const REC_CLOUD_VAULT_AUTH = new Set(["cloud_vault", "both_user_browser_and_runtime", "app_owned", "browser_profile"]);

function recPickEnum(raw, validList, fallback = "any") {
  if (typeof raw !== "string") return fallback;
  const v = raw.trim().toLowerCase();
  return validList.includes(v) ? v : fallback;
}

export function normalizeRecommendParams(input = {}) {
  const get = (keys) => {
    if (input instanceof URLSearchParams) {
      for (const k of keys) {
        const val = input.get(k);
        if (val != null && val.trim() !== "") return val;
      }
      return "";
    }
    for (const k of keys) {
      if (input[k] != null && String(input[k]).trim() !== "") return String(input[k]);
    }
    return "";
  };

  const rawLimitStr = get(["limit", "top"]);
  const rawLimit = rawLimitStr ? Number(rawLimitStr) : NaN;
  const limit = Number.isFinite(rawLimit) ? Math.min(10, Math.max(1, Math.round(rawLimit))) : 3;
  const rawLocale = get(["locale", "lang"]).toLowerCase();
  const locale = rawLocale.startsWith("zh") ? "zh" : rawLocale.startsWith("en") ? "en" : null;

  return {
    useCase: recPickEnum(get(["useCase", "use_case", "scenario", "goal"]), REC_OPTIONS.useCase, "any"),
    auth: recPickEnum(get(["auth", "credentials", "session"]), REC_OPTIONS.auth, "any"),
    hosting: recPickEnum(get(["hosting", "host", "deploy"]), REC_OPTIONS.hosting, "any"),
    mcp: recPickEnum(get(["mcp"]), REC_OPTIONS.mcp, "any"),
    antiBot: recPickEnum(get(["antiBot", "anti_bot", "antibot", "stealth"]), REC_OPTIONS.antiBot, "any"),
    budget: recPickEnum(get(["budget", "license", "pricing"]), REC_OPTIONS.budget, "any"),
    perception: recPickEnum(get(["perception"]), REC_OPTIONS.perception, "any"),
    limit,
    locale
  };
}

function recCheckHardExclusion(agent, q, loc) {
  const zh = loc === "zh";

  if (q.hosting === "self-host" && agent.hosting === "cloud") {
    return {
      reasonCode: "cloud_only",
      reason: zh
        ? "仅提供云端托管，不满足数据不出内网（self-host）要求。"
        : "Cloud-only runtime; cannot satisfy a strict self-host / private-network constraint."
    };
  }
  if (q.hosting === "cloud" && agent.hosting === "self-host") {
    return {
      reasonCode: "self_host_only",
      reason: zh
        ? "仅支持本机/自托管运行，无官方云端托管服务。"
        : "Self-host only; no vendor-managed cloud runtime verified."
    };
  }
  if (q.mcp === "required" && agent.mcp === "no") {
    return {
      reasonCode: "no_mcp",
      reason: zh
        ? "不提供原生 MCP 服务器，无法直接以 MCP 协议挂载。"
        : "No native MCP server; cannot satisfy a strict MCP requirement."
    };
  }
  if (q.auth === "local-session" && !REC_LOCAL_SESSION_AUTH.has(agent.authModel)) {
    return {
      reasonCode: "no_local_session",
      reason: zh
        ? `凭据模型为「${authLabel("zh", agent.authModel)}」，不支持直接复用本机已登录浏览器会话。`
        : `Uses ${authLabel("en", agent.authModel)} credentials rather than attaching to your existing local browser session.`
    };
  }
  if (q.auth === "cloud-vault" && (agent.authModel === "user_browser" || agent.authModel === "unknown")) {
    return {
      reasonCode: "no_cloud_vault",
      reason: zh
        ? "依赖本机用户会话或凭据机制未知，不提供云端托管凭据库。"
        : "Depends on a local user browser session (or unknown auth) rather than a cloud credential vault."
    };
  }
  if (q.budget === "free-oss") {
    if (REC_COPYLEFT_LICENSES.has(agent.license)) {
      return {
        reasonCode: "copyleft_license",
        reason: zh
          ? `许可证为 ${agent.license}（强传染性/源码可用协议），不符合 MIT / Apache-2.0 宽松开源约束。`
          : `Licensed under ${agent.license} (copyleft / source-available), outside strict MIT / Apache-2.0 requirements.`
      };
    }
    if (!REC_PERMISSIVE_LICENSES.has(agent.license)) {
      return {
        reasonCode: "not_permissive_oss",
        reason: zh
          ? `许可证为「${licenseLabel("zh", agent.license)}」，非宽松开源免费方案。`
          : `License is ${licenseLabel("en", agent.license)}, not a permissive MIT / Apache-2.0 open-source tool.`
      };
    }
  }
  if (q.budget === "oss-any") {
    if (!REC_PERMISSIVE_LICENSES.has(agent.license) && !REC_COPYLEFT_LICENSES.has(agent.license)) {
      return {
        reasonCode: "not_open_source",
        reason: zh
          ? `许可证为「${licenseLabel("zh", agent.license)}」，不符合开源可自托管要求。`
          : `License is ${licenseLabel("en", agent.license)}, not an open-source repository.`
      };
    }
  }
  if (q.perception !== "any" && agent.perception !== q.perception) {
    if (!(q.perception === "vision" && agent.perception === "hybrid")) {
      return {
        reasonCode: "perception_mismatch",
        reason: zh
          ? `感知路径为「${perceptionLabel("zh", agent.perception)}」，与指定的「${perceptionLabel("zh", q.perception)}」不匹配。`
          : `Perception pipeline is ${perceptionLabel("en", agent.perception)}, not ${perceptionLabel("en", q.perception)}.`
      };
    }
  }
  return null;
}

function recScoreAgent(agent, q, loc) {
  const zh = loc === "zh";
  let raw = 0;
  let maxPossible = 0;
  const reasons = [];
  const breakdown = {};

  function addAxis(key, earned, possible, reasonText) {
    raw += earned;
    maxPossible += possible;
    breakdown[key] = { earned, possible };
    if (reasonText) reasons.push(reasonText);
  }

  // 1. Use-case fit (weight 30)
  if (q.useCase === "coding-agent") {
    let s = 0;
    if (agent.mcp === "yes") s += 12;
    else if (agent.mcp === "partial") s += 5;
    if (agent.hosting === "self-host") s += 7;
    else if (agent.hosting === "both") s += 6;
    if (agent.perception === "dom") s += 6;
    else if (agent.perception === "hybrid") s += 5;
    if (REC_PERMISSIVE_LICENSES.has(agent.license)) s += 3;
    if (agent.pricingBadge === "Free" || agent.pricingBadge === "OSS") s += 2;
    const note =
      s >= 25
        ? zh
          ? `原生适配编程智能体工作流（${mcpLabel("zh", agent.mcp)} MCP · ${perceptionLabel("zh", agent.perception)} 感知 · ${hostingLabel("zh", agent.hosting)}）`
          : `Strong fit for coding-agent loops (MCP ${mcpLabel("en", agent.mcp)}, ${perceptionLabel("en", agent.perception)} perception, ${hostingLabel("en", agent.hosting)})`
        : null;
    addAxis("useCase", s, 30, note);
  } else if (q.useCase === "logged-in-ops") {
    let s = 0;
    if (agent.authModel === "user_browser") s += 14;
    else if (agent.authModel === "both_user_browser_and_runtime") s += 12;
    else if (agent.authModel === "browser_profile") s += 6;
    if (agent.antiBotBadge === "Login") s += 9;
    else if (agent.antiBotBadge === "Stealth") s += 7;
    else if (agent.antiBotBadge === "Gated") s += 4;
    else if (agent.antiBotBadge === "None") s += 3;
    if (agent.hosting !== "cloud") s += 4;
    if (agent.mcp === "yes") s += 3;
    else if (agent.mcp === "partial") s += 1;
    const note =
      s >= 22
        ? zh
          ? `可直接复用本机已登录会话，无需将账号密码上云（反爬策略：${agent.antiBotBadge}）`
          : `Reuses your local logged-in browser session without exporting passwords to cloud (${agent.antiBotBadge})`
        : null;
    addAxis("useCase", s, 30, note);
  } else if (q.useCase === "headless-pipeline") {
    let s = 0;
    if (agent.hosting === "both") s += 10;
    else if (agent.hosting === "cloud") s += 9;
    else if (agent.id === "auto-browser") s += 7;
    else s += 3;
    if (agent.authModel === "cloud_vault") s += 10;
    else if (agent.authModel === "agent_runtime" || agent.authModel === "both_user_browser_and_runtime") s += 9;
    else if (agent.authModel === "browser_profile" || agent.authModel === "app_owned") s += 7;
    if (agent.perception === "hybrid" || agent.perception === "vision") s += 6;
    else if (agent.perception === "dom") s += 3;
    if (agent.antiBotBadge === "CAPTCHA" || agent.antiBotBadge === "Stealth" || agent.antiBotBadge === "Host") s += 4;
    const note =
      s >= 21
        ? zh
          ? `适合无人值守批处理与后端流水线（${hostingLabel("zh", agent.hosting)} · ${authLabel("zh", agent.authModel)} 凭据隔离）`
          : `Well-suited for unattended pipelines (${hostingLabel("en", agent.hosting)}, ${authLabel("en", agent.authModel)} auth isolation)`
        : null;
    addAxis("useCase", s, 30, note);
  } else if (q.useCase === "visual-canvas") {
    let s = 0;
    if (agent.perception === "vision") s += 18;
    else if (agent.perception === "hybrid") s += 15;
    else if (agent.perception === "dom") s += 2;
    if (agent.hosting === "both") s += 5;
    else s += 3;
    if (agent.mcp === "yes") s += 4;
    else if (agent.mcp === "partial") s += 3;
    if (agent.antiBotBadge === "CAPTCHA" || agent.antiBotBadge === "Stealth" || agent.antiBotBadge === "Driver") s += 3;
    const note =
      agent.perception === "vision" || agent.perception === "hybrid"
        ? zh
          ? `具备${perceptionLabel("zh", agent.perception)}感知能力，能应对动态 UI、复杂视觉布局与非标准 DOM`
          : `${perceptionLabel("en", agent.perception)} perception pipeline handles visual layouts and brittle/canvas UIs`
        : null;
    addAxis("useCase", s, 30, note);
  } else if (q.useCase === "hard-antibot") {
    let s = 0;
    if (agent.antiBotBadge === "CAPTCHA") s += 16;
    else if (agent.antiBotBadge === "Stealth") s += 14;
    else if (agent.antiBotBadge === "Login") s += 10;
    else if (agent.antiBotBadge === "Host") s += 8;
    else if (agent.antiBotBadge === "Driver") s += 5;
    if (agent.perception === "hybrid" || agent.perception === "vision") s += 6;
    else if (agent.perception === "dom") s += 3;
    if (agent.hosting === "both") s += 5;
    else s += 3;
    if (agent.unknowns.length === 0) s += 3;
    const note =
      ["CAPTCHA", "Stealth", "Login", "Host"].includes(agent.antiBotBadge)
        ? zh
          ? `具备明确的风控应对路线（${agent.antiBotBadge}），来源已核验`
          : `Documented anti-bot posture (${agent.antiBotBadge}) backed by verified primary docs`
        : null;
    addAxis("useCase", s, 30, note);
  } else {
    // Neutral balanced score when useCase === "any"
    let s = 10;
    if (agent.perception === "hybrid") s += 4;
    else if (agent.perception === "dom" || agent.perception === "vision") s += 3;
    if (agent.hosting === "both") s += 3;
    if (agent.mcp === "yes") s += 3;
    addAxis("useCase", s, 20, null);
  }

  // 2. Auth boundary (weight 16)
  if (q.auth !== "any") {
    let s = 0;
    if (q.auth === "local-session") {
      s = agent.authModel === "user_browser" ? 16 : agent.authModel === "both_user_browser_and_runtime" ? 15 : 0;
      addAxis(
        "auth",
        s,
        16,
        zh ? `凭据留在本地会话（${authLabel("zh", agent.authModel)}）` : `Keeps credentials in your local session (${authLabel("en", agent.authModel)})`
      );
    } else if (q.auth === "isolated-profile") {
      s =
        agent.authModel === "browser_profile" || agent.authModel === "agent_runtime"
          ? 16
          : REC_ISOLATED_AUTH.has(agent.authModel)
            ? 14
            : agent.authModel === "user_browser"
              ? 6
              : 4;
      addAxis(
        "auth",
        s,
        16,
        s >= 14
          ? zh
            ? `支持独立浏览器 Profile / 运行时隔离（${authLabel("zh", agent.authModel)}）`
            : `Supports isolated profile or runtime credentials (${authLabel("en", agent.authModel)})`
          : null
      );
    } else if (q.auth === "cloud-vault") {
      s =
        agent.authModel === "cloud_vault"
          ? 16
          : agent.authModel === "both_user_browser_and_runtime"
            ? 12
            : REC_CLOUD_VAULT_AUTH.has(agent.authModel)
              ? 10
              : 4;
      addAxis(
        "auth",
        s,
        16,
        s >= 12
          ? zh
            ? `提供托管/运行时凭据隔离（${authLabel("zh", agent.authModel)}）`
            : `Supports managed or runtime credential vaults (${authLabel("en", agent.authModel)})`
          : null
      );
    }
  }

  // 3. Hosting (weight 14)
  if (q.hosting !== "any") {
    let s = 0;
    if (q.hosting === "self-host") {
      s = agent.hosting === "self-host" ? 14 : agent.hosting === "both" ? 13 : 0;
      addAxis(
        "hosting",
        s,
        14,
        zh
          ? `支持私有化/本机部署（${hostingLabel("zh", agent.hosting)}）`
          : `Supports local / private deployment (${hostingLabel("en", agent.hosting)})`
      );
    } else if (q.hosting === "cloud") {
      s = agent.hosting === "cloud" ? 14 : agent.hosting === "both" ? 13 : 0;
      addAxis(
        "hosting",
        s,
        14,
        zh
          ? `支持官方云端托管（${hostingLabel("zh", agent.hosting)}）`
          : `Available as a managed cloud service (${hostingLabel("en", agent.hosting)})`
      );
    }
  }

  // 4. MCP integration (weight 16)
  if (q.mcp !== "any") {
    let s = 0;
    if (q.mcp === "required") {
      s = agent.mcp === "yes" ? 16 : agent.mcp === "partial" ? 7 : 0;
      addAxis(
        "mcp",
        s,
        16,
        agent.mcp === "yes"
          ? zh
            ? "提供原生 MCP 服务器，可直接接入 Claude Code / Cursor / Antigravity"
            : "Ships a native MCP server for direct Claude Code / Cursor / Antigravity integration"
          : null
      );
    } else if (q.mcp === "preferred") {
      s = agent.mcp === "yes" ? 16 : agent.mcp === "partial" ? 10 : 5;
      addAxis(
        "mcp",
        s,
        16,
        agent.mcp === "yes"
          ? zh
            ? "原生支持 MCP，开箱接入主流 Coding Agent"
            : "Native MCP support out of the box"
          : null
      );
    } else if (q.mcp === "sdk-cli") {
      s = agent.mcp === "no" ? 15 : agent.mcp === "partial" ? 14 : 12;
      addAxis(
        "mcp",
        s,
        16,
        zh
          ? "适合通过 CLI / 代码 SDK 编排调用"
          : "Fits CLI / programmatic SDK orchestration cleanly"
      );
    }
  }

  // 5. Anti-bot posture (weight 16)
  if (q.antiBot !== "any") {
    let s = 0;
    if (q.antiBot === "none") {
      s =
        agent.antiBotBadge === "None"
          ? 15
          : agent.antiBotBadge === "Login" || agent.antiBotBadge === "Host"
            ? 13
            : agent.antiBotBadge === "Stealth"
              ? 12
              : 9;
      addAxis("antiBot", s, 16, null);
    } else if (q.antiBot === "login-reuse") {
      s =
        agent.antiBotBadge === "Login"
          ? 16
          : agent.antiBotBadge === "Stealth"
            ? 13
            : agent.authModel === "user_browser" || agent.authModel === "both_user_browser_and_runtime"
              ? 10
              : 4;
      addAxis(
        "antiBot",
        s,
        16,
        agent.antiBotBadge === "Login"
          ? zh
            ? "以本机真实登录态自然绕过风控，不依赖易失效的对抗补丁"
            : "Bypasses login walls via your real local session instead of brittle evasions"
          : null
      );
    } else if (q.antiBot === "stealth-captcha") {
      s =
        agent.antiBotBadge === "CAPTCHA"
          ? 16
          : agent.antiBotBadge === "Stealth"
            ? 14
            : agent.antiBotBadge === "Host"
              ? 10
              : agent.antiBotBadge === "Login"
                ? 8
                : 2;
      addAxis(
        "antiBot",
        s,
        16,
        agent.antiBotBadge === "CAPTCHA" || agent.antiBotBadge === "Stealth"
          ? zh
            ? `官方标注支持 ${agent.antiBotBadge} 级别风控处理`
            : `Documents ${agent.antiBotBadge} anti-bot handling in first-party docs`
          : null
      );
    }
  }

  // 6. Budget & License (weight 14)
  if (q.budget !== "any") {
    let s = 0;
    if (q.budget === "free-oss") {
      s = REC_PERMISSIVE_LICENSES.has(agent.license) ? (agent.pricingBadge === "Free" || agent.pricingBadge === "OSS" ? 14 : 11) : 0;
      addAxis(
        "budget",
        s,
        14,
        zh
          ? `宽松开源协议（${agent.license}），自托管核心免费`
          : `Permissive ${agent.license} license with free self-hosted core`
      );
    } else if (q.budget === "oss-any") {
      s = REC_PERMISSIVE_LICENSES.has(agent.license) ? 14 : REC_COPYLEFT_LICENSES.has(agent.license) ? 11 : 0;
      addAxis(
        "budget",
        s,
        14,
        zh ? `开源可自托管（${agent.license}）` : `Open-source self-hostable (${agent.license})`
      );
    } else if (q.budget === "paid-ok") {
      s = 12;
      if (agent.hosting === "both" || agent.hosting === "cloud") s = 14;
      addAxis("budget", s, 14, null);
    }
  }

  // 7. Perception explicit preference (weight 10)
  if (q.perception !== "any") {
    const s = agent.perception === q.perception ? 10 : 6;
    addAxis(
      "perception",
      s,
      10,
      zh
        ? `匹配指定感知模式（${perceptionLabel("zh", agent.perception)}）`
        : `Matches requested ${perceptionLabel("en", agent.perception)} perception`
    );
  }

  // 8. Epistemic completeness & maturity tie-breaker (weight 10)
  let trust = 8;
  if (agent.unknowns.length > 0) trust -= Math.min(5, agent.unknowns.length * 2.5);
  if (agent.antiBotBadge === "Unknown") trust -= 2;
  if (agent.video) trust += 1;
  if (agent.sources.length >= 2) trust += 1;
  trust = Math.max(0, Math.min(10, Math.round(trust)));
  addAxis("verification", trust, 10, null);

  const score = maxPossible > 0 ? Math.min(99, Math.max(15, Math.round((raw / maxPossible) * 100))) : 50;

  // Ensure at least 2 concrete factual reasons per pick
  if (reasons.length < 2) {
    reasons.push(
      zh
        ? `核心规格：${perceptionLabel("zh", agent.perception)} 感知 · ${hostingLabel("zh", agent.hosting)} · MCP ${mcpLabel("zh", agent.mcp)} · ${licenseLabel("zh", agent.license)}`
        : `Verified specs: ${perceptionLabel("en", agent.perception)} perception, ${hostingLabel("en", agent.hosting)}, MCP ${mcpLabel("en", agent.mcp)}, ${licenseLabel("en", agent.license)}`
    );
  }

  return { score, reasons: reasons.slice(0, 4), breakdown };
}

function recBuildCaveats(agent, q, loc) {
  const zh = loc === "zh";
  const caveats = [];

  if (agent.unknowns.length > 0 || agent.antiBotBadge === "Unknown") {
    const bits = [];
    if (agent.perception === "unknown") bits.push(zh ? "感知路径" : "perception");
    if (agent.authModel === "unknown") bits.push(zh ? "凭据模型" : "credentials");
    if (agent.antiBotBadge === "Unknown") bits.push(zh ? "反爬策略" : "anti-bot");
    if (agent.license === "unknown") bits.push(zh ? "许可证" : "license");
    if (/unknown/i.test(agent.pricingBadge)) bits.push(zh ? "定价" : "pricing");
    caveats.push(
      zh
        ? `存在未在公开文档核实字段（${bits.join("、") || "详见档案"}），落地前请直接核对官方仓库。`
        : `Contains unverified public fields (${bits.join(", ") || "see dossier"}); verify directly with vendor docs before committing.`
    );
  }

  if (REC_COPYLEFT_LICENSES.has(agent.license)) {
    caveats.push(
      zh
        ? `许可证为 ${agent.license}，商业闭源分发或托管服务请先完成法务合规评估。`
        : `${agent.license} license requires legal review if embedding into commercial or hosted offerings.`
    );
  }

  if (agent.mcp === "partial") {
    caveats.push(
      zh
        ? "MCP 标注为「部分支持」（实验性适配器或非标准工具集），生产挂载前需实测接口稳定性。"
        : "MCP support is partial/experimental rather than a full standalone Playwright-style MCP server."
    );
  }

  if (agent.antiBotBadge === "Stealth" || agent.antiBotBadge === "CAPTCHA") {
    caveats.push(
      zh
        ? "反爬与验证码求解均引用厂商公开宣称，无跨站点通用 SLA，请务必用真实目标站压测。"
        : "Stealth/CAPTCHA capabilities are vendor-reported claims with no universal SLA; benchmark against your actual target site."
    );
  }

  if (agent.id === "browser-use" && (q.budget === "free-oss" || q.hosting === "cloud")) {
    caveats.push(
      zh
        ? "开源内核为 MIT 免费自托管；若使用 Browser Use Cloud 则按量计费（浏览器时长 + 代理流量 + 模型 Token 加成）。"
        : "Core library is free MIT self-host; Browser Use Cloud is usage-billed (browser hours, proxy GB, and token markup)."
    );
  }

  if (agent.id === "stagehand" && (q.hosting === "cloud" || q.antiBot === "stealth-captcha")) {
    caveats.push(
      zh
        ? "Stagehand SDK 本身按 MIT 开源免费；云端托管与反爬能力需搭配 Browserbase（按月/浏览器小时另行计费）。"
        : "Stagehand SDK is MIT OSS; managed cloud sessions and stealth features bill separately via Browserbase."
    );
  }

  return caveats;
}

function recBuildStackAdvice(picks, q, catalog, loc) {
  const zh = loc === "zh";
  const advice = [];

  if (q.useCase === "coding-agent" || q.antiBot === "none") {
    advice.push(
      zh
        ? "工程分界线：如果是给自家 Web 应用跑确定性 CI/回归验收（如 agent-skills 的 e2e-testing），优先直接用原生 @playwright/test；仅在需要 AI 自主探索、跨站操作或动态 UI 交互时再引入浏览器 Agent。"
        : "Engineering boundary: for deterministic CI/regression tests on your own app (e.g. Playwright e2e-testing), keep vanilla @playwright/test. Reach for a browser-driving AI agent when you need exploratory navigation, third-party sites, or dynamic UI adaptation."
    );
  }

  if (q.auth === "local-session" || q.useCase === "logged-in-ops") {
    advice.push(
      zh
        ? "会话安全建议：复用本机已登录浏览器时，建议开启独立工作 Profile，避免让不受信任的网页 Prompt 接触到主力生产/财务账号 Cookie。"
        : "Session hygiene: when reusing local logged-in sessions, isolate a dedicated browser profile so untrusted page content cannot touch primary production or finance cookies."
    );
  }

  const pickIds = new Set(picks.map((p) => p.id));
  if (pickIds.has("stagehand") && catalog.infraNote) {
    advice.push(
      zh
        ? `配套基础设施：若 Stagehand 需要上云并发或代理反爬，可搭配官方记录的基础设施伙伴 Browserbase（${catalog.infraNote.sources[0]}）。`
        : `Companion infra: if scaling Stagehand to managed cloud browsers with stealth/proxies, pair with Browserbase (${catalog.infraNote.sources[0]}).`
    );
  }

  if (q.useCase === "hard-antibot" || q.antiBot === "stealth-captcha") {
    advice.push(
      zh
        ? "风控架构建议：优先判断能否用本机真实登录态合法完成任务（Login 路线）；必须无头云端运行时，再对比 Skyvern / Notte / Browser Use 的真实站点通过率与单步成本。"
        : "Anti-bot strategy: prefer legitimate local-session reuse whenever a human operator is present; only pay for stealth/CAPTCHA solvers when unattended headless execution is unavoidable."
    );
  }

  if (advice.length === 0) {
    advice.push(
      zh
        ? "落地建议：先用 Top 2 候选在你的真实目标页面跑 5 条端到端冒烟任务，实测延迟、Token 消耗与登录稳定性后再定型。"
        : "Rollout tip: run 5 real end-to-end smoke tasks on your target site across the top 2 picks to compare latency, token spend, and session stability before standardizing."
    );
  }

  return advice;
}

function recBuildQueryUrl(q, baseOrigin = "https://browserly.maoxunxing.com") {
  const sp = new URLSearchParams();
  for (const key of ["useCase", "auth", "hosting", "mcp", "antiBot", "budget", "perception"]) {
    if (q[key] && q[key] !== "any") sp.set(key, q[key]);
  }
  if (q.limit !== 3) sp.set("limit", String(q.limit));
  if (q.locale) sp.set("locale", q.locale);
  const qs = sp.toString();
  return `${baseOrigin}/api/recommend${qs ? `?${qs}` : ""}`;
}

export function recommendAgents(rawParams = {}, { defaultLocale = "en", baseOrigin = "https://browserly.maoxunxing.com" } = {}) {
  const catalog = getCatalog();
  const q = normalizeRecommendParams(rawParams);
  const locale = q.locale || (defaultLocale === "zh" ? "zh" : "en");
  const zh = locale === "zh";

  const survivors = [];
  const excluded = [];

  for (const agent of catalog.agents) {
    const excl = recCheckHardExclusion(agent, q, locale);
    if (excl) {
      excluded.push({
        id: agent.id,
        name: agent.name,
        vendor: agent.steward,
        reasonCode: excl.reasonCode,
        reason: excl.reason
      });
      continue;
    }
    const scored = recScoreAgent(agent, q, locale);
    survivors.push({ agent, ...scored });
  }

  survivors.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const unkDiff = a.agent.unknowns.length - b.agent.unknowns.length;
    if (unkDiff !== 0) return unkDiff;
    return a.agent.index - b.agent.index;
  });

  const picks = survivors.slice(0, q.limit).map((item, idx) => {
    const a = item.agent;
    return {
      rank: idx + 1,
      tier: idx === 0 ? "primary" : idx === 1 ? "runner-up" : "alternative",
      id: a.id,
      name: a.name,
      vendor: a.steward,
      logo: a.logo,
      score: item.score,
      specs: {
        perception: a.perception,
        hosting: a.hosting,
        mcp: a.mcp,
        credentials: a.authModel,
        antiBot: a.antiBotBadge,
        pricing: a.pricingBadge,
        license: a.license
      },
      summary: a.hostingNote || a.summary,
      matchedReasons: item.reasons,
      caveats: recBuildCaveats(a, q, locale),
      breakdown: item.breakdown,
      urls: {
        detail: `/agent/${a.id}`,
        docs: a.docsUrl,
        repository: a.github,
        homepage: a.homepage
      },
      lastChecked: a.lastChecked,
      sources: a.sources.map((s) => s.url)
    };
  });

  // If 0 survivors, probe relaxing one constraint at a time
  const relaxedSuggestions = [];
  if (picks.length === 0) {
    const relaxAxes = ["budget", "mcp", "hosting", "auth", "perception"];
    for (const axis of relaxAxes) {
      if (q[axis] === "any") continue;
      const alt = { ...q, [axis]: "any" };
      const count = catalog.agents.filter((a) => !recCheckHardExclusion(a, alt, locale)).length;
      if (count > 0) {
        relaxedSuggestions.push({
          relaxAxis: axis,
          unlockedCount: count,
          message: zh
            ? `放宽「${axis}」限制后，可解锁 ${count} 个已核验候选方案。`
            : `Relaxing the "${axis}" constraint unlocks ${count} verified candidate(s).`,
          queryUrl: recBuildQueryUrl({ ...alt, locale }, baseOrigin)
        });
      }
    }
  }

  const queryUrl = recBuildQueryUrl({ ...q, locale }, baseOrigin);

  return {
    asOf: catalog.checked,
    locale,
    totalCatalogCount: catalog.agents.length,
    matchedCount: survivors.length,
    excludedCount: excluded.length,
    query: {
      useCase: q.useCase,
      auth: q.auth,
      hosting: q.hosting,
      mcp: q.mcp,
      antiBot: q.antiBot,
      budget: q.budget,
      perception: q.perception,
      limit: q.limit
    },
    picks,
    excluded: excluded.slice(0, 8),
    relaxedSuggestions,
    stackAdvice: recBuildStackAdvice(picks, q, catalog, locale),
    meta: {
      queryUrl,
      curl: `curl -s "${queryUrl}"`,
      skillUrl: `${baseOrigin}/SKILL.md`,
      skillZhUrl: `${baseOrigin}/SKILL.zh-CN.md`,
      catalogUrl: `${baseOrigin}/api/agents`,
      disclaimer: zh
        ? "基于 Browserly 官方一手文档字段进行确定性打分，非厂商商业排名；价格与反爬能力请以来源页为准。"
        : "Deterministic match over Browserly's first-party verified fields — not a sponsored ranking. Always confirm live pricing and anti-bot behavior on primary docs."
    }
  };
}
