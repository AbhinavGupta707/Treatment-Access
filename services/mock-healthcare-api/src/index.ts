import cors from "@fastify/cors";
import Fastify, { type FastifyInstance, type FastifyReply } from "fastify";
import { z } from "zod";
import {
  defaultDemoToggles,
  seedAuditEvents,
  seedCase,
  seedCriteria,
  seedEvidenceMappings,
  seedOrder,
  seedPatient,
} from "@tacc/demo-data";
import {
  AuditEventSchema,
  DemoTogglesSchema,
  type AuditEvent,
  type DemoToggles,
  type EvidenceMapping,
  type TreatmentAccessCase,
} from "@tacc/shared-schemas";

const port = Number(process.env.PORT ?? 8787);

const EventIngestSchema = AuditEventSchema.partial({
  event_id: true,
  timestamp: true,
  input_summary: true,
  output_summary: true,
  evidence_refs: true,
}).extend({
  case_id: z.string().min(1),
  actor_type: z.enum(["agent", "api_workflow", "robot", "human", "system"]),
  actor_name: z.string().min(1),
  task_or_agent_name: z.string().min(1),
  action: z.string().min(1),
});

const SafetyScreeningSchema = z.object({
  collected_at: z.string().default("2026-06-28"),
  tb_result: z
    .enum(["negative", "positive", "indeterminate"])
    .default("negative"),
  hepatitis_b_surface_antigen: z
    .enum(["negative", "positive", "unknown"])
    .default("negative"),
  source: z.string().default("clinician-entered synthetic safety screen"),
  actor_name: z.string().default("UiPath API Workflow"),
});

const PriorAuthRequestSchema = z.object({
  case_id: z.string().default(seedCase.case_id),
  patient_id: z.string().default(seedPatient.patient_id),
  order_id: z.string().default(seedOrder.order_id),
  channel: z.enum(["api", "portal_fallback"]).default("api"),
  submitted_by: z.string().default("UiPath API Workflow"),
  evidence_refs: z.array(z.string()).default([]),
});

const AppealRequestSchema = z.object({
  case_id: z.string().default(seedCase.case_id),
  submission_id: z.string(),
  appeal_summary: z.string().default("Synthetic appeal packet pending review."),
  clinician_approved: z.boolean().default(false),
  submitted_by: z.string().default("UiPath API Workflow"),
  evidence_refs: z.array(z.string()).default([]),
});

const PharmacyHandoffRequestSchema = z.object({
  case_id: z.string().default(seedCase.case_id),
  patient_id: z.string().default(seedPatient.patient_id),
  order_id: z.string().default(seedOrder.order_id),
  approval_reference: z.string().min(1),
  requested_by: z.string().default("Care Continuity Agent"),
});

const SchedulingTaskRequestSchema = z.object({
  case_id: z.string().default(seedCase.case_id),
  handoff_id: z.string().min(1),
  task_type: z.string().default("patient_access_coordination"),
  requested_by: z.string().default("Care Continuity Agent"),
});

type PriorAuthSubmission = {
  submission_id: string;
  case_id: string;
  status: "submitted" | "unavailable";
  channel: "api" | "portal_fallback";
  submitted_at: string;
  decision_status: "pending" | "denied" | "approved";
  denial_code?: string;
  denial_reason?: DemoToggles["denial_reason"];
  fallback_required: boolean;
  error_code?: string;
};

type AppealSubmission = {
  appeal_id: string;
  case_id: string;
  submission_id: string;
  status: "submitted" | "blocked";
  decision_status: "pending" | "approved";
  submitted_at: string;
  clinician_approved: boolean;
};

type PharmacyHandoff = {
  handoff_id: string;
  case_id: string;
  patient_id: string;
  order_id: string;
  status: "created";
  assigned_to: string;
  created_at: string;
  approval_reference: string;
};

type SchedulingTask = {
  scheduling_task_id: string;
  case_id: string;
  handoff_id: string;
  status: "created";
  owner: string;
  created_at: string;
};

