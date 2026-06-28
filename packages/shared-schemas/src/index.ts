import { z } from "zod";

export const CaseStageSchema = z.enum([
  "intake",
  "policy_evidence",
  "clinical_validation",
  "submission",
  "payer_decision",
  "denial_rescue",
  "care_continuity",
  "closure",
]);

export const EvidenceStatusSchema = z.enum([
  "found",
  "missing",
  "conflicting",
  "needs_human_validation",
]);

export const ActorTypeSchema = z.enum([
  "agent",
  "api_workflow",
  "robot",
  "human",
  "system",
]);

export const TreatmentAccessCaseSchema = z.object({
  case_id: z.string(),
  external_case_key: z.string().optional(),
  maestro_case_id: z.string().optional(),
  patient_id: z.string(),
  order_id: z.string(),
  payer_id: z.string(),
  service_type: z.string(),
  medication_name: z.string(),
  urgency: z.enum(["routine", "urgent"]),
  status: z.string(),
  current_stage: CaseStageSchema,
  active_secondary_stages: z.array(z.string()).default([]),
  sla_due_at: z.string(),
  sla_state: z.enum(["on_track", "at_risk", "breached"]),
  outcome: z.string().nullable().default(null),
  last_event_at: z.string(),
});

export const PatientSnapshotSchema = z.object({
  patient_id: z.string(),
  age: z.number().int().positive(),
  synthetic_name: z.string(),
  diagnosis_codes: z.array(z.string()),
  coverage_plan: z.string(),
  provider_id: z.string(),
});

export const TreatmentOrderSchema = z.object({
  order_id: z.string(),
  service_type: z.string(),
  medication_name: z.string(),
  dose: z.string(),
  diagnosis: z.string(),
  ordering_provider: z.string(),
  requested_start_date: z.string(),
});

export const PolicyCriterionSchema = z.object({
  criterion_id: z.string(),
  policy_id: z.string(),
  description: z.string(),
  required_evidence_type: z.string(),
  severity: z.enum(["blocking", "warning", "informational"]),
  must_be_clinician_attested: z.boolean(),
  policy_citation: z.string(),
  source_span: z.string(),
  version: z.string(),
});

export const EvidenceMappingSchema = z.object({
  mapping_id: z.string(),
  case_id: z.string(),
  criterion_id: z.string(),
  artifact_id: z.string().nullable(),
  status: EvidenceStatusSchema,
  evidence_summary: z.string(),
  source_quote_short: z.string().optional(),
  source_span: z.string().optional(),
  confidence: z.number().min(0).max(1),
  needs_human_review: z.boolean(),
  human_review_reason: z.string().optional(),
  reviewer_decision: z
    .enum(["pending", "approved", "edited", "rejected"])
    .default("pending"),
});

export const AuditEventSchema = z.object({
  event_id: z.string(),
  case_id: z.string(),
  maestro_case_id: z.string().optional(),
  actor_type: ActorTypeSchema,
  actor_name: z.string(),
  task_or_agent_name: z.string(),
  action: z.string(),
  input_summary: z.string(),
  output_summary: z.string(),
  evidence_refs: z.array(z.string()).default([]),
  trace_id: z.string().optional(),
  orchestrator_job_id: z.string().optional(),
  timestamp: z.string(),
});

export const DemoTogglesSchema = z.object({
  missing_safety_lab: z.boolean().default(false),
  payer_api_unavailable: z.boolean().default(false),
  denial_reason: z
    .enum(["step_therapy", "safety_screen", "medical_necessity"])
    .default("step_therapy"),
  clinician_rejects_assertion: z.boolean().default(false),
});

export type TreatmentAccessCase = z.infer<typeof TreatmentAccessCaseSchema>;
export type PatientSnapshot = z.infer<typeof PatientSnapshotSchema>;
export type TreatmentOrder = z.infer<typeof TreatmentOrderSchema>;
export type PolicyCriterion = z.infer<typeof PolicyCriterionSchema>;
export type EvidenceMapping = z.infer<typeof EvidenceMappingSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type DemoToggles = z.infer<typeof DemoTogglesSchema>;
