import {
  denialLetterScenarios,
  missingEvidenceMappings,
  missingSafetyLabScenario,
  treatmentAccessDemoFixture,
} from "@tacc/demo-data";
import {
  AgentDisplayNameById,
  AgentRuntimeSummarySchema,
  DemoTogglesSchema,
  type AgentId,
  type DenialReasonCategory,
  type AgentOutput,
  type AgentRuntimeResult,
  type AgentRuntimeSummary,
  type AppealPacket,
  type AuditEvent,
  type ClinicalAssertionReview,
  type DemoFixture,
  type DemoToggles,
  type EvidenceMapping,
  type HumanTask,
  type PayerDecision,
  type PharmacyHandoff,
  type PolicyCriterion,
  type SafetyFlag,
  type SubmissionPacket,
} from "@tacc/shared-schemas";

const generatedAt = "2026-06-28T22:40:00.000Z";

const agentOrder: AgentId[] = [
  "coverage-requirement",
  "evidence-retrieval",
  "missing-evidence",
  "submission-packet",
  "denial-rescue",
  "appeal-packet",
  "care-continuity",
];

export type TreatmentAccessAgentRuntimeOptions = {
  fixture?: DemoFixture;
  toggles?: Partial<DemoToggles>;
};

type RuntimeContext = {
  fixture: DemoFixture;
  toggles: DemoToggles;
  evidenceMappings: EvidenceMapping[];
  payerDecision: PayerDecision;
};

export function listTreatmentAccessAgents(): AgentId[] {
  return [...agentOrder];
}

export function runTreatmentAccessAgents(
  options: TreatmentAccessAgentRuntimeOptions = {},
): AgentRuntimeSummary {
  const context = createRuntimeContext(options);
  const results = agentOrder.map((agentId) => runAgent(agentId, context));
  const safetyFlags = results.flatMap((result) => result.output.safety_flags);
  const evidenceRefs = unique(
    results.flatMap((result) => result.trace.evidence_refs),
  );

  return AgentRuntimeSummarySchema.parse({
    case_id: context.fixture.case.case_id,
    generated_at: generatedAt,
    results,
    safety_flags: safetyFlags,
    evidence_refs: evidenceRefs,
    synthetic_data_disclaimer:
      "Synthetic deterministic agent runtime; no live UiPath execution.",
  });
}

export function runTreatmentAccessAgent(
  agentId: AgentId,
  options: TreatmentAccessAgentRuntimeOptions = {},
): AgentRuntimeResult {
  return runAgent(agentId, createRuntimeContext(options));
}

function createRuntimeContext(
  options: TreatmentAccessAgentRuntimeOptions,
): RuntimeContext {
  const fixture = options.fixture ?? treatmentAccessDemoFixture;
  const toggles = DemoTogglesSchema.parse({
    ...fixture.demoToggles,
    ...options.toggles,
  });

  return {
    fixture,
    toggles,
    evidenceMappings: evidenceMappingsForToggles(fixture, toggles),
    payerDecision: payerDecisionForToggles(fixture, toggles),
  };
}

