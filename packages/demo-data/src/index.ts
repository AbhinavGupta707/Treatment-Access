import type {
  AgentTrace,
  AppealPacket,
  AttachmentMetadata,
  AuditEvent,
  Citation,
  DemoFixture,
  DemoToggles,
  EvidenceArtifact,
  EvidenceMapping,
  HumanTask,
  LabResult,
  MedicationHistoryEntry,
  PatientSnapshot,
  PayerDecision,
  PayerPolicy,
  PharmacyHandoff,
  PolicyCriterion,
  SubmissionAttempt,
  SubmissionPacket,
  TreatmentAccessCase,
  TreatmentOrder,
} from "@tacc/shared-schemas";

const now = "2026-06-28T22:00:00.000Z";
const caseId = "case-syn-001";
const patientId = "patient-syn-001";
const orderId = "order-syn-001";
const policyId = "policy-aurora-vale-biologic-2026";
const policySourceUri =
  "fixture://policies/aurora-vale-fictionalimab-policy.md";
const diagnosisCode = "K50.90";

const citation = (
  citation_id: string,
  label: string,
  source_uri: string,
  section_label: string,
  excerpt: string,
): Citation => ({
  citation_id,
  label,
  source_span: {
    source_uri,
    section_label,
    excerpt,
  },
});

export const seedPatient: PatientSnapshot = {
  patient_id: patientId,
  age: 34,
  synthetic_name: "Synthetic Patient TAC-001",
  synthetic_initials: "SP",
  diagnosis_codes: [diagnosisCode],
  coverage_plan: "Aurora Vale Fictional Health Premier PPO",
  provider_id: "provider-syn-gi-001",
  member_id: "member-syn-001",
  preferred_contact_channel: "portal",
  synthetic_data_disclaimer:
    "Synthetic fictional patient for Treatment Access demo use only.",
};

export const seedOrder: TreatmentOrder = {
  order_id: orderId,
  service_type: "specialty_medication",
  medication_name: "Fictionalimab",
  dose: "160 mg induction, then 80 mg every 8 weeks",
  route: "subcutaneous",
  site_of_care: "home administration after specialty pharmacy onboarding",
  diagnosis: "Moderate-to-severe fictional inflammatory bowel condition",
  ordering_provider: "Demo GI Clinician A",
  requested_start_date: "2026-07-03",
  order_priority_reason:
    "Synthetic scenario marks therapy as time-sensitive after documented prior therapy failures.",
  created_at: "2026-06-28T18:40:00.000Z",
};

export const seedCase: TreatmentAccessCase = {
  case_id: caseId,
  external_case_key: "TACC-2026-001",
  maestro_case_id: "maestro-case-placeholder-001",
  patient_id: seedPatient.patient_id,
  order_id: seedOrder.order_id,
  payer_id: "payer-aurora-vale",
  service_type: seedOrder.service_type,
  medication_name: seedOrder.medication_name,
  urgency: "urgent",
  status: "Ready for UiPath intake",
  current_stage: "intake",
  active_secondary_stages: [],
  sla_due_at: "2026-07-01T17:00:00.000Z",
  sla_state: "on_track",
  outcome: null,
  payer_status: "not_submitted",
  last_event_at: now,
  synthetic_data_disclaimer:
    "Synthetic fictional demo case; contains no real patient, payer, or provider data.",
};

export const diagnosisPolicyCitation = citation(
  "policy-citation-diagnosis",
  "Policy Section 2.1",
  policySourceUri,
  "Diagnosis and severity",
  "Fictional policy requires a specialist note documenting moderate-to-severe disease activity.",
);

export const stepTherapyPolicyCitation = citation(
  "policy-citation-step",
  "Policy Section 2.4",
  policySourceUri,
  "Preferred therapy history",
  "Fictional policy requires inadequate response or intolerance to two preferred therapies.",
);

