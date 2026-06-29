import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../src/index";

const servers: ReturnType<typeof createServer>[] = [];

function testServer() {
  const server = createServer();
  servers.push(server);
  return server;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe("mock healthcare api", () => {
  it("returns health status", async () => {
    const server = testServer();
    const response = await server.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      service: "mock-healthcare-api",
      syntheticDataOnly: true,
    });
  });

  it("returns synthetic case, patient, order, and evidence state", async () => {
    const server = testServer();
    const response = await server.inject({ method: "GET", url: "/demo/state" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      case: {
        case_id: "case-syn-001",
        patient_id: "patient-syn-001",
        order_id: "order-syn-001",
      },
      patient: {
        synthetic_name: "Synthetic Patient TAC-001",
      },
      order: {
        medication_name: "Fictionalimab",
      },
      syntheticDataOnly: true,
    });
  });

  it("uses demo toggles to remove and restore safety screening evidence", async () => {
    const server = testServer();
    const toggleResponse = await server.inject({
      method: "POST",
      url: "/demo/toggles",
      payload: { missing_safety_lab: true },
    });
    expect(toggleResponse.statusCode).toBe(200);

    const missingResponse = await server.inject({
      method: "GET",
      url: "/cases/case-syn-001/evidence-matrix",
    });
    expect(missingResponse.statusCode).toBe(200);
    const missingMapping = missingResponse
      .json()
      .evidence_mappings.find(
        (mapping: { criterion_id: string }) =>
          mapping.criterion_id === "criterion-safety-screen",
      );
    expect(missingMapping).toMatchObject({
      artifact_id: null,
      status: "missing",
      needs_human_review: true,
    });

    const labResponse = await server.inject({
      method: "POST",
      url: "/patients/patient-syn-001/labs/safety-screening",
      payload: {
        collected_at: "2026-06-29",
        tb_result: "negative",
        hepatitis_b_surface_antigen: "negative",
      },
    });
    expect(labResponse.statusCode).toBe(200);

    const restoredResponse = await server.inject({
      method: "GET",
      url: "/cases/case-syn-001/evidence-matrix",
    });
    const restoredMapping = restoredResponse
      .json()
      .evidence_mappings.find(
        (mapping: { criterion_id: string }) =>
          mapping.criterion_id === "criterion-safety-screen",
      );
    expect(restoredMapping).toMatchObject({
      artifact_id: "artifact-safety-labs",
      status: "found",
    });
  });

  it("ingests actor-tagged case events and lists them by case", async () => {
    const server = testServer();
    const ingestResponse = await server.inject({
      method: "POST",
      url: "/events",
      payload: {
        case_id: "case-syn-001",
        actor_type: "agent",
        actor_name: "Evidence Retrieval Agent",
        task_or_agent_name: "Evidence Retrieval Agent",
        action: "evidence_mapped",
        output_summary: "Mapped synthetic evidence to policy criteria.",
        trace_id: "trace-syn-001",
      },
    });
    expect(ingestResponse.statusCode).toBe(200);
    expect(ingestResponse.json()).toMatchObject({
      event: {
        case_id: "case-syn-001",
        actor_type: "agent",
        actor_name: "Evidence Retrieval Agent",
        action: "evidence_mapped",
      },
    });
    expect(ingestResponse.json().event.timestamp).toEqual(expect.any(String));

    const listResponse = await server.inject({
      method: "GET",
      url: "/cases/case-syn-001/events",
    });
    expect(listResponse.statusCode).toBe(200);
    expect(
      listResponse
        .json()
        .events.some(
          (event: { action: string }) => event.action === "evidence_mapped",
        ),
    ).toBe(true);
  });

  it("returns deterministic payer unavailable responses for fallback", async () => {
    const server = testServer();
    await server.inject({
      method: "POST",
      url: "/demo/toggles",
      payload: { payer_api_unavailable: true },
    });

    const submitResponse = await server.inject({
      method: "POST",
      url: "/payer/prior-auth",
      payload: {
        case_id: "case-syn-001",
        evidence_refs: ["artifact-progress-note"],
      },
    });
    expect(submitResponse.statusCode).toBe(200);
    expect(submitResponse.json()).toMatchObject({
      status: "unavailable",
      error_code: "PAYER_API_DOWN",
      fallback_required: true,
    });

    const statusResponse = await server.inject({
      method: "GET",
      url: `/payer/prior-auth/${submitResponse.json().submission_id}/status`,
    });
    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json()).toMatchObject({
      status: "unavailable",
      fallback_required: true,
    });
  });

  it("allows portal fallback submission when payer api is unavailable", async () => {
    const server = testServer();
    await server.inject({
      method: "POST",
      url: "/demo/toggles",
      payload: { payer_api_unavailable: true },
    });

    const apiResponse = await server.inject({
      method: "POST",
      url: "/payer/prior-auth",
      payload: {
        case_id: "case-syn-001",
        channel: "api",
        evidence_refs: ["artifact-progress-note"],
      },
    });
    expect(apiResponse.statusCode).toBe(200);
    expect(apiResponse.json()).toMatchObject({
      status: "unavailable",
      error_code: "PAYER_API_DOWN",
      fallback_required: true,
    });

    const fallbackResponse = await server.inject({
      method: "POST",
      url: "/payer/prior-auth",
      payload: {
        case_id: "case-syn-001",
        channel: "portal_fallback",
        submitted_by: "UiPath Mock Payer Portal Robot",
        evidence_refs: ["artifact-progress-note", "artifact-med-history"],
      },
    });
    expect(fallbackResponse.statusCode).toBe(200);
    expect(fallbackResponse.json()).toMatchObject({
      status: "submitted",
      channel: "portal_fallback",
      portal_confirmation_id: "AVFH-PORTAL-SYN-002",
      decision_hint: "denial_expected_for_demo",
    });

    const fallbackStatusResponse = await server.inject({
      method: "GET",
      url: `/payer/prior-auth/${fallbackResponse.json().submission_id}/status`,
    });
    expect(fallbackStatusResponse.statusCode).toBe(200);
    expect(fallbackStatusResponse.json()).toMatchObject({
      status: "denied",
      channel: "portal_fallback",
      portal_confirmation_id: "AVFH-PORTAL-SYN-002",
    });

    const eventsResponse = await server.inject({
      method: "GET",
      url: "/cases/case-syn-001/events",
    });
    expect(eventsResponse.statusCode).toBe(200);
    expect(
      eventsResponse
        .json()
        .events.some(
          (event: { actor_type: string; action: string }) =>
            event.actor_type === "robot" &&
            event.action === "payer_portal_fallback_submitted",
        ),
    ).toBe(true);
  });

  it("creates a checkpoint 7 live proof run and mirrors visible stage events", async () => {
    const server = testServer();
    const response = await server.inject({
      method: "POST",
      url: "/live-proof-runs",
      payload: {
        requested_by: "Unit test",
        mode: "deterministic",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      events_written: 7,
      live_proof_run: {
        mode: "deterministic",
        status: "waiting_for_approval",
        no_live_uipath_side_effects: true,
        no_real_payer_submission: true,
      },
    });
    expect(
      response
        .json()
        .live_proof_run.steps.map((step: { stage: string }) => step.stage),
    ).toEqual([
      "case_live_proof_started",
      "policy_checked",
      "evidence_mapped",
      "human_gate_required",
      "submission_packet_ready_or_blocked",
      "payer_api_unavailable_or_not_attempted",
      "live_proof_completed_or_waiting_for_approval",
    ]);
    expect(response.json().live_proof_run.step_runs).toHaveLength(7);

    const eventsResponse = await server.inject({
      method: "GET",
      url: "/cases/case-syn-001/events",
    });
    expect(eventsResponse.statusCode).toBe(200);
    expect(
      eventsResponse
        .json()
        .events.some(
          (event: { action: string }) =>
            event.action === "live_proof_completed_or_waiting_for_approval",
        ),
    ).toBe(true);

    const readResponse = await server.inject({
      method: "GET",
      url: `/live-proof-runs/${response.json().live_proof_run.run_id}`,
    });
    expect(readResponse.statusCode).toBe(200);
    expect(readResponse.json()).toMatchObject({
      live_proof_run: {
        run_id: response.json().live_proof_run.run_id,
      },
    });
  });

  it("validates checkpoint 8 UiPath event state provenance", async () => {
    const server = testServer();
    const uipathWrittenPayload = {
      event_id: "evt-uipath-syn-001",
      case_id: "case-syn-001",
      event_type: "case.h1_proof.created",
      event_action: "uipath_h1_event_written",
      timestamp: "2026-06-29T18:00:00.000Z",
      actor_type: "api_workflow",
      actor_name: "UiPath API Workflow",
      task_or_agent_name: "WriteTreatmentAccessEvent",
      input_summary: "Synthetic H1 event accepted by UiPath.",
      output_summary:
        "Data Service record was written in TreatmentAccessHackathon.",
      provenance: {
        source_system: "uipath_data_service",
        source_actor: "UiPath API Workflow",
        source_verification: "live_uipath_written",
        uipath_folder_name: "TreatmentAccessHackathon",
        uipath_folder_key: "4fba2fa1-012b-469a-b6aa-e5be3811c173",
        uipath_record_id: "ds-record-syn-001",
        uipath_record_type: "TaccAuditEvent",
        confirmation_status: "created",
        confirmation_id: "df-confirmation-syn-001",
        source_labels: ["uipath_data_service", "checkpoint8_h1"],
        safety_labels: ["synthetic_data_only", "clinician_review_required"],
        captured_at: "2026-06-29T18:00:00.000Z",
      },
      payload: {
        policy_citation: "Northstar Biologic Policy 2026, Section 2.4",
      },
    };

    const validateResponse = await server.inject({
      method: "POST",
      url: "/uipath/event-state-records/validate",
      payload: uipathWrittenPayload,
    });
    expect(validateResponse.statusCode).toBe(200);
    expect(validateResponse.json()).toMatchObject({
      verification: "live_uipath_written",
      mirrored_audit_event: {
        action: "uipath_h1_event_written",
        source_provenance: {
          source_system: "uipath_data_service",
          uipath_record_id: "ds-record-syn-001",
        },
      },
    });

    const ingestResponse = await server.inject({
      method: "POST",
      url: "/uipath/event-state-records",
      payload: uipathWrittenPayload,
    });
    expect(ingestResponse.statusCode).toBe(200);
    expect(ingestResponse.json()).toMatchObject({
      event_state_record: {
        event_id: "evt-uipath-syn-001",
        provenance: {
          source_verification: "live_uipath_written",
        },
      },
    });

    const overclaimResponse = await server.inject({
      method: "POST",
      url: "/uipath/event-state-records/validate",
      payload: {
        ...uipathWrittenPayload,
        event_id: "evt-local-overclaim-syn-001",
        provenance: {
          ...uipathWrittenPayload.provenance,
          source_system: "command_center_ui",
          source_actor: "Command Center UI",
          uipath_record_id: undefined,
        },
      },
    });
    expect(overclaimResponse.statusCode).toBe(400);
    expect(overclaimResponse.json()).toMatchObject({
      error: "VALIDATION_ERROR",
      syntheticDataOnly: true,
    });

    const eventsResponse = await server.inject({
      method: "GET",
      url: "/cases/case-syn-001/events",
    });
    expect(
      eventsResponse
        .json()
        .events.some(
          (event: {
            action: string;
            source_provenance?: { source_verification: string };
          }) =>
            event.action === "uipath_h1_event_written" &&
            event.source_provenance?.source_verification ===
              "live_uipath_written",
        ),
    ).toBe(true);
  });

  it("submits prior auth, approves appeal after clinician approval, and creates pharmacy handoff", async () => {
    const server = testServer();
    await server.inject({
      method: "POST",
      url: "/demo/toggles",
      payload: { denial_reason: "medical_necessity" },
    });

    const submitResponse = await server.inject({
      method: "POST",
      url: "/payer/prior-auth",
      payload: {
        case_id: "case-syn-001",
        evidence_refs: ["artifact-progress-note"],
      },
    });
    expect(submitResponse.statusCode).toBe(200);
    expect(submitResponse.json()).toMatchObject({
      status: "submitted",
      decision_hint: "denial_expected_for_demo",
    });

    const statusResponse = await server.inject({
      method: "GET",
      url: `/payer/prior-auth/${submitResponse.json().submission_id}/status`,
    });
    expect(statusResponse.statusCode).toBe(200);
    expect(statusResponse.json()).toMatchObject({
      status: "denied",
      denial_code: "MED_NECESSITY_NOT_ESTABLISHED",
      reason: "medical_necessity",
    });

    const appealResponse = await server.inject({
      method: "POST",
      url: "/payer/appeals",
      payload: {
        case_id: "case-syn-001",
        submission_id: submitResponse.json().submission_id,
        clinician_approved: true,
      },
    });
    expect(appealResponse.statusCode).toBe(200);
    expect(appealResponse.json()).toMatchObject({
      status: "submitted",
      decision_status: "approved",
    });

    const appealStatusResponse = await server.inject({
      method: "GET",
      url: `/payer/appeals/${appealResponse.json().appeal_id}/status`,
    });
    expect(appealStatusResponse.statusCode).toBe(200);
    expect(appealStatusResponse.json()).toMatchObject({
      status: "approved",
      approval_reference: `approval-${appealResponse.json().appeal_id}`,
    });

    const handoffResponse = await server.inject({
      method: "POST",
      url: "/pharmacy/handoffs",
      payload: {
        case_id: "case-syn-001",
        patient_id: "patient-syn-001",
        order_id: "order-syn-001",
        approval_reference: appealStatusResponse.json().approval_reference,
      },
    });
    expect(handoffResponse.statusCode).toBe(200);
    expect(handoffResponse.json()).toMatchObject({
      status: "created",
      assigned_to: "patient-access-coordinator",
    });

    const readHandoffResponse = await server.inject({
      method: "GET",
      url: `/pharmacy/handoffs/${handoffResponse.json().handoff_id}`,
    });
    expect(readHandoffResponse.statusCode).toBe(200);
    expect(readHandoffResponse.json()).toMatchObject({
      handoff: {
        handoff_id: handoffResponse.json().handoff_id,
      },
    });
  });

  it("returns deterministic not found errors", async () => {
    const server = testServer();
    const response = await server.inject({
      method: "GET",
      url: "/patients/not-a-patient",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: "PATIENT_NOT_FOUND",
      syntheticDataOnly: true,
    });
  });
});