function runAgent(
  agentId: AgentId,
  context: RuntimeContext,
): AgentRuntimeResult {
  const output = outputForAgent(agentId, context);
  const evidenceRefs = evidenceRefsForOutput(output);
  const needsHuman = output.safety_flags.some(
    (flag) => flag.requires_human_approval || flag.severity === "blocking",
  );
  const status = needsHuman ? "needs_human" : "completed";
  const traceId = `trace-runtime-${agentId}`;
  const outputSummary = outputSummaryForAgent(agentId, output);
  const displayName = AgentDisplayNameById[agentId];

  const trace = {
    trace_id: traceId,
    case_id: context.fixture.case.case_id,
    agent_name: displayName,
    status,
    input_summary: inputSummaryForAgent(agentId, context),
    output_summary: outputSummary,
    tool_calls: toolCallsForAgent(agentId),
    evidence_refs: evidenceRefs,
    started_at: generatedAt,
    completed_at: generatedAt,
  } satisfies AgentRuntimeResult["trace"];

  const auditEvent: AuditEvent = {
    event_id: `event-runtime-${agentId}`,
    case_id: context.fixture.case.case_id,
    maestro_case_id: context.fixture.case.maestro_case_id,
    actor_type: "agent",
    actor_name: displayName,
    task_or_agent_name: displayName,
    action: actionForAgent(agentId),
    input_summary: trace.input_summary,
    output_summary: outputSummary,
    evidence_refs: evidenceRefs,
    trace_id: traceId,
    payer_status: payerStatusForAgent(agentId),
    timestamp: generatedAt,
  };

  return {
    agent_id: agentId,
    trace,
    audit_event: auditEvent,
    output,
  };
}

function outputForAgent(
  agentId: AgentId,
  context: RuntimeContext,
): AgentOutput {
  switch (agentId) {
    case "coverage-requirement":
      return coverageRequirementOutput(context);
    case "evidence-retrieval":
      return evidenceRetrievalOutput(context);
    case "missing-evidence":
      return missingEvidenceOutput(context);
    case "submission-packet":
      return submissionPacketOutput(context);
    case "denial-rescue":
      return denialRescueOutput(context);
    case "appeal-packet":
      return appealPacketOutput(context);
    case "care-continuity":
      return careContinuityOutput(context);
  }
}

function coverageRequirementOutput(context: RuntimeContext): AgentOutput {
  return {
    agent_id: "coverage-requirement",
    authorization_required: true,
    policy_id: context.fixture.payerPolicy.policy_id,
    policy_version: context.fixture.payerPolicy.version,
    required_criteria: context.fixture.criteria,
    required_documents: context.fixture.payerPolicy.required_documents,
    submission_channels: context.fixture.payerPolicy.submission_channels,
    evidence_refs: ["artifact-policy"],
    safety_flags: [
      {
        flag_id: "flag-policy-citations-required",
        severity: "info",
        code: "POLICY_CITATIONS_PRESENT",
        message:
          "Policy criteria include fixture citations and must remain source-grounded.",
        evidence_refs: ["artifact-policy"],
        requires_human_approval: false,
      },
    ],
  };
}

function evidenceRetrievalOutput(context: RuntimeContext): AgentOutput {
  const clinicalAssertions = clinicalAssertionsForMappings(
    context.evidenceMappings,
    context.toggles,
  );
  const safetyFlags = [
    ...missingSafetyFlags(context.evidenceMappings),
    ...clinicalAssertionSafetyFlags(clinicalAssertions),
  ];
  const extractionMethods = unique(
    context.fixture.artifacts.map((artifact) => artifact.extraction_method),
  );

  return {
    agent_id: "evidence-retrieval",
    evidence_mappings: context.evidenceMappings,
    evidence_refs: artifactIdsFromMappings(context.evidenceMappings),
    clinical_assertions: clinicalAssertions,
    extraction_methods_used: extractionMethods,
    safety_flags: safetyFlags,
  };
}

function missingEvidenceOutput(context: RuntimeContext): AgentOutput {
  const missingMappings = context.evidenceMappings.filter(
    (mapping) => mapping.status === "missing",
  );
  const missingBlockingCriteria = context.fixture.criteria.filter(
    (criterion) =>
      criterion.severity === "blocking" &&
      missingMappings.some(
        (mapping) => mapping.criterion_id === criterion.criterion_id,
      ),
  );
  const humanTasks = context.fixture.humanTasks.filter((task) =>
    missingMappings.some((mapping) =>
      task.prompt
        .toLowerCase()
        .includes(criterionLabel(mapping.criterion_id).toLowerCase()),
    ),
  );

  return {
    agent_id: "missing-evidence",
    can_submit: missingBlockingCriteria.length === 0,
    missing_blocking_criteria: missingBlockingCriteria,
    missing_evidence_mappings: missingMappings,
    human_tasks_to_create: humanTasks,
    remediation_summary:
      missingBlockingCriteria.length > 0
        ? "Blocking synthetic safety evidence must be supplied before payer submission."
        : "No blocking missing evidence detected in the synthetic fixture.",
    safety_flags: missingSafetyFlags(context.evidenceMappings),
  };
}