type MockState = {
  toggles: DemoToggles;
  auditEvents: AuditEvent[];
  submissions: PriorAuthSubmission[];
  appeals: AppealSubmission[];
  handoffs: PharmacyHandoff[];
  schedulingTasks: SchedulingTask[];
  safetyScreeningOverride: SafetyScreening | null;
  counters: {
    event: number;
    submission: number;
    appeal: number;
    handoff: number;
    scheduling: number;
  };
};

type SafetyScreening = z.infer<typeof SafetyScreeningSchema>;

type ErrorPayload = {
  error: string;
  message: string;
  syntheticDataOnly: true;
};

const syntheticDocuments = [
  {
    document_id: "doc-progress-note",
    patient_id: seedPatient.patient_id,
    type: "specialist_note",
    display_name: "Synthetic gastroenterology progress note",
    artifact_id: "artifact-progress-note",
    source_uri: "synthetic://ehr/progress-note.md",
    text: "Fictional source excerpt: symptoms remain moderate-to-severe despite therapy. Clinician validation is required before this claim is submitted.",
  },
  {
    document_id: "doc-med-history",
    patient_id: seedPatient.patient_id,
    type: "medication_history",
    display_name: "Synthetic medication history",
    artifact_id: "artifact-med-history",
    source_uri: "synthetic://ehr/medication-history.json",
    text: "Fictional source excerpt: inadequate response to mesalamine and steroid taper.",
  },
  {
    document_id: "doc-safety-screening",
    patient_id: seedPatient.patient_id,
    type: "safety_labs",
    display_name: "Synthetic TB and hepatitis safety screening",
    artifact_id: "artifact-safety-labs",
    source_uri: "synthetic://ehr/safety-screening.csv",
    text: "Fictional source excerpt: TB negative; hepatitis B surface antigen negative.",
  },
];

const medicationHistory = {
  patient_id: seedPatient.patient_id,
  prior_therapies: [
    {
      medication_name: "Mesalamine-SYN",
      outcome: "inadequate_response",
      start_date: "2025-09-10",
      end_date: "2025-12-12",
    },
    {
      medication_name: "Steroid Taper-SYN",
      outcome: "symptoms_recurred",
      start_date: "2026-01-08",
      end_date: "2026-02-19",
    },
  ],
  syntheticDataOnly: true,
};

