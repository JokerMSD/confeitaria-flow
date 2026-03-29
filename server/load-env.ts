import fs from "fs";
import path from "path";

let envLoaded = false;

function parseEnvLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

export function loadEnvFile() {
  if (envLoaded) {
    return;
  }

  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  const content = fs.readFileSync(envPath, "utf-8");

  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);

    if (!parsed) {
      continue;
    }

    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }

  envLoaded = true;
}
