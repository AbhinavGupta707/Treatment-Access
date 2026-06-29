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
import type {
  LiveProofApprovalGate,
  LiveProofRun,
  LiveProofSourceKind,
  LiveProofStep,
  LiveProofStepStatus,
  UiPathProofManifestItem,
} from "./types";

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
    source_labels: [
      "Local synthetic event mirror",
      "Ready for live UiPath proof",
      "No real payer submission",
    ],
    proof_status:
      options?.status === "completed"
        ? "local_synthetic_proof"
        : "ready_for_live_uipath_proof",
    proof_manifest: buildLocalProofManifest(state, timestamp, caseId),
    safety_status:
      "Synthetic only; clinical assertions require source evidence, policy citation, or human approval.",
    no_live_uipath_side_effects: true,
    no_real_payer_submission: true,
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

  const run = candidate as Partial<LiveProofRun> & Record<string, unknown>;
  if (!run.run_id || !run.case_id || !run.status || !Array.isArray(run.steps)) {
    return null;
  }

  if ("current_stage" in run || "approval_gates" in run) {
    return normalizeSharedLiveProofRun(run as unknown as SharedLiveProofRun);
  }

  return {
    ...(run as LiveProofRun),
    proof_manifest:
      run.proof_manifest ??
      buildGenericProofManifest(run as LiveProofRun, new Date().toISOString()),
    proof_status: run.proof_status ?? "ready_for_live_uipath_proof",
    safety_status:
      run.safety_status ??
      "Synthetic only; live UiPath side effects require explicit approval.",
  };
}

type SharedUiPathEvidenceRef = {
  evidence_ref_id?: string;
  source?: string;
  label?: string;
  external_id?: string;
  url?: string;
  captured_at?: string;
};

type SharedLiveProofTrace = {
  trace_id?: string;
  provider?: string;
  status?: string;
  project_name?: string;
  url?: string;
  captured_at?: string;
};

type SharedLiveProofApprovalGate = {
  gate_id?: string;
  gate_type?: string;
  status?: string;
  assigned_role?: string;
  reason?: string;
  source_stage?: string;
  uipath_task_id?: string;
};

type SharedLiveProofStep = {
  step_id?: string;
  stage?: string;
  status?: string;
  title?: string;
  summary?: string;
  actor_type?: string;
  actor_name?: string;
  completed_at?: string;
  started_at?: string;
  trace?: SharedLiveProofTrace;
  uipath_evidence_refs?: SharedUiPathEvidenceRef[];
  evidence_refs?: string[];
};

type SharedSubmissionAttempt = {
  orchestrator_job_id?: string;
  portal_confirmation_id?: string;
  confirmation_id?: string;
  status?: string;
  completed_at?: string;
};

type SharedLiveProofRun = {
  run_id?: string;
  case_id?: string;
  status?: string;
  started_at?: string;
  requested_by?: string;
  mode?: string;
  current_stage?: string;
  completed_at?: string;
  steps?: SharedLiveProofStep[];
  approval_gates?: SharedLiveProofApprovalGate[];
  traces?: SharedLiveProofTrace[];
  uipath_evidence_refs?: SharedUiPathEvidenceRef[];
  submission_attempts?: SharedSubmissionAttempt[];
  mirror_events?: Array<{ event_id?: string; timestamp?: string }>;
  source_labels?: string[];
  no_live_uipath_side_effects?: boolean;
  no_real_payer_submission?: boolean;
  synthetic_data_disclaimer?: string;
  proof_manifest?: UiPathProofManifestItem[];
};

