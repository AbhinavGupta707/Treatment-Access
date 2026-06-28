import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

const args = process.argv.slice(2);
const port = readOption("--port") ?? process.env.PORT ?? "8787";
const defaultBaseUrl =
  process.env.TACC_MOCK_API_BASE_URL ?? `http://127.0.0.1:${port}`;
const baseUrl = trimTrailingSlash(readOption("--base-url") ?? defaultBaseUrl);
const startApi = args.includes("--start-api");
const keepApi = args.includes("--keep-api");

type CheckResult = {
  name: string;
  status: "passed" | "skipped";
  detail?: string;
};

if (args.includes("--help")) {
  console.log(`Smoke-test the Checkpoint 1 mock runtime.

Usage:
  node --import tsx/esm scripts/verify-demo.ts [--start-api] [--keep-api] [--base-url <url>] [--port <port>]

Checks:
  - API health
  - seeded demo state
  - reset behavior
  - demo toggles changing evidence and payer behavior
  - event ingestion and listing

The script uses only synthetic data.
`);
  process.exit(0);
}

let apiProcess: ChildProcessWithoutNullStreams | undefined;
const results: CheckResult[] = [];

try {
  if (startApi) {
    const alreadyRunning = await isApiHealthy();
    if (alreadyRunning) {
      results.push({
        name: "mock API startup",
        status: "skipped",
        detail: `healthy API already available at ${baseUrl}`,
      });
    } else {
      apiProcess = startMockApi(port);
      await waitForHealth(15_000);
      results.push({
        name: "mock API startup",
        status: "passed",
        detail: `started on ${baseUrl}`,
      });
    }
  }

  const health = await getJson("/health");
  assert(health.ok === true, "health ok flag was not true");
  assert(
    health.syntheticDataOnly === true,
    "health response did not confirm synthetic data",
  );
  results.push({ name: "API health", status: "passed" });

  const reset = await postJson("/demo/reset", {});
  assert(reset.ok === true, "reset endpoint did not return ok=true");
  results.push({
    name: "reset behavior",
    status: "passed",
    detail: `eventCount=${reset.eventCount}`,
  });

  const seededState = await getJson("/demo/state");
  assert(seededState.case?.case_id === "case-syn-001", "seed case missing");
  assert(
    seededState.patient?.patient_id === seededState.case.patient_id,
    "seed patient does not match case",
  );
  assert(
    seededState.events?.some(
      (event: { event_id?: string }) => event.event_id === "event-seed-001",
    ),
    "seed audit event missing",
  );
  assert(
    seededState.toggles?.missing_safety_lab === false,
    "missing_safety_lab default was not false",
  );
  results.push({
    name: "seeded demo state",
    status: "passed",
    detail: seededState.case.case_id,
  });

  const toggles = await postJson("/demo/toggles", {
    missing_safety_lab: true,
    payer_api_unavailable: true,
    denial_reason: "safety_screen",
  });
  assert(
    toggles.toggles?.missing_safety_lab === true,
    "missing_safety_lab toggle did not update",
  );
  assert(
    toggles.toggles?.payer_api_unavailable === true,
    "payer_api_unavailable toggle did not update",
  );

  const toggledState = await getJson("/demo/state");
  const safetyMapping = toggledState.evidenceMappings?.find(
    (mapping: { criterion_id?: string }) =>
      mapping.criterion_id === "criterion-safety-screen",
  );
  assert(safetyMapping, "safety-screen mapping missing");
  assert(
    safetyMapping.status === "missing",
    "safety-screen mapping did not become missing",
  );

  const payerResponse = await postJson("/payer/prior-auth", {
    case_id: seededState.case.case_id,
  });
  assert(
    payerResponse.status === "unavailable",
    "payer API did not report unavailable when toggled",
  );

  const payerDecision = await getJson(
    "/payer/prior-auth/pa-submission-syn-001/status",
  );
  assert(
    payerDecision.reason === "safety_screen",
    "denial reason did not follow toggle",
  );

  results.push({
    name: "toggles behavior",
    status: "passed",
    detail:
      "safety evidence missing, payer API unavailable, denial=safety_screen",
  });

  const eventId = `event-smoke-${Date.now()}`;
  const eventResponse = await postJson("/events", {
    event_id: eventId,
    case_id: seededState.case.case_id,
    actor_type: "api_workflow",
    actor_name: "Checkpoint 1 smoke script",
    task_or_agent_name: "verify-demo",
    action: "smoke_event_ingested",
    input_summary: "Synthetic smoke event posted to event mirror.",
    output_summary: "Event should appear in /demo/state events.",
    evidence_refs: [],
    trace_id: "trace-smoke-checkpoint-1",
    timestamp: new Date().toISOString(),
  });
  assert(
    typeof eventResponse.eventCount === "number",
    "event ingestion did not return an event count",
  );

  const eventState = await getJson("/demo/state");
  assert(
    eventState.events?.some(
      (event: { event_id?: string }) => event.event_id === eventId,
    ),
    "ingested smoke event was not listed in demo state",
  );
  results.push({
    name: "event ingestion and listing",
    status: "passed",
    detail: eventId,
  });

  const finalReset = await postJson("/demo/reset", {});
  const cleanState = await getJson("/demo/state");
  assert(finalReset.ok === true, "final reset failed");
  assert(
    cleanState.toggles?.missing_safety_lab === false,
    "final reset did not clear missing_safety_lab",
  );
  assert(
    !cleanState.events?.some(
      (event: { event_id?: string }) => event.event_id === eventId,
    ),
    "final reset did not clear smoke event",
  );
  results.push({
    name: "clean reset after smoke",
    status: "passed",
    detail: `eventCount=${cleanState.events?.length ?? "unknown"}`,
  });

  printResults(results);
} catch (error) {
  printResults(results);
  console.error(formatFailure(error));
  process.exit(1);
} finally {
  if (apiProcess && !keepApi) {
    apiProcess.kill("SIGTERM");
  }
}

