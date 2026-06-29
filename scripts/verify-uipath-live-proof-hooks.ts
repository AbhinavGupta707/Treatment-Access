import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Manifest = {
  scope?: {
    uipathFolderName?: string;
    syntheticDataOnly?: boolean;
    separateProjectGuardrail?: string;
  };
  liveProofContract?: {
    requiredVisibleEvents?: string[];
  };
  diagnosticOrder?: string[];
  hookSurfaces?: Array<{
    surface?: string;
    registrationDiscovery?: string[];
    officialActivationFlow?: string[];
    approvalGatedCommands?: string[];
    evidenceToCapture?: string[];
  }>;
  defaultMode?: {
    forbiddenWithoutApproval?: string[];
  };
};

type LiveProofRequest = {
  synthetic?: boolean;
  uipathFolderName?: string;
  approvalState?: {
    sideEffectApprovalGranted?: boolean;
  };
};

type LiveProofEvent = {
  eventType?: string;
  actorType?: string;
  syntheticDataDisclaimer?: string;
  payloadJson?: string;
};

const requiredFiles = [
  "uipath/live-proof/README.md",
  "uipath/live-proof/live-proof-governed-hooks.manifest.json",
  "uipath/live-proof/samples/live-proof-request.sample.json",
  "uipath/live-proof/samples/live-proof-events.sample.json",
  "uipath/coded-agents/live-proof/README.md",
  "uipath/coded-agents/live-proof/coded-agent-authoring-contract.json",
];

const requiredSurfaces = [
  "coded_agent_or_agent_builder",
  "maestro_case",
  "action_center",
  "data_service_data_fabric",
  "orchestrator_job",
  "rpa",
  "solution_lifecycle",
];

const requiredEvents = [
  "case_live_proof_started",
  "policy_checked",
  "evidence_mapped",
  "human_gate_required",
  "submission_packet_ready_or_blocked",
  "payer_api_unavailable_or_not_attempted",
  "live_proof_completed_or_waiting_for_approval",
];

const requiredForbiddenPhrases = [
  "live agent debug or run",
  "Maestro debug or run",
  "Action Center task creation, assignment, or completion",
  "Data Service/Data Fabric record writes",
  "Orchestrator job start",
  "RPA run or debug",
  "solution upload, publish, deploy, or activate",
  "IXP mutation",
  "payer submission",
];

try {
  for (const path of requiredFiles) {
    assert(existsSync(resolve(path)), `missing required file: ${path}`);
  }

  const manifest = readJson<Manifest>(
    "uipath/live-proof/live-proof-governed-hooks.manifest.json",
  );
  const request = readJson<LiveProofRequest>(
    "uipath/live-proof/samples/live-proof-request.sample.json",
  );
  const events = readJson<LiveProofEvent[]>(
    "uipath/live-proof/samples/live-proof-events.sample.json",
  );
  const codedAgentContract = readJson<Record<string, unknown>>(
    "uipath/coded-agents/live-proof/coded-agent-authoring-contract.json",
  );

  assert(
    manifest.scope?.uipathFolderName === "TreatmentAccessHackathon",
    "manifest must target TreatmentAccessHackathon",
  );
  assert(
    manifest.scope?.syntheticDataOnly === true,
    "manifest must require synthetic data only",
  );
  assert(
    manifest.scope?.separateProjectGuardrail?.includes("AgentFactoryDemo"),
    "manifest must explicitly guard against AgentFactoryDemo reuse",
  );
  assert(
    request.synthetic === true &&
      request.uipathFolderName === "TreatmentAccessHackathon",
    "sample request must be synthetic and scoped to TreatmentAccessHackathon",
  );
  assert(
    request.approvalState?.sideEffectApprovalGranted === false,
    "sample request must default sideEffectApprovalGranted to false",
  );

  assertArrayContains(
    manifest.diagnosticOrder,
    [
      "registration_discovery_install_state",
      "official_activation_flow",
      "permissions_runtime",
    ],
    "manifest diagnostic order",
  );
  assertArrayContains(
    manifest.liveProofContract?.requiredVisibleEvents,
    requiredEvents,
    "manifest required visible events",
  );
  assertArrayContains(
    manifest.defaultMode?.forbiddenWithoutApproval,
    requiredForbiddenPhrases,
    "manifest forbidden live side effects",
  );

  const surfaces = manifest.hookSurfaces ?? [];
  assertArrayContains(
    surfaces.map((surface) => surface.surface),
    requiredSurfaces,
    "manifest hook surfaces",
  );

  for (const surface of surfaces) {
    assert(
      (surface.registrationDiscovery?.length ?? 0) > 0,
      `${surface.surface} must define registration discovery commands`,
    );
    assert(
      (surface.officialActivationFlow?.length ?? 0) > 0,
      `${surface.surface} must define official activation flow notes`,
    );
    assert(
      (surface.approvalGatedCommands?.length ?? 0) > 0,
      `${surface.surface} must define approval-gated commands`,
    );
    assert(
      (surface.evidenceToCapture?.length ?? 0) > 0,
      `${surface.surface} must define evidence capture requirements`,
    );
  }

  assert(
    codedAgentContract.projectState === "authoring_artifact_only",
    "coded agent contract must remain an authoring artifact only",
  );
  assert(
    String(codedAgentContract.scaffoldRule ?? "").includes(
      "uip codedagent new",
    ),
    "coded agent contract must require official CLI scaffold",
  );

  assert(Array.isArray(events), "events sample must be an array");
  assertArrayContains(
    events.map((event) => event.eventType),
    requiredEvents,
    "sample event types",
  );

  for (const event of events) {
    assert(
      event.syntheticDataDisclaimer?.includes("Synthetic demo data only"),
      `event ${event.eventType} must include synthetic disclaimer`,
    );
    assert(
      typeof event.payloadJson === "string",
      `event ${event.eventType} must include payloadJson string`,
    );
    JSON.parse(event.payloadJson);
  }

  const docs = [
    readText("uipath/live-proof/README.md"),
    readText("uipath/coded-agents/live-proof/README.md"),
    readText("uipath/live-wiring-runbook.md"),
  ].join("\n");

  for (const phrase of [
    "Action Center",
    "Data Service",
    "Maestro",
    "Orchestrator",
    "RPA",
    "Solution",
    "explicit approval",
    "synthetic",
  ]) {
    assert(docs.includes(phrase), `docs must mention ${phrase}`);
  }

  console.log("UiPath live proof hook readiness passed.");
} catch (error) {
  console.error(
    `UiPath live proof hook readiness failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}

function readText(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(readText(path)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertArrayContains(
  actual: string[] | undefined,
  expected: string[],
  label: string,
) {
  assert(Array.isArray(actual), `${label} must be an array`);
  const missing = expected.filter((item) => !actual.includes(item));
  assert(missing.length === 0, `${label} missing: ${missing.join(", ")}`);
}
