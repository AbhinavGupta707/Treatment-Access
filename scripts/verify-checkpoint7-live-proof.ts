import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type Check = {
  name: string;
  detail?: string;
};

const checks: Check[] = [];

try {
  assertPackageCommand();
  assertValueFirstNarrative();
  assertLiveProofContractEvidence();
  assertSafetyAndEvidenceBoundaries();
  assertSubmissionReadinessPath();

  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[passed] ${check.name}${suffix}`);
  }

  console.log(
    "Checkpoint 7 live proof readiness passed. This static smoke did not run live UiPath, payer, robot, Data Service, Action Center, Maestro, Agent Builder, solution, or IXP side effects.",
  );
} catch (error) {
  for (const check of checks) {
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[passed] ${check.name}${suffix}`);
  }

  console.error(
    `Checkpoint 7 live proof readiness failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exit(1);
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

  checks.push({
    name: "Checkpoint 7 package command",
    detail: "smoke:checkpoint7-live-proof is registered",
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

function assertMatches(name: string, content: string, ...patterns: RegExp[]) {
  const normalizedContent = content.replace(/\s+/g, " ");
  const missing = patterns.find((pattern) => !pattern.test(normalizedContent));
  assert(!missing, `${name} missing ${String(missing)}`);
  checks.push({ name });
}

function readText(path: string) {
  return readFileSync(resolve(path), "utf8");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
