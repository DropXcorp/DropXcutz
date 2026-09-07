import { spawn } from "node:child_process";

let shuttingDown = false;

const children = [
  ["api", process.platform === "win32" ? "bun.cmd" : "bun", ["--watch", "src/index.ts"], "backend"],
  ["admin", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], "frontend/apps/super-admin"],
  ["erp", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], "frontend/apps/salon-erp"],
  ["website", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], "frontend/apps/public-site"],
].map(([name, command, args, cwd]) => {
  const child = spawn(command, args, { stdio: ["inherit", "pipe", "pipe"], shell: process.platform === "win32", cwd });

  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.error(`[${name}] stopped (${signal ?? `exit ${code}`})`);
      stopAll(code ?? 1);
    }
  });

  return child;
});

function stopAll(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  setTimeout(() => process.exit(exitCode), 250);
}

process.on("SIGINT", () => stopAll());
process.on("SIGTERM", () => stopAll());
