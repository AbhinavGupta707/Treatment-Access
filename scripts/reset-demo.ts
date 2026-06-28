const defaultBaseUrl =
  process.env.TACC_MOCK_API_BASE_URL ?? "http://127.0.0.1:8787";

const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.log(`Reset the local synthetic demo runtime.

Usage:
  node --import tsx/esm scripts/reset-demo.ts [--base-url <url>] [--json]

Environment:
  TACC_MOCK_API_BASE_URL  Override the mock API base URL.
`);
  process.exit(0);
}

const baseUrl = readOption("--base-url") ?? defaultBaseUrl;
const json = args.includes("--json");

try {
  const reset = await postJson(`${baseUrl}/demo/reset`, {});
  const state = await getJson(`${baseUrl}/demo/state`);

  assert(reset.ok === true, "reset endpoint did not return ok=true");
  assert(
    state.toggles?.missing_safety_lab === false,
    "missing_safety_lab toggle did not reset",
  );
  assert(
    state.toggles?.payer_api_unavailable === false,
    "payer_api_unavailable toggle did not reset",
  );
  assert(
    state.case?.case_id === "case-syn-001",
    "seed case was not present after reset",
  );

  const summary = {
    ok: true,
    baseUrl,
    case_id: state.case.case_id,
    stage: state.case.current_stage,
    eventCount: state.events?.length ?? reset.eventCount,
    toggles: state.toggles,
    syntheticDataOnly: true,
  };

  if (json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(
      [
        "Demo reset complete.",
        `Base URL: ${summary.baseUrl}`,
        `Case: ${summary.case_id} (${summary.stage})`,
        `Events: ${summary.eventCount}`,
        `Toggles: ${JSON.stringify(summary.toggles)}`,
        "Synthetic data only: true",
      ].join("\n"),
    );
  }
} catch (error) {
  console.error(formatFailure("Demo reset failed", error));
  process.exit(1);
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

async function getJson(url: string) {
  const response = await fetch(url);
  return parseResponse(url, response);
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse(url, response);
}

async function parseResponse(url: string, response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${text}`);
  }

  return data;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function formatFailure(prefix: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `${prefix}: ${message}

Start the mock API first with:
  CI=true pnpm dev:api

Or run the full checkpoint smoke command:
  CI=true pnpm smoke:checkpoint1`;
}
