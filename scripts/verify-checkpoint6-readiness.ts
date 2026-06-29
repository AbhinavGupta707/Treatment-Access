import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

type CheckStatus = "passed" | "skipped";

type Check = {
  name: string;
  status: CheckStatus;
  detail?: string;
};

const args = process.argv.slice(2);
const liveProviders = args.includes("--live-providers");
const uiSmoke = args.includes("--ui-smoke");
const requireLiveEnv = args.includes("--require-live-env") || liveProviders;
const timeoutMs = Number(readOption("--timeout-ms") ?? "10000");

const commandCenterUrl = trimTrailingSlash(
  readOption("--command-center-url") ??
    process.env.TACC_COMMAND_CENTER_URL ??
    "http://127.0.0.1:5173",
);

const envFile = loadDotenvLocal();
const env = (name: string) => process.env[name] ?? envFile.get(name);

const checks: Check[] = [];

if (args.includes("--help")) {
  console.log(`Verify Checkpoint 6 demo readiness without live UiPath side effects.

Usage:
  node --import tsx/esm scripts/verify-checkpoint6-readiness.ts [options]

Options:
  --live-providers       Read-only Fireworks and LangSmith connectivity checks.
  --require-live-env     Fail when live provider env vars are missing.
  --ui-smoke             Check a running Command Center at TACC_COMMAND_CENTER_URL.
  --command-center-url   Override the Command Center URL for --ui-smoke.
  --timeout-ms           Fetch timeout for provider/UI checks. Default: 10000.

Default mode is deterministic and local: static readiness, env-shape checks,
and a no-secret leak scan. It never prints .env.local contents and never calls
UiPath, Orchestrator, Action Center, Data Service, robots, or payer systems.
`);
  process.exit(0);
}

