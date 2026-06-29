import { z } from "zod";

export const IsoDateTimeSchema = z.string().datetime();
export const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const SourceSpanSchema = z.object({
  artifact_id: z.string().optional(),
  source_uri: z.string(),
  section_label: z.string().optional(),
  start_line: z.number().int().positive().optional(),
  end_line: z.number().int().positive().optional(),
  char_start: z.number().int().nonnegative().optional(),
  char_end: z.number().int().nonnegative().optional(),
  excerpt: z.string().max(280).optional(),
});

export const CitationSchema = z.object({
  citation_id: z.string(),
  label: z.string(),
  source_span: SourceSpanSchema,
});

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

export const SecondaryStageSchema = z.enum([
  "missing_evidence",
  "api_failure_portal_fallback",
  "denial_rescue_appeal",
  "clinician_rework",
  "sla_at_risk",
  "human_exception_review",
]);

export const EvidenceStatusSchema = z.enum([
  "found",
  "missing",
  "conflicting",
  "needs_human_validation",
]);

export const ExtractionMethodSchema = z.enum([
  "seeded_fixture",
  "fallback_parser",
  "document_understanding",
  "human_entered",
]);

export const ActorTypeSchema = z.enum([
  "agent",
  "api_workflow",
  "robot",
  "human",
  "system",
]);

export const PayerStatusSchema = z.enum([
  "not_submitted",
  "submitted",
  "under_review",
  "approved",
  "denied",
  "rfi",
  "appeal_submitted",
  "appeal_approved",
  "appeal_denied",
  "unavailable",
]);

export const SubmissionChannelSchema = z.enum([
  "payer_api",
  "payer_portal_rpa",
  "manual_fax_placeholder",
]);

export const HumanReviewDecisionSchema = z.enum([
  "pending",
  "approved",
  "edited",
  "rejected",
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
  active_secondary_stages: z.array(SecondaryStageSchema).default([]),
  sla_due_at: IsoDateTimeSchema,
  sla_state: z.enum(["on_track", "at_risk", "breached"]),
  outcome: z.string().nullable().default(null),
  payer_status: PayerStatusSchema.default("not_submitted"),
  last_event_at: IsoDateTimeSchema,
  synthetic_data_disclaimer: z
    .string()
    .default("Synthetic fictional demo data; not a real person or encounter."),
});

export const PatientSnapshotSchema = z.object({
  patient_id: z.string(),
  age: z.number().int().positive(),
  synthetic_name: z.string(),
  synthetic_initials: z.string().optional(),
  diagnosis_codes: z.array(z.string()),
  coverage_plan: z.string(),
  provider_id: z.string(),
  member_id: z.string().optional(),
  preferred_contact_channel: z
    .enum(["portal", "phone", "none"])
    .default("none"),
  synthetic_data_disclaimer: z
    .string()
    .default("Synthetic fictional patient for demo use only."),
});

export const TreatmentOrderSchema = z.object({
  order_id: z.string(),
  service_type: z.string(),
  medication_name: z.string(),
  dose: z.string(),
  diagnosis: z.string(),
  ordering_provider: z.string(),
  requested_start_date: IsoDateSchema,
  route: z.string().optional(),
  site_of_care: z.string().optional(),
  order_priority_reason: z.string().optional(),
  created_at: IsoDateTimeSchema.optional(),
});

export const PayerPolicySchema = z.object({
  policy_id: z.string(),
  payer_id: z.string(),
  payer_name: z.string(),
  policy_name: z.string(),
  version: z.string(),
  effective_date: IsoDateSchema,
  source_uri: z.string(),
  summary: z.string(),
  submission_channels: z.array(SubmissionChannelSchema),
  required_documents: z.array(z.string()).default([]),
  citations: z.array(CitationSchema).default([]),
});

export const PolicyCriterionSchema = z.object({
  criterion_id: z.string(),
  policy_id: z.string(),
  description: z.string(),
  required_evidence_type: z.string(),
  severity: z.enum(["blocking", "warning", "informational"]),
  must_be_clinician_attested: z.boolean(),
  policy_citation: z.string(),
  source_span: z.union([z.string(), SourceSpanSchema]),
  version: z.string(),
});