export function createServer(): FastifyInstance {
  const state = createInitialState();
  const server = Fastify({
    logger: process.env.NODE_ENV !== "test",
  });

  void server.register(cors, {
    origin: true,
  });

  server.setErrorHandler((error, _request, reply) => {
    if (error instanceof z.ZodError) {
      void reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
        syntheticDataOnly: true,
      } satisfies ErrorPayload);
      return;
    }

    const message =
      error instanceof Error ? error.message : "Unknown server error.";
    void reply.status(500).send({
      error: "INTERNAL_ERROR",
      message,
      syntheticDataOnly: true,
    } satisfies ErrorPayload);
  });

  server.get("/health", async () => ({
    ok: true,
    service: "mock-healthcare-api",
    version: "0.1.0",
    syntheticDataOnly: true,
  }));

  server.get("/demo/state", async () => stateSnapshot(state));

  server.post("/demo/reset", async () => {
    Object.assign(state, createInitialState());
    return { ok: true, ...stateSnapshot(state) };
  });

  server.get("/demo/toggles", async () => ({
    toggles: state.toggles,
    syntheticDataOnly: true,
  }));

  server.post("/demo/toggles", async (request) => {
    state.toggles = DemoTogglesSchema.parse({
      ...state.toggles,
      ...(request.body as Partial<DemoToggles>),
    });
    recordSystemEvent(
      state,
      "demo_toggles_updated",
      "Demo toggle update request.",
      `Active toggles: ${JSON.stringify(state.toggles)}.`,
    );
    return { ok: true, toggles: state.toggles, syntheticDataOnly: true };
  });

  server.get("/cases", async () => ({
    cases: [caseSnapshot(state)],
    syntheticDataOnly: true,
  }));

  server.get<{ Params: { caseId: string } }>(
    "/cases/:caseId",
    async (request, reply) => {
      const caseId = request.params.caseId;
      if (caseId !== seedCase.case_id) {
        return notFound(
          reply,
          "CASE_NOT_FOUND",
          `No synthetic case found for ${caseId}.`,
        );
      }

      return {
        case: caseSnapshot(state),
        patient: seedPatient,
        order: seedOrder,
        latest_event: latestEventForCase(state, caseId),
        syntheticDataOnly: true,
      };
    },
  );

  server.get<{ Params: { caseId: string } }>(
    "/cases/:caseId/events",
    async (request, reply) => {
      const caseId = request.params.caseId;
      if (caseId !== seedCase.case_id) {
        return notFound(
          reply,
          "CASE_NOT_FOUND",
          `No synthetic case found for ${caseId}.`,
        );
      }

      return {
        events: state.auditEvents.filter((event) => event.case_id === caseId),
        syntheticDataOnly: true,
      };
    },
  );

  server.get<{ Params: { caseId: string } }>(
    "/cases/:caseId/evidence-matrix",
    async (request, reply) => {
      const caseId = request.params.caseId;
      if (caseId !== seedCase.case_id) {
        return notFound(
          reply,
          "CASE_NOT_FOUND",
          `No synthetic case found for ${caseId}.`,
        );
      }

      return {
        case_id: caseId,
        criteria: seedCriteria,
        evidence_mappings: applyEvidenceToggles(state),
        syntheticDataOnly: true,
      };
    },
  );

  server.get<{ Params: { caseId: string } }>(
    "/cases/:caseId/agent-traces",
    async (request, reply) => {
      const caseId = request.params.caseId;
      if (caseId !== seedCase.case_id) {
        return notFound(
          reply,
          "CASE_NOT_FOUND",
          `No synthetic case found for ${caseId}.`,
        );
      }

      return {
        case_id: caseId,
        traces: state.auditEvents
          .filter(
            (event) => event.case_id === caseId && event.actor_type === "agent",
          )
          .map((event) => ({
            trace_id: event.trace_id ?? event.event_id,
            agent_name: event.actor_name,
            action: event.action,
            output_summary: event.output_summary,
            timestamp: event.timestamp,
          })),
        syntheticDataOnly: true,
      };
    },
  );

  server.post("/events", async (request) => {
    const eventInput = EventIngestSchema.parse(request.body);
    const event: AuditEvent = {
      event_id: eventInput.event_id ?? nextId(state, "event", "event-live"),
      case_id: eventInput.case_id,
      maestro_case_id: eventInput.maestro_case_id,
      actor_type: eventInput.actor_type,
      actor_name: eventInput.actor_name,
      task_or_agent_name: eventInput.task_or_agent_name,
      action: eventInput.action,
      input_summary: eventInput.input_summary ?? "No input summary supplied.",
      output_summary:
        eventInput.output_summary ?? "No output summary supplied.",
      evidence_refs: eventInput.evidence_refs ?? [],
      trace_id: eventInput.trace_id,
      orchestrator_job_id: eventInput.orchestrator_job_id,
      timestamp: eventInput.timestamp ?? new Date().toISOString(),
    };
    AuditEventSchema.parse(event);
    state.auditEvents = [...state.auditEvents, event];
    return {
      ok: true,
      event,
      eventCount: state.auditEvents.length,
      syntheticDataOnly: true,
    };
  });

  server.get<{ Querystring: { case_id?: string } }>(
    "/events",
    async (request) => ({
      events: request.query.case_id
        ? state.auditEvents.filter(
            (event) => event.case_id === request.query.case_id,
          )
        : state.auditEvents,
      syntheticDataOnly: true,
    }),
  );

  server.get<{ Params: { id: string } }>(
    "/patients/:id",
    async (request, reply) => {
      if (request.params.id !== seedPatient.patient_id) {
        return notFound(
          reply,
          "PATIENT_NOT_FOUND",
          `No synthetic patient found for ${request.params.id}.`,
        );
      }

      return { patient: seedPatient, syntheticDataOnly: true };
    },
  );

  server.get<{ Params: { id: string; orderId: string } }>(
    "/patients/:id/orders/:orderId",
    async (request, reply) => {
      if (
        request.params.id !== seedPatient.patient_id ||
        request.params.orderId !== seedOrder.order_id
      ) {
        return notFound(
          reply,
          "ORDER_NOT_FOUND",
          "Synthetic patient/order pair was not found.",
        );
      }

      return {
        order: seedOrder,
        case_id: seedCase.case_id,
        payer_id: seedCase.payer_id,
        syntheticDataOnly: true,
      };
    },
  );

  server.get<{ Params: { id: string } }>(
    "/patients/:id/medication-history",
    async (request, reply) => {
      if (request.params.id !== seedPatient.patient_id) {
        return notFound(
          reply,
          "PATIENT_NOT_FOUND",
          `No synthetic patient found for ${request.params.id}.`,
        );
      }

      return medicationHistory;
    },
  );

  server.get<{ Params: { id: string } }>(
    "/patients/:id/documents",
    async (request, reply) => {
      if (request.params.id !== seedPatient.patient_id) {
        return notFound(
          reply,
          "PATIENT_NOT_FOUND",
          `No synthetic patient found for ${request.params.id}.`,
        );
      }

      return {
        documents: documentsForState(state).map(
          ({ text, ...document }) => document,
        ),
        syntheticDataOnly: true,
      };
    },
  );

  server.get<{ Params: { documentId: string } }>(
    "/documents/:documentId",
    async (request, reply) => {
      const document = documentsForState(state).find(
        (candidate) => candidate.document_id === request.params.documentId,
      );
      if (!document) {
        return notFound(
          reply,
          "DOCUMENT_NOT_FOUND",
          `No synthetic document found for ${request.params.documentId}.`,
        );
      }

      return { document, syntheticDataOnly: true };
    },
  );

  server.post<{ Params: { id: string } }>(
    "/patients/:id/labs/safety-screening",
    async (request, reply) => {
      if (request.params.id !== seedPatient.patient_id) {
        return notFound(
          reply,
          "PATIENT_NOT_FOUND",
          `No synthetic patient found for ${request.params.id}.`,
        );
      }

      state.safetyScreeningOverride = SafetyScreeningSchema.parse(
        request.body ?? {},
      );
      state.toggles = { ...state.toggles, missing_safety_lab: false };
      recordSystemEvent(
        state,
        "safety_screening_added",
        "Synthetic safety lab payload received.",
        "Safety screening is now available for evidence mapping.",
        state.safetyScreeningOverride.actor_name,
      );

      return {
        ok: true,
        patient_id: request.params.id,
        safety_screening: state.safetyScreeningOverride,
        toggles: state.toggles,
        syntheticDataOnly: true,
      };
    },
  );

  server.post("/payer/prior-auth", async (request) => {
    const priorAuthRequest = PriorAuthRequestSchema.parse(request.body ?? {});
    const submittedAt = new Date().toISOString();

    if (state.toggles.payer_api_unavailable) {
      const submission: PriorAuthSubmission = {
        submission_id: nextId(state, "submission", "pa-submission"),
        case_id: priorAuthRequest.case_id,
        status: "unavailable",
        channel: priorAuthRequest.channel,
        submitted_at: submittedAt,
        decision_status: "pending",
        fallback_required: true,
        error_code: "PAYER_API_DOWN",
      };
      state.submissions = [...state.submissions, submission];
      recordApiEvent(
        state,
        priorAuthRequest.case_id,
        "payer_prior_auth_unavailable",
        "Prior authorization API submission attempted.",
        "Payer API unavailable; portal fallback required.",
        priorAuthRequest.submitted_by,
        priorAuthRequest.evidence_refs,
      );
      return {
        status: "unavailable",
        submission_id: submission.submission_id,
        error_code: submission.error_code,
        fallback_required: true,
        syntheticDataOnly: true,
      };
    }

    const denialCode = denialCodeForReason(state.toggles.denial_reason);
    const submission: PriorAuthSubmission = {
      submission_id: nextId(state, "submission", "pa-submission"),
      case_id: priorAuthRequest.case_id,
      status: "submitted",
      channel: priorAuthRequest.channel,
      submitted_at: submittedAt,
      decision_status: "denied",
      denial_code: denialCode,
      denial_reason: state.toggles.denial_reason,
      fallback_required: false,
    };
    state.submissions = [...state.submissions, submission];
    recordApiEvent(
      state,
      priorAuthRequest.case_id,
      "payer_prior_auth_submitted",
      "Prior authorization API submission accepted.",
      `Submission ${submission.submission_id} queued; demo decision is denied for ${state.toggles.denial_reason}.`,
      priorAuthRequest.submitted_by,
      priorAuthRequest.evidence_refs,
    );

    return {
      status: "submitted",
      submission_id: submission.submission_id,
      decision_hint: "denial_expected_for_demo",
      syntheticDataOnly: true,
    };
  });

  server.get<{ Params: { submissionId: string } }>(
    "/payer/prior-auth/:submissionId/status",
    async (request, reply) => {
      const submission = state.submissions.find(
        (candidate) => candidate.submission_id === request.params.submissionId,
      );
      if (!submission) {
        return notFound(
          reply,
          "SUBMISSION_NOT_FOUND",
          `No synthetic prior authorization submission found for ${request.params.submissionId}.`,
        );
      }

      if (submission.status === "unavailable") {
        return {
          submission_id: submission.submission_id,
          status: "unavailable",
          error_code: submission.error_code,
          fallback_required: true,
          syntheticDataOnly: true,
        };
      }

      return {
        submission_id: submission.submission_id,
        status: submission.decision_status,
        denial_code: submission.denial_code,
        reason: submission.denial_reason,
        appeal_deadline: "2026-07-12",
        policy_citation: policyCitationForReason(submission.denial_reason),
        syntheticDataOnly: true,
      };
    },
  );

  server.post("/payer/appeals", async (request) => {
    const appealRequest = AppealRequestSchema.parse(request.body ?? {});
    const appeal: AppealSubmission = {
      appeal_id: nextId(state, "appeal", "appeal"),
      case_id: appealRequest.case_id,
      submission_id: appealRequest.submission_id,
      status: appealRequest.clinician_approved ? "submitted" : "blocked",
      decision_status: appealRequest.clinician_approved
        ? "approved"
        : "pending",
      submitted_at: new Date().toISOString(),
      clinician_approved: appealRequest.clinician_approved,
    };
    state.appeals = [...state.appeals, appeal];
    recordApiEvent(
      state,
      appealRequest.case_id,
      appeal.clinician_approved
        ? "payer_appeal_submitted"
        : "payer_appeal_blocked",
      "Appeal packet received by mock payer endpoint.",
      appeal.clinician_approved
        ? `Appeal ${appeal.appeal_id} approved for demo.`
        : "Appeal requires clinician approval before payer submission.",
      appealRequest.submitted_by,
      appealRequest.evidence_refs,
    );

    return { ...appeal, syntheticDataOnly: true };
  });

  server.get<{ Params: { appealId: string } }>(
    "/payer/appeals/:appealId/status",
    async (request, reply) => {
      const appeal = state.appeals.find(
        (candidate) => candidate.appeal_id === request.params.appealId,
      );
      if (!appeal) {
        return notFound(
          reply,
          "APPEAL_NOT_FOUND",
          `No synthetic appeal found for ${request.params.appealId}.`,
        );
      }

      return {
        appeal_id: appeal.appeal_id,
        status: appeal.decision_status,
        approval_reference:
          appeal.decision_status === "approved"
            ? `approval-${appeal.appeal_id}`
            : null,
        syntheticDataOnly: true,
      };
    },
  );

  server.post("/pharmacy/handoffs", async (request) => {
    const handoffRequest = PharmacyHandoffRequestSchema.parse(
      request.body ?? {},
    );
    const handoff: PharmacyHandoff = {
      handoff_id: nextId(state, "handoff", "pharmacy-handoff"),
      case_id: handoffRequest.case_id,
      patient_id: handoffRequest.patient_id,
      order_id: handoffRequest.order_id,
      status: "created",
      assigned_to: "patient-access-coordinator",
      created_at: new Date().toISOString(),
      approval_reference: handoffRequest.approval_reference,
    };
    state.handoffs = [...state.handoffs, handoff];
    recordApiEvent(
      state,
      handoff.case_id,
      "pharmacy_handoff_created",
      `Approval reference ${handoff.approval_reference} received.`,
      `Pharmacy handoff ${handoff.handoff_id} assigned to ${handoff.assigned_to}.`,
      handoffRequest.requested_by,
    );

    return { ...handoff, syntheticDataOnly: true };
  });

  server.get<{ Params: { handoffId: string } }>(
    "/pharmacy/handoffs/:handoffId",
    async (request, reply) => {
      const handoff = state.handoffs.find(
        (candidate) => candidate.handoff_id === request.params.handoffId,
      );
      if (!handoff) {
        return notFound(
          reply,
          "HANDOFF_NOT_FOUND",
          `No synthetic pharmacy handoff found for ${request.params.handoffId}.`,
        );
      }

      return { handoff, syntheticDataOnly: true };
    },
  );

  server.post("/scheduling/tasks", async (request) => {
    const taskRequest = SchedulingTaskRequestSchema.parse(request.body ?? {});
    const schedulingTask: SchedulingTask = {
      scheduling_task_id: nextId(state, "scheduling", "scheduling-task"),
      case_id: taskRequest.case_id,
      handoff_id: taskRequest.handoff_id,
      status: "created",
      owner: "patient-access-coordinator",
      created_at: new Date().toISOString(),
    };
    state.schedulingTasks = [...state.schedulingTasks, schedulingTask];
    recordApiEvent(
      state,
      schedulingTask.case_id,
      "scheduling_task_created",
      `Scheduling task requested for handoff ${schedulingTask.handoff_id}.`,
      `Task ${schedulingTask.scheduling_task_id} assigned to ${schedulingTask.owner}.`,
      taskRequest.requested_by,
    );

    return { ...schedulingTask, syntheticDataOnly: true };
  });

  return server;
}

