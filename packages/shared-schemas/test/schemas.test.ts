import { describe, expect, it } from "vitest";
import { DemoTogglesSchema, TreatmentAccessCaseSchema } from "../src/index";

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
  });

  it("applies deterministic demo toggle defaults", () => {
    expect(DemoTogglesSchema.parse({})).toEqual({
      missing_safety_lab: false,
      payer_api_unavailable: false,
      denial_reason: "step_therapy",
      clinician_rejects_assertion: false,
    });
  });
});