export const AttachmentMetadataSchema = z.object({
  attachment_id: z.string(),
  case_id: z.string(),
  artifact_id: z.string(),
  display_name: z.string(),
  file_name: z.string(),
  content_type: z.string(),
  source_uri: z.string(),
  purpose: z.enum([
    "policy",
    "clinical_note",
    "lab_report",
    "medication_history",
    "payer_denial",
    "appeal_packet",
    "handoff",
  ]),
  synthetic: z.literal(true),
  source_hash: z.string(),
});

export const EvidenceArtifactSchema = z.object({
  artifact_id: z.string(),
  case_id: z.string(),
  type: z.enum([
    "payer_policy",
    "progress_note",
    "lab_report",
    "medication_history",
    "attachment_metadata",
    "denial_letter",
    "clinician_attestation",
  ]),
  source_uri: z.string(),
  display_name: z.string(),
  extracted_text: z.string().optional(),
  structured_fields: z.record(z.unknown()).default({}),
  extraction_method: ExtractionMethodSchema,
  extraction_confidence: z.number().min(0).max(1),
  source_hash: z.string(),
  synthetic: z.literal(true).default(true),
});

export const EvidenceMappingSchema = z.object({
  mapping_id: z.string(),
  case_id: z.string(),
  criterion_id: z.string(),
  artifact_id: z.string().nullable(),
  status: EvidenceStatusSchema,
  evidence_summary: z.string(),
  source_quote_short: z.string().optional(),
  source_span: z.union([z.string(), SourceSpanSchema]).optional(),
  confidence: z.number().min(0).max(1),
  needs_human_review: z.boolean(),
  human_review_reason: z.string().optional(),
  reviewer_decision: HumanReviewDecisionSchema.default("pending"),
  reviewer_original_text: z.string().optional(),
  reviewer_final_text: z.string().optional(),
  reviewer_id: z.string().optional(),
  reviewed_at: IsoDateTimeSchema.optional(),
  citations: z.array(CitationSchema).default([]),
});

export const LabResultSchema = z.object({
  lab_id: z.string(),
  patient_id: z.string(),
  case_id: z.string(),
  test_name: z.string(),
  result: z.string(),
  collected_at: IsoDateTimeSchema,
  status: z.enum(["final", "missing", "pending"]),
  source_artifact_id: z.string().optional(),
  synthetic: z.literal(true).default(true),
});

export const MedicationHistoryEntrySchema = z.object({
  medication_history_id: z.string(),
  patient_id: z.string(),
  case_id: z.string(),
  medication_name: z.string(),
  therapy_class: z.string(),
  start_date: IsoDateSchema,
  end_date: IsoDateSchema.optional(),
  outcome: z.string(),
  source_artifact_id: z.string().optional(),
  synthetic: z.literal(true).default(true),
});

export const SubmissionPacketSchema = z.object({
  packet_id: z.string(),
  case_id: z.string(),
  ready_to_submit: z.boolean(),
  form_fields: z.record(z.string()),
  attachment_ids: z.array(z.string()),
  cover_letter_summary: z.string(),
  unsupported_claim_warnings: z.array(z.string()).default([]),
  built_at: IsoDateTimeSchema,
  version: z.string(),
});

export const SubmissionAttemptSchema = z.object({
  attempt_id: z.string(),
  case_id: z.string(),
  packet_id: z.string(),
  channel: SubmissionChannelSchema,
  status: z.enum(["queued", "submitted", "failed", "fallback_required"]),
  started_at: IsoDateTimeSchema,
  completed_at: IsoDateTimeSchema.optional(),
  payload_summary: z.string(),
  response_summary: z.string().optional(),
  orchestrator_job_id: z.string().optional(),
  portal_confirmation_id: z.string().optional(),
  error_code: z.string().optional(),
  retry_count: z.number().int().nonnegative().default(0),
});

