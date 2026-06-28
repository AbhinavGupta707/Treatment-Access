import cors from "@fastify/cors";
import Fastify from "fastify";
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
  DemoTogglesSchema,
  type AuditEvent,
  type DemoToggles,
} from "@tacc/shared-schemas";

const port = Number(process.env.PORT ?? 8787);

let toggles: DemoToggles = { ...defaultDemoToggles };
let auditEvents: AuditEvent[] = [...seedAuditEvents];

export function createServer() {
  const server = Fastify({
    logger: true,
  });

  void server.register(cors, {
    origin: true,
  });

  server.get("/health", async () => ({
    ok: true,
    service: "mock-healthcare-api",
    syntheticDataOnly: true,
  }));

  server.get("/demo/state", async () => ({
    case: seedCase,
    patient: seedPatient,
    order: seedOrder,
    criteria: seedCriteria,
    evidenceMappings: applyEvidenceToggles(),
    toggles,
    events: auditEvents,
  }));

  server.post("/demo/reset", async () => {
    toggles = { ...defaultDemoToggles };
    auditEvents = [...seedAuditEvents];
    return { ok: true, toggles, eventCount: auditEvents.length };
  });

  server.post("/demo/toggles", async (request) => {
    toggles = DemoTogglesSchema.parse({
      ...toggles,
      ...(request.body as Partial<DemoToggles>),
    });
    return { ok: true, toggles };
  });

  server.post("/events", async (request) => {
    const event = request.body as AuditEvent;
    auditEvents = [...auditEvents, event];
    return { ok: true, eventCount: auditEvents.length };
  });

  server.post("/payer/prior-auth", async () => {
    if (toggles.payer_api_unavailable) {
      return {
        status: "unavailable",
        error_code: "PAYER_API_DOWN",
        fallback_required: true,
      };
    }

    return {
      status: "submitted",
      submission_id: "pa-submission-syn-001",
      decision_hint: "denial_expected_for_demo",
    };
  });

  server.get("/payer/prior-auth/:submissionId/status", async () => ({
    status: "denied",
    denial_code:
      toggles.denial_reason === "step_therapy"
        ? "STEP_THERAPY_INCOMPLETE"
        : "CRITERION_MISSING",
    reason: toggles.denial_reason,
    appeal_deadline: "2026-07-12",
  }));

  server.post("/pharmacy/handoffs", async () => ({
    status: "created",
    handoff_id: "pharmacy-handoff-syn-001",
    assigned_to: "patient-access-coordinator",
  }));

  return server;
}

function applyEvidenceToggles() {
  if (!toggles.missing_safety_lab) {
    return seedEvidenceMappings;
  }

  return seedEvidenceMappings.map((mapping) =>
    mapping.criterion_id === "criterion-safety-screen"
      ? {
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
        }
      : mapping,
  );
}

if (process.env.NODE_ENV !== "test") {
  const server = createServer();
  await server.listen({ host: "0.0.0.0", port });
}
