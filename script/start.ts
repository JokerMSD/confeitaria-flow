import { existsSync } from "fs";
import { spawn, spawnSync } from "child_process";
import { loadEnvFile } from "../server/load-env";

loadEnvFile();

function ensureBuildArtifacts() {
  if (existsSync("dist/index.cjs")) {
    return;
  }

  console.log("dist not found, building production bundle...");
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(command, ["run", "build"], {
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function startServer() {
  const child = spawn(process.execPath, ["dist/index.cjs"], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

ensureBuildArtifacts();
startServer();
