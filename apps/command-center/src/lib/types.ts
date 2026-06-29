import type {
  AuditEvent,
  DemoToggles,
  EvidenceMapping,
  PatientSnapshot,
  PolicyCriterion,
  TreatmentAccessCase,
  TreatmentOrder,
} from "@tacc/shared-schemas";

export type MirrorSubmission = {
  submission_id?: string;
  attempt_id?: string;
  case_id: string;
  packet_id?: string;
  channel: "api" | "portal_fallback" | "payer_api" | "payer_portal_rpa";
  status:
    "queued" | "submitted" | "failed" | "fallback_required" | "unavailable";
  submitted_at?: string;
  started_at?: string;
  completed_at?: string;
  decision_status?: "pending" | "denied" | "approved";
  denial_code?: string;
  denial_reason?: DemoToggles["denial_reason"];
  fallback_required?: boolean;
  payload_summary?: string;
  response_summary?: string;
  orchestrator_job_id?: string;
  portal_confirmation_id?: string;
  error_code?: string;
  retry_count?: number;
};

export type MirrorAppeal = {
  appeal_id: string;
  case_id: string;
  submission_id?: string;
  status?: "submitted" | "blocked";
  decision_status?: "pending" | "approved";
  submitted_at?: string;
  clinician_approved?: boolean;
};

export type MirrorHandoff = {
  handoff_id: string;
  case_id: string;
  patient_id?: string;
  order_id?: string;
  status?: "created" | "pending" | "sent" | "accepted" | "failed";
  assigned_to?: string;
  assigned_coordinator_role?: string;
  pharmacy_name?: string;
  benefits_summary?: string;
  next_step?: string;
  created_at?: string;
  updated_at?: string;
  approval_reference?: string;
};

export type MirrorSchedulingTask = {
  scheduling_task_id: string;
  case_id: string;
  handoff_id: string;
  status: string;
  owner: string;
  created_at: string;
};

export type DemoState = {
  case: TreatmentAccessCase | null;
  patient: PatientSnapshot | null;
  order: TreatmentOrder | null;
  criteria: PolicyCriterion[];
  evidenceMappings: EvidenceMapping[];
  toggles: DemoToggles;
  submissions: MirrorSubmission[];
  appeals: MirrorAppeal[];
  handoffs: MirrorHandoff[];
  schedulingTasks: MirrorSchedulingTask[];
  events: AuditEvent[];
};

export type RuntimeSource = "api" | "fallback";

export type RuntimeState = {
  data: DemoState;
  source: RuntimeSource;
  apiBaseUrl: string;
  lastFetchedAt: string;
  error: string | null;
};

export type ActorFilter =
  "all" | "agent" | "api_workflow" | "robot" | "human" | "system";