export const safetyPolicyCitation = citation(
  "policy-citation-safety",
  "Policy Section 3.2",
  policySourceUri,
  "Safety screening",
  "Fictional policy requires recent TB and hepatitis screening before biologic initiation.",
);

export const seedPayerPolicy: PayerPolicy = {
  policy_id: policyId,
  payer_id: seedCase.payer_id,
  payer_name: "Aurora Vale Fictional Health",
  policy_name: "Fictionalimab Prior Authorization Policy",
  version: "2026.1",
  effective_date: "2026-01-01",
  source_uri: policySourceUri,
  summary:
    "Synthetic payer policy requiring diagnosis confirmation, prior therapy history, safety screening, and clinician attestation before approval.",
  submission_channels: ["payer_api", "payer_portal_rpa"],
  required_documents: [
    "specialist progress note",
    "medication history",
    "TB and hepatitis safety screening",
    "clinician attestation for severity statement",
  ],
  citations: [
    diagnosisPolicyCitation,
    stepTherapyPolicyCitation,
    safetyPolicyCitation,
  ],
};

export const seedCriteria: PolicyCriterion[] = [
  {
    criterion_id: "criterion-diagnosis",
    policy_id: policyId,
    description:
      "Confirmed diagnosis of moderate-to-severe fictional inflammatory bowel condition.",
    required_evidence_type: "specialist_note",
    severity: "blocking",
    must_be_clinician_attested: true,
    policy_citation: "Aurora Vale Fictionalimab Policy 2026, Section 2.1",
    source_span: {
      source_uri: seedPayerPolicy.source_uri,
      section_label: "Diagnosis and severity",
      excerpt:
        "Fictional policy requires specialist documentation of diagnosis and disease activity.",
    },
    version: seedPayerPolicy.version,
  },
  {
    criterion_id: "criterion-step-therapy",
    policy_id: policyId,
    description:
      "Documented inadequate response or intolerance to two preferred therapies.",
    required_evidence_type: "medication_history",
    severity: "blocking",
    must_be_clinician_attested: false,
    policy_citation: "Aurora Vale Fictionalimab Policy 2026, Section 2.4",
    source_span: {
      source_uri: seedPayerPolicy.source_uri,
      section_label: "Preferred therapy history",
      excerpt:
        "Fictional policy requires two preferred therapy attempts before Fictionalimab.",
    },
    version: seedPayerPolicy.version,
  },
  {
    criterion_id: "criterion-safety-screen",
    policy_id: policyId,
    description:
      "Recent TB and hepatitis screening before Fictionalimab initiation.",
    required_evidence_type: "safety_labs",
    severity: "blocking",
    must_be_clinician_attested: false,
    policy_citation: "Aurora Vale Fictionalimab Policy 2026, Section 3.2",
    source_span: {
      source_uri: seedPayerPolicy.source_uri,
      section_label: "Safety screening",
      excerpt:
        "Fictional policy requires negative TB and hepatitis screening within six months.",
    },
    version: seedPayerPolicy.version,
  },
  {
    criterion_id: "criterion-continuity-plan",
    policy_id: policyId,
    description:
      "Care-continuity plan is documented for specialty pharmacy onboarding after approval.",
    required_evidence_type: "pharmacy_handoff",
    severity: "warning",
    must_be_clinician_attested: false,
    policy_citation: "Aurora Vale Fictionalimab Policy 2026, Section 4.3",
    source_span: {
      source_uri: seedPayerPolicy.source_uri,
      section_label: "Care continuity",
      excerpt:
        "Fictional policy requests a plan for pharmacy coordination after payer approval.",
    },
    version: seedPayerPolicy.version,
  },
];

