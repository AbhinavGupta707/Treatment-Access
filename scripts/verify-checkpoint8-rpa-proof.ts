import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type RobotContract = {
  syntheticDataOnly?: boolean;
  orchestratorFolder?: {
    name?: string;
    key?: string;
  };
  inputs?: Record<string, { asset?: string; example?: string; type?: string }>;
  fallbackStateMachine?: {
    states?: Array<{
      state?: string;
      mirrorAction?: string;
      actorType?: string;
      source?: string;
      terminal?: boolean;
    }>;
    transitions?: Array<{
      from?: string;
      to?: string;
      requiresApproval?: boolean;
      sideEffect?: boolean;
    }>;
  };
  outputs?: {
    fallbackEvent?: {
      action?: string;
      actor?: string;
      requiredFields?: string[];
    };
  };
};

type UiPathProject = {
  name?: string;
  main?: string;
  dependencies?: Record<string, string>;
  designOptions?: {
    outputType?: string;
  };
  expressionLanguage?: string;
  targetFramework?: string;
};

type SolutionManifest = {
  Projects?: Array<{
    Type?: string;
    ProjectRelativePath?: string;
  }>;
};

const paths = {
  sourceProject: "uipath/robots/PayerPortalFallback/project.json",
  sourceMain: "uipath/robots/PayerPortalFallback/Main.xaml",
  solutionProject:
    "uipath/solution/treatment-access-command-center/PayerPortalFallback/project.json",
  solutionMain:
    "uipath/solution/treatment-access-command-center/PayerPortalFallback/Main.xaml",
  solutionManifest:
    "uipath/solution/treatment-access-command-center/treatment-access-command-center.uipx",
  solutionPackage:
    "uipath/solution/treatment-access-command-center/resources/solution_folder/package/PayerPortalFallback.json",
  solutionProcess:
    "uipath/solution/treatment-access-command-center/resources/solution_folder/process/process/PayerPortalFallback.json",
  robotContract: "uipath/robots/payer-portal-fallback/robot-contract.json",
  approvalGate:
    "uipath/robots/payer-portal-fallback/live-smoke-approval-gate.md",
  indicationChecklist:
    "uipath/robots/payer-portal-fallback/studio-indication-checklist.md",
  validationNotes: "uipath/robots/payer-portal-fallback/validation-notes.md",
  solutionReadme: "uipath/solution/treatment-access-command-center/README.md",
  portalSource: "apps/mock-payer-portal/src/main.tsx",
  writeEventWorkflow: "uipath/api-workflows/write-event.workflow.json",
  handoff: "docs/checkpoint-8-lane-handoffs/rpa-orchestrator-proof.md",
} as const;

const expectedPortalTargetTokens = [
  'data-uipath="prior-auth-form"',
  'uiPath="case-id"',
  'uiPath="order-id"',
  'uiPath="member-id"',
  'uiPath="medication"',
  'uiPath="diagnosis"',
  'data-uipath="submit-prior-auth"',
  'data-uipath="portal-confirmation"',
  'data-uipath="confirmation-id"',
] as const;

const expectedTodoIndications = [
  "TODO Indicate - Use Application/Browser (Mock Payer Portal)",
  "TODO Indicate - Type Member ID",
  "TODO Indicate - Type Medication",
  "TODO Indicate - Type Diagnosis",
  "TODO Indicate - Click Submit Prior Authorization",
  "TODO Indicate - Read Confirmation ID",
] as const;

const expectedApprovalCommands = [
  "uip rpa run",
  "uip rpa debug start",
  "uip or jobs start",
  "uip solution upload",
  "uip solution publish",
  "uip solution deploy",
  "write-event.workflow.json",
] as const;

const failures: string[] = [];
const warnings: string[] = [];

for (const path of Object.values(paths)) {
  assert(
    existsSync(resolve(path)),
    `missing required H3 proof artifact: ${path}`,
  );
}

const sourceProject = readJson<UiPathProject>(paths.sourceProject);
const solutionProject = readJson<UiPathProject>(paths.solutionProject);
const solutionManifest = readJson<SolutionManifest>(paths.solutionManifest);
const robotContract = readJson<RobotContract>(paths.robotContract);
const sourceMain = read(paths.sourceMain);
const solutionMain = read(paths.solutionMain);
const portalSource = read(paths.portalSource);
const approvalGate = read(paths.approvalGate);
const indicationChecklist = read(paths.indicationChecklist);
const validationNotes = read(paths.validationNotes);
const solutionReadme = read(paths.solutionReadme);
const handoff = read(paths.handoff);
const writeEventWorkflow = read(paths.writeEventWorkflow);
const solutionPackage = read(paths.solutionPackage);
const solutionProcess = read(paths.solutionProcess);

assert(
  sourceProject.name === "PayerPortalFallback",
  "source RPA project name must be PayerPortalFallback",
);
assert(
  sourceProject.main === "Main.xaml",
  "source RPA project must use Main.xaml",
);
assert(
  sourceProject.targetFramework === "Portable",
  "source RPA project must stay Portable",
);
assert(
  sourceProject.expressionLanguage === "VisualBasic",
  "source RPA project expression language must stay VisualBasic",
);
assert(
  sourceProject.designOptions?.outputType === "Process",
  "source RPA project must be a Process",
);
assert(
  sourceProject.dependencies?.["UiPath.System.Activities"] !== undefined,
  "source RPA project must keep UiPath.System.Activities dependency",
);
assert(
  JSON.stringify(sourceProject) === JSON.stringify(solutionProject),
  "solution copy project.json must match source project.json; re-import/sync before pack",
);
assert(
  sourceMain === solutionMain,
  "solution copy Main.xaml must match source Main.xaml; re-import/sync before pack",
);
assert(
  solutionManifest.Projects?.some(
    (project) =>
      project.Type === "Process" &&
      project.ProjectRelativePath === "PayerPortalFallback/project.uiproj",
  ) === true,
  "solution manifest must register PayerPortalFallback/project.uiproj as a Process",
);
assert(
  solutionPackage.includes('"kind": "package"') &&
    solutionPackage.includes('"name": "PayerPortalFallback"'),
  "solution package resource must bind PayerPortalFallback",
);
assert(
  solutionProcess.includes('"kind": "process"') &&
    solutionProcess.includes('"name": "PayerPortalFallback"') &&
    solutionProcess.includes('"targetFrameworkValue": "Portable"'),
  "solution process resource must bind PayerPortalFallback as Portable process",
);