function createInitialState(): MockState {
  return {
    toggles: { ...defaultDemoToggles },
    auditEvents: [...seedAuditEvents],
    submissions: [],
    appeals: [],
    handoffs: [],
    schedulingTasks: [],
    safetyScreeningOverride: null,
    counters: {
      event: 0,
      submission: 0,
      appeal: 0,
      handoff: 0,
      scheduling: 0,
    },
  };
}

function stateSnapshot(state: MockState) {
  return {
    case: caseSnapshot(state),
    patient: seedPatient,
    order: seedOrder,
    criteria: seedCriteria,
    evidenceMappings: applyEvidenceToggles(state),
    toggles: state.toggles,
    submissions: state.submissions,
    appeals: state.appeals,
    handoffs: state.handoffs,
    schedulingTasks: state.schedulingTasks,
    events: state.auditEvents,
    syntheticDataOnly: true,
  };
}

function caseSnapshot(state: MockState): TreatmentAccessCase {
  const latestEvent = latestEventForCase(state, seedCase.case_id);
  const hasUnavailableSubmission = state.submissions.some(
    (submission) => submission.status === "unavailable",
  );
  const hasHandoff = state.handoffs.length > 0;
  const hasAppeal = state.appeals.some(
    (appeal) => appeal.decision_status === "approved",
  );
  const hasSubmission = state.submissions.some(
    (submission) => submission.status === "submitted",
  );

  return {
    ...seedCase,
    status: hasHandoff
      ? "Pharmacy handoff created"
      : hasAppeal
        ? "Appeal approved"
        : hasSubmission
          ? "Prior authorization denied for demo"
          : state.toggles.missing_safety_lab
            ? "Missing evidence"
            : seedCase.status,
    current_stage: hasHandoff
      ? "care_continuity"
      : hasAppeal
        ? "care_continuity"
        : hasSubmission
          ? "payer_decision"
          : state.toggles.missing_safety_lab
            ? "policy_evidence"
            : seedCase.current_stage,
    active_secondary_stages: [
      ...(state.toggles.missing_safety_lab
        ? (["missing_evidence"] as const)
        : []),
      ...(hasUnavailableSubmission
        ? (["api_failure_portal_fallback"] as const)
        : []),
      ...(hasSubmission && !hasAppeal
        ? (["denial_rescue_appeal"] as const)
        : []),
    ],
    last_event_at: latestEvent?.timestamp ?? seedCase.last_event_at,
  };
}