export const PayerDecisionSchema = z.object({
  decision_id: z.string(),
  case_id: z.string(),
  submission_attempt_id: z.string(),
  status: PayerStatusSchema,
  reason: z.string(),
  denial_code: z.string().optional(),
  policy_citation: z.string().optional(),
  appeal_deadline: IsoDateSchema.optional(),
  raw_response: z.string().optional(),
  source_artifact_id: z.string().optional(),
});

export const AppealPacketSchema = z.object({
  appeal_id: z.string(),
  case_id: z.string(),
  denial_reason: z.string(),
  appeal_strategy: z.string(),
  evidence_used: z.array(z.string()),
  draft_text: z.string(),
  unsupported_claim_warnings: z.array(z.string()).default([]),
  clinician_approved: z.boolean(),
  clinician_edits: z.string().optional(),
  submitted_at: IsoDateTimeSchema.optional(),
  version: z.string(),
  citations: z.array(CitationSchema).default([]),
});

export const PharmacyHandoffSchema = z.object({
  handoff_id: z.string(),
  case_id: z.string(),
  status: z.enum(["pending", "sent", "accepted", "failed"]),
  pharmacy_name: z.string(),
  assigned_coordinator_role: z.string(),
  benefits_summary: z.string(),
  next_step: z.string(),
  scheduling_task_id: z.string().optional(),
  created_at: IsoDateTimeSchema,
  updated_at: IsoDateTimeSchema,
});

export const HumanTaskSchema = z.object({
  task_id: z.string(),
  case_id: z.string(),
  task_type: z.enum([
    "evidence_approval",
    "missing_evidence",
    "appeal_signoff",
    "exception_review",
  ]),
  status: z.enum(["pending", "completed", "cancelled"]),
  assigned_role: z.string(),
  prompt: z.string(),
  due_at: IsoDateTimeSchema,
  completed_at: IsoDateTimeSchema.optional(),
});

export const AgentTraceSchema = z.object({
  trace_id: z.string(),
  case_id: z.string(),
  agent_name: z.string(),
  status: z.enum([
    "not_started",
    "running",
    "completed",
    "needs_human",
    "failed",
  ]),
  input_summary: z.string(),
  output_summary: z.string(),
  tool_calls: z.array(z.string()).default([]),
  evidence_refs: z.array(z.string()).default([]),
  started_at: IsoDateTimeSchema,
  completed_at: IsoDateTimeSchema.optional(),
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
  payer_status: PayerStatusSchema.optional(),
  timestamp: IsoDateTimeSchema,
});

export const AgentIdSchema = z.enum([
  "coverage-requirement",
  "evidence-retrieval",
  "missing-evidence",
  "submission-packet",
  "denial-rescue",
  "appeal-packet",
  "care-continuity",
]);

export const AgentDisplayNameById = {
  "coverage-requirement": "Coverage Requirement Agent",
  "evidence-retrieval": "Evidence Retrieval Agent",
  "missing-evidence": "Missing Evidence Agent",
  "submission-packet": "Submission Packet Agent",
  "denial-rescue": "Denial Rescue Agent",
  "appeal-packet": "Appeal Packet Agent",
  "care-continuity": "Care Continuity Agent",
} as const;

export const SafetyFlagSchema = z.object({
  flag_id: z.string(),
  severity: z.enum(["info", "warning", "blocking"]),
  code: z.string(),
  message: z.string(),
  evidence_refs: z.array(z.string()).default([]),
  requires_human_approval: z.boolean().default(false),
});

export const ClinicalAssertionReviewSchema = z.object({
  assertion_id: z.string(),
  statement: z.string(),
  status: z.enum(["supported", "needs_human_approval", "unsupported"]),
  evidence_refs: z.array(z.string()).default([]),
  policy_citations: z.array(z.string()).default([]),
  human_approval_required: z.boolean(),
  warning: z.string().optional(),
});

const BaseAgentInputSchema = z.object({
  case: TreatmentAccessCaseSchema,
  patient: PatientSnapshotSchema,
  order: TreatmentOrderSchema,
  demo_toggles: z.lazy(() => DemoTogglesSchema),
});

