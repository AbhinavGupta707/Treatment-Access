import { LiveProofRunSchema } from "@tacc/shared-schemas";
import { runTreatmentAccessLiveProof } from "@tacc/agent-runtime";

const expectedStages = [
  "case_live_proof_started",
  "policy_checked",
  "evidence_mapped",
  "human_gate_required",
  "submission_packet_ready_or_blocked",
  "payer_api_unavailable_or_not_attempted",
  "live_proof_completed_or_waiting_for_approval",
] as const;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const runtimeRun = LiveProofRunSchema.parse(
  await runTreatmentAccessLiveProof({
    requestedBy: "Checkpoint 7 smoke",
    mode: "deterministic",
    runId: "live-proof-smoke-runtime",
  }),
);

assert(runtimeRun.steps.length === 7, "Expected seven live proof stages.");
assert(
  JSON.stringify(runtimeRun.steps.map((step) => step.stage)) ===
    JSON.stringify(expectedStages),
  "Live proof stages must match the Checkpoint 7 visible timeline.",
);
assert(
  runtimeRun.step_runs.length === 7,
  "Expected all seven agent step outputs to be schema-validated.",
);
assert(
  runtimeRun.mirror_events.length === 7,
  "Expected seven synthetic mirror events.",
);
assert(
  runtimeRun.mirror_events.every(
    (event, index) => event.action === expectedStages[index],
  ),
  "Mirror event actions must preserve the visible stage contract.",
);
assert(
  runtimeRun.approval_gates.some((gate) => gate.status === "pending"),
  "Expected a pending approval gate for live side effects.",
);
assert(
  runtimeRun.no_live_uipath_side_effects &&
    runtimeRun.no_real_payer_submission,
  "Live proof smoke must not perform UiPath side effects or payer submission.",
);

process.env.NODE_ENV = "test";
const { createServer } = await import("../services/mock-healthcare-api/src/index.ts");
const server = createServer();

try {
  const createResponse = await server.inject({
    method: "POST",
    url: "/live-proof-runs",
    payload: {
      requested_by: "Checkpoint 7 smoke",
      mode: "deterministic",
    },
  });
  assert(
    createResponse.statusCode === 200,
    `Expected API live proof creation to return 200, got ${createResponse.statusCode}.`,
  );
  const apiRun = LiveProofRunSchema.parse(
    createResponse.json().live_proof_run,
  );
  assert(
    createResponse.json().events_written === 7,
    "API should write seven synthetic mirror events.",
  );
  assert(
    apiRun.step_runs.length === 7,
    "API live proof run should include seven validated agent step records.",
  );

  const eventsResponse = await server.inject({
    method: "GET",
    url: `/cases/${apiRun.case_id}/events`,
  });
  assert(
    eventsResponse.statusCode === 200,
    `Expected case events to return 200, got ${eventsResponse.statusCode}.`,
  );
  const actions = eventsResponse
    .json()
    .events.map((event: { action: string }) => event.action);
  for (const stage of expectedStages) {
    assert(actions.includes(stage), `Missing mirror event stage ${stage}.`);
  }

  const readResponse = await server.inject({
    method: "GET",
    url: `/live-proof-runs/${apiRun.run_id}`,
  });
  assert(
    readResponse.statusCode === 200,
    `Expected live proof read to return 200, got ${readResponse.statusCode}.`,
  );

  console.log("Checkpoint 7 live proof smoke passed.");
  console.log(
    JSON.stringify(
      {
        run_id: apiRun.run_id,
        mode: apiRun.mode,
        status: apiRun.status,
        stages: apiRun.steps.map((step) => step.stage),
        agent_steps: apiRun.step_runs.map((step) => step.agent_id),
        source_labels: apiRun.source_labels,
        side_effects: "none; synthetic event mirror only",
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
