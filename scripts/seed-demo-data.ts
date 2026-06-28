import {
  defaultDemoToggles,
  seedAuditEvents,
  seedCase,
  seedCriteria,
  seedEvidenceMappings,
  seedOrder,
  seedPatient,
} from "@tacc/demo-data";

const defaultBaseUrl =
  process.env.TACC_MOCK_API_BASE_URL ?? "http://127.0.0.1:8787";

const args = process.argv.slice(2);

if (args.includes("--help")) {
  console.log(`Inspect or apply the synthetic demo seed.

Usage:
  node --import tsx/esm scripts/seed-demo-data.ts [--apply] [--base-url <url>] [--json]

Options:
  --apply          Reset a running mock API to the seed state.
  --base-url <url> Mock API base URL. Defaults to TACC_MOCK_API_BASE_URL or ${defaultBaseUrl}.
  --json           Print machine-readable JSON only.
`);
  process.exit(0);
}

const apply = args.includes("--apply");
const json = args.includes("--json");
const baseUrl = readOption("--base-url") ?? defaultBaseUrl;

const summary = {
  case_id: seedCase.case_id,
  external_case_key: seedCase.external_case_key,
  patient_id: seedPatient.patient_id,
  order_id: seedOrder.order_id,
  medication_name: seedOrder.medication_name,
  criteria: seedCriteria.length,
  evidenceMappings: seedEvidenceMappings.length,
  seedEvents: seedAuditEvents.length,
  defaultToggles: defaultDemoToggles,
  syntheticDataOnly: true,
};

if (apply) {
  try {
    const response = await postJson(`${baseUrl}/demo/reset`, {});
    assert(response.ok === true, "reset endpoint did not return ok=true");
  } catch (error) {
    console.error(formatFailure(error));
    process.exit(1);
  }
}

if (json) {
  console.log(
    JSON.stringify({ ...summary, appliedTo: apply ? baseUrl : null }, null, 2),
  );
} else {
  console.log(
    [
      apply
        ? `Applied synthetic seed to ${baseUrl}.`
        : "Synthetic seed summary.",
      `Case: ${summary.case_id} (${summary.external_case_key})`,
      `Patient: ${summary.patient_id}`,
      `Order: ${summary.order_id}`,
      `Medication: ${summary.medication_name}`,
      `Criteria: ${summary.criteria}`,
      `Evidence mappings: ${summary.evidenceMappings}`,
      `Seed events: ${summary.seedEvents}`,
      `Default toggles: ${JSON.stringify(summary.defaultToggles)}`,
      "Synthetic data only: true",
    ].join("\n"),
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

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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

function formatFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `Could not apply seed to ${baseUrl}: ${message}

Start the mock API first with:
  CI=true pnpm dev:api

Or use the checkpoint smoke command, which starts the API automatically:
  CI=true pnpm smoke:checkpoint1`;
}
