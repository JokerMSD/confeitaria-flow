import { execFileSync } from "child_process";

function parsePorts(argv: string[]) {
  return argv
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function getWindowsPidsForPort(port: number) {
  const output = execFileSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf-8",
  });

  const pids = new Set<number>();

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("TCP")) {
      continue;
    }

    const columns = trimmed.split(/\s+/);
    if (columns.length < 5) {
      continue;
    }

    const localAddress = columns[1] ?? "";
    const state = columns[3] ?? "";
    const pid = Number.parseInt(columns[4] ?? "", 10);

    if (!Number.isInteger(pid) || pid <= 0 || state !== "LISTENING") {
      continue;
    }

    const separatorIndex = localAddress.lastIndexOf(":");
    const localPort = Number.parseInt(localAddress.slice(separatorIndex + 1), 10);

    if (localPort === port) {
      pids.add(pid);
    }
  }

  return [...pids];
}

function getUnixPidsForPort(port: number) {
  try {
    const output = execFileSync("lsof", ["-ti", `tcp:${port}`], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output
      .split(/\r?\n/)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch {
    return [];
  }
}

function getPidsForPort(port: number) {
  return process.platform === "win32"
    ? getWindowsPidsForPort(port)
    : getUnixPidsForPort(port);
}

function killPid(pid: number) {
  if (pid === process.pid || pid === process.ppid) {
    return;
  }

  if (process.platform === "win32") {
    execFileSync("taskkill", ["/PID", String(pid), "/F", "/T"], {
      stdio: ["ignore", "ignore", "ignore"],
    });
    return;
  }

  process.kill(pid, "SIGTERM");
}

const ports = parsePorts(process.argv.slice(2));

if (ports.length === 0) {
  process.exit(0);
}

for (const port of ports) {
  const pids = getPidsForPort(port);

  if (pids.length === 0) {
    console.log(`port ${port} is free`);
    continue;
  }

  for (const pid of pids) {
    try {
      killPid(pid);
      console.log(`freed port ${port} by stopping pid ${pid}`);
    } catch (error) {
      console.error(`failed to free port ${port} from pid ${pid}`, error);
      process.exitCode = 1;
    }
  }
}
