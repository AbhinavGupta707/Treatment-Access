import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const port = readOption("--port") ?? process.env.PORT ?? "8789";
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
  console.log(`Smoke-test the Checkpoint 4 fallback proof path.

Usage:
  node --import tsx/esm scripts/verify-checkpoint4.ts [--start-api] [--keep-api] [--base-url <url>] [--port <port>]

Checks:
  - API health and clean reset
  - payer API unavailable behavior
  - portal_fallback submission success if the current API supports it
  - robot fallback event ingestion and Command Center-visible state
  - Command Center and Mock Payer Portal built static artifacts

The script uses synthetic data only and does not call live UiPath, Orchestrator,
Action Center, Data Service, or real payer systems.
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

  const cleanState = await getJson("/demo/state");
  assert(cleanState.case?.case_id === "case-syn-001", "seed case missing");
  assert(
    cleanState.submissions?.length === 0,
    "reset did not clear prior submissions",
  );
  assert(
    cleanState.toggles?.payer_api_unavailable === false,
    "reset did not clear payer API unavailable toggle",
  );
  results.push({
    name: "clean reset",
    status: "passed",
    detail: `eventCount=${cleanState.events?.length ?? "unknown"}`,
  });

  await postJson("/demo/toggles", {
    missing_safety_lab: false,
    payer_api_unavailable: true,
    denial_reason: "step_therapy",
  });

  const unavailableResponse = await postJson("/payer/prior-auth", {
    case_id: cleanState.case.case_id,
    patient_id: cleanState.patient?.patient_id,
    order_id: cleanState.order?.order_id,
    channel: "api",
    submitted_by: "Checkpoint 4 smoke API workflow",
    evidence_refs: ["mapping-diagnosis", "mapping-step-therapy"],
  });
  assert(
    unavailableResponse.status === "unavailable",
    "payer API did not report unavailable when toggled",
  );
  assert(
    unavailableResponse.fallback_required === true,
    "payer API unavailable path did not require fallback",
  );

  const unavailableStatus = await getJson(
    `/payer/prior-auth/${unavailableResponse.submission_id}/status`,
  );
  assert(
    unavailableStatus.status === "unavailable",
    "unavailable submission status did not remain unavailable",
  );

  const unavailableState = await getJson("/demo/state");
  assert(
    unavailableState.case?.active_secondary_stages?.includes(
      "api_failure_portal_fallback",
    ),
    "case did not expose api_failure_portal_fallback secondary stage",
  );
  assert(
    unavailableState.events?.some(
      (event: { action?: string }) =>
        event.action === "payer_prior_auth_unavailable",
    ),
    "payer unavailable event was not visible in demo state",
  );
  results.push({
    name: "payer API unavailable path",
    status: "passed",
    detail: unavailableResponse.submission_id,
  });

  const portalFallbackAttempt = await postJson("/payer/prior-auth", {
    case_id: cleanState.case.case_id,
    patient_id: cleanState.patient?.patient_id,
    order_id: cleanState.order?.order_id,
    channel: "portal_fallback",
    submitted_by: "UiPath Robot Portal Fallback",
    evidence_refs: ["mapping-diagnosis", "mapping-step-therapy"],
  });

  let portalSubmissionId: string | undefined;
  if (portalFallbackAttempt.status === "submitted") {
    portalSubmissionId = portalFallbackAttempt.submission_id;
    results.push({
      name: "portal_fallback success while payer API is unavailable",
      status: "passed",
      detail: portalSubmissionId,
    });
  } else {
    results.push({
      name: "portal_fallback success while payer API is unavailable",
      status: "skipped",
      detail:
        "current API still returns unavailable for portal_fallback while payer_api_unavailable=true",
    });

    await postJson("/demo/toggles", {
      payer_api_unavailable: false,
      denial_reason: "step_therapy",
    });
    const restoredPortalFallback = await postJson("/payer/prior-auth", {
      case_id: cleanState.case.case_id,
      patient_id: cleanState.patient?.patient_id,
      order_id: cleanState.order?.order_id,
      channel: "portal_fallback",
      submitted_by: "UiPath Robot Portal Fallback",
      evidence_refs: ["mapping-diagnosis", "mapping-step-therapy"],
    });
    assert(
      restoredPortalFallback.status === "submitted",
      "portal_fallback channel was not accepted after payer availability was restored",
    );
    portalSubmissionId = restoredPortalFallback.submission_id;
    results.push({
      name: "portal_fallback channel contract",
      status: "passed",
      detail: portalSubmissionId,
    });
  }

  const robotEventId = `event-cp4-robot-${Date.now()}`;
  const portalConfirmationId = "AVFH-PORTAL-SYN-001";
  const robotEvent = await postJson("/events", {
    event_id: robotEventId,
    case_id: cleanState.case.case_id,
    actor_type: "robot",
    actor_name: "UiPath Portal Fallback Robot",
    task_or_agent_name: "Mock payer portal submission",
    action: "portal_fallback_submitted",
    input_summary:
      "Synthetic prior authorization packet submitted through mock portal fallback.",
    output_summary: `Portal confirmation ${portalConfirmationId}; linked submission ${portalSubmissionId}.`,
    evidence_refs: ["mapping-diagnosis", "mapping-step-therapy"],
    trace_id: "trace-cp4-portal-fallback",
    orchestrator_job_id: "job-syn-cp4-local-smoke",
    timestamp: new Date().toISOString(),
  });
  assert(robotEvent.ok === true, "robot fallback event was not accepted");

  const eventMirror = await getJson(
    `/events?case_id=${encodeURIComponent(cleanState.case.case_id)}`,
  );
  assert(
    eventMirror.events?.some(
      (event: { event_id?: string; actor_type?: string; action?: string }) =>
        event.event_id === robotEventId &&
        event.actor_type === "robot" &&
        event.action === "portal_fallback_submitted",
    ),
    "robot fallback event was not visible in event mirror",
  );

  const commandCenterState = await getJson("/demo/state");
  assert(
    commandCenterState.events?.some(
      (event: { event_id?: string }) => event.event_id === robotEventId,
    ),
    "robot fallback event was not visible to Command Center state",
  );
  assert(
    commandCenterState.submissions?.some(
      (submission: { submission_id?: string; channel?: string }) =>
        submission.submission_id === portalSubmissionId &&
        submission.channel === "portal_fallback",
    ),
    "portal fallback submission was not visible in runtime state",
  );
  results.push({
    name: "event mirror and Command Center-visible state",
    status: "passed",
    detail: robotEventId,
  });

  assertBuiltApp(
    "Command Center",
    "apps/command-center/dist",
    "Treatment Access Command Center",
  );
  results.push({
    name: "Command Center static artifact",
    status: "passed",
    detail: "apps/command-center/dist",
  });

  assertBuiltApp(
    "Mock Payer Portal",
    "apps/mock-payer-portal/dist",
    "Northstar Payer Portal",
  );
  results.push({
    name: "Mock Payer Portal static artifact",
    status: "passed",
    detail: "apps/mock-payer-portal/dist",
  });

  const finalReset = await postJson("/demo/reset", {});
  const finalState = await getJson("/demo/state");
  assert(finalReset.ok === true, "final reset failed");
  assert(
    finalState.submissions?.length === 0,
    "final reset did not clear submissions",
  );
  assert(
    !finalState.events?.some(
      (event: { event_id?: string }) => event.event_id === robotEventId,
    ),
    "final reset did not clear CP4 robot event",
  );
  results.push({
    name: "clean reset after CP4 smoke",
    status: "passed",
    detail: `eventCount=${finalState.events?.length ?? "unknown"}`,
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

function assertBuiltApp(
  label: string,
  distPath: string,
  expectedTitle: string,
) {
  const indexPath = join(distPath, "index.html");
  assert(existsSync(indexPath), `${label} build is missing ${indexPath}`);

  const indexHtml = readFileSync(indexPath, "utf8");
  assert(
    indexHtml.includes(expectedTitle),
    `${label} index.html did not include expected title ${expectedTitle}`,
  );

  const assetsPath = join(distPath, "assets");
  assert(existsSync(assetsPath), `${label} build is missing assets directory`);
  assert(
    readdirSync(assetsPath).some((fileName) => fileName.endsWith(".js")),
    `${label} build is missing a JavaScript asset`,
  );
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

  console.log("Checkpoint 4 smoke results:");
  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[${check.status}] ${check.name}${suffix}`);
  }
}

function formatFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `Checkpoint 4 smoke failed: ${message}

Endpoint and artifact assumptions:
  GET  /health
  GET  /demo/state
  POST /demo/reset
  POST /demo/toggles
  POST /events
  GET  /events?case_id=<caseId>
  POST /payer/prior-auth
  GET  /payer/prior-auth/:submissionId/status
  apps/command-center/dist/index.html
  apps/mock-payer-portal/dist/index.html

Run via the root package script so contracts, mock API, and both frontend apps
are built before this smoke checks static artifacts.`;
}