function startMockApi(apiPort: string) {
  const child = spawn(
    "pnpm",
    ["--filter", "@tacc/mock-healthcare-api", "start"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        CI: "true",
        PORT: apiPort,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  child.stdout.on("data", (data) => {
    if (process.env.DEBUG_SMOKE) {
      process.stdout.write(`[api] ${data}`);
    }
  });
  child.stderr.on("data", (data) => {
    if (process.env.DEBUG_SMOKE) {
      process.stderr.write(`[api] ${data}`);
    }
  });

  child.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`Mock API exited with code ${code}.`);
    }
    if (signal && signal !== "SIGTERM") {
      console.error(`Mock API exited with signal ${signal}.`);
    }
  });

  return child;
}

async function waitForHealth(timeoutMs: number) {
  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      if (await isApiHealthy()) {
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }

  throw new Error(
    `mock API did not become healthy at ${baseUrl}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

async function isApiHealthy() {
  try {
    const health = await getJson("/health");
    return health.ok === true && health.service === "mock-healthcare-api";
  } catch {
    return false;
  }
}

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  return parseResponse(path, response);
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(path, response);
}

async function parseResponse(path: string, response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${text}`);
  }

  return data;
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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function printResults(checks: CheckResult[]) {
  if (checks.length === 0) {
    return;
  }

  console.log("Checkpoint 1 smoke results:");
  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[${check.status}] ${check.name}${suffix}`);
  }
}

function formatFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `Checkpoint 1 smoke failed: ${message}

Endpoint assumptions:
  GET  /health
  GET  /demo/state
  POST /demo/reset
  POST /demo/toggles
  POST /events
  POST /payer/prior-auth
  GET  /payer/prior-auth/:submissionId/status

Use --start-api to launch the current mock API automatically.`;
}
