import { describe, expect, it } from "vitest";
import { treatmentAccessDemoFixture } from "@tacc/demo-data";
import {
  AgentRuntimeSummarySchema,
  AppealPacketAgentOutputSchema,
  DenialRescueAgentOutputSchema,
  EvidenceRetrievalAgentOutputSchema,
  LiveProofRunSchema,
  MissingEvidenceAgentOutputSchema,
  type DemoFixture,
  SubmissionPacketAgentOutputSchema,
} from "@tacc/shared-schemas";
import {
  createFireworksClient,
  createLangSmithTraceConfig,
  getTreatmentAccessGraphDefinition,
  listTreatmentAccessAgents,
  resolveAgentRuntimeConfig,
  runTreatmentAccessGraph,
  runTreatmentAccessAgent,
  runTreatmentAccessAgents,
  runTreatmentAccessLiveProof,
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
    expect(medicalNecessity.appeal_strategy).toContain("clinician attestation");
    expect(medicalNecessity.denial_reason_category).toBe("documentation_gap");
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

  it("defaults to deterministic runtime config without requiring live keys", () => {
    const validation = resolveAgentRuntimeConfig({});

    expect(validation.ok).toBe(true);
    expect(validation.config.mode).toBe("deterministic");
    expect(validation.safeEnvSummary.FIREWORKS_API_KEY).toBe("missing");
    expect(validation.safeEnvSummary.LANGSMITH_API_KEY).toBe("missing");
  });

  it("validates live runtime config without exposing secret values", () => {
    const validation = resolveAgentRuntimeConfig({
      AGENT_MODE: "live",
      AGENT_ORCHESTRATOR: "uipath",
      FIREWORKS_API_KEY: "dummy-fw-key",
      LANGSMITH_TRACING: "true",
      LANGSMITH_API_KEY: "dummy-ls-key",
      LANGSMITH_PROJECT: "Treatment Access Command Center",
    });

    expect(validation.ok).toBe(true);
    expect(validation.config.mode).toBe("live");
    expect(validation.config.orchestrator).toBe("uipath");
    expect(validation.safeEnvSummary.FIREWORKS_API_KEY).toBe("set");
    expect(JSON.stringify(validation.safeEnvSummary)).not.toContain(
      "dummy-fw-key",
    );
    expect(JSON.stringify(validation.safeEnvSummary)).not.toContain(
      "dummy-ls-key",
    );
  });

  it("fails live runtime config clearly when required keys are missing", () => {
    const validation = resolveAgentRuntimeConfig({
      AGENT_MODE: "live",
      LANGSMITH_TRACING: "true",
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toContain(
      "FIREWORKS_API_KEY is required when AGENT_MODE=live.",
    );
    expect(validation.errors).toContain(
      "LANGSMITH_API_KEY is required when LANGSMITH_TRACING=true.",
    );
  });

  it("supports provider readiness checks without making a model call", async () => {
    const validation = resolveAgentRuntimeConfig({
      AGENT_MODE: "live",
      FIREWORKS_API_KEY: "dummy-fw-key",
      FIREWORKS_FAST_MODEL: "accounts/fireworks/models/deepseek-v3p1",
      LANGSMITH_TRACING: "false",
    });
    const client = createFireworksClient(validation.config);
    const readiness = await client.checkConnectivity({ callModel: false });
    const traceConfig = createLangSmithTraceConfig(validation.config, {
      case_id: "case-synthetic",
      run_id: "run-synthetic",
    });

    expect(readiness.status).toBe("configured");
    expect(readiness.message).toContain("Model call skipped");
    expect(traceConfig.enabled).toBe(false);
    expect(traceConfig.metadata.synthetic).toBe(true);
    expect(traceConfig.metadata.case_id).toBe("case-synthetic");
  });

  it("exposes the LangGraph workflow definition with governed branch edges", () => {
    const graph = getTreatmentAccessGraphDefinition();

    expect(graph.runtime).toBe("langgraph");
    expect(graph.dependency).toBe("@langchain/langgraph");
    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        "coverage-requirement",
        "evidence-retrieval",
        "missing-evidence",
        "submission-packet",
        "denial-rescue",
        "appeal-packet",
        "care-continuity",
        "audit-packet",
      ]),
    );
    expect(graph.edges.map((edge) => edge.branch).filter(Boolean)).toEqual(
      expect.arrayContaining([
        "missing_evidence_to_human_gate",
        "clinician_rejection_to_rework",
        "payer_api_unavailable_to_robot_fallback",
        "denial_to_appeal",
        "approval_to_care_handoff",
      ]),
    );
  });

  it("runs the deterministic graph through denial rescue and appeal signoff", async () => {
    const run = await runTreatmentAccessGraph({ mode: "deterministic" });

    expect(AgentRuntimeSummarySchema.parse(run.summary).results.length).toBe(6);
    expect(run.status).toBe("waiting_human");
    expect(run.branches_taken).toEqual(
      expect.arrayContaining([
        "complete_evidence_to_submission",
        "denial_to_appeal",
      ]),
    );
    expect(run.human_gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate_type: "clinical_assertion",
          status: "approved",
        }),
        expect.objectContaining({
          gate_type: "appeal_signoff",
          status: "pending",
        }),
      ]),
    );
    expect(
      run.steps.every((step) => step.validated && step.trace_metadata),
    ).toBe(true);
    expect(run.no_live_uipath_side_effects).toBe(true);
    expect(run.no_real_payer_submission).toBe(true);
  });

  it("routes missing evidence to a human gate before submission", async () => {
    const run = await runTreatmentAccessGraph({
      mode: "deterministic",
      toggles: { missing_safety_lab: true },
    });

    expect(run.status).toBe("waiting_human");
    expect(run.branches_taken).toContain("missing_evidence_to_human_gate");
    expect(run.steps.map((step) => step.node_id)).not.toContain(
      "submission-packet",
    );
    expect(run.human_gates).toContainEqual(
      expect.objectContaining({
        gate_type: "missing_evidence",
        status: "pending",
      }),
    );
  });

  it("routes clinician rejection to rework and blocks unsupported claims", async () => {
    const run = await runTreatmentAccessGraph({
      mode: "deterministic",
      toggles: { clinician_rejects_assertion: true },
    });
    const submission = SubmissionPacketAgentOutputSchema.parse(
      run.steps.find((step) => step.node_id === "submission-packet")
        ?.agent_result?.output,
    );

    expect(run.status).toBe("blocked");
    expect(run.branches_taken).toContain("clinician_rejection_to_rework");
    expect(submission.ready_to_submit).toBe(false);
    expect(
      submission.safety_flags.some(
        (flag) => flag.code === "UNSUPPORTED_CLINICAL_ASSERTION",
      ),
    ).toBe(true);
  });

  it("requests robot fallback without starting a live UiPath job when payer API is unavailable", async () => {
    const run = await runTreatmentAccessGraph({
      mode: "deterministic",
      toggles: { payer_api_unavailable: true },
    });

    expect(run.status).toBe("robot_fallback_requested");
    expect(run.branches_taken).toContain(
      "payer_api_unavailable_to_robot_fallback",
    );
    expect(run.submission_attempts[0]).toEqual(
      expect.objectContaining({
        status: "fallback_required",
        error_code: "PAYER_API_DOWN",
      }),
    );
    expect(run.robot_fallback_requests[0]).toEqual(
      expect.objectContaining({
        orchestrator_folder: "TreatmentAccessHackathon",
        no_live_job_started: true,
      }),
    );
  });

  it("routes approvals to care continuity handoff", async () => {
    const approvedFixture = structuredClone(
      treatmentAccessDemoFixture,
    ) as DemoFixture;
    approvedFixture.case.payer_status = "approved";
    const run = await runTreatmentAccessGraph({
      mode: "deterministic",
      fixture: approvedFixture,
    });

    expect(run.status).toBe("completed");
    expect(run.branches_taken).toContain("approval_to_care_handoff");
    expect(run.steps.map((step) => step.node_id)).toContain("care-continuity");
  });

  it("uses the live provider adapter interface when supplied and keeps outputs validated", async () => {
    const calls: string[] = [];
    const run = await runTreatmentAccessGraph({
      mode: "live",
      provider: {
        provider_name: "fireworks",
        async invokeAgentNode(input) {
          calls.push(`${input.agent_id}:${input.output_schema}`);
          expect(input.trace_metadata.metadata.run_mode).toBe("live");
          expect(input.trace_metadata.metadata.synthetic).toBe(true);
          return input.deterministic_output;
        },
      },
    });

    expect(calls).toEqual(
      expect.arrayContaining([
        "coverage-requirement:CoverageRequirementAgentOutputSchema",
        "submission-packet:SubmissionPacketAgentOutputSchema",
      ]),
    );
    expect(run.mode).toBe("live");
    expect(run.steps.every((step) => step.validated)).toBe(true);
  });

  it("creates a Checkpoint 7 live proof run with seven validated agent outputs and mirror stages", async () => {
    const run = LiveProofRunSchema.parse(
      await runTreatmentAccessLiveProof({
        mode: "deterministic",
        runId: "live-proof-unit-test",
      }),
    );

    expect(run.steps.map((step) => step.stage)).toEqual([
      "case_live_proof_started",
      "policy_checked",
      "evidence_mapped",
      "human_gate_required",
      "submission_packet_ready_or_blocked",
      "payer_api_unavailable_or_not_attempted",
      "live_proof_completed_or_waiting_for_approval",
    ]);
    expect(run.step_runs.map((step) => step.agent_id)).toEqual(
      listTreatmentAccessAgents(),
    );
    expect(run.mirror_events.map((event) => event.action)).toEqual(
      run.steps.map((step) => step.stage),
    );
    expect(run.submission_attempts[0]).toEqual(
      expect.objectContaining({
        status: "fallback_required",
        error_code: "PAYER_API_DOWN",
      }),
    );
    expect(run.approval_gates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gate_type: "exception_review",
          status: "pending",
        }),
      ]),
    );
    expect(run.no_live_uipath_side_effects).toBe(true);
    expect(run.no_real_payer_submission).toBe(true);
  });
});
