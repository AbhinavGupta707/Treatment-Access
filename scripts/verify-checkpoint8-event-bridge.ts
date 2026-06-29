import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { UiPathEventStateRecordSchema } from "@tacc/shared-schemas";

type Check = {
  name: string;
  detail?: string;
};

const checks: Check[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(path: string) {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as unknown;
}

function readText(path: string) {
  return readFileSync(resolve(path), "utf8");
}

function assertMatches(name: string, content: string, ...patterns: RegExp[]) {
  const normalizedContent = content.replace(/\s+/g, " ");
  const missing = patterns.find((pattern) => !pattern.test(normalizedContent));
  assert(!missing, `${name} missing ${String(missing)}`);
  checks.push({ name });
}

async function assertSamplesAndApi() {
  const validSample = UiPathEventStateRecordSchema.parse(
    readJson(
      "uipath/live-proof/samples/uipath-written-event-state.sample.json",
    ),
  );
  assert(
    validSample.provenance.source_verification === "live_uipath_written",
    "valid sample must be classified as live_uipath_written",
  );
  assert(
    Boolean(validSample.provenance.uipath_record_id),
    "valid sample must include a UiPath record identifier",
  );

  let invalidRejected = false;
  try {
    UiPathEventStateRecordSchema.parse(
      readJson(
        "uipath/live-proof/samples/local-overclaim-event-state.invalid.sample.json",
      ),
    );
  } catch {
    invalidRejected = true;
  }
  assert(
    invalidRejected,
    "local overclaim sample must be rejected by the shared schema",
  );

  checks.push({
    name: "Event state samples",
    detail: "UiPath-written accepted; local overclaim rejected",
  });

  process.env.NODE_ENV = "test";
  const { createServer } =
    await import("../services/mock-healthcare-api/src/index.ts");
  const server = createServer();

  try {
    const validateResponse = await server.inject({
      method: "POST",
      url: "/uipath/event-state-records/validate",
      payload: validSample,
    });
    assert(
      validateResponse.statusCode === 200,
      `expected valid bridge payload to return 200, got ${validateResponse.statusCode}`,
    );
    assert(
      validateResponse.json().verification === "live_uipath_written",
      "valid bridge payload must preserve live_uipath_written verification",
    );

    const ingestResponse = await server.inject({
      method: "POST",
      url: "/uipath/event-state-records",
      payload: validSample,
    });
    assert(
      ingestResponse.statusCode === 200,
      `expected bridge ingest to return 200, got ${ingestResponse.statusCode}`,
    );
    assert(
      ingestResponse.json().audit_event.source_provenance.uipath_record_id ===
        validSample.provenance.uipath_record_id,
      "mirrored audit event must preserve UiPath provenance",
    );

    const invalidResponse = await server.inject({
      method: "POST",
      url: "/uipath/event-state-records/validate",
      payload: readJson(
        "uipath/live-proof/samples/local-overclaim-event-state.invalid.sample.json",
      ),
    });
    assert(
      invalidResponse.statusCode === 400,
      `expected local overclaim bridge payload to return 400, got ${invalidResponse.statusCode}`,
    );

    const listResponse = await server.inject({
      method: "GET",
      url: `/uipath/event-state-records?case_id=${validSample.case_id}&verification=live_uipath_written`,
    });
    assert(
      listResponse.statusCode === 200,
      `expected bridge list to return 200, got ${listResponse.statusCode}`,
    );
    assert(
      listResponse.json().event_state_records.length === 1,
      "bridge list must return the ingested live UiPath-written record",
    );

    checks.push({
      name: "Mock API event bridge",
      detail: "validate, ingest, timeline mirror, and filtered read passed",
    });
  } finally {
    await server.close();
  }
}

function assertDocs() {
  const combined = [
    "uipath/data-service/event-mirror-contract.md",
    "uipath/data-service/entity-contract.md",
    "uipath/data-service/README.md",
    "uipath/live-proof/README.md",
    "docs/checkpoint-8-lane-handoffs/event-state-bridge.md",
  ]
    .map((path) => readText(path))
    .join("\n");

  assertMatches(
    "Checkpoint 8 event bridge contract docs",
    combined,
    /source_system|sourceSystem/i,
    /source_actor|sourceActor/i,
    /uipath_folder_key|uipathFolderKey|uiPath folder/i,
    /uipath_record_id|uipathRecordId|record identifier/i,
    /uipath_task_id|uipathTaskId|task identifier/i,
    /uipath_job_id|uipathJobId|job identifier/i,
    /confirmation_status|confirmationStatus/i,
    /safety_labels|safetyLabels/i,
    /live_uipath_written/i,
    /local_synthetic_mirror/i,
  );

  assertMatches(
    "Approval-gated Data Service commands",
    combined,
    /uip df entities list/i,
    /uip df records insert/i,
    /requires explicit approval|approval-gated/i,
    /Do not create entities or records|No live entities are created/i,
  );
}

try {
  assertDocs();
  await assertSamplesAndApi();

  console.log("Checkpoint 8 event bridge verification passed.");
  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[passed] ${check.name}${suffix}`);
  }
} catch (error) {
  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[passed] ${check.name}${suffix}`);
  }

  console.error(
    `Checkpoint 8 event bridge verification failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}
