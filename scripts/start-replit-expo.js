const { spawn } = require("node:child_process");

const mode = process.argv[2] ?? "web";
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

const baseArgs = ["expo", "start"];
const env = {
  ...process.env,
  BROWSER: "none",
  EXPO_NO_TELEMETRY: "1"
};

let args;

if (mode === "mobile") {
  args = [...baseArgs, "--tunnel"];
} else if (mode === "lan") {
  args = [...baseArgs, "--lan"];
} else {
  args = [...baseArgs, "--web"];
}

console.log(`Starting Expo for Replit in ${mode} mode...`);
console.log(`Command: ${npxBin} ${args.join(" ")}`);

const child = spawn(npxBin, args, {
  env,
  shell: false,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