export const seedArtifacts: EvidenceArtifact[] = [
  {
    artifact_id: "artifact-policy",
    case_id: caseId,
    type: "payer_policy",
    source_uri: seedPayerPolicy.source_uri,
    display_name: "Aurora Vale Fictionalimab Policy",
    extracted_text:
      "Synthetic policy text: diagnosis, prior therapies, safety screening, and care-continuity plan are reviewed for Fictionalimab.",
    structured_fields: {
      policy_id: policyId,
      required_document_count: seedPayerPolicy.required_documents.length,
    },
    extraction_method: "seeded_fixture",
    extraction_confidence: 1,
    source_hash: "sha256-syn-policy-001",
    synthetic: true,
  },
  {
    artifact_id: "artifact-progress-note",
    case_id: caseId,
    type: "progress_note",
    source_uri: "fixture://notes/specialist-progress-note.md",
    display_name: "Synthetic Specialist Progress Note",
    extracted_text:
      "Synthetic progress note: demo clinician documents ongoing moderate-to-severe symptoms and recommends Fictionalimab after prior therapy attempts.",
    structured_fields: {
      diagnosis: seedOrder.diagnosis,
      clinician_attestation_required: true,
      severity_phrase: "moderate-to-severe fictional activity",
    },
    extraction_method: "fallback_parser",
    extraction_confidence: 0.87,
    source_hash: "sha256-syn-note-001",
    synthetic: true,
  },
  {
    artifact_id: "artifact-med-history",
    case_id: caseId,
    type: "medication_history",
    source_uri: "fixture://ehr/medication-history.json",
    display_name: "Synthetic Medication History",
    extracted_text:
      "Synthetic medication history: preferred therapy A had inadequate response; preferred therapy B stopped for fictional intolerance.",
    structured_fields: {
      prior_therapy_count: 2,
      failures_documented: true,
    },
    extraction_method: "seeded_fixture",
    extraction_confidence: 0.94,
    source_hash: "sha256-syn-med-history-001",
    synthetic: true,
  },
  {
    artifact_id: "artifact-safety-labs",
    case_id: caseId,
    type: "lab_report",
    source_uri: "fixture://labs/safety-screening.csv",
    display_name: "Synthetic Safety Screening",
    extracted_text:
      "Synthetic lab report: TB screen negative; hepatitis B surface antigen negative; hepatitis C antibody negative.",
    structured_fields: {
      tb_screen: "negative",
      hepatitis_b_surface_antigen: "negative",
      hepatitis_c_antibody: "negative",
      collected_at: "2026-06-21T09:15:00.000Z",
    },
    extraction_method: "fallback_parser",
    extraction_confidence: 0.91,
    source_hash: "sha256-syn-labs-001",
    synthetic: true,
  },
  {
    artifact_id: "artifact-denial-step-therapy",
    case_id: caseId,
    type: "denial_letter",
    source_uri: "fixture://denials/step-therapy-denial.md",
    display_name: "Synthetic Step Therapy Denial Letter",
    extracted_text:
      "Synthetic payer denial: records reviewed did not clearly show two prior preferred therapy outcomes.",
    structured_fields: {
      denial_code: "STEP_THERAPY_INCOMPLETE",
      appeal_deadline: "2026-07-12",
    },
    extraction_method: "fallback_parser",
    extraction_confidence: 0.89,
    source_hash: "sha256-syn-denial-step-001",
    synthetic: true,
  },
];

export const seedAttachments: AttachmentMetadata[] = [
  {
    attachment_id: "attachment-policy",
    case_id: caseId,
    artifact_id: "artifact-policy",
    display_name: "Fictionalimab policy extract",
    file_name: "fictionalimab-policy-synthetic.md",
    content_type: "text/markdown",
    source_uri: seedPayerPolicy.source_uri,
    purpose: "policy",
    synthetic: true,
    source_hash: "sha256-syn-policy-001",
  },
  {
    attachment_id: "attachment-progress-note",
    case_id: caseId,
    artifact_id: "artifact-progress-note",
    display_name: "Specialist progress note",
    file_name: "specialist-progress-note-synthetic.md",
    content_type: "text/markdown",
    source_uri: "fixture://notes/specialist-progress-note.md",
    purpose: "clinical_note",
    synthetic: true,
    source_hash: "sha256-syn-note-001",
  },
  {
    attachment_id: "attachment-safety-labs",
    case_id: caseId,
    artifact_id: "artifact-safety-labs",
    display_name: "Safety screening lab report",
    file_name: "safety-screening-synthetic.csv",
    content_type: "text/csv",
    source_uri: "fixture://labs/safety-screening.csv",
    purpose: "lab_report",
    synthetic: true,
    source_hash: "sha256-syn-labs-001",
  },
  {
    attachment_id: "attachment-denial-step",
    case_id: caseId,
    artifact_id: "artifact-denial-step-therapy",
    display_name: "Step therapy denial letter",
    file_name: "step-therapy-denial-synthetic.md",
    content_type: "text/markdown",
    source_uri: "fixture://denials/step-therapy-denial.md",
    purpose: "payer_denial",
    synthetic: true,
    source_hash: "sha256-syn-denial-step-001",
  },
];