export const CoverageRequirementAgentInputSchema = BaseAgentInputSchema.extend({
  agent_id: z.literal("coverage-requirement"),
  payer_policy: PayerPolicySchema,
  criteria: z.array(PolicyCriterionSchema),
});

export const CoverageRequirementAgentOutputSchema = z.object({
  agent_id: z.literal("coverage-requirement"),
  authorization_required: z.boolean(),
  policy_id: z.string(),
  policy_version: z.string(),
  required_criteria: z.array(PolicyCriterionSchema),
  required_documents: z.array(z.string()),
  submission_channels: z.array(SubmissionChannelSchema),
  evidence_refs: z.array(z.string()).default([]),
  safety_flags: z.array(SafetyFlagSchema).default([]),
});

export const EvidenceRetrievalAgentInputSchema = BaseAgentInputSchema.extend({
  agent_id: z.literal("evidence-retrieval"),
  criteria: z.array(PolicyCriterionSchema),
  artifacts: z.array(EvidenceArtifactSchema),
  labs: z.array(LabResultSchema),
  medication_history: z.array(MedicationHistoryEntrySchema),
});

export const EvidenceRetrievalAgentOutputSchema = z.object({
  agent_id: z.literal("evidence-retrieval"),
  evidence_mappings: z.array(EvidenceMappingSchema),
  evidence_refs: z.array(z.string()).default([]),
  clinical_assertions: z.array(ClinicalAssertionReviewSchema),
  extraction_methods_used: z.array(ExtractionMethodSchema),
  safety_flags: z.array(SafetyFlagSchema).default([]),
});

export const MissingEvidenceAgentInputSchema = BaseAgentInputSchema.extend({
  agent_id: z.literal("missing-evidence"),
  criteria: z.array(PolicyCriterionSchema),
  evidence_mappings: z.array(EvidenceMappingSchema),
  human_tasks: z.array(HumanTaskSchema),
});

export const MissingEvidenceAgentOutputSchema = z.object({
  agent_id: z.literal("missing-evidence"),
  can_submit: z.boolean(),
  missing_blocking_criteria: z.array(PolicyCriterionSchema),
  missing_evidence_mappings: z.array(EvidenceMappingSchema),
  human_tasks_to_create: z.array(HumanTaskSchema),
  remediation_summary: z.string(),
  safety_flags: z.array(SafetyFlagSchema).default([]),
});

export const SubmissionPacketAgentInputSchema = BaseAgentInputSchema.extend({
  agent_id: z.literal("submission-packet"),
  evidence_mappings: z.array(EvidenceMappingSchema),
  attachments: z.array(AttachmentMetadataSchema),
  existing_packet: SubmissionPacketSchema,
});

export const SubmissionPacketAgentOutputSchema = z.object({
  agent_id: z.literal("submission-packet"),
  packet: SubmissionPacketSchema,
  ready_to_submit: z.boolean(),
  blocked_reasons: z.array(z.string()),
  next_channel: SubmissionChannelSchema.optional(),
  safety_flags: z.array(SafetyFlagSchema).default([]),
});

export const DenialReasonCategorySchema = z.enum([
  "step_therapy",
  "safety_screen",
  "documentation_gap",
]);

export const DenialRescueAgentInputSchema = BaseAgentInputSchema.extend({
  agent_id: z.literal("denial-rescue"),
  payer_decision: PayerDecisionSchema,
  evidence_mappings: z.array(EvidenceMappingSchema),
});

export const DenialRescueAgentOutputSchema = z.object({
  agent_id: z.literal("denial-rescue"),
  payer_decision: PayerDecisionSchema,
  denial_reason_category: DenialReasonCategorySchema,
  appeal_strategy: z.string(),
  evidence_gap_ids: z.array(z.string()),
  evidence_refs: z.array(z.string()).default([]),
  safety_flags: z.array(SafetyFlagSchema).default([]),
});

