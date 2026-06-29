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
import type { LiveProofRun, LiveProofStep } from "./types";

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
      liveProofRun: parseLiveProofRun(json),
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
      liveProofRun: buildSyntheticLiveProofRun(fallbackState, fetchedAt, {
        status: "blocked",
        sourceLabel: "Contract preview from local synthetic fallback",
      }),
      source: "fallback",
      apiBaseUrl,
      lastFetchedAt: fetchedAt,
      error: error instanceof Error ? error.message : "Mock API request failed",
    };
  }
}

export async function startLiveProofRun(
  caseId: string,
  signal?: AbortSignal,
): Promise<LiveProofRun> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/live-proof-runs`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ case_id: caseId }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Live proof run failed with ${response.status}`);
  }

  const json = (await response.json()) as unknown;
  const run = parseLiveProofRun(json);

  if (!run) {
    throw new Error("Live proof response did not include a run contract");
  }

  return run;
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

export function buildSyntheticLiveProofRun(
  state: DemoState,
  timestamp = new Date().toISOString(),
  options?: {
    status?: LiveProofRun["status"];
    sourceLabel?: string;
  },
): LiveProofRun {
  const caseId = state.case?.case_id ?? "case-syn-001";
  const needsHuman = state.evidenceMappings.some(
    (mapping) => mapping.needs_human_review,
  );
  const missingEvidence = state.evidenceMappings.some(
    (mapping) => mapping.status === "missing",
  );
  const apiDown =
    state.toggles.payer_api_unavailable ||
    state.case?.active_secondary_stages.includes(
      "api_failure_portal_fallback",
    ) === true;

  const steps: LiveProofStep[] = [
    {
      step_id: "case_live_proof_started",
      label: "Case run started",
      agent: "UiPath Maestro",
      status: "completed",
      summary:
        "Created a synthetic live-proof run record for the treatment-access case.",
      source: "uipath",
      evidence_refs: [
        {
          label: "UiPath event mirror",
          source: "event_mirror",
          detail: `${state.events.length} synthetic event records visible`,
        },
      ],
    },
    {
      step_id: "policy_checked",
      label: "Policy checked",
      agent: "Coverage Requirement Agent",
      status: "completed",
      summary:
        "Matched payer criteria to policy citations before any packet language is prepared.",
      source: "fireworks",
      evidence_refs: state.criteria.slice(0, 2).map((criterion) => ({
        label: criterion.policy_citation,
        source: "event_mirror",
        detail: formatSourceRef(criterion.source_span),
      })),
    },
    {
      step_id: "evidence_mapped",
      label: "Evidence mapped",
      agent: "Evidence Retrieval Agent",
      status: missingEvidence ? "blocked" : "completed",
      summary: missingEvidence
        ? "A required synthetic source is missing, so submission remains blocked."
        : "Mapped chart evidence to payer criteria and flagged clinical assertions that need review.",
      source: "fireworks",
      evidence_refs: state.evidenceMappings.slice(0, 3).map((mapping) => ({
        label: mapping.evidence_summary,
        source: "event_mirror",
        detail: formatSourceRef(mapping.source_span),
      })),
    },
    {
      step_id: "human_gate_required",
      label: "Clinician gate",
      agent: "Missing Evidence Agent",
      status: needsHuman ? "needs_human" : "completed",
      summary: needsHuman
        ? "A clinician must approve the high-impact clinical assertion before submission."
        : "No current evidence row requires clinician approval.",
      source: "human",
      evidence_refs: state.evidenceMappings
        .filter((mapping) => mapping.needs_human_review)
        .map((mapping) => ({
          label: "Human review reason",
          source: "human",
          detail: mapping.human_review_reason ?? mapping.evidence_summary,
        })),
    },
    {
      step_id: "submission_packet_ready_or_blocked",
      label: "Packet readiness",
      agent: "Submission Packet Agent",
      status: needsHuman || missingEvidence ? "blocked" : "running",
      summary:
        needsHuman || missingEvidence
          ? "Submission packet is held until evidence and approval gates clear."
          : "Packet is ready to route through the governed payer channel.",
      source: "uipath",
      evidence_refs: [
        {
          label: "Safety rule",
          source: "event_mirror",
          detail:
            "The UI visualizes readiness only; UiPath-owned workflows produce live case state.",
        },
      ],
    },
    {
      step_id: "payer_api_unavailable_or_not_attempted",
      label: "Payer channel",
      agent: "API Workflow",
      status: apiDown ? "blocked" : "queued",
      summary: apiDown
        ? "Payer API is unavailable; robot fallback waits for governed UiPath records."
        : "Payer API is available but no real payer submission is implied.",
      source: "uipath",
      evidence_refs: [
        {
          label: "Payer channel state",
          source: "event_mirror",
          detail: apiDown ? "API unavailable" : "API ready",
        },
      ],
    },
    {
      step_id: "live_proof_completed_or_waiting_for_approval",
      label: "Proof outcome",
      agent: "Audit Packet",
      status: needsHuman ? "needs_human" : "running",
      summary: needsHuman
        ? "Live proof is waiting for clinician approval before any downstream action."
        : "Run is ready for the next governed UiPath-owned action.",
      source: "uipath",
      evidence_refs: [
        {
          label: "Synthetic-only safety",
          source: "deterministic",
          detail:
            state.case?.synthetic_data_disclaimer ??
            "Synthetic fictional demo data; not a real person or encounter.",
        },
      ],
    },
  ];

  return {
    run_id: `live-proof-preview-${caseId}`,
    case_id: caseId,
    status:
      options?.status ??
      (needsHuman
        ? "waiting_for_approval"
        : missingEvidence
          ? "blocked"
          : "running"),
    headline: needsHuman
      ? "Clinician approval is the next safe step"
      : "Live proof is ready for governed routing",
    started_at: timestamp,
    updated_at: timestamp,
    current_agent: needsHuman
      ? "Missing Evidence Agent"
      : apiDown
        ? "Submission Packet Agent"
        : "Coverage Requirement Agent",
    value_summary: [
      "Prevents avoidable denial by checking policy criteria first",
      "Reduces manual chart review by mapping evidence to requirements",
      "Keeps appeal language as a clinician-reviewed administrative draft",
      "Leaves auditable human gates under UiPath governance",
    ],
    steps,
    approval_gate: {
      gate_id: "clinician-approval-syn",
      label: "Clinician approval",
      status: needsHuman ? "waiting" : "not_required",
      owner: "Clinician reviewer",
      reason: needsHuman
        ? "High-impact clinical assertion requires human approval."
        : "Current synthetic evidence does not require a human exception gate.",
      source: "human",
    },
    traces: [
      {
        provider: "Fireworks",
        label: "Agent model calls",
        status: "pending",
        detail:
          "Will show provider evidence after the live agent runtime writes run metadata.",
      },
      {
        provider: "LangSmith",
        label: "Trace metadata",
        status: "metadata_only",
        trace_id: "pending-live-proof-trace",
        detail:
          "Trace URL is displayed only when the runtime returns one. Metadata-only states are labeled honestly.",
      },
      {
        provider: "UiPath",
        label: "Governed records",
        status: "available",
        detail:
          "Command Center visualizes UiPath-owned event records; it is not the source of truth.",
      },
    ],
    source_label:
      options?.sourceLabel ?? "Contract preview until live proof API responds",
    synthetic_data_disclaimer:
      state.case?.synthetic_data_disclaimer ??
      "Synthetic fictional demo data; not a real person or encounter.",
  };
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

function parseLiveProofRun(value: unknown): LiveProofRun | null {
  const envelope = value as {
    liveProofRun?: unknown;
    live_proof_run?: unknown;
    run?: unknown;
  };
  const candidate =
    envelope.liveProofRun ?? envelope.live_proof_run ?? envelope.run ?? value;

  if (!candidate || typeof candidate !== "object") return null;

  const run = candidate as Partial<LiveProofRun>;
  if (!run.run_id || !run.case_id || !run.status || !Array.isArray(run.steps)) {
    return null;
  }

  return run as LiveProofRun;
}

function formatSourceRef(
  source:
    | string
    | { source_uri: string; section_label?: string | undefined }
    | undefined,
) {
  if (!source) return "No source reference";
  if (typeof source === "string") return source;
  return [source.source_uri, source.section_label].filter(Boolean).join(" - ");
}