export const seedLabs: LabResult[] = [
  {
    lab_id: "lab-tb-screen",
    patient_id: patientId,
    case_id: caseId,
    test_name: "Synthetic TB screening",
    result: "negative",
    collected_at: "2026-06-21T09:15:00.000Z",
    status: "final",
    source_artifact_id: "artifact-safety-labs",
    synthetic: true,
  },
  {
    lab_id: "lab-hep-b-screen",
    patient_id: patientId,
    case_id: caseId,
    test_name: "Synthetic hepatitis B surface antigen",
    result: "negative",
    collected_at: "2026-06-21T09:15:00.000Z",
    status: "final",
    source_artifact_id: "artifact-safety-labs",
    synthetic: true,
  },
  {
    lab_id: "lab-hep-c-screen",
    patient_id: patientId,
    case_id: caseId,
    test_name: "Synthetic hepatitis C antibody",
    result: "negative",
    collected_at: "2026-06-21T09:15:00.000Z",
    status: "final",
    source_artifact_id: "artifact-safety-labs",
    synthetic: true,
  },
];

export const missingSafetyLabScenario: LabResult[] = seedLabs.map((lab) => ({
  ...lab,
  result: "not present in synthetic chart snapshot",
  status: "missing",
  source_artifact_id: undefined,
}));

export const seedMedicationHistory: MedicationHistoryEntry[] = [
  {
    medication_history_id: "med-history-preferred-a",
    patient_id: patientId,
    case_id: caseId,
    medication_name: "Preferred Therapy A",
    therapy_class: "fictional conventional therapy",
    start_date: "2025-10-01",
    end_date: "2026-01-15",
    outcome: "Synthetic record indicates inadequate response.",
    source_artifact_id: "artifact-med-history",
    synthetic: true,
  },
  {
    medication_history_id: "med-history-preferred-b",
    patient_id: patientId,
    case_id: caseId,
    medication_name: "Preferred Therapy B",
    therapy_class: "fictional immunomodulator",
    start_date: "2026-02-01",
    end_date: "2026-04-10",
    outcome: "Synthetic record indicates intolerance in a demo-only note.",
    source_artifact_id: "artifact-med-history",
    synthetic: true,
  },
];

