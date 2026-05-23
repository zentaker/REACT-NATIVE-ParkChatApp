// Safe env diagnostics — never prints full values
const vars = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_PROJECT_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
];

console.log("Aldea / ParkChat — Env Doctor");
console.log("==============================");
console.log("");

const results = {};

for (const k of vars) {
  const v = (process.env[k] ?? "").trim();
  let host = null;
  try { host = new URL(v).hostname; } catch {}
  results[k] = {
    exists: !!v,
    len: v.length,
    start: v.slice(0, 8),
    isUrl: v.startsWith("https://"),
    isJwt: v.startsWith("eyJ"),
    host,
  };
  console.log(`${k}:`);
  console.log(`  exists        : ${results[k].exists}`);
  console.log(`  length        : ${results[k].len}`);
  console.log(`  starts with   : "${results[k].start}"`);
  console.log(`  looksLikeUrl  : ${results[k].isUrl}`);
  console.log(`  looksLikeJwt  : ${results[k].isJwt}`);
  console.log(`  host (if URL) : ${host ?? "n/a"}`);
  console.log("");
}

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const proj = (process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL ?? "").trim();

const equalUrlKey = url && key && url === key;
const equalProjKey = proj && key && proj === key;

console.log(`equalityCheck (URL == ANON_KEY)          : ${equalUrlKey}`);
console.log(`equalityCheck (PROJECT_URL == ANON_KEY)  : ${equalProjKey}`);
console.log("");

if (equalUrlKey) {
  console.log("[PROBLEM] EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are identical.");
  console.log("          Both fields received the same JWT. The URL field must be the Project URL.");
  console.log("          Fix: In Replit Secrets, set a NEW secret:");
  console.log("          EXPO_PUBLIC_SUPABASE_PROJECT_URL = https://apcdhwqfntujcwsbtfbu.supabase.co");
}

if (proj && !results["EXPO_PUBLIC_SUPABASE_PROJECT_URL"].isJwt && results["EXPO_PUBLIC_SUPABASE_PROJECT_URL"].isUrl) {
  console.log("[OK] EXPO_PUBLIC_SUPABASE_PROJECT_URL is a valid URL — fallback will be used.");
} else if (proj) {
  console.log("[WARN] EXPO_PUBLIC_SUPABASE_PROJECT_URL is set but doesn't look like a valid https:// URL.");
} else {
  console.log("[INFO] EXPO_PUBLIC_SUPABASE_PROJECT_URL not set — add it to Replit Secrets to unblock.");
}