function submissionPacketOutput(context: RuntimeContext): AgentOutput {
  const missingBlocking = blockingMissingCriteria(
    context.fixture.criteria,
    context.evidenceMappings,
  );
  const clinicalAssertions = clinicalAssertionsForMappings(
    context.evidenceMappings,
    context.toggles,
  );
  const unsupportedClaimWarnings = unsupportedWarnings(clinicalAssertions);
  const blockedReasons = [
    ...missingBlocking.map(
      (criterion) => `Missing blocking evidence for ${criterion.criterion_id}.`,
    ),
    ...unsupportedClaimWarnings,
  ];
  const readyToSubmit = blockedReasons.length === 0;
  const packet: SubmissionPacket = {
    ...context.fixture.submissionPacket,
    ready_to_submit: readyToSubmit,
    attachment_ids: readyToSubmit
      ? context.fixture.submissionPacket.attachment_ids
      : context.fixture.submissionPacket.attachment_ids.filter(
          (attachmentId) => attachmentId !== "attachment-safety-labs",
        ),
    unsupported_claim_warnings: unsupportedClaimWarnings,
  };

  return {
    agent_id: "submission-packet",
    packet,
    ready_to_submit: readyToSubmit,
    blocked_reasons: blockedReasons,
    next_channel: readyToSubmit ? "payer_api" : undefined,
    safety_flags: [
      ...missingSafetyFlags(context.evidenceMappings),
      ...clinicalAssertionSafetyFlags(clinicalAssertions),
    ],
  };
}

function denialRescueOutput(context: RuntimeContext): AgentOutput {
  const category = denialReasonCategory(context.toggles.denial_reason);
  const strategyByReason: Record<DenialReasonCategory, string> = {
    step_therapy:
      "Use the synthetic medication history to clarify two prior preferred therapy outcomes.",
    safety_screen:
      "Attach the synthetic TB and hepatitis screening evidence before requesting reconsideration.",
    documentation_gap:
      "Resolve the documentation gap with cited diagnosis and severity evidence routed for clinician attestation.",
  };
  const evidenceGapIdsByReason: Record<DenialReasonCategory, string[]> = {
    step_therapy: ["mapping-step-therapy"],
    safety_screen: ["mapping-safety-screen"],
    documentation_gap: ["mapping-diagnosis"],
  };

  return {
    agent_id: "denial-rescue",
    payer_decision: context.payerDecision,
    denial_reason_category: category,
    appeal_strategy: strategyByReason[category],
    evidence_gap_ids: evidenceGapIdsByReason[category],
    evidence_refs: refsForMappings(
      context.evidenceMappings,
      evidenceGapIdsByReason[category],
    ),
    safety_flags:
      category === "documentation_gap"
        ? [
            {
              flag_id: "flag-documentation-gap-human-approval",
              severity: "warning",
              code: "CLINICAL_ASSERTION_REVIEW_REQUIRED",
              message:
                "Documentation-gap appeal strategy depends on clinician-approved clinical assertions.",
              evidence_refs: ["artifact-progress-note"],
              requires_human_approval: true,
            },
          ]
        : [],
  };
}

function denialReasonCategory(
  reason: DemoToggles["denial_reason"],
): DenialReasonCategory {
  return reason === "medical_necessity" ? "documentation_gap" : reason;
}

