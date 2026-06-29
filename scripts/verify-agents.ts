import {
  AgentRuntimeSummarySchema,
  AppealPacketAgentOutputSchema,
  DenialRescueAgentOutputSchema,
  EvidenceRetrievalAgentOutputSchema,
  MissingEvidenceAgentOutputSchema,
  SubmissionPacketAgentOutputSchema,
} from "@tacc/shared-schemas";
import { runTreatmentAccessAgents } from "@tacc/agent-runtime";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const baseline = AgentRuntimeSummarySchema.parse(runTreatmentAccessAgents());
assert(baseline.results.length === 7, "Expected seven agent runtime results.");
assert(
  baseline.results.every(
    (result) =>
      result.trace.trace_id === result.audit_event.trace_id &&
      result.audit_event.actor_type === "agent",
  ),
  "Each agent result must include linked trace and audit event payloads.",
);

const missingSafety = AgentRuntimeSummarySchema.parse(
  runTreatmentAccessAgents({ toggles: { missing_safety_lab: true } }),
);
const missingSafetyOutput = MissingEvidenceAgentOutputSchema.parse(
  missingSafety.results.find((result) => result.agent_id === "missing-evidence")
    ?.output,
);
const blockedSubmission = SubmissionPacketAgentOutputSchema.parse(
  missingSafety.results.find(
    (result) => result.agent_id === "submission-packet",
  )?.output,
);
assert(
  missingSafetyOutput.can_submit === false &&
    blockedSubmission.ready_to_submit === false,
  "Missing safety lab should block submission.",
);
assert(
  blockedSubmission.safety_flags.some(
    (flag) => flag.code === "MISSING_SAFETY_LAB",
  ),
  "Missing safety lab should emit a blocking safety flag.",
);

const stepTherapy = DenialRescueAgentOutputSchema.parse(
  runTreatmentAccessAgents({
    toggles: { denial_reason: "step_therapy" },
  }).results.find((result) => result.agent_id === "denial-rescue")?.output,
);
const safetyScreen = DenialRescueAgentOutputSchema.parse(
  runTreatmentAccessAgents({
    toggles: { denial_reason: "safety_screen" },
  }).results.find((result) => result.agent_id === "denial-rescue")?.output,
);
assert(
  stepTherapy.appeal_strategy !== safetyScreen.appeal_strategy,
  "Denial reason should change appeal strategy.",
);

const rejectedAppeal = AppealPacketAgentOutputSchema.parse(
  runTreatmentAccessAgents({
    toggles: { clinician_rejects_assertion: true },
  }).results.find((result) => result.agent_id === "appeal-packet")?.output,
);
assert(
  rejectedAppeal.administrative_draft_only &&
    rejectedAppeal.clinician_review_required,
  "Appeal output must stay an administrative draft requiring clinician review.",
);
assert(
  rejectedAppeal.unsupported_claim_warnings.some((warning) =>
    warning.includes("Clinician rejected"),
  ),
  "Rejected clinical assertion should produce an unsupported-claim warning.",
);

const evidenceOutput = EvidenceRetrievalAgentOutputSchema.parse(
  baseline.results.find((result) => result.agent_id === "evidence-retrieval")
    ?.output,
);
const unapprovedClinicalAssertion = evidenceOutput.clinical_assertions.find(
  (assertion) => assertion.status === "needs_human_approval",
);
assert(
  Boolean(
    unapprovedClinicalAssertion?.evidence_refs.length &&
    unapprovedClinicalAssertion.policy_citations.length &&
    unapprovedClinicalAssertion.human_approval_required,
  ),
  "Clinical assertions must carry evidence refs, policy citations, or human approval routing.",
);

console.log("Agent runtime smoke passed.");
console.log(
  JSON.stringify(
    {
      case_id: baseline.case_id,
      agents: baseline.results.map((result) => result.agent_id),
      safety_flag_codes: baseline.safety_flags.map((flag) => flag.code),
      synthetic_data_disclaimer: baseline.synthetic_data_disclaimer,
    },
    null,
    2,
  ),
);
