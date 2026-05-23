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

const hasUrl = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL);
const hasKey = Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
check("EXPO_PUBLIC_SUPABASE_URL", hasUrl, hasUrl ? "set" : "missing — app fallback to mocks");
check("EXPO_PUBLIC_SUPABASE_ANON_KEY", hasKey, hasKey ? "set" : "missing — app fallback to mocks");

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("[WARN] SUPABASE_SERVICE_ROLE_KEY present — never expose service_role to the Expo client.");
}

if (!hasUrl || !hasKey) {
  console.log("");
  console.log("Hint: set the two secrets in Replit Secrets to enable real Supabase mode.");
}
