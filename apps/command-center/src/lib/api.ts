import {
  AuditEventSchema,
  DemoTogglesSchema,
  EvidenceMappingSchema,
  PatientSnapshotSchema,
  PolicyCriterionSchema,
  TreatmentAccessCaseSchema,
  TreatmentOrderSchema,
  type DemoToggles,
} from "@tacc/shared-schemas";
import type { DemoState, RuntimeState } from "./types";

const fallbackNow = "2026-06-28T22:00:00.000Z";

const fallbackCitations = {
  diagnosis: {
    citation_id: "citation-fallback-diagnosis",
    label: "Synthetic progress note",
    source_span: {
      artifact_id: "artifact-progress-note",
      source_uri: "fixture://fallback/progress-note.md",
      section_label: "Assessment",
      excerpt:
        "Fictional source excerpt: symptoms remain moderate-to-severe despite therapy.",
    },
  },
  stepTherapy: {
    citation_id: "citation-fallback-step-therapy",
    label: "Synthetic medication history",
    source_span: {
      artifact_id: "artifact-med-history",
      source_uri: "fixture://fallback/medication-history.json",
      section_label: "Prior therapies",
      excerpt:
        "Fictional source excerpt: inadequate response to mesalamine and steroid taper.",
    },
  },
  safety: {
    citation_id: "citation-fallback-safety-screen",
    label: "Synthetic safety screening",
    source_span: {
      artifact_id: "artifact-safety-labs",
      source_uri: "fixture://fallback/safety-screening.csv",
      section_label: "Screening results",
      excerpt:
        "Fictional source excerpt: TB negative; hepatitis B surface antigen negative.",
    },
  },
};

const fallbackState: DemoState = {
  case: {
    case_id: "case-syn-001",
    external_case_key: "TACC-2026-001",
    patient_id: "patient-syn-001",
    order_id: "order-syn-001",
    payer_id: "payer-northstar",
    service_type: "specialty_medication",
    medication_name: "Fictionalimab",
    urgency: "urgent",
    status: "Local synthetic fallback",
    current_stage: "intake",
    active_secondary_stages: ["api_failure_portal_fallback", "sla_at_risk"],
    sla_due_at: "2026-07-01T17:00:00.000Z",
    sla_state: "at_risk",
    outcome: null,
    payer_status: "unavailable",
    last_event_at: fallbackNow,
    synthetic_data_disclaimer:
      "Synthetic fictional demo data; not a real person or encounter.",
  },
  patient: {
    patient_id: "patient-syn-001",
    age: 34,
    synthetic_name: "Maya Rivers",
    diagnosis_codes: ["K50.90"],
    coverage_plan: "Northstar Premier PPO",
    provider_id: "provider-syn-gi-001",
    preferred_contact_channel: "portal",
    synthetic_data_disclaimer: "Synthetic fictional patient for demo use only.",
  },
  order: {
    order_id: "order-syn-001",
    service_type: "specialty_medication",
    medication_name: "Fictionalimab",
    dose: "160 mg induction, then 80 mg every 8 weeks",
    diagnosis: "Moderate-to-severe inflammatory bowel disease",
    ordering_provider: "Dr. Lena Hart",
    requested_start_date: "2026-07-03",
  },
  criteria: [
    {
      criterion_id: "criterion-diagnosis",
      policy_id: "policy-northstar-biologic-2026",
      description:
        "Confirmed diagnosis of moderate-to-severe inflammatory bowel disease.",
      required_evidence_type: "specialist_note",
      severity: "blocking",
      must_be_clinician_attested: true,
      policy_citation: "Northstar Biologic Policy 2026, Section 2.1",
      source_span: "policy.md#criteria-diagnosis",
      version: "2026.1",
    },
    {
      criterion_id: "criterion-step-therapy",
      policy_id: "policy-northstar-biologic-2026",
      description:
        "Documented inadequate response or intolerance to two preferred therapies.",
      required_evidence_type: "medication_history",
      severity: "blocking",
      must_be_clinician_attested: false,
      policy_citation: "Northstar Biologic Policy 2026, Section 2.4",
      source_span: "policy.md#criteria-step-therapy",
      version: "2026.1",
    },
    {
      criterion_id: "criterion-safety-screen",
      policy_id: "policy-northstar-biologic-2026",
      description:
        "Recent TB and hepatitis screening before biologic initiation.",
      required_evidence_type: "safety_labs",
      severity: "blocking",
      must_be_clinician_attested: false,
      policy_citation: "Northstar Biologic Policy 2026, Section 3.2",
      source_span: "policy.md#criteria-safety",
      version: "2026.1",
    },
  ],
  evidenceMappings: [
    {
      mapping_id: "mapping-diagnosis",
      case_id: "case-syn-001",
      criterion_id: "criterion-diagnosis",
      artifact_id: "artifact-progress-note",
      status: "needs_human_validation",
      evidence_summary:
        "Specialist note supports diagnosis and severity; clinician attestation required.",
      source_quote_short:
        "Fictional source excerpt: symptoms remain moderate-to-severe despite therapy.",
      source_span: "progress-note.md#assessment",
      confidence: 0.87,
      needs_human_review: true,
      human_review_reason:
        "High-impact medical assertion requires clinician validation.",
      reviewer_decision: "pending",
      citations: [fallbackCitations.diagnosis],
    },
    {
      mapping_id: "mapping-step-therapy",
      case_id: "case-syn-001",
      criterion_id: "criterion-step-therapy",
      artifact_id: "artifact-med-history",
      status: "found",
      evidence_summary:
        "Synthetic medication history lists two prior therapies with documented failure dates.",
      source_quote_short:
        "Fictional source excerpt: inadequate response to mesalamine and steroid taper.",
      source_span: "medication-history.json#priorTherapies",
      confidence: 0.94,
      needs_human_review: false,
      reviewer_decision: "pending",
      citations: [fallbackCitations.stepTherapy],
    },
    {
      mapping_id: "mapping-safety-screen",
      case_id: "case-syn-001",
      criterion_id: "criterion-safety-screen",
      artifact_id: "artifact-safety-labs",
      status: "found",
      evidence_summary:
        "Synthetic TB and hepatitis screening are present and recent.",
      source_quote_short:
        "Fictional source excerpt: TB negative; hepatitis B surface antigen negative.",
      source_span: "safety-screening.csv#row-1",
      confidence: 0.91,
      needs_human_review: false,
      reviewer_decision: "pending",
      citations: [fallbackCitations.safety],
    },
  ],
  toggles: {
    missing_safety_lab: false,
    payer_api_unavailable: true,
    denial_reason: "step_therapy",
    clinician_rejects_assertion: false,
    force_low_confidence_extraction: false,
    pharmacy_handoff_failure: false,
  },
  submissions: [],
  appeals: [],
  handoffs: [],
  schedulingTasks: [],
  events: [
    {
      event_id: "event-local-fallback-001",
      case_id: "case-syn-001",
      actor_type: "system",
      actor_name: "Command Center fallback",
      task_or_agent_name: "Local synthetic cache",
      action: "api_unavailable",
      input_summary: "Mock API request failed.",
      output_summary:
        "Showing local synthetic fallback state until the event mirror is reachable.",
      evidence_refs: [],
      timestamp: fallbackNow,
    },
  ],
};