export const AppealPacketAgentInputSchema = BaseAgentInputSchema.extend({
  agent_id: z.literal("appeal-packet"),
  payer_decision: PayerDecisionSchema,
  evidence_mappings: z.array(EvidenceMappingSchema),
  prior_appeal_packet: AppealPacketSchema,
});

export const AppealPacketAgentOutputSchema = z.object({
  agent_id: z.literal("appeal-packet"),
  appeal_packet: AppealPacketSchema,
  administrative_draft_only: z.literal(true),
  clinician_review_required: z.boolean(),
  unsupported_claim_warnings: z.array(z.string()),
  safety_flags: z.array(SafetyFlagSchema).default([]),
});

export const CareContinuityAgentInputSchema = BaseAgentInputSchema.extend({
  agent_id: z.literal("care-continuity"),
  payer_status: PayerStatusSchema,
  pharmacy_handoff: PharmacyHandoffSchema,
});

export const CareContinuityAgentOutputSchema = z.object({
  agent_id: z.literal("care-continuity"),
  should_create_handoff: z.boolean(),
  handoff: PharmacyHandoffSchema,
  blocked_reason: z.string().optional(),
  safety_flags: z.array(SafetyFlagSchema).default([]),
});

export const AgentInputSchema = z.discriminatedUnion("agent_id", [
  CoverageRequirementAgentInputSchema,
  EvidenceRetrievalAgentInputSchema,
  MissingEvidenceAgentInputSchema,
  SubmissionPacketAgentInputSchema,
  DenialRescueAgentInputSchema,
  AppealPacketAgentInputSchema,
  CareContinuityAgentInputSchema,
]);

export const AgentOutputSchema = z.discriminatedUnion("agent_id", [
  CoverageRequirementAgentOutputSchema,
  EvidenceRetrievalAgentOutputSchema,
  MissingEvidenceAgentOutputSchema,
  SubmissionPacketAgentOutputSchema,
  DenialRescueAgentOutputSchema,
  AppealPacketAgentOutputSchema,
  CareContinuityAgentOutputSchema,
]);

export const AgentRuntimeResultSchema = z.object({
  agent_id: AgentIdSchema,
  trace: AgentTraceSchema,
  audit_event: AuditEventSchema,
  output: AgentOutputSchema,
});

export const AgentRuntimeSummarySchema = z.object({
  case_id: z.string(),
  generated_at: IsoDateTimeSchema,
  results: z.array(AgentRuntimeResultSchema),
  safety_flags: z.array(SafetyFlagSchema).default([]),
  evidence_refs: z.array(z.string()).default([]),
  synthetic_data_disclaimer: z
    .string()
    .default(
      "Synthetic deterministic agent runtime; no live UiPath execution.",
    ),
});

export const DemoTogglesSchema = z.object({
  missing_safety_lab: z.boolean().default(false),
  payer_api_unavailable: z.boolean().default(false),
  denial_reason: z
    .enum([
      "step_therapy",
      "safety_screen",
      "medical_necessity",
      "documentation_gap",
    ])
    .default("step_therapy"),
  clinician_rejects_assertion: z.boolean().default(false),
  force_low_confidence_extraction: z.boolean().default(false),
  pharmacy_handoff_failure: z.boolean().default(false),
});

export const DemoFixtureSchema = z.object({
  case: TreatmentAccessCaseSchema,
  patient: PatientSnapshotSchema,
  order: TreatmentOrderSchema,
  payerPolicy: PayerPolicySchema,
  criteria: z.array(PolicyCriterionSchema),
  artifacts: z.array(EvidenceArtifactSchema),
  attachments: z.array(AttachmentMetadataSchema),
  evidenceMappings: z.array(EvidenceMappingSchema),
  labs: z.array(LabResultSchema),
  medicationHistory: z.array(MedicationHistoryEntrySchema),
  submissionPacket: SubmissionPacketSchema,
  submissionAttempts: z.array(SubmissionAttemptSchema),
  payerDecisions: z.array(PayerDecisionSchema),
  appealPacket: AppealPacketSchema,
  pharmacyHandoff: PharmacyHandoffSchema,
  humanTasks: z.array(HumanTaskSchema),
  agentTraces: z.array(AgentTraceSchema),
  auditEvents: z.array(AuditEventSchema),
  demoToggles: DemoTogglesSchema,
});

