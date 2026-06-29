import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type QuickFormContract = {
  taskKey?: string;
  uiPath?: {
    taskType?: string;
    folderName?: string;
    folderId?: number;
  };
  quickForm?: {
    outcomes?: Array<{ id?: string; name?: string }>;
  };
};

type TaskPayload = {
  syntheticDataOnly?: boolean;
  noPhi?: boolean;
  uipathScope?: {
    organization?: string;
    tenant?: string;
    folderName?: string;
    folderId?: number;
  };
  task?: {
    contractPath?: string;
    taskType?: string;
    formType?: string;
  };
  caseContext?: {
    caseId?: string;
    externalCaseKey?: string;
  };
  clinicalGate?: {
    unsupportedClaim?: {
      claimText?: string;
      autonomousUseAllowed?: boolean;
    };
    policyCriterion?: {
      policyCitation?: string;
    };
    evidenceRefs?: Array<{
      sourceUri?: string;
      sourceSpan?: string;
      confidence?: number;
    }>;
  };
  allowedOutcomes?: Array<{ id?: string; name?: string }>;
  completionDataTemplate?: Record<string, unknown>;
  eventMirrorOnCreate?: {
    action?: string;
    evidence_refs?: string[];
  };
};

type ProofManifest = {
  scope?: {
    organization?: string;
    tenant?: string;
    folderName?: string;
    folderId?: number;
    syntheticDataOnly?: boolean;
  };
  liveTaskClaim?: {
    status?: string;
    taskId?: unknown;
    taskType?: string;
    taskKey?: string;
    folderId?: number;
    externalTag?: string;
    completedTime?: string;
    deepLink?: unknown;
    inboxLink?: string;
    requirement?: string;
  };
  readOnlyDiscovery?: {
    commandsRun?: string[];
    sideEffects?: string;
  };
  liveExecution?: {
    commandsRun?: string[];
    results?: string[];
    sideEffects?: string;
  };
  taskPayload?: {
    path?: string;
    noPhi?: boolean;
    containsUnsupportedClaim?: boolean;
    containsPolicyCitation?: boolean;
    containsEvidenceRefs?: boolean;
  };
  approvalGatedLivePath?: {
    creation?: {
      approvalRequired?: boolean;
      evidenceRequired?: string[];
    };
    assignment?: {
      approvalRequired?: boolean;
      commandTemplate?: string;
      verifyCommand?: string;
    };
    completion?: {
      approvalRequired?: boolean;
      commandTemplate?: string;
      verifyCommand?: string;
      eventMirrorAction?: string;
    };
  };
  maestroInlineHitlStatus?: {
    caseInstanceId?: string;
    caseStatus?: string;
    flowInstanceId?: string;
    flowStatus?: string;
    hitlNode?: string;
    faultSummary?: string;
  };
  deepLinkRules?: {
    standalonePattern?: string;
    inboxPattern?: string;
    tenantSlugRequired?: boolean;
  };
  fallback?: {
    useOnlyIf?: string[];
    proofSurface?: string;
    requiredUiLabel?: string;
    requiredEvent?: {
      action?: string;
      actor_type?: string;
      evidence_refs?: string[];
    };
    approvalGatedCommandTemplate?: string;
  };
};

const requiredFiles = [
  "uipath/action-center/contracts/clinician-evidence-validation.quickform.json",
  "uipath/action-center/live-proof/clinician-validation-task-payload.json",
  "uipath/live-proof/action-center-human-gate-proof.manifest.json",
  "docs/action-center-live-proof.md",
  "docs/checkpoint-8-lane-handoffs/action-center-gate.md",
];

const requiredReadOnlyCommands = [
  "uip login status --output json",
  "uip tasks users 7986316 --output json",
  "uip tasks list --folder-id 7986316 --output json",
];

const requiredOutcomes = [
  "approve",
  "approve_with_edits",
  "reject",
  "request_more_evidence",
];

