import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type ContractState = {
  state?: string;
  mirrorAction?: string;
  actorType?: string;
  source?: string;
  terminal?: boolean;
};

type RobotContract = {
  syntheticDataOnly?: boolean;
  fallbackStateMachine?: {
    states?: ContractState[];
    transitions?: Array<{
      from?: string;
      to?: string;
      requiresApproval?: boolean;
      sideEffect?: boolean;
    }>;
  };
  outputs?: {
    status?: {
      allowedValues?: string[];
    };
    fallbackRequestEvent?: {
      action?: string;
      actor?: string;
    };
    fallbackEvent?: {
      action?: string;
      actor?: string;
    };
  };
};

const expectedStates = [
  {
    state: "api_unavailable",
    mirrorAction: "payer_prior_auth_unavailable",
    actorType: "api_workflow",
    source: "mock_api_event_mirror",
    terminal: false,
  },
  {
    state: "robot_requested",
    mirrorAction: "robot_fallback_requested",
    actorType: "robot",
    source: "uipath_robot_event",
    terminal: false,
  },
  {
    state: "confirmation_received",
    mirrorAction: "payer_portal_fallback_submitted",
    actorType: "robot",
    source: "uipath_robot_event",
    terminal: true,
  },
] as const;

const portalPath = resolve("apps/mock-payer-portal/src/main.tsx");
const contractPath = resolve(
  "uipath/robots/payer-portal-fallback/robot-contract.json",
);

const portalSource = readFileSync(portalPath, "utf8");
const robotContract = JSON.parse(
  readFileSync(contractPath, "utf8"),
) as RobotContract;

const failures: string[] = [];

assert(
  robotContract.syntheticDataOnly === true,
  "robot contract must declare syntheticDataOnly=true",
);

for (const expected of expectedStates) {
  const state = robotContract.fallbackStateMachine?.states?.find(
    (candidate) => candidate.state === expected.state,
  );
  assert(state !== undefined, `missing contract state ${expected.state}`);
  assert(
    state?.mirrorAction === expected.mirrorAction,
    `${expected.state} must map to ${expected.mirrorAction}`,
  );
  assert(
    state?.actorType === expected.actorType,
    `${expected.state} must use actorType=${expected.actorType}`,
  );
  assert(
    state?.source === expected.source,
    `${expected.state} must use source=${expected.source}`,
  );
  assert(
    state?.terminal === expected.terminal,
    `${expected.state} terminal flag must be ${expected.terminal}`,
  );
  assert(
    robotContract.outputs?.status?.allowedValues?.includes(expected.state) ===
      true,
    `outputs.status.allowedValues must include ${expected.state}`,
  );
  assert(
    portalSource.includes(`stageId: "${expected.state}"`) ||
      portalSource.includes(`data-stage-id="${expected.state}"`),
    `portal source must expose stage ${expected.state}`,
  );
  assert(
    portalSource.includes(`action: "${expected.mirrorAction}"`) ||
      portalSource.includes(`data-mirror-action="${expected.mirrorAction}"`),
    `portal source must expose mirror action ${expected.mirrorAction}`,
  );
}

const requestTransition = robotContract.fallbackStateMachine?.transitions?.find(
  (transition) =>
    transition.from === "api_unavailable" &&
    transition.to === "robot_requested",
);
assert(
  requestTransition?.sideEffect === false,
  "api_unavailable -> robot_requested must remain no-side-effect",
);

const confirmationTransition =
  robotContract.fallbackStateMachine?.transitions?.find(
    (transition) =>
      transition.from === "robot_requested" &&
      transition.to === "confirmation_received",
  );
assert(
  confirmationTransition?.requiresApproval === true,
  "robot_requested -> confirmation_received must require approval",
);
assert(
  confirmationTransition?.sideEffect === true,
  "robot_requested -> confirmation_received must be marked sideEffect=true",
);

assert(
  robotContract.outputs?.fallbackRequestEvent?.action ===
    "robot_fallback_requested",
  "fallbackRequestEvent action must be robot_fallback_requested",
);
assert(
  robotContract.outputs?.fallbackEvent?.action ===
    "payer_portal_fallback_submitted",
  "fallbackEvent action must be payer_portal_fallback_submitted",
);

assert(
  portalSource.includes("real payer submission"),
  "portal confirmation must keep no-real-payer-submission disclaimer text",
);

if (failures.length > 0) {
  console.error("RPA portal fallback semantic check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  "RPA portal fallback semantic check passed: api_unavailable -> robot_requested -> confirmation_received.",
);

function assert(condition: boolean, message: string) {
  if (!condition) {
    failures.push(message);
  }
}
