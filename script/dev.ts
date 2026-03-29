import { spawn } from "child_process";

const isWindows = process.platform === "win32";

function start(name: string, args: string[], env: NodeJS.ProcessEnv = {}) {
  const command = isWindows ? "cmd.exe" : "npm";
  const commandArgs = isWindows ? ["/d", "/s", "/c", `npm ${args.join(" ")}`] : args;

  const child = spawn(command, commandArgs, {
    env: {
      ...process.env,
      FORCE_COLOR: "1",
      ...env,
    },
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
    windowsHide: false,
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  return child;
}

process.stdout.write("\x1b[2J\x1b[H");
console.log("starting app and api in parallel...");

const api = start("api", ["run", "api"]);
const app = start("app", ["run", "app"]);

const shutdown = () => {
  api.kill();
  app.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

api.on("exit", (code) => {
  if (code && code !== 0) {
    app.kill();
    process.exit(code);
  }
});

app.on("exit", (code) => {
  if (code && code !== 0) {
    api.kill();
    process.exit(code);
  }
});
