import type {
  AuditEvent,
  DemoToggles,
  EvidenceMapping,
  PatientSnapshot,
  PolicyCriterion,
  TreatmentAccessCase,
  TreatmentOrder,
} from "@tacc/shared-schemas";

const now = "2026-06-28T22:00:00.000Z";

export const seedPatient: PatientSnapshot = {
  patient_id: "patient-syn-001",
  age: 34,
  synthetic_name: "Maya Rivers",
  diagnosis_codes: ["K50.90"],
  coverage_plan: "Northstar Premier PPO",
  provider_id: "provider-syn-gi-001",
};

export const seedOrder: TreatmentOrder = {
  order_id: "order-syn-001",
  service_type: "specialty_medication",
  medication_name: "Fictionalimab",
  dose: "160 mg induction, then 80 mg every 8 weeks",
  diagnosis: "Moderate-to-severe inflammatory bowel disease",
  ordering_provider: "Dr. Lena Hart",
  requested_start_date: "2026-07-03",
};

export const seedCase: TreatmentAccessCase = {
  case_id: "case-syn-001",
  external_case_key: "TACC-2026-001",
  patient_id: seedPatient.patient_id,
  order_id: seedOrder.order_id,
  payer_id: "payer-northstar",
  service_type: seedOrder.service_type,
  medication_name: seedOrder.medication_name,
  urgency: "urgent",
  status: "Ready for UiPath intake",
  current_stage: "intake",
  active_secondary_stages: [],
  sla_due_at: "2026-07-01T17:00:00.000Z",
  sla_state: "on_track",
  outcome: null,
  last_event_at: now,
};

export const seedCriteria: PolicyCriterion[] = [
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
];

export const seedEvidenceMappings: EvidenceMapping[] = [
  {
    mapping_id: "mapping-diagnosis",
    case_id: seedCase.case_id,
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
  },
  {
    mapping_id: "mapping-step-therapy",
    case_id: seedCase.case_id,
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
  },
  {
    mapping_id: "mapping-safety-screen",
    case_id: seedCase.case_id,
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
  },
];

export const defaultDemoToggles: DemoToggles = {
  missing_safety_lab: false,
  payer_api_unavailable: false,
  denial_reason: "step_therapy",
  clinician_rejects_assertion: false,
};

export const seedAuditEvents: AuditEvent[] = [
  {
    event_id: "event-seed-001",
    case_id: seedCase.case_id,
    actor_type: "system",
    actor_name: "Demo seed",
    task_or_agent_name: "Seed reset",
    action: "initialized_case",
    input_summary: "Synthetic treatment order and payer policy fixtures.",
    output_summary: "Case is ready for UiPath intake.",
    evidence_refs: [],
    timestamp: now,
  },
];