export const seedEvidenceMappings: EvidenceMapping[] = [
  {
    mapping_id: "mapping-diagnosis",
    case_id: caseId,
    criterion_id: "criterion-diagnosis",
    artifact_id: "artifact-progress-note",
    status: "needs_human_validation",
    evidence_summary:
      "Specialist note supports diagnosis and severity; clinician attestation is required before submission.",
    source_quote_short:
      "Fictional excerpt: symptoms remain moderate-to-severe despite prior therapy attempts.",
    source_span: {
      artifact_id: "artifact-progress-note",
      source_uri: "fixture://notes/specialist-progress-note.md",
      section_label: "Assessment",
      excerpt:
        "Fictional excerpt: symptoms remain moderate-to-severe despite prior therapy attempts.",
    },
    confidence: 0.87,
    needs_human_review: true,
    human_review_reason:
      "High-impact medical assertion requires clinician validation.",
    reviewer_decision: "pending",
    reviewer_original_text:
      "Specialist note supports diagnosis and disease activity.",
    citations: [diagnosisPolicyCitation],
  },
  {
    mapping_id: "mapping-step-therapy",
    case_id: caseId,
    criterion_id: "criterion-step-therapy",
    artifact_id: "artifact-med-history",
    status: "found",
    evidence_summary:
      "Synthetic medication history lists two preferred therapies with documented outcomes.",
    source_quote_short:
      "Fictional excerpt: inadequate response to Preferred Therapy A and intolerance to Preferred Therapy B.",
    source_span: {
      artifact_id: "artifact-med-history",
      source_uri: "fixture://ehr/medication-history.json",
      section_label: "priorTherapies",
      excerpt:
        "Fictional excerpt: two prior therapy outcomes are documented for demo review.",
    },
    confidence: 0.94,
    needs_human_review: false,
    reviewer_decision: "pending",
    citations: [stepTherapyPolicyCitation],
  },
  {
    mapping_id: "mapping-safety-screen",
    case_id: caseId,
    criterion_id: "criterion-safety-screen",
    artifact_id: "artifact-safety-labs",
    status: "found",
    evidence_summary:
      "Synthetic TB and hepatitis screening are present and recent.",
    source_quote_short:
      "Fictional excerpt: TB negative; hepatitis B and C screening negative.",
    source_span: {
      artifact_id: "artifact-safety-labs",
      source_uri: "fixture://labs/safety-screening.csv",
      section_label: "row-1",
      excerpt:
        "Fictional excerpt: TB and hepatitis safety screens are negative.",
    },
    confidence: 0.91,
    needs_human_review: false,
    reviewer_decision: "pending",
    citations: [safetyPolicyCitation],
  },
  {
    mapping_id: "mapping-continuity-plan",
    case_id: caseId,
    criterion_id: "criterion-continuity-plan",
    artifact_id: "artifact-progress-note",
    status: "found",
    evidence_summary:
      "Order includes specialty pharmacy onboarding and coordinator follow-up after approval.",
    source_quote_short:
      "Fictional excerpt: coordinator to send pharmacy handoff when authorization is approved.",
    source_span: {
      artifact_id: "artifact-progress-note",
      source_uri: "fixture://notes/specialist-progress-note.md",
      section_label: "Plan",
      excerpt:
        "Fictional excerpt: coordinator to send pharmacy handoff after approval.",
    },
    confidence: 0.86,
    needs_human_review: false,
    reviewer_decision: "pending",
    citations: [safetyPolicyCitation],
  },
];

export const missingEvidenceMappings: EvidenceMapping[] =
  seedEvidenceMappings.map((mapping) =>
    mapping.criterion_id === "criterion-safety-screen"
      ? {
          ...mapping,
          artifact_id: null,
          status: "missing",
          evidence_summary:
            "Safety screening is missing in the current synthetic chart snapshot.",
          source_quote_short: undefined,
          source_span: undefined,
          confidence: 0,
          needs_human_review: true,
          human_review_reason:
            "Blocking safety criterion must be supplied before submission.",
          citations: [safetyPolicyCitation],
        }
      : mapping,
  );

export const seedSubmissionPacket: SubmissionPacket = {
  packet_id: "packet-syn-001",
  case_id: caseId,
  ready_to_submit: false,
  form_fields: {
    patient_reference: seedPatient.patient_id,
    medication_requested: seedOrder.medication_name,
    diagnosis_code: diagnosisCode,
    requested_start_date: seedOrder.requested_start_date,
    policy_reference: seedPayerPolicy.policy_id,
  },
  attachment_ids: [
    "attachment-progress-note",
    "attachment-safety-labs",
    "attachment-policy",
  ],
  cover_letter_summary:
    "Administrative draft packet for clinician-reviewed Fictionalimab prior authorization.",
  unsupported_claim_warnings: [
    "Diagnosis severity statement is awaiting clinician approval.",
  ],
  built_at: "2026-06-28T22:12:00.000Z",
  version: "1",
};

