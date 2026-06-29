import { describe, expect, it } from "vitest";
import {
  AgentDisplayNameById,
  AgentIdSchema,
  AgentRuntimeResultSchema,
  AppealPacketAgentOutputSchema,
  AgentTraceSchema,
  AuditEventSchema,
  CoverageRequirementAgentInputSchema,
  DemoFixtureSchema,
  DemoTogglesSchema,
  EvidenceArtifactSchema,
  EvidenceMappingSchema,
  PayerDecisionSchema,
  PharmacyHandoffSchema,
  TreatmentAccessCaseSchema,
} from "../src/index";

describe("shared schemas", () => {
  it("validates the base treatment access case contract", () => {
    const parsed = TreatmentAccessCaseSchema.parse({
      case_id: "case-001",
      patient_id: "patient-001",
      order_id: "order-001",
      payer_id: "payer-001",
      service_type: "specialty_medication",
      medication_name: "Fictionalimab",
      urgency: "urgent",
      status: "Evidence assembly",
      current_stage: "policy_evidence",
      sla_due_at: "2026-07-01T12:00:00.000Z",
      sla_state: "on_track",
      last_event_at: "2026-06-28T22:00:00.000Z",
    });

    expect(parsed.active_secondary_stages).toEqual([]);
    expect(parsed.payer_status).toBe("not_submitted");
  });

  it("applies deterministic demo toggle defaults", () => {
    expect(DemoTogglesSchema.parse({})).toEqual({
      missing_safety_lab: false,
      payer_api_unavailable: false,
      denial_reason: "step_therapy",
      clinician_rejects_assertion: false,
      force_low_confidence_extraction: false,
      pharmacy_handoff_failure: false,
    });
  });

  it("validates source-grounded evidence, events, decisions, traces, and handoffs", () => {
    expect(() =>
      EvidenceArtifactSchema.parse({
        artifact_id: "artifact-001",
        case_id: "case-001",
        type: "progress_note",
        source_uri: "fixture://notes/synthetic.md",
        display_name: "Synthetic note",
        structured_fields: { diagnosis: "fictional diagnosis" },
        extraction_method: "fallback_parser",
        extraction_confidence: 0.82,
        source_hash: "sha256-syn-001",
      }),
    ).not.toThrow();

    expect(() =>
      EvidenceMappingSchema.parse({
        mapping_id: "mapping-001",
        case_id: "case-001",
        criterion_id: "criterion-001",
        artifact_id: "artifact-001",
        status: "needs_human_validation",
        evidence_summary: "Synthetic evidence requires clinician review.",
        source_span: {
          source_uri: "fixture://notes/synthetic.md",
          section_label: "Assessment",
        },
        confidence: 0.82,
        needs_human_review: true,
        human_review_reason: "Clinician must approve assertion.",
      }),
    ).not.toThrow();

    expect(() =>
      AuditEventSchema.parse({
        event_id: "event-001",
        case_id: "case-001",
        actor_type: "agent",
        actor_name: "Coverage Requirement Agent",
        task_or_agent_name: "Policy extraction",
        action: "policy_criteria_extracted",
        input_summary: "Synthetic policy.",
        output_summary: "Criteria extracted.",
        timestamp: "2026-06-28T22:00:00.000Z",
      }),
    ).not.toThrow();

    expect(
      PayerDecisionSchema.parse({
        decision_id: "decision-001",
        case_id: "case-001",
        submission_attempt_id: "attempt-001",
        status: "denied",
        reason: "Synthetic denial reason.",
        appeal_deadline: "2026-07-12",
      }).status,
    ).toBe("denied");

    expect(
      PharmacyHandoffSchema.parse({
        handoff_id: "handoff-001",
        case_id: "case-001",
        status: "pending",
        pharmacy_name: "Demo Specialty Pharmacy",
        assigned_coordinator_role: "patient-access-coordinator",
        benefits_summary: "Synthetic benefits summary.",
        next_step: "Create onboarding task.",
        created_at: "2026-06-28T22:00:00.000Z",
        updated_at: "2026-06-28T22:00:00.000Z",
      }).status,
    ).toBe("pending");

    expect(
      AgentTraceSchema.parse({
        trace_id: "trace-001",
        case_id: "case-001",
        agent_name: "Evidence Retrieval Agent",
        status: "completed",
        input_summary: "Synthetic inputs.",
        output_summary: "Synthetic output.",
        started_at: "2026-06-28T22:00:00.000Z",
      }).tool_calls,
    ).toEqual([]);
  });

  it("validates the aggregate fixture contract shape", () => {
    const parsed = DemoFixtureSchema.partial().parse({
      demoToggles: {},
    });

    expect(parsed.demoToggles?.denial_reason).toBe("step_therapy");
  });

  it("defines seven distinct agent IDs and runtime result contracts", () => {
    const agentIds = AgentIdSchema.options;

    expect(agentIds).toEqual([
      "coverage-requirement",
      "evidence-retrieval",
      "missing-evidence",
      "submission-packet",
      "denial-rescue",
      "appeal-packet",
      "care-continuity",
    ]);
    expect(
      agentIds.map((agentId) => AgentDisplayNameById[agentId]),
    ).toHaveLength(7);

    expect(() =>
      CoverageRequirementAgentInputSchema.parse({
        agent_id: "coverage-requirement",
        case: {
          case_id: "case-001",
          patient_id: "patient-001",
          order_id: "order-001",
          payer_id: "payer-001",
          service_type: "specialty_medication",
          medication_name: "Fictionalimab",
          urgency: "urgent",
          status: "Evidence assembly",
          current_stage: "policy_evidence",
          sla_due_at: "2026-07-01T12:00:00.000Z",
          sla_state: "on_track",
          last_event_at: "2026-06-28T22:00:00.000Z",
        },
        patient: {
          patient_id: "patient-001",
          age: 34,
          synthetic_name: "Synthetic Patient",
          diagnosis_codes: ["K50.90"],
          coverage_plan: "Synthetic plan",
          provider_id: "provider-syn-001",
        },
        order: {
          order_id: "order-001",
          service_type: "specialty_medication",
          medication_name: "Fictionalimab",
          dose: "demo dose",
          diagnosis: "Synthetic diagnosis",
          ordering_provider: "Demo Clinician",
          requested_start_date: "2026-07-03",
        },
        demo_toggles: {},
        payer_policy: {
          policy_id: "policy-001",
          payer_id: "payer-001",
          payer_name: "Synthetic payer",
          policy_name: "Synthetic policy",
          version: "1",
          effective_date: "2026-01-01",
          source_uri: "fixture://policy.md",
          summary: "Synthetic policy summary.",
          submission_channels: ["payer_api"],
        },
        criteria: [],
      }),
    ).not.toThrow();

    const appealOutput = AppealPacketAgentOutputSchema.parse({
      agent_id: "appeal-packet",
      appeal_packet: {
        appeal_id: "appeal-001",
        case_id: "case-001",
        denial_reason: "Synthetic denial reason.",
        appeal_strategy: "Administrative draft strategy.",
        evidence_used: [],
        draft_text:
          "Administrative draft for clinician review; not medical or legal advice.",
        clinician_approved: false,
        version: "1",
      },
      administrative_draft_only: true,
      clinician_review_required: true,
      unsupported_claim_warnings: ["Clinician approval is required."],
    });
    expect(appealOutput.administrative_draft_only).toBe(true);

    expect(() =>
      AgentRuntimeResultSchema.parse({
        agent_id: "appeal-packet",
        trace: {
          trace_id: "trace-appeal-001",
          case_id: "case-001",
          agent_name: "Appeal Packet Agent",
          status: "needs_human",
          input_summary: "Synthetic denial.",
          output_summary: "Administrative appeal draft prepared.",
          started_at: "2026-06-28T22:00:00.000Z",
        },
        audit_event: {
          event_id: "event-appeal-001",
          case_id: "case-001",
          actor_type: "agent",
          actor_name: "Appeal Packet Agent",
          task_or_agent_name: "Appeal Packet Agent",
          action: "appeal_packet_drafted",
          input_summary: "Synthetic denial.",
          output_summary: "Administrative appeal draft prepared.",
          trace_id: "trace-appeal-001",
          timestamp: "2026-06-28T22:00:00.000Z",
        },
        output: appealOutput,
      }),
    ).not.toThrow();
  });
});