function latestEventForCase(state: MockState, caseId: string) {
  return [...state.auditEvents]
    .reverse()
    .find((event) => event.case_id === caseId);
}

function applyEvidenceToggles(state: MockState): EvidenceMapping[] {
  return seedEvidenceMappings.map((mapping) => {
    if (
      mapping.criterion_id === "criterion-diagnosis" &&
      state.toggles.clinician_rejects_assertion
    ) {
      return {
        ...mapping,
        status: "conflicting" as const,
        evidence_summary:
          "Clinician rejected the generated severity assertion; revised packet must remove unsupported language.",
        confidence: 0.56,
        needs_human_review: true,
        human_review_reason: "Clinician rejection demo toggle is active.",
        reviewer_decision: "rejected" as const,
      };
    }

    if (
      mapping.criterion_id === "criterion-safety-screen" &&
      state.toggles.missing_safety_lab &&
      !state.safetyScreeningOverride
    ) {
      return {
        ...mapping,
        artifact_id: null,
        status: "missing" as const,
        evidence_summary:
          "Safety screening is missing in the current synthetic chart snapshot.",
        source_quote_short: undefined,
        source_span: undefined,
        confidence: 0,
        needs_human_review: true,
        human_review_reason:
          "Blocking safety criterion must be supplied before submission.",
      };
    }

    return mapping;
  });
}