export const seedSubmissionAttempts: SubmissionAttempt[] = [
  {
    attempt_id: "attempt-api-unavailable",
    case_id: caseId,
    packet_id: seedSubmissionPacket.packet_id,
    channel: "payer_api",
    status: "fallback_required",
    started_at: "2026-06-28T22:18:00.000Z",
    completed_at: "2026-06-28T22:18:25.000Z",
    payload_summary:
      "Synthetic prior authorization packet sent to mock payer API.",
    response_summary:
      "Mock payer API unavailable; portal robot fallback required.",
    error_code: "PAYER_API_DOWN",
    retry_count: 1,
  },
  {
    attempt_id: "attempt-portal-rpa",
    case_id: caseId,
    packet_id: seedSubmissionPacket.packet_id,
    channel: "payer_portal_rpa",
    status: "submitted",
    started_at: "2026-06-28T22:19:00.000Z",
    completed_at: "2026-06-28T22:22:00.000Z",
    payload_summary:
      "UiPath robot entered synthetic packet into mock payer portal.",
    response_summary: "Portal returned synthetic confirmation ID.",
    orchestrator_job_id: "job-syn-portal-001",
    portal_confirmation_id: "AVFH-PORTAL-SYN-001",
    retry_count: 0,
  },
];

export const stepTherapyDenialDecision: PayerDecision = {
  decision_id: "decision-step-therapy-denial",
  case_id: caseId,
  submission_attempt_id: "attempt-portal-rpa",
  status: "denied",
  reason:
    "Synthetic denial states the prior therapy documentation was not clear enough for approval.",
  denial_code: "STEP_THERAPY_INCOMPLETE",
  policy_citation: "Aurora Vale Fictionalimab Policy 2026, Section 2.4",
  appeal_deadline: "2026-07-12",
  raw_response:
    "Synthetic denial letter for demo use only. Not a real payer communication.",
  source_artifact_id: "artifact-denial-step-therapy",
};

export const safetyScreenDenialDecision: PayerDecision = {
  decision_id: "decision-safety-screen-denial",
  case_id: caseId,
  submission_attempt_id: "attempt-portal-rpa",
  status: "denied",
  reason:
    "Synthetic denial states safety screening was not attached to the submission.",
  denial_code: "SAFETY_SCREEN_MISSING",
  policy_citation: "Aurora Vale Fictionalimab Policy 2026, Section 3.2",
  appeal_deadline: "2026-07-12",
  raw_response: "Synthetic denial variant for missing evidence demo mode only.",
  source_artifact_id: "artifact-denial-step-therapy",
};

export const medicalNecessityDenialDecision: PayerDecision = {
  decision_id: "decision-medical-necessity-denial",
  case_id: caseId,
  submission_attempt_id: "attempt-portal-rpa",
  status: "denied",
  reason:
    "Synthetic denial disputes whether the record supports medical necessity.",
  denial_code: "MEDICAL_NECESSITY_NOT_ESTABLISHED",
  policy_citation: "Aurora Vale Fictionalimab Policy 2026, Section 2.1",
  appeal_deadline: "2026-07-12",
  raw_response:
    "Synthetic denial variant for clinician attestation demo mode only.",
  source_artifact_id: "artifact-denial-step-therapy",
};

export const seedPayerDecisions: PayerDecision[] = [
  stepTherapyDenialDecision,
  safetyScreenDenialDecision,
  medicalNecessityDenialDecision,
];