function normalizeSharedLiveProofRun(run: SharedLiveProofRun): LiveProofRun {
  const updatedAt =
    run.completed_at ??
    latestTimestamp([
      ...(run.steps ?? []).flatMap((step) => [
        step.completed_at,
        step.started_at,
      ]),
      ...(run.uipath_evidence_refs ?? []).map((ref) => ref.captured_at),
    ]) ??
    new Date().toISOString();
  const traces = (run.traces ?? []).map(normalizeSharedTrace);
  const proofManifest = buildSharedProofManifest(run, updatedAt);

  return {
    run_id: String(run.run_id),
    case_id: String(run.case_id),
    status: normalizeRunStatus(String(run.status)),
    headline: run.no_live_uipath_side_effects
      ? "Ready for live UiPath proof"
      : "Live UiPath proof recorded",
    started_at: run.started_at,
    updated_at: updatedAt,
    current_agent: currentAgentFromSharedRun(run),
    value_summary: [
      "Cuts prior-auth prep by turning chart review into a governed evidence matrix",
      "Reduces preventable denials by blocking unsupported payer-facing claims",
      "Speeds appeal readiness while keeping clinician signoff in the loop",
      "Keeps auditability visible without putting backend clutter on the main screen",
    ],
    steps: (run.steps ?? []).map((step) => normalizeSharedStep(step, traces)),
    approval_gate: normalizeSharedApprovalGate(run.approval_gates?.[0]),
    traces,
    source_label:
      run.no_live_uipath_side_effects === true
        ? "Ready for live UiPath proof; no side-effecting UiPath run claimed"
        : "Live UiPath evidence returned by runtime",
    source_labels: run.source_labels ?? [],
    proof_manifest: proofManifest,
    proof_status:
      run.no_live_uipath_side_effects === true
        ? "ready_for_live_uipath_proof"
        : "live_uipath_proof_recorded",
    safety_status:
      "Synthetic only; every clinical assertion needs source evidence, policy citation, or human approval.",
    no_live_uipath_side_effects: run.no_live_uipath_side_effects,
    no_real_payer_submission: run.no_real_payer_submission,
    synthetic_data_disclaimer:
      run.synthetic_data_disclaimer ??
      "Synthetic live proof run; no real patient, payer, provider, credential, or personal health data.",
  };
}

function normalizeSharedStep(
  step: SharedLiveProofStep,
  _traces: LiveProofRun["traces"],
): LiveProofStep {
  const source = sourceFromSharedStep(step);
  return {
    step_id: step.step_id ?? step.stage ?? "live-proof-step",
    label: step.title ?? labelizeSource(step.stage ?? "Proof step"),
    agent: step.actor_name ?? labelizeSource(step.actor_type ?? "UiPath"),
    status: normalizeStepStatus(step.status),
    summary: step.summary ?? "Runtime returned proof step metadata.",
    source,
    evidence_refs: (step.uipath_evidence_refs ?? []).map((ref) => ({
      label: ref.label ?? ref.evidence_ref_id ?? sourceKindLabel(source),
      source: normalizeEvidenceSource(ref.source),
      detail: ref.external_id ?? ref.url ?? ref.evidence_ref_id ?? "Captured",
      href: ref.url,
      record_id: ref.external_id ?? ref.evidence_ref_id,
    })),
  };
}

function normalizeSharedTrace(
  trace: SharedLiveProofTrace,
): LiveProofRun["traces"][number] {
  return {
    provider:
      trace.provider === "fireworks"
        ? "Fireworks"
        : trace.provider === "langsmith"
          ? "LangSmith"
          : "Deterministic",
    label: trace.project_name ?? trace.trace_id ?? "Trace metadata",
    status:
      trace.status === "available"
        ? "available"
        : trace.status === "metadata_only"
          ? "metadata_only"
          : "unavailable",
    trace_id: trace.trace_id,
    trace_url: trace.url,
    detail:
      trace.status === "not_configured"
        ? "Provider trace not configured for this run."
        : `Captured at ${trace.captured_at ?? "runtime"}.`,
  };
}

function normalizeSharedApprovalGate(
  gate?: SharedLiveProofApprovalGate,
): LiveProofApprovalGate {
  if (!gate) {
    return {
      gate_id: "live-uipath-approval-gate",
      label: "Live UiPath approval gate",
      status: "required",
      owner: "Demo operator",
      reason:
        "New live UiPath side effects remain approval-gated. Existing proof includes a completed Action Center task, Data Fabric records, solution deployment, and Orchestrator job.",
      source: "uipath",
    };
  }

  return {
    gate_id: gate.gate_id ?? "live-uipath-approval-gate",
    label: labelizeSource(gate.gate_type ?? "Live UiPath approval gate"),
    status: normalizeApprovalStatus(gate.status),
    owner: gate.assigned_role ?? "Demo operator",
    reason:
      gate.reason ??
      "Live UiPath side effects remain approval-gated until evidence is captured.",
    source: gate.uipath_task_id ? "human" : "uipath",
  };
}

function normalizeRunStatus(status: string): LiveProofRun["status"] {
  if (status === "created") return "not_started";
  if (status === "waiting_for_approval") return "waiting_for_approval";
  if (status === "completed") return "completed";
  if (status === "blocked") return "blocked";
  if (status === "failed") return "failed";
  if (status === "running") return "running";
  return "not_started";
}

function normalizeStepStatus(status?: string): LiveProofStepStatus {
  if (status === "pending") return "queued";
  if (status === "waiting_for_approval") return "needs_human";
  if (status === "skipped") return "blocked";
  if (status === "completed" || status === "running" || status === "blocked") {
    return status;
  }
  return "queued";
}