function appealPacketOutput(context: RuntimeContext): AgentOutput {
  const clinicalAssertions = clinicalAssertionsForMappings(
    context.evidenceMappings,
    context.toggles,
  );
  const warnings = unique([
    ...unsupportedWarnings(clinicalAssertions),
    "Administrative draft for clinician review only; not autonomous medical or legal advice.",
  ]);
  const strategy = denialRescueOutput(context);
  const appealPacket: AppealPacket = {
    ...context.fixture.appealPacket,
    denial_reason: context.payerDecision.reason,
    appeal_strategy:
      strategy.agent_id === "denial-rescue"
        ? strategy.appeal_strategy
        : context.fixture.appealPacket.appeal_strategy,
    evidence_used:
      strategy.agent_id === "denial-rescue"
        ? strategy.evidence_gap_ids
        : context.fixture.appealPacket.evidence_used,
    draft_text: [
      "Administrative draft for clinician review.",
      strategy.agent_id === "denial-rescue"
        ? strategy.appeal_strategy
        : context.fixture.appealPacket.appeal_strategy,
      "This synthetic appeal text is not medical or legal advice and must be approved by a clinician before submission.",
    ].join(" "),
    unsupported_claim_warnings: warnings,
    clinician_approved: false,
  };

  return {
    agent_id: "appeal-packet",
    appeal_packet: appealPacket,
    administrative_draft_only: true,
    clinician_review_required: true,
    unsupported_claim_warnings: warnings,
    safety_flags: [
      {
        flag_id: "flag-appeal-clinician-signoff",
        severity: "warning",
        code: "APPEAL_SIGNOFF_REQUIRED",
        message:
          "Appeal draft cannot be submitted until clinician review is complete.",
        evidence_refs: appealPacket.evidence_used,
        requires_human_approval: true,
      },
      ...clinicalAssertionSafetyFlags(clinicalAssertions),
    ],
  };
}

function careContinuityOutput(context: RuntimeContext): AgentOutput {
  const approved =
    context.payerDecision.status === "approved" ||
    context.payerDecision.status === "appeal_approved";
  const shouldCreate = approved && !context.toggles.pharmacy_handoff_failure;
  const handoff: PharmacyHandoff = {
    ...context.fixture.pharmacyHandoff,
    status: shouldCreate ? "sent" : "pending",
    next_step: shouldCreate
      ? "Send synthetic approval and onboarding summary to demo specialty pharmacy."
      : context.fixture.pharmacyHandoff.next_step,
  };

  return {
    agent_id: "care-continuity",
    should_create_handoff: shouldCreate,
    handoff,
    blocked_reason: shouldCreate
      ? undefined
      : "Awaiting payer or appeal approval before pharmacy handoff.",
    safety_flags: context.toggles.pharmacy_handoff_failure
      ? [
          {
            flag_id: "flag-pharmacy-handoff-failed",
            severity: "warning",
            code: "PHARMACY_HANDOFF_RETRY_REQUIRED",
            message:
              "Synthetic pharmacy handoff failed and needs coordinator follow-up.",
            evidence_refs: [],
            requires_human_approval: false,
          },
        ]
      : [],
  };
}

function evidenceMappingsForToggles(
  fixture: DemoFixture,
  toggles: DemoToggles,
): EvidenceMapping[] {
  if (!toggles.missing_safety_lab) {
    return fixture.evidenceMappings;
  }

  const byId = new Map(
    missingEvidenceMappings.map((mapping) => [mapping.mapping_id, mapping]),
  );
  return fixture.evidenceMappings.map(
    (mapping) => byId.get(mapping.mapping_id) ?? mapping,
  );
}

function payerDecisionForToggles(
  fixture: DemoFixture,
  toggles: DemoToggles,
): PayerDecision {
  return (
    denialLetterScenarios[toggles.denial_reason] ?? fixture.payerDecisions[0]
  );
}