export const seedAppealPacket: AppealPacket = {
  appeal_id: "appeal-syn-001",
  case_id: caseId,
  denial_reason: stepTherapyDenialDecision.reason,
  appeal_strategy:
    "Administrative draft cites the medication history evidence and asks for reconsideration after clinician review.",
  evidence_used: ["mapping-step-therapy", "mapping-diagnosis"],
  draft_text:
    "Administrative draft for clinician review: the synthetic record contains two documented prior therapy outcomes and a specialist assessment supporting the requested therapy. This text is not medical or legal advice and must be approved by a clinician before submission.",
  unsupported_claim_warnings: [
    "Do not submit until the clinician approves the severity statement.",
  ],
  clinician_approved: false,
  version: "1",
  citations: [diagnosisPolicyCitation, stepTherapyPolicyCitation],
};

export const seedPharmacyHandoff: PharmacyHandoff = {
  handoff_id: "pharmacy-handoff-syn-001",
  case_id: caseId,
  status: "pending",
  pharmacy_name: "Demo Specialty Pharmacy",
  assigned_coordinator_role: "patient-access-coordinator",
  benefits_summary:
    "Synthetic approval and benefit notes will be sent after payer approval.",
  next_step:
    "Create onboarding task and confirm shipment readiness in the mock pharmacy API.",
  scheduling_task_id: "scheduling-task-syn-001",
  created_at: "2026-06-28T22:35:00.000Z",
  updated_at: "2026-06-28T22:35:00.000Z",
};

export const seedHumanTasks: HumanTask[] = [
  {
    task_id: "task-clinician-evidence-approval",
    case_id: caseId,
    task_type: "evidence_approval",
    status: "pending",
    assigned_role: "clinician-reviewer",
    prompt:
      "Review the synthetic diagnosis/severity assertion before submission.",
    due_at: "2026-06-29T17:00:00.000Z",
  },
  {
    task_id: "task-missing-safety-screen",
    case_id: caseId,
    task_type: "missing_evidence",
    status: "pending",
    assigned_role: "nurse-coordinator",
    prompt:
      "Upload or attest to synthetic TB and hepatitis screening before payer submission.",
    due_at: "2026-06-29T17:00:00.000Z",
  },
  {
    task_id: "task-appeal-signoff",
    case_id: caseId,
    task_type: "appeal_signoff",
    status: "pending",
    assigned_role: "clinician-reviewer",
    prompt:
      "Approve or edit the administrative appeal draft before it is submitted.",
    due_at: "2026-07-01T17:00:00.000Z",
  },
];

export const seedAgentTraces: AgentTrace[] = [
  {
    trace_id: "trace-coverage-agent-001",
    case_id: caseId,
    agent_name: "Coverage Requirement Agent",
    status: "completed",
    input_summary: "Synthetic order and Aurora Vale policy fixture.",
    output_summary:
      "Authorization required with four criteria and two submission channels.",
    tool_calls: ["policy_fixture_lookup", "schema_validator"],
    evidence_refs: ["artifact-policy"],
    started_at: "2026-06-28T22:01:00.000Z",
    completed_at: "2026-06-28T22:02:00.000Z",
  },
  {
    trace_id: "trace-evidence-agent-001",
    case_id: caseId,
    agent_name: "Evidence Retrieval Agent",
    status: "needs_human",
    input_summary: "Policy criteria, progress note, labs, medication history.",
    output_summary:
      "Mapped evidence for all criteria and routed diagnosis severity to clinician review.",
    tool_calls: ["mock_ehr_pull", "fallback_parser", "evidence_matrix_writer"],
    evidence_refs: [
      "artifact-progress-note",
      "artifact-med-history",
      "artifact-safety-labs",
    ],
    started_at: "2026-06-28T22:03:00.000Z",
    completed_at: "2026-06-28T22:05:00.000Z",
  },
  {
    trace_id: "trace-denial-rescue-agent-001",
    case_id: caseId,
    agent_name: "Denial Rescue Agent",
    status: "completed",
    input_summary: "Synthetic denial letter and original evidence matrix.",
    output_summary:
      "Detected step-therapy denial and prepared appeal ingredients.",
    tool_calls: ["denial_parser", "evidence_compare"],
    evidence_refs: ["artifact-denial-step-therapy", "artifact-med-history"],
    started_at: "2026-06-28T22:26:00.000Z",
    completed_at: "2026-06-28T22:28:00.000Z",
  },
  {
    trace_id: "trace-care-continuity-agent-001",
    case_id: caseId,
    agent_name: "Care Continuity Agent",
    status: "not_started",
    input_summary: "Pending payer approval.",
    output_summary:
      "Will create pharmacy handoff after approval or appeal approval.",
    tool_calls: [],
    evidence_refs: [],
    started_at: "2026-06-28T22:35:00.000Z",
  },
];