function normalizeApprovalStatus(
  status?: string,
): LiveProofApprovalGate["status"] {
  if (status === "not_created") return "required";
  if (status === "pending") return "waiting";
  if (status === "approved_for_demo") return "approved";
  if (status === "blocked") return "blocked";
  return "required";
}

function sourceFromSharedStep(step: SharedLiveProofStep): LiveProofSourceKind {
  const evidenceSource = step.uipath_evidence_refs?.[0]?.source;
  if (evidenceSource) return normalizeEvidenceSource(evidenceSource);
  if (step.actor_type === "human") return "human";
  if (step.actor_type === "api_workflow") return "uipath";
  if (step.trace?.provider === "fireworks") return "fireworks";
  if (step.trace?.provider === "langsmith") return "langsmith";
  return "deterministic";
}

function normalizeEvidenceSource(source?: string): LiveProofSourceKind {
  if (source === "uipath_event_mirror") return "event_mirror";
  if (source === "uipath_orchestrator") return "orchestrator";
  if (source === "uipath_data_service") return "data_service";
  if (source === "uipath_action_center") return "human";
  if (source === "mock_healthcare_api") return "mock_api";
  if (source === "fireworks" || source === "langsmith") return source;
  if (source === "deterministic_runtime") return "deterministic";
  return "uipath";
}

function currentAgentFromSharedRun(run: SharedLiveProofRun) {
  const activeStep =
    run.steps?.find((step) => step.status === "running") ??
    run.steps?.find((step) => step.status === "waiting_for_approval") ??
    run.steps?.at(-1);
  return (
    activeStep?.actor_name ?? labelizeSource(run.current_stage ?? "UiPath")
  );
}

function buildSharedProofManifest(
  run: SharedLiveProofRun,
  timestamp: string,
): UiPathProofManifestItem[] {
  const evidenceRefs = run.uipath_evidence_refs ?? [];
  const latestEventId = run.mirror_events?.at(-1)?.event_id;
  const taskId = run.approval_gates?.find(
    (gate) => gate.uipath_task_id,
  )?.uipath_task_id;
  const jobId = run.submission_attempts?.find(
    (attempt) => attempt.orchestrator_job_id,
  )?.orchestrator_job_id;
  const confirmationId = run.submission_attempts?.find(
    (attempt) => attempt.portal_confirmation_id ?? attempt.confirmation_id,
  );
  const sourceLabels = run.source_labels?.join(" | ");

  return [
    {
      label: "UiPath folder",
      value: "TreatmentAccessHackathon / DefaultTenant / galacticus",
      status: "ready",
      source: "uipath",
      timestamp,
    },
    {
      label: "Folder ID",
      value: "7986316",
      status: "ready",
      source: "uipath",
      timestamp,
    },
    {
      label: "Folder key",
      value: "4fba2fa1-012b-469a-b6aa-e5be3811c173",
      status: "ready",
      source: "uipath",
      timestamp,
    },
    {
      label: "Run / record ID",
      value: String(run.run_id),
      status: "available",
      source: "event_mirror",
      timestamp,
    },
    {
      label: "Event record ID",
      value: latestEventId ?? "Ready for UiPath-written event record",
      status: latestEventId ? "available" : "pending",
      source: "event_mirror",
      timestamp: run.mirror_events?.at(-1)?.timestamp ?? timestamp,
    },
    {
      label: "Action Center task ID",
      value: taskId ?? "Ready for live Action Center task",
      status: taskId ? "available" : "pending",
      source: "human",
      timestamp,
    },
    {
      label: "Orchestrator job ID",
      value: jobId ?? "Ready for live Orchestrator job",
      status: jobId ? "available" : "pending",
      source: "orchestrator",
      timestamp,
    },
    {
      label: "Portal confirmation ID",
      value:
        confirmationId?.portal_confirmation_id ??
        confirmationId?.confirmation_id ??
        "Ready for robot confirmation",
      status:
        (confirmationId?.portal_confirmation_id ??
        confirmationId?.confirmation_id)
          ? "available"
          : "pending",
      source: "orchestrator",
      timestamp: confirmationId?.completed_at ?? timestamp,
    },
    {
      label: "Source labels",
      value: sourceLabels || "Ready for source labels",
      status: sourceLabels ? "available" : "pending",
      source: "uipath",
      timestamp,
    },
    {
      label: "Safety status",
      value:
        run.no_live_uipath_side_effects === true
          ? "Ready for live UiPath proof; no side-effecting UiPath run claimed"
          : "Live UiPath proof recorded",
      status: run.no_live_uipath_side_effects === true ? "ready" : "available",
      source: "uipath",
      timestamp,
    },
    ...evidenceRefs.slice(0, 3).map((ref): UiPathProofManifestItem => ({
      label: ref.label ?? ref.evidence_ref_id ?? "Evidence reference",
      value: ref.external_id ?? ref.url ?? ref.evidence_ref_id ?? "Captured",
      status: "available",
      source: normalizeEvidenceSource(ref.source),
      timestamp: ref.captured_at ?? timestamp,
    })),
  ];
}

