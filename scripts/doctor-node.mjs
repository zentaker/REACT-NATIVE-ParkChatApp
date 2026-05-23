import { existsSync } from "node:fs";
import { join } from "node:path";

function check(label, ok, detail) {
  const tag = ok ? "[OK]" : "[WARN]";
  console.log(`${tag} ${label}${detail ? `: ${detail}` : ""}`);
}

console.log("Aldea / ParkChat — Node Doctor");
console.log("==============================");
console.log("");
console.log(`node:     ${process.version}`);
console.log(`platform: ${process.platform}`);
console.log(`arch:     ${process.arch}`);
console.log(`cwd:      ${process.cwd()}`);
console.log("");

const cwd = process.cwd();
check("package.json", existsSync(join(cwd, "package.json")));
check("app.json", existsSync(join(cwd, "app.json")));
check("app/ directory", existsSync(join(cwd, "app")));
check("node_modules", existsSync(join(cwd, "node_modules")));
console.log("");

const rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const rawKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const projectUrl = (process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL ?? "").trim();
const hasUrl = Boolean(rawUrl);
const hasKey = Boolean(rawKey);

function describeUrl(value) {
  if (!value) return { ok: false, detail: "missing — app fallback to mocks" };
  if (value.startsWith("eyJ")) {
    return {
      ok: false,
      detail: `looks like a JWT (len=${value.length}, starts with "${value.slice(0, 6)}"). Paste the Project URL, not the anon key.`
    };
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") {
      return { ok: false, detail: `protocol must be https: (got ${parsed.protocol})` };
    }
    const host = parsed.hostname;
    if (!(host.endsWith(".supabase.co") || host.endsWith(".supabase.in"))) {
      return { ok: false, detail: `host "${host}" is not *.supabase.co/.supabase.in` };
    }
    if (parsed.pathname && parsed.pathname !== "/" && parsed.pathname !== "") {
      return { ok: false, detail: `URL must not contain a path (got "${parsed.pathname}")` };
    }
    return { ok: true, detail: `valid (${host})` };
  } catch {
    return { ok: false, detail: "not a parseable URL" };
  }
}

function describeAnonKey(value) {
  if (!value) return { ok: false, detail: "missing — app fallback to mocks" };
  if (!value.startsWith("eyJ")) {
    return {
      ok: false,
      detail: `does not look like a JWT (expected to start with "eyJ", got "${value.slice(0, 6)}")`
    };
  }
  return { ok: true, detail: `JWT present (len=${value.length})` };
}

const urlInfo = describeUrl(rawUrl);
const keyInfo = describeAnonKey(rawKey);
const projInfo = describeUrl(projectUrl);

check("EXPO_PUBLIC_SUPABASE_URL", urlInfo.ok, urlInfo.detail);
check("EXPO_PUBLIC_SUPABASE_ANON_KEY", keyInfo.ok, keyInfo.detail);

const equalUrlKey = rawUrl && rawKey && rawUrl === rawKey;
if (equalUrlKey) {
  console.log("[WARN] EXPO_PUBLIC_SUPABASE_URL == EXPO_PUBLIC_SUPABASE_ANON_KEY (identical values).");
  console.log("       Both secrets received the same JWT. URL field needs the Project URL.");
  console.log("       Fix: Add a NEW Replit Secret:");
  console.log("         Name : EXPO_PUBLIC_SUPABASE_PROJECT_URL");
  console.log("         Value: https://<project-ref>.supabase.co");
}

if (projectUrl) {
  check("EXPO_PUBLIC_SUPABASE_PROJECT_URL (fallback)", projInfo.ok, projInfo.ok ? projInfo.detail : projInfo.detail);
  if (projInfo.ok) {
    console.log("[INFO] lib/supabase.ts will use PROJECT_URL fallback since URL is invalid.");
  }
} else if (!urlInfo.ok) {
  console.log("[INFO] EXPO_PUBLIC_SUPABASE_PROJECT_URL not set.");
  console.log("       Add this secret in Replit to unblock Supabase without fixing the broken URL.");
  console.log("         Name : EXPO_PUBLIC_SUPABASE_PROJECT_URL");
  console.log("         Value: https://apcdhwqfntujcwsbtfbu.supabase.co");
}

const effectiveUrlOk = urlInfo.ok || projInfo.ok;
const supabaseReady = effectiveUrlOk && keyInfo.ok;

console.log("");
check("Supabase ready (effective)", supabaseReady,
  supabaseReady ? "app will connect to real Supabase" : "app will fall back to mocks");

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("[WARN] SUPABASE_SERVICE_ROLE_KEY present — never expose service_role to the Expo client.");
}