export const defaultDemoToggles: DemoToggles = {
  missing_safety_lab: false,
  payer_api_unavailable: false,
  denial_reason: "step_therapy",
  clinician_rejects_assertion: false,
  force_low_confidence_extraction: false,
  pharmacy_handoff_failure: false,
};

export const seedAuditEvents: AuditEvent[] = [
  {
    event_id: "event-seed-001",
    case_id: caseId,
    maestro_case_id: seedCase.maestro_case_id,
    actor_type: "system",
    actor_name: "Demo seed",
    task_or_agent_name: "Seed reset",
    action: "initialized_case",
    input_summary: "Synthetic treatment order and payer policy fixtures.",
    output_summary: "Case is ready for UiPath intake.",
    evidence_refs: [],
    payer_status: "not_submitted",
    timestamp: now,
  },
  {
    event_id: "event-policy-001",
    case_id: caseId,
    maestro_case_id: seedCase.maestro_case_id,
    actor_type: "agent",
    actor_name: "Coverage Requirement Agent",
    task_or_agent_name: "Policy extraction",
    action: "policy_criteria_extracted",
    input_summary: "Aurora Vale Fictionalimab policy fixture.",
    output_summary: "Four policy criteria extracted with source citations.",
    evidence_refs: ["artifact-policy"],
    trace_id: "trace-coverage-agent-001",
    payer_status: "not_submitted",
    timestamp: "2026-06-28T22:02:00.000Z",
  },
  {
    event_id: "event-evidence-001",
    case_id: caseId,
    maestro_case_id: seedCase.maestro_case_id,
    actor_type: "agent",
    actor_name: "Evidence Retrieval Agent",
    task_or_agent_name: "Evidence mapping",
    action: "evidence_matrix_created",
    input_summary:
      "Progress note, medication history, safety labs, and policy criteria.",
    output_summary:
      "Evidence mapped; clinician review required for diagnosis severity.",
    evidence_refs: [
      "artifact-progress-note",
      "artifact-med-history",
      "artifact-safety-labs",
    ],
    trace_id: "trace-evidence-agent-001",
    payer_status: "not_submitted",
    timestamp: "2026-06-28T22:05:00.000Z",
  },
];

export const treatmentAccessDemoFixture: DemoFixture = {
  case: seedCase,
  patient: seedPatient,
  order: seedOrder,
  payerPolicy: seedPayerPolicy,
  criteria: seedCriteria,
  artifacts: seedArtifacts,
  attachments: seedAttachments,
  evidenceMappings: seedEvidenceMappings,
  labs: seedLabs,
  medicationHistory: seedMedicationHistory,
  submissionPacket: seedSubmissionPacket,
  submissionAttempts: seedSubmissionAttempts,
  payerDecisions: seedPayerDecisions,
  appealPacket: seedAppealPacket,
  pharmacyHandoff: seedPharmacyHandoff,
  humanTasks: seedHumanTasks,
  agentTraces: seedAgentTraces,
  auditEvents: seedAuditEvents,
  demoToggles: defaultDemoToggles,
};

export const denialLetterScenarios = {
  step_therapy: stepTherapyDenialDecision,
  safety_screen: safetyScreenDenialDecision,
  medical_necessity: medicalNecessityDenialDecision,
} as const;

export const pharmacyHandoffDetails = seedPharmacyHandoff;
export const appealIngredients = seedAppealPacket;