try {
  assertDocsSeparateSmokeLayers();
  assertPackageCommands();
  assertDemoStartsProductFirst();
  assertLiveEnvShape();
  assertNoSecretLeaks();

  if (uiSmoke) {
    await checkCommandCenterPages();
  } else {
    checks.push({
      name: "Command Center UI smoke",
      status: "skipped",
      detail: "run smoke:checkpoint6-ui with the app server already running",
    });
  }

  if (liveProviders) {
    await checkFireworksConnectivity();
    await checkLangSmithConnectivity();
  } else {
    checks.push({
      name: "Fireworks read-only connectivity",
      status: "skipped",
      detail: "run smoke:checkpoint6-live-providers after live keys are present",
    });
    checks.push({
      name: "LangSmith read-only connectivity",
      status: "skipped",
      detail: "run smoke:checkpoint6-live-providers after live keys are present",
    });
  }

  checks.push({
    name: "UiPath live side-effect gate",
    status: "passed",
    detail:
      "no live UiPath run/debug, task creation, Data Service write, robot job, solution deploy, or payer submission attempted",
  });

  printChecks();
  console.log(
    "Checkpoint 6 readiness passed. Skipped checks are intentional unless their gated mode was requested.",
  );
} catch (error) {
  printChecks();
  console.error(
    `Checkpoint 6 readiness failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}

function assertDocsSeparateSmokeLayers() {
  const testing = readText("docs/testing.md");
  const submission = readText("docs/submission.md");
  const plan = readText("docs/live-agentic-product-plan.md");
  const combined = `${testing}\n${submission}\n${plan}`;

  assertMatches(
    "deterministic local smoke documentation",
    combined,
    /deterministic local smoke|deterministic local proof/i,
    /smoke:checkpoint6-readiness/i,
  );
  assertMatches(
    "live provider no-side-effect documentation",
    combined,
    /Fireworks\/LangSmith no-side-effect|live provider/i,
    /smoke:checkpoint6-live-providers/i,
  );
  assertMatches(
    "approval-gated UiPath documentation",
    combined,
    /approval-gated UiPath|explicit approval/i,
    /Action Center|Data Service|Orchestrator|robot|solution/i,
  );
}

function assertPackageCommands() {
  const packageJson = JSON.parse(readText("package.json")) as {
    scripts?: Record<string, string>;
  };
  const scripts = packageJson.scripts ?? {};

  for (const name of [
    "smoke:checkpoint6-readiness",
    "smoke:checkpoint6-live-providers",
    "smoke:checkpoint6-ui",
    "verify:checkpoint6",
  ]) {
    assert(Boolean(scripts[name]), `package.json is missing ${name}`);
  }

  checks.push({
    name: "Checkpoint 6 package commands",
    status: "passed",
    detail:
      "smoke:checkpoint6-readiness, smoke:checkpoint6-live-providers, smoke:checkpoint6-ui, verify:checkpoint6",
  });
}

function assertDemoStartsProductFirst() {
  const script = readText("docs/demo-script.md");
  assert(
    /0:00-0:[0-9]+ \| (Command Center )?(dashboard|executive dashboard|portfolio dashboard)/i.test(
      script,
    ),
    "demo run of show must start on the product dashboard",
  );
  assert(
    /beautiful product dashboard|product-first|product dashboard/i.test(script),
    "demo script must explicitly describe the product-first opening",
  );

  checks.push({
    name: "product-first demo narrative",
    status: "passed",
    detail: "demo starts on Command Center dashboard before drill-down proof",
  });
}

function assertLiveEnvShape() {
  const requiredWhenLive = [
    "FIREWORKS_API_KEY",
    "FIREWORKS_BASE_URL",
    "FIREWORKS_AGENT_MODEL",
    "LANGSMITH_API_KEY",
    "LANGSMITH_PROJECT",
  ];
  const optional = [
    "AGENT_MODE",
    "AGENT_ORCHESTRATOR",
    "LANGSMITH_ENDPOINT",
    "LANGSMITH_WORKSPACE_ID",
  ];
  const missing = requiredWhenLive.filter((name) => !env(name));
  const presentRequired = requiredWhenLive.filter((name) => Boolean(env(name)));
  const presentOptional = optional.filter((name) => Boolean(env(name)));

  if (requireLiveEnv && missing.length > 0) {
    throw new Error(
      `live provider env is missing required key(s): ${missing.join(", ")}`,
    );
  }

  checks.push({
    name: "live provider environment shape",
    status: missing.length === 0 ? "passed" : "skipped",
    detail:
      missing.length === 0
        ? `required keys present: ${presentRequired.join(", ")}; optional keys present: ${presentOptional.join(", ") || "none"}`
        : `not in live mode; missing required live key(s): ${missing.join(", ")}`,
  });
}

function assertNoSecretLeaks() {
  const scannedFiles = listScannableFiles(process.cwd());
  const leaks: string[] = [];

  for (const file of scannedFiles) {
    const content = readFileSync(file, "utf8");
    const relativePath = file.slice(process.cwd().length + 1);
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (looksLikeCommittedSecret(line)) {
        leaks.push(`${relativePath}:${index + 1}`);
      }
    });
  }

  assert(
    leaks.length === 0,
    `potential committed secret material found at ${leaks.join(", ")}`,
  );

  checks.push({
    name: "no-secret leak scan",
    status: "passed",
    detail: `scanned ${scannedFiles.length} workspace text files; .env.local was not scanned or printed`,
  });
}

async function checkCommandCenterPages() {
  for (const path of ["/", "/dashboard", "/cases", "/analytics"]) {
    const response = await fetchWithTimeout(`${commandCenterUrl}${path}`);
    const text = await response.text();
    assert(
      response.ok,
      `${commandCenterUrl}${path} returned HTTP ${response.status}`,
    );
    assert(
      /Treatment Access Command Center|root/i.test(text),
      `${commandCenterUrl}${path} did not look like the Command Center app shell`,
    );
  }

  checks.push({
    name: "Command Center UI smoke",
    status: "passed",
    detail: `${commandCenterUrl} responded for /, /dashboard, /cases, and /analytics`,
  });
}

async function checkFireworksConnectivity() {
  const apiKey = requireEnv("FIREWORKS_API_KEY");
  const baseUrl = trimTrailingSlash(
    env("FIREWORKS_BASE_URL") ?? "https://api.fireworks.ai/inference/v1",
  );
  const response = await fetchWithTimeout(`${baseUrl}/models`, {
    headers: { authorization: `Bearer ${apiKey}` },
  });
  const text = await response.text();
  assert(
    response.ok,
    `Fireworks /models returned HTTP ${response.status}: ${summarizeHttpText(text)}`,
  );

  checks.push({
    name: "Fireworks read-only connectivity",
    status: "passed",
    detail: `authenticated /models at ${redactUrl(baseUrl)}; no inference call was made`,
  });
}

async function checkLangSmithConnectivity() {
  const apiKey = requireEnv("LANGSMITH_API_KEY");
  const endpoint = trimTrailingSlash(
    env("LANGSMITH_ENDPOINT") ?? "https://api.smith.langchain.com",
  );
  const response = await fetchWithTimeout(`${endpoint}/api/v1/sessions?limit=1`, {
    headers: { "x-api-key": apiKey },
  });
  const text = await response.text();
  assert(
    response.ok,
    `LangSmith sessions read returned HTTP ${response.status}: ${summarizeHttpText(text)}`,
  );

  checks.push({
    name: "LangSmith read-only connectivity",
    status: "passed",
    detail: `authenticated project/session read at ${redactUrl(endpoint)}; no trace was created`,
  });
}

function requireEnv(name: string) {
  const value = env(name);
  if (!value) {
    throw new Error(`${name} is required for live provider connectivity`);
  }
  return value;
}

function loadDotenvLocal() {
  const values = new Map<string, string>();
  const envPath = resolve(".env.local");
  if (!existsSync(envPath)) {
    return values;
  }

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const name = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
    if (name) {
      values.set(name, value);
    }
  }

  return values;
}

function listScannableFiles(root: string) {
  const ignoredDirs = new Set([
    ".git",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
  ]);
  const ignoredFiles = new Set([".env.local"]);
  const allowedExtensions = new Set([
    "",
    ".cjs",
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".ts",
    ".tsx",
    ".txt",
    ".xaml",
    ".xml",
    ".yml",
    ".yaml",
  ]);
  const files: string[] = [];

  function visit(path: string) {
    const stat = statSync(path);
    const name = path.split("/").at(-1) ?? path;
    if (stat.isDirectory()) {
      if (ignoredDirs.has(name)) {
        return;
      }
      for (const child of readdirSync(path)) {
        visit(join(path, child));
      }
      return;
    }

    if (ignoredFiles.has(name) || stat.size > 1_000_000) {
      return;
    }

    const dotIndex = name.lastIndexOf(".");
    const extension = dotIndex === -1 ? "" : name.slice(dotIndex);
    if (allowedExtensions.has(extension)) {
      files.push(path);
    }
  }

  visit(root);
  return files;
}

function looksLikeCommittedSecret(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return false;
  }

  const assignment = trimmed.match(
    /^(?:export\s+)?([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Z0-9_]*)\s*[:=]\s*["']?([^"',\s#]+)["']?/,
  );
  if (assignment) {
    const name = assignment[1] ?? "";
    const value = assignment[2] ?? "";
    if (
      /^(replace|example|local|synthetic|dummy|test|changeme|your-|<)/i.test(
        value,
      )
    ) {
      return false;
    }
    if (value.length >= 16 && !/^(true|false|null)$/i.test(value)) {
      return !["TACC_EVENT_API_KEY"].includes(name);
    }
  }

  return /\b(?:sk-[A-Za-z0-9_-]{20,}|fw_[A-Za-z0-9_-]{20,}|lsv2_[A-Za-z0-9_-]{20,})\b/.test(
    trimmed,
  );
}

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function assertMatches(name: string, content: string, ...patterns: RegExp[]) {
  const missing = patterns.find((pattern) => !pattern.test(content));
  assert(!missing, `${name} missing ${String(missing)}`);
  checks.push({ name, status: "passed" });
}

function readText(path: string) {
  return readFileSync(resolve(path), "utf8");
}

function readOption(name: string) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  const value = args[index + 1];
  if (!value) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function redactUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return "<configured endpoint>";
  }
}

function summarizeHttpText(text: string) {
  return text.replace(/\s+/g, " ").slice(0, 160) || "<empty response>";
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function printChecks() {
  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[${check.status}] ${check.name}${suffix}`);
  }
}