export type SourceSpan = z.infer<typeof SourceSpanSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type TreatmentAccessCase = z.infer<typeof TreatmentAccessCaseSchema>;
export type PatientSnapshot = z.infer<typeof PatientSnapshotSchema>;
export type TreatmentOrder = z.infer<typeof TreatmentOrderSchema>;
export type PayerPolicy = z.infer<typeof PayerPolicySchema>;
export type PolicyCriterion = z.infer<typeof PolicyCriterionSchema>;
export type AttachmentMetadata = z.infer<typeof AttachmentMetadataSchema>;
export type EvidenceArtifact = z.infer<typeof EvidenceArtifactSchema>;
export type EvidenceMapping = z.infer<typeof EvidenceMappingSchema>;
export type LabResult = z.infer<typeof LabResultSchema>;
export type MedicationHistoryEntry = z.infer<
  typeof MedicationHistoryEntrySchema
>;
export type SubmissionPacket = z.infer<typeof SubmissionPacketSchema>;
export type SubmissionAttempt = z.infer<typeof SubmissionAttemptSchema>;
export type PayerDecision = z.infer<typeof PayerDecisionSchema>;
export type AppealPacket = z.infer<typeof AppealPacketSchema>;
export type PharmacyHandoff = z.infer<typeof PharmacyHandoffSchema>;
export type HumanTask = z.infer<typeof HumanTaskSchema>;
export type AgentTrace = z.infer<typeof AgentTraceSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AgentId = z.infer<typeof AgentIdSchema>;
export type SafetyFlag = z.infer<typeof SafetyFlagSchema>;
export type ClinicalAssertionReview = z.infer<
  typeof ClinicalAssertionReviewSchema
>;
export type CoverageRequirementAgentInput = z.infer<
  typeof CoverageRequirementAgentInputSchema
>;
export type CoverageRequirementAgentOutput = z.infer<
  typeof CoverageRequirementAgentOutputSchema
>;
export type EvidenceRetrievalAgentInput = z.infer<
  typeof EvidenceRetrievalAgentInputSchema
>;
export type EvidenceRetrievalAgentOutput = z.infer<
  typeof EvidenceRetrievalAgentOutputSchema
>;
export type MissingEvidenceAgentInput = z.infer<
  typeof MissingEvidenceAgentInputSchema
>;
export type MissingEvidenceAgentOutput = z.infer<
  typeof MissingEvidenceAgentOutputSchema
>;
export type SubmissionPacketAgentInput = z.infer<
  typeof SubmissionPacketAgentInputSchema
>;
export type SubmissionPacketAgentOutput = z.infer<
  typeof SubmissionPacketAgentOutputSchema
>;
export type DenialReasonCategory = z.infer<typeof DenialReasonCategorySchema>;
export type DenialRescueAgentInput = z.infer<
  typeof DenialRescueAgentInputSchema
>;
export type DenialRescueAgentOutput = z.infer<
  typeof DenialRescueAgentOutputSchema
>;
export type AppealPacketAgentInput = z.infer<
  typeof AppealPacketAgentInputSchema
>;
export type AppealPacketAgentOutput = z.infer<
  typeof AppealPacketAgentOutputSchema
>;
export type CareContinuityAgentInput = z.infer<
  typeof CareContinuityAgentInputSchema
>;
export type CareContinuityAgentOutput = z.infer<
  typeof CareContinuityAgentOutputSchema
>;
export type AgentInput = z.infer<typeof AgentInputSchema>;
export type AgentOutput = z.infer<typeof AgentOutputSchema>;
export type AgentRuntimeResult = z.infer<typeof AgentRuntimeResultSchema>;
export type AgentRuntimeSummary = z.infer<typeof AgentRuntimeSummarySchema>;
export type DemoToggles = z.infer<typeof DemoTogglesSchema>;
export type DemoFixture = z.infer<typeof DemoFixtureSchema>;