export function getApiBaseUrl() {
  const configured = import.meta.env.VITE_TACC_API_BASE_URL as
    string | undefined;
  return (configured?.trim() || "http://localhost:8787").replace(/\/+$/, "");
}

export async function loadRuntimeState(
  signal?: AbortSignal,
): Promise<RuntimeState> {
  const apiBaseUrl = getApiBaseUrl();
  const fetchedAt = new Date().toISOString();

  try {
    const response = await fetch(`${apiBaseUrl}/demo/state`, {
      headers: { accept: "application/json" },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Mock API returned ${response.status}`);
    }

    const json = (await response.json()) as unknown;
    return {
      data: parseDemoState(json),
      source: "api",
      apiBaseUrl,
      lastFetchedAt: fetchedAt,
      error: null,
    };
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    return {
      data: fallbackState,
      source: "fallback",
      apiBaseUrl,
      lastFetchedAt: fetchedAt,
      error: error instanceof Error ? error.message : "Mock API request failed",
    };
  }
}

export async function updateDemoToggles(
  toggles: Partial<DemoToggles>,
  signal?: AbortSignal,
) {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/demo/toggles`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(toggles),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Toggle update failed with ${response.status}`);
  }

  return response.json() as Promise<{ ok: boolean; toggles: DemoToggles }>;
}

export async function resetDemoState(signal?: AbortSignal) {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/demo/reset`, {
    method: "POST",
    headers: { accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Reset failed with ${response.status}`);
  }

  return response.json() as Promise<{ ok: boolean; eventCount: number }>;
}

function parseDemoState(value: unknown): DemoState {
  const state = value as DemoState;

  return {
    case: state.case ? TreatmentAccessCaseSchema.parse(state.case) : null,
    patient: state.patient ? PatientSnapshotSchema.parse(state.patient) : null,
    order: state.order ? TreatmentOrderSchema.parse(state.order) : null,
    criteria: state.criteria.map((criterion) =>
      PolicyCriterionSchema.parse(criterion),
    ),
    evidenceMappings: state.evidenceMappings.map((mapping) =>
      EvidenceMappingSchema.parse(mapping),
    ),
    toggles: DemoTogglesSchema.parse(state.toggles),
    submissions: Array.isArray(state.submissions) ? state.submissions : [],
    appeals: Array.isArray(state.appeals) ? state.appeals : [],
    handoffs: Array.isArray(state.handoffs) ? state.handoffs : [],
    schedulingTasks: Array.isArray(state.schedulingTasks)
      ? state.schedulingTasks
      : [],
    events: state.events.map((event) => AuditEventSchema.parse(event)),
  };
}