assert(
  robotContract.syntheticDataOnly === true,
  "robot contract must declare syntheticDataOnly=true",
);
assert(
  robotContract.orchestratorFolder?.name === "TreatmentAccessHackathon",
  "robot contract must target TreatmentAccessHackathon",
);
assert(
  robotContract.orchestratorFolder?.key ===
    "4fba2fa1-012b-469a-b6aa-e5be3811c173",
  "robot contract must target the TreatmentAccessHackathon folder key",
);
for (const assetName of ["TACC_PAYER_PORTAL_URL", "TACC_MOCK_API_BASE_URL"]) {
  assert(
    Object.values(robotContract.inputs ?? {}).some(
      (input) => input.asset === assetName,
    ),
    `robot contract must declare required asset ${assetName}`,
  );
}
const confirmationState = robotContract.fallbackStateMachine?.states?.find(
  (state) => state.state === "confirmation_received",
);
assert(
  confirmationState?.mirrorAction === "payer_portal_fallback_submitted",
  "confirmation_received must map to payer_portal_fallback_submitted",
);
assert(
  confirmationState?.actorType === "robot",
  "confirmation_received must be robot-authored",
);
const confirmationTransition =
  robotContract.fallbackStateMachine?.transitions?.find(
    (transition) =>
      transition.from === "robot_requested" &&
      transition.to === "confirmation_received",
  );
assert(
  confirmationTransition?.requiresApproval === true &&
    confirmationTransition.sideEffect === true,
  "robot_requested -> confirmation_received must remain approval-gated and side-effecting",
);
for (const requiredField of [
  "caseId",
  "confirmationId",
  "robotJobId",
  "portalUrl",
  "demoRunId",
]) {
  assert(
    robotContract.outputs?.fallbackEvent?.requiredFields?.includes(
      requiredField,
    ) === true,
    `fallbackEvent must require ${requiredField}`,
  );
}

for (const target of expectedPortalTargetTokens) {
  assert(portalSource.includes(target), `mock portal must expose ${target}`);
}
assert(
  portalSource.includes("AVFH-PORTAL-SYN-001"),
  "mock portal must expose deterministic synthetic confirmation ID",
);
assert(
  portalSource.includes("not a real payer submission"),
  "mock portal must keep the no-real-payer-submission disclaimer",
);

assert(
  sourceMain.includes('DisplayName="Main Sequence"'),
  "Main.xaml must remain validate/build-capable",
);
const hasCapturedUiaActivities =
  sourceMain.includes("<uix:NApplicationCard") ||
  sourceMain.includes("UiPath.UIAutomationNext.Activities.NApplicationCard");
if (!hasCapturedUiaActivities) {
  warnings.push(
    "Main.xaml does not yet contain captured UIA activities; H3 remains prepared, not executed.",
  );
  assert(
    indicationChecklist.includes(
      "Live target capture has not been performed yet",
    ),
    "indication checklist must explicitly state live target capture is not complete",
  );
  for (const indication of expectedTodoIndications) {
    assert(
      indicationChecklist.includes(indication),
      `indication checklist must include ${indication}`,
    );
  }
}

for (const command of expectedApprovalCommands) {
  assert(
    approvalGate.includes(command),
    `approval gate must list ${command} before live smoke`,
  );
}
assert(
  approvalGate.includes("Any portal submission"),
  "approval gate must require approval before any synthetic portal submission",
);
assert(
  approvalGate.includes("robot_requested is request/preparation state only") ||
    approvalGate.includes("robot_requested` is request/preparation state only"),
  "approval gate must not collapse robot_requested into confirmation",
);
assert(
  validationNotes.includes("uip or folders runtimes") &&
    validationNotes.includes("uip or folders get"),
  "validation notes must record read-only runtime/folder discovery commands",
);
assert(
  solutionReadme.includes("action=payer_portal_fallback_submitted") &&
    solutionReadme.includes("confirmationId") &&
    solutionReadme.includes("robotJobId"),
  "solution README must document expected confirmation write-back fields",
);
assert(
  handoff.includes("Runtime / License Status") &&
    handoff.includes("Approval-Needed Commands") &&
    handoff.includes("Confirmation Write-Back"),
  "Checkpoint 8 RPA handoff must document runtime status, approval commands, and write-back",
);

if (
  writeEventWorkflow.includes("actor_type: 'api_workflow'") &&
  !writeEventWorkflow.includes("actorType")
) {
  warnings.push(
    "write-event.workflow.json currently hardcodes actor_type=api_workflow; use /events with actor_type=robot or update the workflow before claiming robot-authored write-back.",
  );
}

if (failures.length > 0) {
  console.error("Checkpoint 8 RPA proof preflight failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  "Checkpoint 8 RPA proof preflight passed: real project, solution registration, synthetic portal targets, approval gates, and write-back contract are aligned.",
);
if (warnings.length > 0) {
  console.warn("Checkpoint 8 RPA proof preflight warnings:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

function read(path: string) {
  return readFileSync(resolve(path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(read(path)) as T;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    failures.push(message);
  }
}
