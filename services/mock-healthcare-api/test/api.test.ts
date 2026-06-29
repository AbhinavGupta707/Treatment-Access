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
