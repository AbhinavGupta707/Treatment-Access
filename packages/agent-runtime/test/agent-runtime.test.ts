import { describe, expect, it } from "vitest";
import {
  AgentRuntimeSummarySchema,
  AppealPacketAgentOutputSchema,
  DenialRescueAgentOutputSchema,
  EvidenceRetrievalAgentOutputSchema,
  MissingEvidenceAgentOutputSchema,
  SubmissionPacketAgentOutputSchema,
} from "@tacc/shared-schemas";
import {
  listTreatmentAccessAgents,
  runTreatmentAccessAgent,
  runTreatmentAccessAgents,
} from "../src/index";

describe("agent runtime", () => {
  it("runs all seven treatment access agents with deterministic envelopes", () => {
    const summary = runTreatmentAccessAgents();

    expect(AgentRuntimeSummarySchema.parse(summary).results).toHaveLength(7);
    expect(summary.results.map((result) => result.agent_id)).toEqual(
      listTreatmentAccessAgents(),
    );
    expect(
      summary.results.every(
        (result) =>
          result.trace.trace_id === `trace-runtime-${result.agent_id}` &&
          result.audit_event.trace_id === result.trace.trace_id,
      ),
    ).toBe(true);
    expect(summary.synthetic_data_disclaimer).toContain(
      "no live UiPath execution",
    );
  });

  it("blocks submission when the safety lab is missing", () => {
    const summary = runTreatmentAccessAgents({
      toggles: { missing_safety_lab: true },
    });
    const missing = MissingEvidenceAgentOutputSchema.parse(
      summary.results.find((result) => result.agent_id === "missing-evidence")
        ?.output,
    );
    const submission = SubmissionPacketAgentOutputSchema.parse(
      summary.results.find((result) => result.agent_id === "submission-packet")
        ?.output,
    );

    expect(missing.can_submit).toBe(false);
    expect(missing.missing_blocking_criteria[0]?.criterion_id).toBe(
      "criterion-safety-screen",
    );
    expect(submission.ready_to_submit).toBe(false);
    expect(
      submission.safety_flags.some(
        (flag) => flag.code === "MISSING_SAFETY_LAB",
      ),
    ).toBe(true);
  });

  it("changes denial rescue strategy by denial reason", () => {
    const stepTherapy = DenialRescueAgentOutputSchema.parse(
      runTreatmentAccessAgent("denial-rescue", {
        toggles: { denial_reason: "step_therapy" },
      }).output,
    );
    const safetyScreen = DenialRescueAgentOutputSchema.parse(
      runTreatmentAccessAgent("denial-rescue", {
        toggles: { denial_reason: "safety_screen" },
      }).output,
    );
    const medicalNecessity = DenialRescueAgentOutputSchema.parse(
      runTreatmentAccessAgent("denial-rescue", {
        toggles: { denial_reason: "medical_necessity" },
      }).output,
    );

    expect(stepTherapy.appeal_strategy).toContain("medication history");
    expect(safetyScreen.appeal_strategy).toContain("TB and hepatitis");
    expect(medicalNecessity.appeal_strategy).toContain(
      "clinician attestation",
    );
    expect(
      new Set([
        stepTherapy.denial_reason_category,
        safetyScreen.denial_reason_category,
        medicalNecessity.denial_reason_category,
      ]).size,
    ).toBe(3);
  });

  it("keeps appeal text administrative and flags unsupported clinical claims", () => {
    const appeal = AppealPacketAgentOutputSchema.parse(
      runTreatmentAccessAgent("appeal-packet", {
        toggles: { clinician_rejects_assertion: true },
      }).output,
    );

    expect(appeal.administrative_draft_only).toBe(true);
    expect(appeal.appeal_packet.draft_text).toContain(
      "Administrative draft for clinician review",
    );
    expect(appeal.appeal_packet.draft_text).toContain(
      "not medical or legal advice",
    );
    expect(appeal.unsupported_claim_warnings.join(" ")).toContain(
      "Clinician rejected",
    );
    expect(
      appeal.safety_flags.some(
        (flag) => flag.code === "UNSUPPORTED_CLINICAL_ASSERTION",
      ),
    ).toBe(true);
  });

  it("requires evidence, policy citation, or human approval for clinical assertions", () => {
    const evidence = EvidenceRetrievalAgentOutputSchema.parse(
      runTreatmentAccessAgent("evidence-retrieval").output,
    );
    const diagnosisAssertion = evidence.clinical_assertions.find(
      (assertion) => assertion.assertion_id === "assertion-diagnosis-severity",
    );

    expect(diagnosisAssertion?.evidence_refs).toContain(
      "artifact-progress-note",
    );
    expect(diagnosisAssertion?.policy_citations).toContain(
      "Policy Section 2.1",
    );
    expect(diagnosisAssertion?.human_approval_required).toBe(true);
  });
});