function buildLocalProofManifest(
  state: DemoState,
  timestamp: string,
  caseId: string,
): UiPathProofManifestItem[] {
  const robotEvent = state.events.find((event) => event.actor_type === "robot");
  const portalSubmission = state.submissions.find(
    (submission) => submission.channel === "portal_fallback",
  );
  return [
    {
      label: "UiPath folder",
      value:
        "TreatmentAccessHackathon / TACCFinalLiveProof20260629 / DefaultTenant / galacticus",
      status: "available",
      source: "uipath",
      timestamp,
    },
    {
      label: "Run / record ID",
      value: "tacc-live-uipath-proof-20260629-final",
      status: "available",
      source: "event_mirror",
      timestamp,
    },
    {
      label: "Event record ID",
      value: "B2501C19-E673-F111-AC9A-0022489A9A06",
      status: "available",
      source: "event_mirror",
      timestamp,
    },
    {
      label: "Action Center task ID",
      value: "4401667 - Completed ExternalTask",
      status: "available",
      source: "human",
      timestamp,
    },
    {
      label: "Action Center task key",
      value: "93c09da5-3edb-455e-9679-d513113fd4fa",
      status: "available",
      source: "human",
      timestamp,
    },
    {
      label: "Maestro Case instance",
      value:
        "cad900ae-e4f9-4e59-a1c8-c6f15934f5bc - faulted at action task binding",
      status: "blocked",
      source: "uipath",
      timestamp,
    },
    {
      label: "Maestro Flow instance",
      value: "4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0 - HITL ExternalTag boundary",
      status: "blocked",
      source: "uipath",
      timestamp,
    },
    {
      label: "Orchestrator job ID",
      value: "6d9b9fa9-f582-4983-98fa-167e87d57f2a",
      status: "available",
      source: "orchestrator",
      timestamp,
    },
    {
      label: "Confirmation ID",
      value:
        portalSubmission?.portal_confirmation_id ??
        "No portal confirmation; scaffold job only",
      status: portalSubmission?.portal_confirmation_id
        ? "available"
        : "blocked",
      source: "orchestrator",
      timestamp: portalSubmission?.completed_at ?? timestamp,
    },
    {
      label: "Solution deployment ID",
      value: "46ec1e63-3b09-4308-8b44-ed4b65e4e7f7",
      status: "available",
      source: "uipath",
      timestamp,
    },
    {
      label: "Safety status",
      value:
        "Live UiPath proof recorded; no real payer submission or PHI. Action Center ExternalTask completed; inline Maestro HITL and portal UIA remain production-hardening boundaries.",
      status: "available",
      source: "uipath",
      timestamp,
    },
  ];
}

function buildGenericProofManifest(
  run: LiveProofRun,
  timestamp: string,
): UiPathProofManifestItem[] {
  return [
    {
      label: "UiPath folder",
      value: "TreatmentAccessHackathon / DefaultTenant / galacticus",
      status: "ready",
      source: "uipath",
      timestamp,
    },
    {
      label: "Run / record ID",
      value: run.run_id,
      status: "available",
      source: "event_mirror",
      timestamp: run.updated_at ?? timestamp,
    },
    {
      label: "Safety status",
      value:
        run.no_live_uipath_side_effects === true
          ? "Ready for live UiPath proof; no live UiPath side effect claimed"
          : "Live proof status returned by runtime",
      status: run.no_live_uipath_side_effects === true ? "ready" : "available",
      source: "uipath",
      timestamp: run.updated_at ?? timestamp,
    },
  ];
}

function latestTimestamp(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => b.localeCompare(a))[0];
}

function labelizeSource(value: string) {
  return value.replace(/_/g, " ");
}

function sourceKindLabel(source: LiveProofSourceKind) {
  if (source === "event_mirror") return "Event mirror";
  if (source === "data_service") return "Data Service";
  if (source === "mock_api") return "Mock API";
  return source.charAt(0).toUpperCase() + source.slice(1);
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