function clinicalAssertionsForMappings(
  mappings: EvidenceMapping[],
  toggles: DemoToggles,
): ClinicalAssertionReview[] {
  const diagnosisMapping = mappings.find(
    (mapping) => mapping.criterion_id === "criterion-diagnosis",
  );
  if (!diagnosisMapping) {
    return [];
  }

  return [
    {
      assertion_id: "assertion-diagnosis-severity",
      statement:
        "Synthetic record supports diagnosis and moderate-to-severe disease activity.",
      status: toggles.clinician_rejects_assertion
        ? "unsupported"
        : "needs_human_approval",
      evidence_refs: artifactIdsFromMappings([diagnosisMapping]),
      policy_citations: diagnosisMapping.citations.map(
        (citation) => citation.label,
      ),
      human_approval_required: true,
      warning: toggles.clinician_rejects_assertion
        ? "Clinician rejected this assertion; do not include in payer-facing language."
        : "High-impact clinical assertion requires clinician approval before submission.",
    },
  ];
}

function missingSafetyFlags(mappings: EvidenceMapping[]): SafetyFlag[] {
  const safetyMapping = mappings.find(
    (mapping) => mapping.criterion_id === "criterion-safety-screen",
  );
  if (safetyMapping?.status !== "missing") {
    return [];
  }

  return [
    {
      flag_id: "flag-missing-safety-lab",
      severity: "blocking",
      code: "MISSING_SAFETY_LAB",
      message:
        "Missing synthetic TB/hepatitis safety lab blocks payer submission.",
      evidence_refs: [],
      requires_human_approval: true,
    },
  ];
}

function clinicalAssertionSafetyFlags(
  assertions: ClinicalAssertionReview[],
): SafetyFlag[] {
  return assertions
    .filter((assertion) => assertion.status !== "supported")
    .map((assertion) => ({
      flag_id: `flag-${assertion.assertion_id}`,
      severity: assertion.status === "unsupported" ? "blocking" : "warning",
      code:
        assertion.status === "unsupported"
          ? "UNSUPPORTED_CLINICAL_ASSERTION"
          : "CLINICAL_ASSERTION_REVIEW_REQUIRED",
      message:
        assertion.warning ??
        "Clinical assertion needs evidence, policy citation, or human approval.",
      evidence_refs: assertion.evidence_refs,
      requires_human_approval: assertion.human_approval_required,
    }));
}

function unsupportedWarnings(assertions: ClinicalAssertionReview[]): string[] {
  return assertions
    .filter((assertion) => assertion.status !== "supported")
    .map((assertion) => assertion.warning)
    .filter((warning): warning is string => Boolean(warning));
}

function blockingMissingCriteria(
  criteria: PolicyCriterion[],
  mappings: EvidenceMapping[],
): PolicyCriterion[] {
  return criteria.filter(
    (criterion) =>
      criterion.severity === "blocking" &&
      mappings.some(
        (mapping) =>
          mapping.criterion_id === criterion.criterion_id &&
          mapping.status === "missing",
      ),
  );
}

function artifactIdsFromMappings(mappings: EvidenceMapping[]): string[] {
  return unique(
    mappings
      .map((mapping) => mapping.artifact_id)
      .filter((artifactId): artifactId is string => Boolean(artifactId)),
  );
}

function refsForMappings(
  mappings: EvidenceMapping[],
  mappingIds: string[],
): string[] {
  return artifactIdsFromMappings(
    mappings.filter((mapping) => mappingIds.includes(mapping.mapping_id)),
  );
}

function evidenceRefsForOutput(output: AgentOutput): string[] {
  switch (output.agent_id) {
    case "coverage-requirement":
    case "evidence-retrieval":
    case "denial-rescue":
      return output.evidence_refs;
    case "missing-evidence":
      return artifactIdsFromMappings(output.missing_evidence_mappings);
    case "submission-packet":
      return output.packet.attachment_ids;
    case "appeal-packet":
      return output.appeal_packet.evidence_used;
    case "care-continuity":
      return [];
  }
}