function documentsForState(state: MockState) {
  if (!state.toggles.missing_safety_lab || state.safetyScreeningOverride) {
    return syntheticDocuments;
  }

  return syntheticDocuments.filter(
    (document) => document.document_id !== "doc-safety-screening",
  );
}

function nextId(
  state: MockState,
  key: keyof MockState["counters"],
  prefix: string,
): string {
  state.counters[key] += 1;
  return `${prefix}-syn-${state.counters[key].toString().padStart(3, "0")}`;
}

function recordSystemEvent(
  state: MockState,
  action: string,
  inputSummary: string,
  outputSummary: string,
  actorName = "Mock Healthcare API",
) {
  state.auditEvents = [
    ...state.auditEvents,
    {
      event_id: nextId(state, "event", "event-live"),
      case_id: seedCase.case_id,
      actor_type: "system",
      actor_name: actorName,
      task_or_agent_name: "Mock Healthcare API",
      action,
      input_summary: inputSummary,
      output_summary: outputSummary,
      evidence_refs: [],
      timestamp: new Date().toISOString(),
    },
  ];
}

function recordApiEvent(
  state: MockState,
  caseId: string,
  action: string,
  inputSummary: string,
  outputSummary: string,
  actorName: string,
  evidenceRefs: string[] = [],
) {
  state.auditEvents = [
    ...state.auditEvents,
    {
      event_id: nextId(state, "event", "event-live"),
      case_id: caseId,
      actor_type: "api_workflow",
      actor_name: actorName,
      task_or_agent_name: "Mock Healthcare API",
      action,
      input_summary: inputSummary,
      output_summary: outputSummary,
      evidence_refs: evidenceRefs,
      timestamp: new Date().toISOString(),
    },
  ];
}

function denialCodeForReason(reason: DemoToggles["denial_reason"]) {
  switch (reason) {
    case "safety_screen":
      return "SAFETY_SCREEN_MISSING";
    case "medical_necessity":
      return "MED_NECESSITY_NOT_ESTABLISHED";
    case "step_therapy":
      return "STEP_THERAPY_INCOMPLETE";
  }
}

function policyCitationForReason(
  reason: DemoToggles["denial_reason"] | undefined,
) {
  switch (reason) {
    case "safety_screen":
      return "Northstar Biologic Policy 2026, Section 3.2";
    case "medical_necessity":
      return "Northstar Biologic Policy 2026, Section 2.1";
    case "step_therapy":
    default:
      return "Northstar Biologic Policy 2026, Section 2.4";
  }
}

function notFound(reply: FastifyReply, error: string, message: string) {
  void reply.status(404).send({
    error,
    message,
    syntheticDataOnly: true,
  });
}

if (process.env.NODE_ENV !== "test") {
  const server = createServer();
  await server.listen({ host: "0.0.0.0", port });
}
