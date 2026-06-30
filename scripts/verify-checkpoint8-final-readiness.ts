import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { runTreatmentAccessLiveProof } from "@tacc/agent-runtime";
import { LiveProofRunSchema } from "@tacc/shared-schemas";

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
  assert(existsSync(resolve(path)), `${path} is missing`);
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
  const script = packageJson.scripts?.["smoke:checkpoint8-live-uipath"];

  assert(
    script?.includes("scripts/verify-checkpoint8-final-readiness.ts"),
    "package.json must register smoke:checkpoint8-live-uipath",
  );
  assert(
    script.includes("build:contracts"),
    "smoke:checkpoint8-live-uipath must compile contracts first",
  );

  checks.push({
    name: "Checkpoint 8 package command",
    detail: "registered no-side-effect final readiness smoke",
  });
}

function assertFinalUxManifest() {
  const ui = [
    readText("apps/command-center/src/main.tsx"),
    readText("apps/command-center/src/lib/api.ts"),
    readText("apps/command-center/src/lib/types.ts"),
  ].join("\n");

  assertMatches(
    "Command Center proof manifest",
    ui,
    /UiPath (?:Evidence Manifest|Governance Records)/i,
    /TreatmentAccessHackathon/i,
    /7986316/i,
    /4fba2fa1-012b-469a-b6aa-e5be3811c173/i,
    /Action Center task ID/i,
    /Orchestrator job ID/i,
    /Portal confirmation ID|Confirmation ID/i,
    /Safety status/i,
    /Verified final UiPath proof records|Live UiPath evidence recorded|Live UiPath proof recorded/i,
  );

  assertMatches(
    "value-first dashboard copy",
    ui,
    /Maestro case orchestration/i,
    /policy review/i,
    /evidence matching/i,
    /human signoff/i,
    /appeal readiness/i,
    /UiPath keeps the governed record/i,
  );
}

function assertDocsSeparateProofTypes() {
  const docs = [
    readText("README.md"),
    readText("docs/demo-script.md"),
    readText("docs/submission.md"),
    readText("docs/testing.md"),
    readText("uipath/screenshots/manifest.md"),
  ].join("\n");

  assertMatches(
    "proof type separation",
    docs,
    /Local Synthetic Proof/i,
    /live provider proof/i,
    /Live UiPath Proof/i,
    /ready for live UiPath proof|live proof recorded/i,
    /no live .*claimed|not claimed|not claiming|not created|not completed/i,
  );

  assertMatches(
    "healthcare value and safety claims",
    docs,
    /time saved|less manual chart review/i,
    /fewer preventable denials/i,
    /faster (?:appeal readiness|PA submission|prior authorization)/i,
    /safer human gates|auditable human gates/i,
    /source evidence/i,
    /policy citation/i,
    /human approval|clinician review/i,
    /synthetic data/i,
    /not autonomous medical or legal advice/i,
  );

  assertMatches(
    "live UiPath identifiers documented",
    docs,
    /TreatmentAccessHackathon/i,
    /7986316/i,
    /4fba2fa1-012b-469a-b6aa-e5be3811c173/i,
    /record ID|event\/record ID|event record/i,
    /task ID/i,
    /job ID/i,
    /confirmation ID/i,
    /timestamp/i,
    /safety status/i,
  );
}

async function assertDeterministicRunHasFinalEvidence() {
  const run = LiveProofRunSchema.parse(
    await runTreatmentAccessLiveProof({
      requestedBy: "Checkpoint 8 final readiness smoke",
      mode: "deterministic",
      runId: "checkpoint8-final-readiness-smoke",
    }),
  );

  assert(
    run.uipath_evidence_refs.some(
      (ref) =>
        ref.source === "uipath_event_mirror" && ref.external_id === run.run_id,
    ),
    "Runtime proof must expose a UiPath/event record ID reference",
  );
  assert(
    run.approval_gates.some((gate) => gate.status === "pending"),
    "Runtime proof must keep a pending live side-effect approval gate",
  );
  assert(
    run.source_labels.some((label) =>
      /No live UiPath side effects/i.test(label),
    ),
    "Runtime proof must label local proof as no live UiPath side effects",
  );
  assert(
    run.no_live_uipath_side_effects && run.no_real_payer_submission,
    "Checkpoint 8 smoke must not perform live UiPath side effects or payer submission",
  );

  checks.push({
    name: "Deterministic final proof evidence",
    detail: `${run.run_id} exposes event refs, source labels, and approval gates`,
  });
}

try {
  assertPackageCommand();
  assertFinalUxManifest();
  assertDocsSeparateProofTypes();
  await assertDeterministicRunHasFinalEvidence();

  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[passed] ${check.name}${suffix}`);
  }
  console.log(
    "Checkpoint 8 final readiness passed. This smoke is no-side-effect and did not create live UiPath tasks, records, jobs, deployments, or payer submissions.",
  );
} catch (error) {
  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[passed] ${check.name}${suffix}`);
  }
  console.error(
    `Checkpoint 8 final readiness failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
}
