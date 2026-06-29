import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { runTreatmentAccessLiveProof } from "@tacc/agent-runtime";
import { LiveProofRunSchema } from "@tacc/shared-schemas";

const expectedStages = [
  "case_live_proof_started",
  "policy_checked",
  "evidence_mapped",
  "human_gate_required",
  "submission_packet_ready_or_blocked",
  "payer_api_unavailable_or_not_attempted",
  "live_proof_completed_or_waiting_for_approval",
] as const;

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

function readText(path: string) {
  return readFileSync(resolve(path), "utf8");
}

function assertMatches(name: string, content: string, ...patterns: RegExp[]) {
  const normalizedContent = content.replace(/\s+/g, " ");
  const missing = patterns.find((pattern) => !pattern.test(normalizedContent));
  assert(!missing, `${name} missing ${String(missing)}`);
  checks.push({ name });
}

function assertPackageCommand() {
  const packageJson = JSON.parse(readText("package.json")) as {
    scripts?: Record<string, string>;
  };
  const script = packageJson.scripts?.["smoke:checkpoint7-live-proof"];

  assert(
    script?.includes("scripts/verify-checkpoint7-live-proof.ts"),
    "package.json must register smoke:checkpoint7-live-proof",
  );
  assert(
    script.includes("build:contracts"),
    "smoke:checkpoint7-live-proof must compile contracts before execution",
  );

  checks.push({
    name: "Checkpoint 7 package command",
    detail:
      "smoke:checkpoint7-live-proof compiles and executes the live proof smoke",
  });
}

function assertValueFirstNarrative() {
  const demo = readText("docs/demo-script.md");
  const submission = readText("docs/submission.md");
  const testing = readText("docs/testing.md");
  const combined = `${demo}\n${submission}\n${testing}`;

  assertMatches(
    "healthcare value narrative",
    combined,
    /less manual chart review/i,
    /fewer preventable denials/i,
    /faster (?:PA|prior authorization) submission/i,
    /safer appeal prep|safer appeals/i,
    /auditable human gates/i,
    /UiPath-governed execution/i,
  );

  assertMatches(
    "demo opens with value before architecture",
    demo,
    /manual chart review/i,
    /preventable denials/i,
    /faster (?:PA|prior authorization) submission/i,
  );
}

function assertLiveProofContractEvidence() {
  const plan = readText("docs/live-uipath-proof-plan.md");
  const orchestrator = readText(
    "docs/checkpoint-7-live-uipath-proof-orchestrator.md",
  );
  const combined = `${plan}\n${orchestrator}`;

  assertMatches(
    "live proof run contract",
    combined,
    /LiveProofRun/i,
    /LiveProofStep/i,
    /LiveProofTrace/i,
    /LiveProofApprovalGate/i,
    /UiPathEvidenceRef/i,
  );

  assertMatches(
    "live proof event timeline",
    combined,
    /case_live_proof_started/i,
    /policy_checked/i,
    /evidence_mapped/i,
    /human_gate_required/i,
    /submission_packet_ready_or_blocked/i,
    /payer_api_unavailable_or_not_attempted/i,
    /live_proof_completed_or_waiting_for_approval/i,
  );

  assertMatches(
    "source labels and trace evidence",
    combined,
    /Fireworks/i,
    /LangSmith/i,
    /source labels/i,
    /trace evidence/i,
  );
}

function assertSafetyAndEvidenceBoundaries() {
  const docs = [
    "docs/demo-script.md",
    "docs/submission.md",
    "docs/testing.md",
    "uipath/screenshots/manifest.md",
  ]
    .filter((path) => existsSync(resolve(path)))
    .map((path) => readText(path))
    .join("\n");

  assertMatches(
    "synthetic and source-grounding boundary",
    docs,
    /synthetic data|synthetic demo/i,
    /source evidence/i,
    /policy citation/i,
    /human approval|clinician review/i,
    /not autonomous medical or legal advice/i,
  );

  assertMatches(
    "evidence-backed claim boundary",
    docs,
    /actual scripts|smoke tests|smoke command|screenshots|logs|captured evidence|explicit caveats/i,
    /no live .*claimed|not claiming|not claimed|approval-gated/i,
  );

  assertMatches(
    "live UiPath side-effect gates",
    docs,
    /Action Center task creation/i,
    /Data Service .*write/i,
    /Orchestrator .*job/i,
    /RPA .*run|robot .*execution/i,
    /solution upload|publish|deploy|activate/i,
    /payer submission/i,
  );
}

function assertSubmissionReadinessPath() {
  const testing = readText("docs/testing.md");
  const submission = readText("docs/submission.md");
  const manifest = readText("uipath/screenshots/manifest.md");
  const combined = `${testing}\n${submission}\n${manifest}`;

  assertMatches(
    "Checkpoint 7 smoke documentation",
    combined,
    /smoke:checkpoint7-live-proof/i,
    /verify:submission-readiness/i,
    /smoke:checkpoint6-readiness/i,
    /git diff --check/i,
  );

  assertMatches(
    "submission evidence manifest",
    manifest,
    /Local Synthetic Proof/i,
    /Live UiPath Proof/i,
    /Manual capture required/i,
    /Exact command or path/i,
  );
}

async function assertRuntimeAndApiContract() {
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

  checks.push({
    name: "Live proof runtime contract",
    detail: "seven stages, seven agent records, pending approval gate",
  });

  process.env.NODE_ENV = "test";
  const { createServer } =
    await import("../services/mock-healthcare-api/src/index.ts");
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

    checks.push({
      name: "Live proof API event mirror",
      detail: `${apiRun.run_id} wrote seven synthetic events`,
    });

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
}

try {
  assertPackageCommand();
  assertValueFirstNarrative();
  assertLiveProofContractEvidence();
  assertSafetyAndEvidenceBoundaries();
  assertSubmissionReadinessPath();
  await assertRuntimeAndApiContract();

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
    `Checkpoint 7 live proof smoke failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}