function outputSummaryForAgent(agentId: AgentId, output: AgentOutput): string {
  switch (agentId) {
    case "coverage-requirement":
      return "Authorization requirements and policy criteria are available.";
    case "evidence-retrieval":
      return output.agent_id === "evidence-retrieval"
        ? `Mapped ${output.evidence_mappings.length} evidence criteria.`
        : "";
    case "missing-evidence":
      return output.agent_id === "missing-evidence"
        ? output.remediation_summary
        : "";
    case "submission-packet":
      return output.agent_id === "submission-packet" && output.ready_to_submit
        ? "Submission packet is ready for payer API."
        : "Submission packet is blocked pending safety or clinician review.";
    case "denial-rescue":
      return output.agent_id === "denial-rescue"
        ? `Appeal strategy selected for ${output.denial_reason_category}.`
        : "";
    case "appeal-packet":
      return "Administrative appeal draft prepared for clinician review.";
    case "care-continuity":
      return output.agent_id === "care-continuity" &&
        output.should_create_handoff
        ? "Pharmacy handoff is ready."
        : "Pharmacy handoff is waiting on payer approval.";
  }
}

function inputSummaryForAgent(
  agentId: AgentId,
  context: RuntimeContext,
): string {
  switch (agentId) {
    case "coverage-requirement":
      return `${context.fixture.order.medication_name} order and synthetic payer policy.`;
    case "evidence-retrieval":
      return "Synthetic policy criteria, fixture artifacts, labs, and medication history.";
    case "missing-evidence":
      return "Evidence matrix and human-task templates.";
    case "submission-packet":
      return "Evidence matrix, attachments, and existing packet fixture.";
    case "denial-rescue":
      return `${context.toggles.denial_reason} denial scenario and evidence matrix.`;
    case "appeal-packet":
      return "Denial rescue strategy and clinician-review appeal constraints.";
    case "care-continuity":
      return "Payer status and pharmacy handoff template.";
  }
}

function toolCallsForAgent(agentId: AgentId): string[] {
  const toolCalls: Record<AgentId, string[]> = {
    "coverage-requirement": ["policy_fixture_lookup", "schema_validator"],
    "evidence-retrieval": [
      "mock_ehr_pull",
      "fallback_parser",
      "evidence_matrix_writer",
    ],
    "missing-evidence": ["evidence_gap_detector", "human_task_planner"],
    "submission-packet": ["packet_builder", "safety_gate"],
    "denial-rescue": ["denial_parser", "strategy_selector"],
    "appeal-packet": ["appeal_draft_builder", "unsupported_claim_checker"],
    "care-continuity": ["pharmacy_handoff_planner"],
  };
  return toolCalls[agentId];
}

function actionForAgent(agentId: AgentId): string {
  const actions: Record<AgentId, string> = {
    "coverage-requirement": "coverage_requirements_resolved",
    "evidence-retrieval": "evidence_matrix_created",
    "missing-evidence": "missing_evidence_reviewed",
    "submission-packet": "submission_packet_prepared",
    "denial-rescue": "denial_rescue_strategy_selected",
    "appeal-packet": "appeal_packet_drafted",
    "care-continuity": "care_continuity_handoff_planned",
  };
  return actions[agentId];
}

function payerStatusForAgent(agentId: AgentId) {
  if (agentId === "denial-rescue" || agentId === "appeal-packet") {
    return "denied";
  }
  if (agentId === "care-continuity") {
    return "appeal_submitted";
  }
  return "not_submitted";
}

function criterionLabel(criterionId: string): string {
  if (criterionId === "criterion-safety-screen") {
    return "safety";
  }
  return criterionId.replace(/^criterion-/, "").replaceAll("-", " ");
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export const runtimeScenarioFixtures = {
  missingSafetyLab: missingSafetyLabScenario,
} as const;
