import { describe, expect, it } from "vitest";
import {
  AgentDisplayNameById,
  AgentIdSchema,
  AgentRunSchema,
  AgentRuntimeResultSchema,
  AppealPacketAgentOutputSchema,
  AgentTraceSchema,
  AgentStepRunSchema,
  AuditEventSchema,
  CaseRunSnapshotSchema,
  CoverageRequirementAgentInputSchema,
  DemoFixtureSchema,
  DemoTogglesSchema,
  EvidenceArtifactSchema,
  EvidenceMappingSchema,
  HumanGateSchema,
  LiveProofApprovalGateSchema,
  LiveProofRunSchema,
  LiveProofStepSchema,
  LiveProofTraceSchema,
  PayerDecisionSchema,
  PharmacyHandoffSchema,
  RobotJobSchema,
  ToolCallSchema,
  TraceLinkSchema,
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

  it("validates live runtime records for case run snapshots", () => {
    const traceLink = TraceLinkSchema.parse({
      trace_id: "trace-live-001",
      run_id: "run-live-001",
      provider: "langsmith",
      project_name: "Treatment Access Command Center",
      url: "https://smith.langchain.com/public/synthetic/r",
      metadata: {
        case_id: "case-001",
        run_mode: "live",
        synthetic: true,
      },
    });
    const agentRun = AgentRunSchema.parse({
      run_id: "run-live-001",
      case_id: "case-001",
      maestro_case_id: "maestro-syn-001",
      mode: "live",
      orchestrator: "uipath",
      status: "running",
      started_at: "2026-06-28T22:00:00.000Z",
      current_stage: "policy_evidence",
      trace_link: traceLink,
    });
    const stepRun = AgentStepRunSchema.parse({
      step_run_id: "step-live-coverage",
      run_id: agentRun.run_id,
      case_id: agentRun.case_id,
      agent_id: "coverage-requirement",
      agent_name: "Coverage Requirement Agent",
      status: "completed",
      input_summary: "Synthetic order and policy.",
      output_summary: "Criteria resolved.",
      started_at: "2026-06-28T22:00:00.000Z",
      completed_at: "2026-06-28T22:00:01.000Z",
      latency_ms: 1000,
      trace_link: traceLink,
    });
    const toolCall = ToolCallSchema.parse({
      tool_call_id: "tool-live-policy",
      run_id: agentRun.run_id,
      step_run_id: stepRun.step_run_id,
      case_id: agentRun.case_id,
      tool_name: "retrieve_payer_policy",
      arguments_hash: "sha256-syn-policy",
      arguments_summary: "Synthetic payer policy lookup.",
      result_summary: "Policy criteria returned.",
      status: "succeeded",
      started_at: "2026-06-28T22:00:00.000Z",
      completed_at: "2026-06-28T22:00:01.000Z",
      trace_link: traceLink,
    });
    const humanGate = HumanGateSchema.parse({
      gate_id: "gate-appeal-signoff",
      case_id: agentRun.case_id,
      run_id: agentRun.run_id,
      gate_type: "appeal_signoff",
      status: "pending",
      assigned_role: "clinician-reviewer",
      prompt_summary: "Review synthetic administrative appeal draft.",
    });
    const robotJob = RobotJobSchema.parse({
      robot_job_id: "robot-portal-fallback",
      case_id: agentRun.case_id,
      run_id: agentRun.run_id,
      process_name: "PayerPortalFallback",
      status: "not_requested",
      trigger_reason: "Synthetic payer API unavailable.",
    });

    const snapshot = CaseRunSnapshotSchema.parse({
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
      agent_run: agentRun,
      step_runs: [stepRun],
      tool_calls: [toolCall],
      human_gates: [humanGate],
      robot_jobs: [robotJob],
      trace_links: [traceLink],
      updated_at: "2026-06-28T22:00:01.000Z",
    });

    expect(snapshot.agent_run.mode).toBe("live");
    expect(snapshot.tool_calls[0]?.synthetic).toBe(true);
    expect(snapshot.human_gates[0]?.decision).toBe("pending");
    expect(snapshot.robot_jobs[0]?.synthetic).toBe(true);
  });

  it("validates Checkpoint 7 live proof run contracts", () => {
    const trace = LiveProofTraceSchema.parse({
      trace_id: "trace-live-proof-001",
      provider: "langsmith",
      status: "metadata_only",
      project_name: "Treatment Access Command Center",
      metadata: {
        case_id: "case-001",
        synthetic: true,
      },
      captured_at: "2026-06-29T12:00:00.000Z",
    });
    const proofStep = LiveProofStepSchema.parse({
      step_id: "step-live-proof-policy",
      run_id: "live-proof-001",
      case_id: "case-001",
      stage: "policy_checked",
      status: "completed",
      title: "Policy checked",
      summary: "Synthetic policy criteria were checked.",
      actor_type: "agent",
      actor_name: "Coverage Requirement Agent",
      started_at: "2026-06-29T12:00:00.000Z",
      completed_at: "2026-06-29T12:00:01.000Z",
      trace,
      uipath_evidence_refs: [
        {
          evidence_ref_id: "proof-event-mirror",
          source: "uipath_event_mirror",
          label: "Synthetic mirror event",
          captured_at: "2026-06-29T12:00:01.000Z",
        },
      ],
    });
    const approvalGate = LiveProofApprovalGateSchema.parse({
      gate_id: "gate-live-proof-clinical",
      gate_type: "clinical_assertion",
      status: "pending",
      assigned_role: "Demo GI Clinician",
      reason: "Clinician approval required.",
      source_stage: "human_gate_required",
      trace,
    });
    const liveProof = LiveProofRunSchema.parse({
      run_id: "live-proof-001",
      case_id: "case-001",
      requested_by: "Command Center",
      mode: "live",
      status: "waiting_for_approval",
      current_stage: "live_proof_completed_or_waiting_for_approval",
      started_at: "2026-06-29T12:00:00.000Z",
      completed_at: "2026-06-29T12:00:01.000Z",
      steps: [proofStep],
      approval_gates: [approvalGate],
      traces: [trace],
      agent_run: {
        run_id: "live-proof-001",
        case_id: "case-001",
        mode: "live",
        orchestrator: "uipath",
        status: "needs_human",
        started_at: "2026-06-29T12:00:00.000Z",
      },
    });

    expect(liveProof.steps[0]?.stage).toBe("policy_checked");
    expect(liveProof.approval_gates[0]?.status).toBe("pending");
    expect(liveProof.no_live_uipath_side_effects).toBe(true);
    expect(liveProof.no_real_payer_submission).toBe(true);
  });
});
