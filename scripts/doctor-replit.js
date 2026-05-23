const fs = require("node:fs");
const path = require("node:path");

function hasEnv(name) {
  return Boolean(process.env[name]);
}

function printCheck(label, ok, detail) {
  const status = ok ? "[OK]" : "[WARN]";
  console.log(`${status} ${label}${detail ? `: ${detail}` : ""}`);
}

console.log("Aldea Replit Doctor");
console.log("===================");
console.log("");
console.log(`cwd: ${process.cwd()}`);
console.log(`node: ${process.version}`);
console.log(`platform: ${process.platform}`);
console.log("");

printCheck("package.json", fs.existsSync(path.join(process.cwd(), "package.json")));
printCheck("app.json", fs.existsSync(path.join(process.cwd(), "app.json")));
printCheck(".replit", fs.existsSync(path.join(process.cwd(), ".replit")));
printCheck("replit.nix", fs.existsSync(path.join(process.cwd(), "replit.nix")));
printCheck("node_modules", fs.existsSync(path.join(process.cwd(), "node_modules")));
console.log("");

printCheck("REPL_ID", hasEnv("REPL_ID"), hasEnv("REPL_ID") ? "present" : "not running inside Replit or env unavailable");
printCheck("REPL_SLUG", hasEnv("REPL_SLUG"), hasEnv("REPL_SLUG") ? process.env.REPL_SLUG : "not set");
printCheck("PORT", hasEnv("PORT"), hasEnv("PORT") ? process.env.PORT : "Replit may infer exposed port from .replit");
console.log("");

printCheck(
  "EXPO_PUBLIC_SUPABASE_URL",
  hasEnv("EXPO_PUBLIC_SUPABASE_URL"),
  hasEnv("EXPO_PUBLIC_SUPABASE_URL") ? "present, value hidden" : "missing, app will use mocks"
);
printCheck(
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  hasEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  hasEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY") ? "present, value hidden" : "missing, app will use mocks"
);

if (hasEnv("SUPABASE_SERVICE_ROLE_KEY")) {
  console.log("[WARN] SUPABASE_SERVICE_ROLE_KEY is present. Do not expose service_role to the Expo client.");
}