try {
  for (const path of requiredFiles) {
    assert(existsSync(resolve(path)), `missing required file: ${path}`);
  }

  const payload = readJson<TaskPayload>(
    "uipath/action-center/live-proof/clinician-validation-task-payload.json",
  );
  const manifest = readJson<ProofManifest>(
    "uipath/live-proof/action-center-human-gate-proof.manifest.json",
  );
  const contract = readJson<QuickFormContract>(
    "uipath/action-center/contracts/clinician-evidence-validation.quickform.json",
  );
  const packageJson = readJson<{ scripts?: Record<string, string> }>(
    "package.json",
  );

  assert(
    packageJson.scripts?.["smoke:checkpoint8-action-center-proof"]?.includes(
      "scripts/verify-checkpoint8-action-center-proof.ts",
    ),
    "package.json must register smoke:checkpoint8-action-center-proof",
  );

  assertScope(payload.uipathScope, "payload");
  assertScope(manifest.scope, "manifest");

  assert(payload.syntheticDataOnly === true, "payload must be synthetic only");
  assert(payload.noPhi === true, "payload must explicitly mark noPhi");
  assert(
    manifest.scope?.syntheticDataOnly === true,
    "manifest must be synthetic only",
  );
  assert(
    manifest.liveTaskClaim?.status === "completed",
    "manifest must claim the completed live Action Center task",
  );
  assert(
    manifest.liveTaskClaim.taskId === 4401667 &&
      manifest.liveTaskClaim.taskType === "ExternalTask" &&
      manifest.liveTaskClaim.folderId === 7986316 &&
      manifest.liveTaskClaim.externalTag === "TACC-2026-001",
    "manifest must contain the live ExternalTask ID, type, folder, and external tag",
  );
  assert(
    manifest.liveTaskClaim.taskKey === "93c09da5-3edb-455e-9679-d513113fd4fa" &&
      manifest.liveTaskClaim.completedTime === "2026-06-29T19:44:16.577Z",
    "manifest must contain the completed task key and completion timestamp",
  );
  assert(
    typeof manifest.liveTaskClaim.deepLink === "string" &&
      manifest.liveTaskClaim.deepLink.includes(
        "/galacticus/DefaultTenant/actions_/current-task/tasks/4401667",
      ) &&
      manifest.liveTaskClaim.inboxLink?.includes(
        "/galacticus/DefaultTenant/orchestrator_/actions/inbox/93c09da5-3edb-455e-9679-d513113fd4fa",
      ),
    "manifest must contain tenant-qualified live task deep links",
  );
  assert(
    manifest.liveTaskClaim.requirement?.includes("task ID") &&
      manifest.liveTaskClaim.requirement?.includes("deep link"),
    "manifest must require task ID and deep link before live task claims",
  );

  assert(
    payload.task?.contractPath ===
      "uipath/action-center/contracts/clinician-evidence-validation.quickform.json",
    "payload must reference the checked-in clinician validation contract",
  );
  assert(
    contract.taskKey === "clinician_evidence_validation",
    "contract must be the clinician evidence validation task",
  );
  assert(
    payload.task?.taskType === "FormTask" &&
      contract.uiPath?.taskType === "FormTask",
    "payload and contract must use FormTask",
  );
  assert(payload.task?.formType === "QuickForm", "payload must use QuickForm");

  assert(
    payload.caseContext?.caseId === "case-syn-001" &&
      payload.caseContext?.externalCaseKey === "TACC-2026-001",
    "payload must target the synthetic demo case",
  );
  assert(
    payload.clinicalGate?.unsupportedClaim?.claimText &&
      payload.clinicalGate.unsupportedClaim.autonomousUseAllowed === false,
    "payload must define an unsupported claim that cannot be used autonomously",
  );
  assert(
    payload.clinicalGate?.policyCriterion?.policyCitation?.includes(
      "Aurora Vale Fictionalimab Policy 2026",
    ),
    "payload must include a policy citation",
  );
  assert(
    (payload.clinicalGate?.evidenceRefs?.length ?? 0) >= 2,
    "payload must include at least two evidence refs",
  );
  for (const ref of payload.clinicalGate?.evidenceRefs ?? []) {
    assert(
      ref.sourceUri?.startsWith("fixture://"),
      "evidence refs must be fixture URIs",
    );
    assert(
      ref.sourceSpan?.startsWith("fixture://"),
      "evidence spans must be fixture URIs",
    );
    assert(
      typeof ref.confidence === "number" &&
        ref.confidence >= 0 &&
        ref.confidence <= 1,
      "evidence confidence must be between 0 and 1",
    );
  }

  assertArrayContains(
    payload.allowedOutcomes?.map((outcome) => outcome.id),
    requiredOutcomes,
    "payload allowed outcomes",
  );
  assertArrayContains(
    contract.quickForm?.outcomes?.map((outcome) => outcome.id),
    requiredOutcomes,
    "contract outcomes",
  );
  assert(
    payload.eventMirrorOnCreate?.action === "human.task.created",
    "payload must define the human.task.created event",
  );

  assertArrayContains(
    manifest.readOnlyDiscovery?.commandsRun,
    requiredReadOnlyCommands,
    "read-only discovery commands",
  );
  assert(
    manifest.readOnlyDiscovery?.sideEffects === "none",
    "read-only discovery must record no side effects",
  );
  assertArrayContains(
    manifest.liveExecution?.commandsRun,
    [
      "uip tasks assign 4401667 --user-id <task-eligible-user-id> --output json",
      "uip tasks get 4401667 --task-type ExternalTask --folder-id 7986316 --output json",
    ],
    "live execution commands",
  );
  assert(
    manifest.liveExecution?.sideEffects?.includes(
      "one synthetic Action Center ExternalTask created",
    ),
    "manifest must record the approved live Action Center side effect",
  );
  assert(
    manifest.taskPayload?.path ===
      "uipath/action-center/live-proof/clinician-validation-task-payload.json",
    "manifest must point at the H2 task payload",
  );
  assert(
    manifest.taskPayload?.noPhi &&
      manifest.taskPayload.containsUnsupportedClaim &&
      manifest.taskPayload.containsPolicyCitation &&
      manifest.taskPayload.containsEvidenceRefs,
    "manifest task payload summary must include noPhi, unsupported claim, citation, and evidence refs",
  );

  assert(
    manifest.approvalGatedLivePath?.creation?.approvalRequired === true,
    "task creation must be approval-gated",
  );
  assert(
    manifest.approvalGatedLivePath?.assignment?.approvalRequired === true &&
      manifest.approvalGatedLivePath.assignment.commandTemplate?.includes(
        "uip tasks assign <task-id> --user-id",
      ),
    "task assignment command must be approval-gated",
  );
  assert(
    manifest.approvalGatedLivePath?.completion?.approvalRequired === true &&
      manifest.approvalGatedLivePath.completion.commandTemplate?.includes(
        "uip tasks complete <task-id>",
      ) &&
      manifest.approvalGatedLivePath.completion.commandTemplate?.includes(
        "--type ExternalTask",
      ) &&
      manifest.approvalGatedLivePath.completion.eventMirrorAction ===
        "human.task.completed",
    "task completion command must be approval-gated",
  );
  assert(
    manifest.maestroInlineHitlStatus?.caseInstanceId ===
      "cad900ae-e4f9-4e59-a1c8-c6f15934f5bc" &&
      manifest.maestroInlineHitlStatus.flowInstanceId ===
        "4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0" &&
      manifest.maestroInlineHitlStatus.hitlNode ===
        "clinicianEvidenceReview1" &&
      manifest.maestroInlineHitlStatus.faultSummary?.includes("ExternalTag"),
    "manifest must record the live Maestro/HITL fault boundary",
  );

  for (const phrase of [
    "numeric task ID",
    "tenant-qualified Action Center deep link",
  ]) {
    assert(
      manifest.approvalGatedLivePath.creation.evidenceRequired?.includes(
        phrase,
      ),
      `creation evidence must include ${phrase}`,
    );
  }
  assert(
    manifest.deepLinkRules?.tenantSlugRequired === true &&
      manifest.deepLinkRules.standalonePattern?.includes(
        "/galacticus/DefaultTenant/actions_/current-task/tasks/",
      ) &&
      manifest.deepLinkRules.inboxPattern?.includes(
        "/galacticus/DefaultTenant/orchestrator_/actions/inbox/",
      ),
    "deep-link rules must include tenant-qualified standalone and inbox patterns",
  );

  assert(
    (manifest.fallback?.useOnlyIf?.length ?? 0) >= 4,
    "fallback must define blocker criteria",
  );
  assert(
    manifest.fallback?.requiredUiLabel ===
      "UiPath-controlled human gate fallback - no live Action Center task created",
    "fallback UI label must be exact",
  );
  assert(
    manifest.fallback.requiredEvent?.action ===
      "human_gate_fallback_recorded" &&
      manifest.fallback.requiredEvent.actor_type === "api_workflow",
    "fallback event must be a UiPath-controlled event mirror action",
  );
  assert(
    manifest.fallback.approvalGatedCommandTemplate?.includes(
      "uip api-workflow run uipath/api-workflows/write-event.workflow.json",
    ),
    "fallback must provide an approval-gated write-event command template",
  );

  const docs = [
    readText("docs/action-center-live-proof.md"),
    readText("docs/checkpoint-8-lane-handoffs/action-center-gate.md"),
    readText("uipath/action-center/README.md"),
  ].join("\n");

  for (const phrase of [
    "Live Action Center ExternalTask created, assigned, and completed",
    "Task ID `4401667`",
    "ExternalTag `TACC-2026-001`",
    "inline Maestro Flow HITL QuickForm",
    "UiPath-controlled human gate fallback - no live Action Center task created",
    "uip tasks users 7986316 --output json",
    "uip tasks list --folder-id 7986316 --output json",
    "human_gate_fallback_recorded",
  ]) {
    assert(docs.includes(phrase), `docs missing phrase: ${phrase}`);
  }

  console.log("Checkpoint 8 Action Center proof readiness passed.");
} catch (error) {
  console.error(
    `Checkpoint 8 Action Center proof readiness failed: ${
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

function assertScope(
  scope:
    | {
        organization?: string;
        tenant?: string;
        folderName?: string;
        folderId?: number;
      }
    | undefined,
  label: string,
) {
  assert(
    scope?.organization === "galacticus",
    `${label} org must be galacticus`,
  );
  assert(
    scope?.tenant === "DefaultTenant",
    `${label} tenant must be DefaultTenant`,
  );
  assert(
    scope?.folderName === "TreatmentAccessHackathon",
    `${label} folder must be TreatmentAccessHackathon`,
  );
  assert(scope?.folderId === 7986316, `${label} folder ID must be 7986316`);
}
