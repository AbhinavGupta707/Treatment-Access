import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import {
  denialLetterScenarios,
  missingEvidenceMappings,
  missingSafetyLabScenario,
  treatmentAccessDemoFixture,
} from "@tacc/demo-data";
import {
  AgentDisplayNameById,
  AgentRunSchema,
  AgentOutputSchema,
  AgentStepRunSchema,
  AgentRuntimeSummarySchema,
  DemoTogglesSchema,
  LiveProofRunSchema,
  ToolCallSchema,
  type AgentId,
  type AgentTrace,
  type DenialReasonCategory,
  type AgentOutput,
  type AgentRuntimeResult,
  type AgentRuntimeSummary,
  type AgentRun,
  type AppealPacket,
  type AuditEvent,
  type ClinicalAssertionReview,
  type DemoFixture,
  type DemoToggles,
  type EvidenceMapping,
  type HumanTask,
  type LiveProofApprovalGate,
  type LiveProofRun,
  type LiveProofStage,
  type LiveProofStep,
  type LiveProofTrace,
  type PayerDecision,
  type PharmacyHandoff,
  type PolicyCriterion,
  type SafetyFlag,
  type ToolCall,
  type UiPathEvidenceRef,
  type SubmissionAttempt,
  type SubmissionPacket,
} from "@tacc/shared-schemas";
import {
  resolveAgentRuntimeConfig,
  type AgentRuntimeConfig,
  type RuntimeEnv,
} from "./config.js";
import { createFireworksClient } from "./fireworks.js";
import {
  createLangSmithTraceLink,
  langSmithTracingEnabled,
} from "./langsmith.js";

export * from "./config.js";
export * from "./fireworks.js";
export * from "./langsmith.js";

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
  clinicalApproval: "pending" | "approved" | "rejected";
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

export type TreatmentAccessGraphMode = "deterministic" | "live";

export type TreatmentAccessGraphNodeId =
  AgentId | "human-gate" | "robot-fallback-request" | "audit-packet";

export type TreatmentAccessGraphBranch =
  | "complete_evidence_to_submission"
  | "missing_evidence_to_human_gate"
  | "clinician_rejection_to_rework"
  | "payer_api_unavailable_to_robot_fallback"
  | "denial_to_appeal"
  | "approval_to_care_handoff";

export type TreatmentAccessTraceMetadata = {
  trace_id: string;
  langsmith_trace_id?: string;
  langsmith_run_url?: string;
  langsmith_project?: string;
  metadata: {
    case_id: string;
    run_id: string;
    node_id: TreatmentAccessGraphNodeId;
    agent_id?: AgentId;
    maestro_case_id?: string;
    run_mode: TreatmentAccessGraphMode;
    synthetic: true;
  };
};

export type TreatmentAccessToolResult = {
  tool_call_id: string;
  owner_node_id: TreatmentAccessGraphNodeId;
  tool_name: string;
  arguments_summary: string;
  result_summary: string;
  status: "completed" | "blocked" | "fallback_required";
  schema_name: string;
  validated: boolean;
  trace_metadata: TreatmentAccessTraceMetadata;
};

export type TreatmentAccessGraphStep = {
  node_id: TreatmentAccessGraphNodeId;
  agent_id?: AgentId;
  status:
    "completed" | "needs_human" | "blocked" | "fallback_requested" | "skipped";
  summary: string;
  output_schema: string;
  validated: boolean;
  trace_metadata: TreatmentAccessTraceMetadata;
  agent_result?: AgentRuntimeResult;
  tool_results: TreatmentAccessToolResult[];
};

export type TreatmentAccessHumanGate = {
  gate_id: string;
  gate_type:
    | "missing_evidence"
    | "clinical_assertion"
    | "appeal_signoff"
    | "exception_review";
  status: "pending" | "approved" | "rejected";
  assigned_role: string;
  reason: string;
  source_node_id: TreatmentAccessGraphNodeId;
  trace_metadata: TreatmentAccessTraceMetadata;
};

export type TreatmentAccessRobotFallbackRequest = {
  request_id: string;
  status: "requested_not_started";
  orchestrator_folder: "TreatmentAccessHackathon";
  robot_process_name: "PayerPortalFallback";
  reason_code: "PAYER_API_DOWN";
  no_live_job_started: true;
  trace_metadata: TreatmentAccessTraceMetadata;
};

export type TreatmentAccessGraphEvent = {
  event_id: string;
  node_id: TreatmentAccessGraphNodeId;
  kind:
    | "node_completed"
    | "branch_taken"
    | "human_gate_recorded"
    | "robot_fallback_requested";
  summary: string;
  timestamp: string;
  trace_metadata: TreatmentAccessTraceMetadata;
};

export type TreatmentAccessGraphDefinition = {
  runtime: "langgraph";
  dependency: "@langchain/langgraph";
  nodes: TreatmentAccessGraphNodeId[];
  edges: Array<{
    from: TreatmentAccessGraphNodeId | typeof START;
    to: TreatmentAccessGraphNodeId | typeof END;
    branch?: TreatmentAccessGraphBranch;
    condition?: string;
  }>;
};

export type TreatmentAccessStructuredProvider = {
  provider_name: "fireworks" | string;
  invokeAgentNode: (input: {
    agent_id: AgentId;
    display_name: string;
    prompt: string;
    deterministic_output: AgentOutput;
    output_schema: string;
    trace_metadata: TreatmentAccessTraceMetadata;
  }) => Promise<AgentOutput>;
};

export type TreatmentAccessGraphOptions = TreatmentAccessAgentRuntimeOptions & {
  mode?: TreatmentAccessGraphMode;
  provider?: TreatmentAccessStructuredProvider;
  langsmith?: {
    project?: string;
    trace_id?: string;
    run_url?: string;
  };
};

export type TreatmentAccessGraphRun = {
  run_id: string;
  case_id: string;
  mode: TreatmentAccessGraphMode;
  status:
    "completed" | "waiting_human" | "blocked" | "robot_fallback_requested";
  graph: TreatmentAccessGraphDefinition;
  steps: TreatmentAccessGraphStep[];
  events: TreatmentAccessGraphEvent[];
  branches_taken: TreatmentAccessGraphBranch[];
  human_gates: TreatmentAccessHumanGate[];
  robot_fallback_requests: TreatmentAccessRobotFallbackRequest[];
  submission_attempts: SubmissionAttempt[];
  summary: AgentRuntimeSummary;
  no_live_uipath_side_effects: true;
  no_real_payer_submission: true;
  synthetic_data_disclaimer: string;
};

export type TreatmentAccessLiveProofOptions =
  TreatmentAccessAgentRuntimeOptions & {
    requestedBy?: string;
    runId?: string;
    env?: RuntimeEnv;
    mode?: TreatmentAccessGraphMode;
    provider?: TreatmentAccessStructuredProvider;
    langsmithRunUrl?: string;
  };

const treatmentAccessGraphNodes: TreatmentAccessGraphNodeId[] = [
  "coverage-requirement",
  "evidence-retrieval",
  "missing-evidence",
  "human-gate",
  "submission-packet",
  "robot-fallback-request",
  "denial-rescue",
  "appeal-packet",
  "care-continuity",
  "audit-packet",
];

const treatmentAccessGraphDefinition: TreatmentAccessGraphDefinition = {
  runtime: "langgraph",
  dependency: "@langchain/langgraph",
  nodes: treatmentAccessGraphNodes,
  edges: [
    { from: START, to: "coverage-requirement" },
    { from: "coverage-requirement", to: "evidence-retrieval" },
    { from: "evidence-retrieval", to: "missing-evidence" },
    {
      from: "missing-evidence",
      to: "human-gate",
      branch: "missing_evidence_to_human_gate",
      condition: "missing blocking evidence exists",
    },
    {
      from: "human-gate",
      to: "evidence-retrieval",
      branch: "clinician_rejection_to_rework",
      condition: "clinician rejects a high-impact clinical assertion",
    },
    {
      from: "missing-evidence",
      to: "submission-packet",
      branch: "complete_evidence_to_submission",
      condition:
        "evidence is complete and required human approvals are present",
    },
    {
      from: "submission-packet",
      to: "robot-fallback-request",
      branch: "payer_api_unavailable_to_robot_fallback",
      condition: "synthetic payer API returns PAYER_API_DOWN",
    },
    {
      from: "submission-packet",
      to: "denial-rescue",
      branch: "denial_to_appeal",
      condition: "payer decision is denied",
    },
    { from: "denial-rescue", to: "appeal-packet" },
    {
      from: "submission-packet",
      to: "care-continuity",
      branch: "approval_to_care_handoff",
      condition: "payer decision is approved or appeal approved",
    },
    { from: "robot-fallback-request", to: "audit-packet" },
    { from: "appeal-packet", to: "audit-packet" },
    { from: "care-continuity", to: "audit-packet" },
    { from: "audit-packet", to: END },
  ],
};

const LangGraphSkeletonState = Annotation.Root({
  visited: Annotation<TreatmentAccessGraphNodeId[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

export function getTreatmentAccessGraphDefinition(): TreatmentAccessGraphDefinition {
  return treatmentAccessGraphDefinition;
}

export function createTreatmentAccessLangGraph(): unknown {
  const graph = new StateGraph(LangGraphSkeletonState) as {
    addNode: (
      name: TreatmentAccessGraphNodeId,
      action: () => unknown,
    ) => unknown;
    addEdge: (
      from: TreatmentAccessGraphNodeId | typeof START,
      to: TreatmentAccessGraphNodeId | typeof END,
    ) => unknown;
    compile: () => unknown;
  };

  for (const nodeId of treatmentAccessGraphNodes) {
    graph.addNode(nodeId, () => ({ visited: [nodeId] }));
  }

  for (const edge of treatmentAccessGraphDefinition.edges) {
    graph.addEdge(edge.from, edge.to);
  }

  return graph.compile();
}

export async function runTreatmentAccessGraph(
  options: TreatmentAccessGraphOptions = {},
): Promise<TreatmentAccessGraphRun> {
  const mode = options.mode ?? modeFromEnvironment();
  const runContext = createGraphRuntimeContext(options);
  const runId = `graph-run-${runContext.fixture.case.case_id}`;
  const steps: TreatmentAccessGraphStep[] = [];
  const events: TreatmentAccessGraphEvent[] = [];
  const branchesTaken: TreatmentAccessGraphBranch[] = [];
  const humanGates: TreatmentAccessHumanGate[] = [];
  const robotFallbackRequests: TreatmentAccessRobotFallbackRequest[] = [];
  const submissionAttempts: SubmissionAttempt[] = [];
  const agentResults: AgentRuntimeResult[] = [];

  const recordStep = (step: TreatmentAccessGraphStep) => {
    steps.push(step);
    events.push({
      event_id: `event-${runId}-${events.length + 1}`,
      node_id: step.node_id,
      kind: "node_completed",
      summary: step.summary,
      timestamp: generatedAt,
      trace_metadata: step.trace_metadata,
    });
    if (step.agent_result) {
      agentResults.push(step.agent_result);
    }
  };
  const takeBranch = (
    branch: TreatmentAccessGraphBranch,
    nodeId: TreatmentAccessGraphNodeId,
    summary: string,
  ) => {
    branchesTaken.push(branch);
    events.push({
      event_id: `event-${runId}-${events.length + 1}`,
      node_id: nodeId,
      kind: "branch_taken",
      summary,
      timestamp: generatedAt,
      trace_metadata: traceMetadata(nodeId, runContext, runId, mode, options),
    });
  };

  recordStep(
    await runGraphAgentStep("coverage-requirement", runContext, {
      mode,
      provider: options.provider,
      runId,
      options,
    }),
  );
  recordStep(
    await runGraphAgentStep("evidence-retrieval", runContext, {
      mode,
      provider: options.provider,
      runId,
      options,
    }),
  );
  const missingEvidenceStep = await runGraphAgentStep(
    "missing-evidence",
    runContext,
    {
      mode,
      provider: options.provider,
      runId,
      options,
    },
  );
  recordStep(missingEvidenceStep);

  if (
    missingEvidenceStep.agent_result?.output.agent_id === "missing-evidence" &&
    !missingEvidenceStep.agent_result.output.can_submit
  ) {
    takeBranch(
      "missing_evidence_to_human_gate",
      "missing-evidence",
      "Blocking evidence is missing; route to human evidence gate.",
    );
    const gate = createHumanGate(
      "missing_evidence",
      "pending",
      "Coordinator must supply missing blocking evidence before submission.",
      "missing-evidence",
      runContext,
      runId,
      mode,
      options,
    );
    humanGates.push(gate);
    recordHumanGateEvent(gate, events, runId);
    recordStep(createAuditStep(runContext, runId, mode, options));
    return finalizeGraphRun({
      runId,
      mode,
      status: "waiting_human",
      context: runContext,
      steps,
      events,
      branchesTaken,
      humanGates,
      robotFallbackRequests,
      submissionAttempts,
      agentResults,
    });
  }

  if (runContext.toggles.clinician_rejects_assertion) {
    const gate = createHumanGate(
      "clinical_assertion",
      "rejected",
      "Clinician rejected the high-impact assertion; evidence must be reworked.",
      "human-gate",
      runContext,
      runId,
      mode,
      options,
    );
    humanGates.push(gate);
    recordHumanGateEvent(gate, events, runId);
    takeBranch(
      "clinician_rejection_to_rework",
      "human-gate",
      "Clinician rejection sends the evidence package back for rework.",
    );
    const rejectedContext = createGraphRuntimeContext(options, "rejected");
    recordStep(
      await runGraphAgentStep("submission-packet", rejectedContext, {
        mode,
        provider: options.provider,
        runId,
        options,
      }),
    );
    recordStep(createAuditStep(rejectedContext, runId, mode, options));
    return finalizeGraphRun({
      runId,
      mode,
      status: "blocked",
      context: rejectedContext,
      steps,
      events,
      branchesTaken,
      humanGates,
      robotFallbackRequests,
      submissionAttempts,
      agentResults,
    });
  }

  const approvalGate = createHumanGate(
    "clinical_assertion",
    "approved",
    "Clinician approved the high-impact assertion for this synthetic packet.",
    "human-gate",
    runContext,
    runId,
    mode,
    options,
  );
  humanGates.push(approvalGate);
  recordHumanGateEvent(approvalGate, events, runId);
  takeBranch(
    "complete_evidence_to_submission",
    "missing-evidence",
    "Evidence is complete and human assertion gate is approved.",
  );

  const approvedContext = createGraphRuntimeContext(options, "approved");
  const submissionStep = await runGraphAgentStep(
    "submission-packet",
    approvedContext,
    {
      mode,
      provider: options.provider,
      runId,
      options,
    },
  );
  recordStep(submissionStep);

  if (
    submissionStep.agent_result?.output.agent_id === "submission-packet" &&
    !submissionStep.agent_result.output.ready_to_submit
  ) {
    const gate = createHumanGate(
      "exception_review",
      "pending",
      "Submission packet remained blocked after approval gate.",
      "submission-packet",
      approvedContext,
      runId,
      mode,
      options,
    );
    humanGates.push(gate);
    recordHumanGateEvent(gate, events, runId);
    recordStep(createAuditStep(approvedContext, runId, mode, options));
    return finalizeGraphRun({
      runId,
      mode,
      status: "waiting_human",
      context: approvedContext,
      steps,
      events,
      branchesTaken,
      humanGates,
      robotFallbackRequests,
      submissionAttempts,
      agentResults,
    });
  }

  const submissionAttempt = createSubmissionAttempt(
    approvedContext,
    runId,
    approvedContext.toggles.payer_api_unavailable
      ? "fallback_required"
      : "submitted",
  );
  submissionAttempts.push(submissionAttempt);

  if (approvedContext.toggles.payer_api_unavailable) {
    takeBranch(
      "payer_api_unavailable_to_robot_fallback",
      "submission-packet",
      "Payer API unavailable; request UiPath robot fallback without starting a live job.",
    );
    const fallbackRequest = createRobotFallbackRequest(
      approvedContext,
      runId,
      mode,
      options,
    );
    robotFallbackRequests.push(fallbackRequest);
    events.push({
      event_id: `event-${runId}-${events.length + 1}`,
      node_id: "robot-fallback-request",
      kind: "robot_fallback_requested",
      summary:
        "Prepared Orchestrator robot fallback request; no live UiPath job was started.",
      timestamp: generatedAt,
      trace_metadata: fallbackRequest.trace_metadata,
    });
    recordStep(createRobotFallbackStep(fallbackRequest));
    recordStep(createAuditStep(approvedContext, runId, mode, options));
    return finalizeGraphRun({
      runId,
      mode,
      status: "robot_fallback_requested",
      context: approvedContext,
      steps,
      events,
      branchesTaken,
      humanGates,
      robotFallbackRequests,
      submissionAttempts,
      agentResults,
    });
  }

  if (
    approvedContext.payerDecision.status === "approved" ||
    approvedContext.payerDecision.status === "appeal_approved"
  ) {
    takeBranch(
      "approval_to_care_handoff",
      "submission-packet",
      "Payer approval routes to care continuity handoff.",
    );
    recordStep(
      await runGraphAgentStep("care-continuity", approvedContext, {
        mode,
        provider: options.provider,
        runId,
        options,
      }),
    );
    recordStep(createAuditStep(approvedContext, runId, mode, options));
    return finalizeGraphRun({
      runId,
      mode,
      status: "completed",
      context: approvedContext,
      steps,
      events,
      branchesTaken,
      humanGates,
      robotFallbackRequests,
      submissionAttempts,
      agentResults,
    });
  }

  takeBranch(
    "denial_to_appeal",
    "submission-packet",
    "Denied payer decision routes to denial rescue and appeal packet.",
  );
  recordStep(
    await runGraphAgentStep("denial-rescue", approvedContext, {
      mode,
      provider: options.provider,
      runId,
      options,
    }),
  );
  recordStep(
    await runGraphAgentStep("appeal-packet", approvedContext, {
      mode,
      provider: options.provider,
      runId,
      options,
    }),
  );
  const appealGate = createHumanGate(
    "appeal_signoff",
    "pending",
    "Appeal draft requires clinician signoff before any submission.",
    "appeal-packet",
    approvedContext,
    runId,
    mode,
    options,
  );
  humanGates.push(appealGate);
  recordHumanGateEvent(appealGate, events, runId);
  recordStep(createAuditStep(approvedContext, runId, mode, options));

  return finalizeGraphRun({
    runId,
    mode,
    status: "waiting_human",
    context: approvedContext,
    steps,
    events,
    branchesTaken,
    humanGates,
    robotFallbackRequests,
    submissionAttempts,
    agentResults,
  });
}

type GraphAgentStepOptions = {
  mode: TreatmentAccessGraphMode;
  provider?: TreatmentAccessStructuredProvider;
  runId: string;
  options: TreatmentAccessGraphOptions;
};

async function runGraphAgentStep(
  agentId: AgentId,
  context: RuntimeContext,
  stepOptions: GraphAgentStepOptions,
): Promise<TreatmentAccessGraphStep> {
  const deterministicResult = runAgent(agentId, context);
  const trace = traceMetadata(
    agentId,
    context,
    stepOptions.runId,
    stepOptions.mode,
    stepOptions.options,
    agentId,
  );
  const output =
    stepOptions.mode === "live" && stepOptions.provider
      ? AgentOutputSchema.parse(
          await stepOptions.provider.invokeAgentNode({
            agent_id: agentId,
            display_name: AgentDisplayNameById[agentId],
            prompt: promptForAgent(agentId),
            deterministic_output: deterministicResult.output,
            output_schema: outputSchemaName(agentId),
            trace_metadata: trace,
          }),
        )
      : AgentOutputSchema.parse(deterministicResult.output);
  const traceStatus = statusForOutput(output);
  const stepStatus = graphStepStatusForTraceStatus(traceStatus);
  const outputSummary = outputSummaryForAgent(agentId, output);
  const agentResult: AgentRuntimeResult = {
    ...deterministicResult,
    trace: {
      ...deterministicResult.trace,
      trace_id: trace.trace_id,
      status: traceStatus,
      output_summary: outputSummary,
      tool_calls:
        stepOptions.mode === "live" && stepOptions.provider
          ? [
              ...deterministicResult.trace.tool_calls,
              `${stepOptions.provider.provider_name}_structured_model`,
            ]
          : deterministicResult.trace.tool_calls,
    },
    audit_event: {
      ...deterministicResult.audit_event,
      trace_id: trace.trace_id,
      output_summary: outputSummary,
    },
    output,
  };

  return {
    node_id: agentId,
    agent_id: agentId,
    status: stepStatus,
    summary: outputSummary,
    output_schema: outputSchemaName(agentId),
    validated: true,
    trace_metadata: trace,
    agent_result: agentResult,
    tool_results: toolResultsForAgent(agentId, context, trace),
  };
}

export function createFireworksStructuredProvider(
  runtimeConfig: AgentRuntimeConfig,
): TreatmentAccessStructuredProvider {
  const client = createFireworksClient(runtimeConfig);

  return {
    provider_name: "fireworks",
    async invokeAgentNode(input) {
      const response = await client.chatCompletionsCreate({
        model: runtimeConfig.fireworks.agentModel,
        messages: [
          {
            role: "system",
            content: [
              "You are a schema-bounded treatment access agent for a synthetic demo.",
              "Return JSON only. Do not include medical or legal advice.",
              "Every clinical assertion must stay source-backed, policy-cited, or routed to human approval.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              agent_id: input.agent_id,
              display_name: input.display_name,
              task: input.prompt,
              output_schema: input.output_schema,
              synthetic_only: true,
              deterministic_output_to_preserve: input.deterministic_output,
            }),
          },
        ],
        temperature: 0,
        max_tokens: 1800,
        response_format: { type: "json_object" },
      });
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(
          `Fireworks returned an empty response for ${input.agent_id}.`,
        );
      }

      return AgentOutputSchema.parse(parseJsonObject(content));
    },
  };
}

export async function runTreatmentAccessLiveProof(
  options: TreatmentAccessLiveProofOptions = {},
): Promise<LiveProofRun> {
  const validation = resolveAgentRuntimeConfig(options.env);
  const requestedMode = options.mode ?? validation.config.mode;
  if (requestedMode === "live" && !validation.ok) {
    throw new Error(
      `Live proof runtime configuration is invalid: ${validation.errors.join(
        "; ",
      )}`,
    );
  }

  const mode: TreatmentAccessGraphMode =
    requestedMode === "live" ? "live" : "deterministic";
  const provider =
    mode === "live"
      ? (options.provider ??
        createFireworksStructuredProvider(validation.config))
      : undefined;
  const fixture = options.fixture ?? treatmentAccessDemoFixture;
  const toggles = DemoTogglesSchema.parse({
    ...fixture.demoToggles,
    payer_api_unavailable: true,
    ...options.toggles,
  });
  const context = createGraphRuntimeContext(
    { fixture, toggles },
    "approved",
  );
  const startedAt = new Date().toISOString();
  const runId =
    options.runId ??
    `live-proof-${fixture.case.case_id}-${startedAt.replace(/[:.]/g, "-")}`;
  const graphOptions: TreatmentAccessGraphOptions = {
    fixture,
    toggles,
    mode,
    provider,
    langsmith: {
      project: validation.config.langSmith.projectName,
      trace_id: `trace-${runId}`,
      run_url: options.langsmithRunUrl,
    },
  };
  const agentSteps: TreatmentAccessGraphStep[] = [];

  for (const agentId of agentOrder) {
    agentSteps.push(
      await runGraphAgentStep(agentId, context, {
        mode,
        provider,
        runId,
        options: graphOptions,
      }),
    );
  }

  const traces = uniqueBy(
    agentSteps.map((step) =>
      liveProofTraceFromMetadata(
        step.trace_metadata,
        validation.config,
        options.langsmithRunUrl,
        startedAt,
      ),
    ),
    (trace) => trace.trace_id,
  );
  const uipathEvidenceRefs = createUiPathEvidenceRefs(
    runId,
    mode,
    validation.config,
    options.langsmithRunUrl,
    startedAt,
  );
  const approvalGates = createLiveProofApprovalGates(
    runId,
    fixture.case.case_id,
    traces[0],
  );
  const proofSteps = createLiveProofSteps({
    runId,
    caseId: fixture.case.case_id,
    mode,
    startedAt,
    agentSteps,
    traces,
    uipathEvidenceRefs,
    payerApiUnavailable: toggles.payer_api_unavailable,
  });
  const mirrorEvents = createLiveProofMirrorEvents({
    runId,
    caseId: fixture.case.case_id,
    maestroCaseId: fixture.case.maestro_case_id,
    steps: proofSteps,
    traces,
  });
  const agentRun = AgentRunSchema.parse({
    run_id: runId,
    case_id: fixture.case.case_id,
    maestro_case_id: fixture.case.maestro_case_id,
    mode,
    orchestrator: validation.config.orchestrator,
    status: "needs_human",
    started_at: startedAt,
    completed_at: startedAt,
    requested_by: options.requestedBy ?? "Command Center live proof",
    current_stage: "submission",
    active_secondary_stages: toggles.payer_api_unavailable
      ? ["api_failure_portal_fallback", "human_exception_review"]
      : ["human_exception_review"],
    trace_link: createLangSmithTraceLink({
      traceId: `trace-${runId}`,
      runId,
      url: options.langsmithRunUrl,
      runtimeConfig: validation.config,
      metadata: { case_id: fixture.case.case_id, live_proof: true },
    }),
    synthetic: true,
    safety_summary:
      "Synthetic proof only; payer submission and UiPath side effects remain approval-gated.",
  } satisfies AgentRun);

  return LiveProofRunSchema.parse({
    run_id: runId,
    case_id: fixture.case.case_id,
    requested_by: options.requestedBy ?? "Command Center live proof",
    mode,
    status: "waiting_for_approval",
    current_stage: "live_proof_completed_or_waiting_for_approval",
    started_at: startedAt,
    completed_at: startedAt,
    steps: proofSteps,
    approval_gates: approvalGates,
    traces,
    uipath_evidence_refs: uipathEvidenceRefs,
    agent_run: agentRun,
    step_runs: createLiveProofStepRuns(
      runId,
      fixture.case.case_id,
      agentSteps,
    ),
    tool_calls: createLiveProofToolCalls(
      runId,
      fixture.case.case_id,
      agentSteps,
    ),
    submission_attempts: [
      createSubmissionAttempt(
        context,
        runId,
        toggles.payer_api_unavailable ? "fallback_required" : "submitted",
      ),
    ],
    mirror_events: mirrorEvents,
    source_labels: [
      mode === "live"
        ? "Fireworks structured model outputs"
        : "Deterministic runtime fallback",
      langSmithTracingEnabled(validation.config.langSmith)
        ? options.langsmithRunUrl
          ? "LangSmith trace URL captured"
          : "LangSmith trace metadata captured"
        : "LangSmith not configured",
      "UiPath event mirror records (synthetic)",
      "No live UiPath side effects",
    ],
    no_live_uipath_side_effects: true,
    no_real_payer_submission: true,
  });
}

function finalizeGraphRun(input: {
  runId: string;
  mode: TreatmentAccessGraphMode;
  status: TreatmentAccessGraphRun["status"];
  context: RuntimeContext;
  steps: TreatmentAccessGraphStep[];
  events: TreatmentAccessGraphEvent[];
  branchesTaken: TreatmentAccessGraphBranch[];
  humanGates: TreatmentAccessHumanGate[];
  robotFallbackRequests: TreatmentAccessRobotFallbackRequest[];
  submissionAttempts: SubmissionAttempt[];
  agentResults: AgentRuntimeResult[];
}): TreatmentAccessGraphRun {
  const safetyFlags = input.agentResults.flatMap(
    (result) => result.output.safety_flags,
  );
  const evidenceRefs = unique(
    input.agentResults.flatMap((result) => result.trace.evidence_refs),
  );
  const summary = AgentRuntimeSummarySchema.parse({
    case_id: input.context.fixture.case.case_id,
    generated_at: generatedAt,
    results: input.agentResults,
    safety_flags: safetyFlags,
    evidence_refs: evidenceRefs,
    synthetic_data_disclaimer:
      "Synthetic LangGraph workflow runtime; no live UiPath execution or real payer submission.",
  });

  return {
    run_id: input.runId,
    case_id: input.context.fixture.case.case_id,
    mode: input.mode,
    status: input.status,
    graph: treatmentAccessGraphDefinition,
    steps: input.steps,
    events: input.events,
    branches_taken: input.branchesTaken,
    human_gates: input.humanGates,
    robot_fallback_requests: input.robotFallbackRequests,
    submission_attempts: input.submissionAttempts,
    summary,
    no_live_uipath_side_effects: true,
    no_real_payer_submission: true,
    synthetic_data_disclaimer:
      "Synthetic LangGraph workflow runtime; no live UiPath execution or real payer submission.",
  };
}

function createLiveProofSteps(input: {
  runId: string;
  caseId: string;
  mode: TreatmentAccessGraphMode;
  startedAt: string;
  agentSteps: TreatmentAccessGraphStep[];
  traces: LiveProofTrace[];
  uipathEvidenceRefs: UiPathEvidenceRef[];
  payerApiUnavailable: boolean;
}): LiveProofStep[] {
  const coverage = requireAgentStep(input.agentSteps, "coverage-requirement");
  const evidence = requireAgentStep(input.agentSteps, "evidence-retrieval");
  const missing = requireAgentStep(input.agentSteps, "missing-evidence");
  const submission = requireAgentStep(input.agentSteps, "submission-packet");
  const trace = input.traces[0];
  const sourceRefs = input.uipathEvidenceRefs;
  const stages: Array<{
    stage: LiveProofStage;
    title: string;
    summary: string;
    actor_type: LiveProofStep["actor_type"];
    actor_name: string;
    status: LiveProofStep["status"];
    output_schema?: string;
    evidence_refs?: string[];
    trace?: LiveProofTrace;
  }> = [
    {
      stage: "case_live_proof_started",
      title: "Synthetic live proof started",
      summary:
        input.mode === "live"
          ? "Command Center requested a live Fireworks-backed synthetic proof run."
          : "Command Center requested a deterministic synthetic proof run because live model mode is not active.",
      actor_type: "system",
      actor_name: "Treatment Access API",
      status: "completed",
      trace,
    },
    {
      stage: "policy_checked",
      title: "Policy checked",
      summary: coverage.summary,
      actor_type: "agent",
      actor_name: AgentDisplayNameById["coverage-requirement"],
      status: "completed",
      output_schema: coverage.output_schema,
      evidence_refs: coverage.agent_result?.trace.evidence_refs,
      trace: liveProofTraceForStep(coverage, input.traces),
    },
    {
      stage: "evidence_mapped",
      title: "Evidence mapped",
      summary: evidence.summary,
      actor_type: "agent",
      actor_name: AgentDisplayNameById["evidence-retrieval"],
      status: "completed",
      output_schema: evidence.output_schema,
      evidence_refs: evidence.agent_result?.trace.evidence_refs,
      trace: liveProofTraceForStep(evidence, input.traces),
    },
    {
      stage: "human_gate_required",
      title: "Human gate required",
      summary:
        "A clinician approval gate is required for the high-impact clinical assertion before any payer-facing submission.",
      actor_type: "human",
      actor_name: "Demo GI Clinician",
      status: "waiting_for_approval",
      output_schema: missing.output_schema,
      evidence_refs: missing.agent_result?.trace.evidence_refs,
      trace: liveProofTraceForStep(missing, input.traces),
    },
    {
      stage: "submission_packet_ready_or_blocked",
      title: "Submission packet ready or blocked",
      summary: submission.summary,
      actor_type: "agent",
      actor_name: AgentDisplayNameById["submission-packet"],
      status:
        submission.status === "blocked" ? "blocked" : "waiting_for_approval",
      output_schema: submission.output_schema,
      evidence_refs: submission.agent_result?.trace.evidence_refs,
      trace: liveProofTraceForStep(submission, input.traces),
    },
    {
      stage: "payer_api_unavailable_or_not_attempted",
      title: "Payer API unavailable or not attempted",
      summary: input.payerApiUnavailable
        ? "Synthetic payer API is unavailable; UiPath robot fallback request is prepared but no live job is started."
        : "Payer API call was not attempted because live payer submission remains approval-gated.",
      actor_type: "api_workflow",
      actor_name: "UiPath API Workflow",
      status: "waiting_for_approval",
      trace,
    },
    {
      stage: "live_proof_completed_or_waiting_for_approval",
      title: "Live proof completed or waiting for approval",
      summary:
        "The synthetic proof run completed local validation and is waiting for clinician/UiPath approval gates before side effects.",
      actor_type: "system",
      actor_name: "Treatment Access API",
      status: "waiting_for_approval",
      trace,
    },
  ];

  return stages.map((stage, index) => ({
    step_id: `${input.runId}-stage-${String(index + 1).padStart(2, "0")}`,
    run_id: input.runId,
    case_id: input.caseId,
    stage: stage.stage,
    status: stage.status,
    title: stage.title,
    summary: stage.summary,
    actor_type: stage.actor_type,
    actor_name: stage.actor_name,
    started_at: input.startedAt,
    completed_at: input.startedAt,
    trace: stage.trace,
    evidence_refs: stage.evidence_refs ?? [],
    uipath_evidence_refs: sourceRefs.filter(
      (ref) =>
        ref.source === "uipath_event_mirror" ||
        ref.source === "langsmith" ||
        (input.mode === "live" && ref.source === "fireworks"),
    ),
    output_schema: stage.output_schema,
    validated: true,
    synthetic: true,
  }));
}

function createLiveProofApprovalGates(
  runId: string,
  caseId: string,
  trace?: LiveProofTrace,
): LiveProofApprovalGate[] {
  const gates: LiveProofApprovalGate[] = [
    {
      gate_id: `${runId}-clinical-assertion-gate`,
      gate_type: "clinical_assertion",
      status: "approved_for_demo",
      assigned_role: "Demo GI Clinician",
      reason:
        "Clinician approval is required for high-impact clinical assertion language; this synthetic proof marks the gate approved only to continue local validation.",
      source_stage: "human_gate_required",
      trace,
      synthetic: true,
    },
    {
      gate_id: `${runId}-payer-side-effect-gate`,
      gate_type: "exception_review",
      status: "pending",
      assigned_role: "Treatment Access Coordinator",
      reason:
        "Live UiPath job start, Action Center task creation, Data Service writes, and payer submission remain explicit-approval gated.",
      source_stage: "live_proof_completed_or_waiting_for_approval",
      trace,
      synthetic: true,
    },
  ];
  return gates.map((gate) => ({
    ...gate,
    gate_id: `${caseId}-${gate.gate_id}`,
  }));
}

function createLiveProofMirrorEvents(input: {
  runId: string;
  caseId: string;
  maestroCaseId?: string;
  steps: LiveProofStep[];
  traces: LiveProofTrace[];
}): AuditEvent[] {
  return input.steps.map((step, index) => ({
    event_id: `event-${input.runId}-${String(index + 1).padStart(2, "0")}`,
    case_id: input.caseId,
    maestro_case_id: input.maestroCaseId,
    actor_type: step.actor_type,
    actor_name: step.actor_name,
    task_or_agent_name: step.actor_name,
    action: step.stage,
    input_summary:
      index === 0
        ? "Command Center requested a synthetic live proof run."
        : `Live proof stage ${step.stage} started.`,
    output_summary: step.summary,
    evidence_refs: step.evidence_refs,
    trace_id: step.trace?.trace_id ?? input.traces[0]?.trace_id,
    payer_status:
      step.stage === "payer_api_unavailable_or_not_attempted"
        ? "unavailable"
        : undefined,
    timestamp: step.completed_at ?? step.started_at,
  }));
}

function createLiveProofStepRuns(
  runId: string,
  caseId: string,
  agentSteps: TreatmentAccessGraphStep[],
) {
  return agentSteps.map((step) => {
    if (!step.agent_id) {
      throw new Error(`Live proof step ${step.node_id} is missing agent_id.`);
    }
    return AgentStepRunSchema.parse({
      step_run_id: `${runId}-${step.node_id}`,
      run_id: runId,
      case_id: caseId,
      agent_id: step.agent_id,
      agent_name: step.agent_id ? AgentDisplayNameById[step.agent_id] : "",
      status: runtimeStatusForGraphStep(step.status),
      input_summary: step.agent_result?.trace.input_summary ?? step.summary,
      output_summary: step.summary,
      started_at: generatedAt,
      completed_at: generatedAt,
      tool_call_ids: step.tool_results.map((tool) => tool.tool_call_id),
      evidence_refs: step.agent_result?.trace.evidence_refs ?? [],
      safety_flags: step.agent_result?.output.safety_flags ?? [],
      trace_link: createLangSmithTraceLink({
        traceId: step.trace_metadata.langsmith_trace_id,
        runId,
        url: step.trace_metadata.langsmith_run_url,
        metadata: {
          case_id: caseId,
          node_id: step.node_id,
          synthetic: true,
        },
      }),
      synthetic: true,
    });
  });
}

function createLiveProofToolCalls(
  runId: string,
  caseId: string,
  agentSteps: TreatmentAccessGraphStep[],
): ToolCall[] {
  return agentSteps.flatMap((step) =>
    step.tool_results.map((tool) =>
      ToolCallSchema.parse({
        tool_call_id: tool.tool_call_id,
        run_id: runId,
        step_run_id: `${runId}-${step.node_id}`,
        case_id: caseId,
        tool_name: tool.tool_name,
        arguments_hash: `sha256-syn-${tool.tool_call_id}`,
        arguments_summary: tool.arguments_summary,
        result_summary: tool.result_summary,
        status:
          tool.status === "completed"
            ? "succeeded"
            : tool.status === "blocked"
              ? "failed"
              : "skipped",
        started_at: generatedAt,
        completed_at: generatedAt,
        trace_link: createLangSmithTraceLink({
          traceId: tool.trace_metadata.langsmith_trace_id,
          runId,
          url: tool.trace_metadata.langsmith_run_url,
          metadata: {
            case_id: caseId,
            tool_name: tool.tool_name,
            synthetic: true,
          },
        }),
        synthetic: true,
      }),
    ),
  );
}

function createUiPathEvidenceRefs(
  runId: string,
  mode: TreatmentAccessGraphMode,
  config: AgentRuntimeConfig,
  langsmithRunUrl: string | undefined,
  capturedAt: string,
): UiPathEvidenceRef[] {
  return [
    {
      evidence_ref_id: `${runId}-event-mirror`,
      source: "uipath_event_mirror",
      label: "Synthetic UiPath event mirror records prepared",
      external_id: runId,
      captured_at: capturedAt,
      synthetic: true,
    },
    {
      evidence_ref_id: `${runId}-runtime-provider`,
      source: mode === "live" ? "fireworks" : "deterministic_runtime",
      label:
        mode === "live"
          ? "Fireworks structured model provider invoked"
          : "Deterministic runtime fallback used",
      captured_at: capturedAt,
      synthetic: true,
    },
    {
      evidence_ref_id: `${runId}-trace`,
      source: "langsmith",
      label: langSmithTracingEnabled(config.langSmith)
        ? langsmithRunUrl
          ? "LangSmith trace URL captured"
          : "LangSmith trace metadata captured"
        : "LangSmith tracing not configured",
      url: langsmithRunUrl,
      captured_at: capturedAt,
      synthetic: true,
    },
  ];
}

function liveProofTraceFromMetadata(
  metadata: TreatmentAccessTraceMetadata,
  config: AgentRuntimeConfig,
  langsmithRunUrl: string | undefined,
  capturedAt: string,
): LiveProofTrace {
  const langsmithEnabled = langSmithTracingEnabled(config.langSmith);
  return {
    trace_id: metadata.langsmith_trace_id ?? metadata.trace_id,
    provider: langsmithEnabled ? "langsmith" : "local",
    status: langsmithRunUrl
      ? "available"
      : langsmithEnabled
        ? "metadata_only"
        : "not_configured",
    project_name: metadata.langsmith_project,
    url: langsmithRunUrl,
    metadata: compactTraceMetadata({
      ...metadata.metadata,
      local_trace_id: metadata.trace_id,
      langsmith_configured: langsmithEnabled,
    }),
    captured_at: capturedAt,
    synthetic: true,
  };
}

function liveProofTraceForStep(
  step: TreatmentAccessGraphStep,
  traces: LiveProofTrace[],
): LiveProofTrace | undefined {
  return traces.find(
    (trace) =>
      trace.trace_id ===
      (step.trace_metadata.langsmith_trace_id ?? step.trace_metadata.trace_id),
  );
}

function requireAgentStep(
  steps: TreatmentAccessGraphStep[],
  agentId: AgentId,
): TreatmentAccessGraphStep {
  const step = steps.find((candidate) => candidate.agent_id === agentId);
  if (!step) {
    throw new Error(`Live proof did not produce ${agentId} step.`);
  }
  return step;
}

function runtimeStatusForGraphStep(
  status: TreatmentAccessGraphStep["status"],
): AgentRun["status"] {
  switch (status) {
    case "completed":
      return "completed";
    case "needs_human":
    case "fallback_requested":
      return "needs_human";
    case "blocked":
      return "failed";
    case "skipped":
      return "cancelled";
  }
}

function createHumanGate(
  gateType: TreatmentAccessHumanGate["gate_type"],
  status: TreatmentAccessHumanGate["status"],
  reason: string,
  sourceNodeId: TreatmentAccessGraphNodeId,
  context: RuntimeContext,
  runId: string,
  mode: TreatmentAccessGraphMode,
  options: TreatmentAccessGraphOptions,
): TreatmentAccessHumanGate {
  return {
    gate_id: `gate-${runId}-${gateType}-${status}`,
    gate_type: gateType,
    status,
    assigned_role:
      gateType === "appeal_signoff"
        ? "Demo GI Clinician"
        : "Treatment Access Coordinator",
    reason,
    source_node_id: sourceNodeId,
    trace_metadata: traceMetadata("human-gate", context, runId, mode, options),
  };
}

function recordHumanGateEvent(
  gate: TreatmentAccessHumanGate,
  events: TreatmentAccessGraphEvent[],
  runId: string,
): void {
  events.push({
    event_id: `event-${runId}-${events.length + 1}`,
    node_id: "human-gate",
    kind: "human_gate_recorded",
    summary: `${gate.gate_type} gate is ${gate.status}: ${gate.reason}`,
    timestamp: generatedAt,
    trace_metadata: gate.trace_metadata,
  });
}

function createRobotFallbackRequest(
  context: RuntimeContext,
  runId: string,
  mode: TreatmentAccessGraphMode,
  options: TreatmentAccessGraphOptions,
): TreatmentAccessRobotFallbackRequest {
  return {
    request_id: `robot-request-${runId}`,
    status: "requested_not_started",
    orchestrator_folder: "TreatmentAccessHackathon",
    robot_process_name: "PayerPortalFallback",
    reason_code: "PAYER_API_DOWN",
    no_live_job_started: true,
    trace_metadata: traceMetadata(
      "robot-fallback-request",
      context,
      runId,
      mode,
      options,
    ),
  };
}

function createRobotFallbackStep(
  request: TreatmentAccessRobotFallbackRequest,
): TreatmentAccessGraphStep {
  return {
    node_id: "robot-fallback-request",
    status: "fallback_requested",
    summary:
      "Robot fallback request prepared for UiPath Orchestrator; no live job started.",
    output_schema: "RobotFallbackRequest",
    validated: true,
    trace_metadata: request.trace_metadata,
    tool_results: [
      {
        tool_call_id: `${request.request_id}-tool`,
        owner_node_id: "robot-fallback-request",
        tool_name: "request_portal_robot_fallback",
        arguments_summary:
          "Prepare PayerPortalFallback request for TreatmentAccessHackathon folder.",
        result_summary:
          "Structured request created in no-side-effect mode; Orchestrator job start remains approval-gated.",
        status: "fallback_required",
        schema_name: "RobotJob",
        validated: true,
        trace_metadata: request.trace_metadata,
      },
    ],
  };
}

function createAuditStep(
  context: RuntimeContext,
  runId: string,
  mode: TreatmentAccessGraphMode,
  options: TreatmentAccessGraphOptions,
): TreatmentAccessGraphStep {
  const trace = traceMetadata("audit-packet", context, runId, mode, options);
  return {
    node_id: "audit-packet",
    status: "completed",
    summary:
      "Cross-cutting audit packet assembled from validated graph steps and governed branch records.",
    output_schema: "AuditPacket",
    validated: true,
    trace_metadata: trace,
    tool_results: [
      {
        tool_call_id: `tool-${runId}-audit-event`,
        owner_node_id: "audit-packet",
        tool_name: "write_audit_event",
        arguments_summary:
          "Collect graph steps, human gates, submission attempts, and fallback requests.",
        result_summary:
          "Audit packet returned locally; no Data Service/Data Fabric write performed.",
        status: "completed",
        schema_name: "AuditPacket",
        validated: true,
        trace_metadata: trace,
      },
    ],
  };
}

function createSubmissionAttempt(
  context: RuntimeContext,
  runId: string,
  status: "submitted" | "fallback_required",
): SubmissionAttempt {
  return {
    attempt_id: `attempt-${runId}-payer-api`,
    case_id: context.fixture.case.case_id,
    packet_id: context.fixture.submissionPacket.packet_id,
    channel: "payer_api",
    status,
    started_at: generatedAt,
    completed_at: generatedAt,
    payload_summary:
      "Validated synthetic prior authorization packet staged for payer API workflow.",
    response_summary:
      status === "fallback_required"
        ? "Synthetic payer API unavailable; robot fallback request required."
        : "Synthetic no-side-effect payer API attempt recorded locally.",
    error_code: status === "fallback_required" ? "PAYER_API_DOWN" : undefined,
    retry_count: status === "fallback_required" ? 1 : 0,
  };
}

function traceMetadata(
  nodeId: TreatmentAccessGraphNodeId,
  context: RuntimeContext,
  runId: string,
  mode: TreatmentAccessGraphMode,
  options: TreatmentAccessGraphOptions,
  agentId?: AgentId,
): TreatmentAccessTraceMetadata {
  return {
    trace_id: `trace-${runId}-${nodeId}`,
    langsmith_trace_id: options.langsmith?.trace_id,
    langsmith_run_url: options.langsmith?.run_url,
    langsmith_project:
      options.langsmith?.project ?? "Treatment Access Command Center",
    metadata: {
      case_id: context.fixture.case.case_id,
      run_id: runId,
      node_id: nodeId,
      agent_id: agentId,
      maestro_case_id: context.fixture.case.maestro_case_id,
      run_mode: mode,
      synthetic: true,
    },
  };
}

function toolResultsForAgent(
  agentId: AgentId,
  context: RuntimeContext,
  trace: TreatmentAccessTraceMetadata,
): TreatmentAccessToolResult[] {
  return toolCallsForAgent(agentId).map((toolName, index) => ({
    tool_call_id: `tool-${trace.metadata.run_id}-${agentId}-${index + 1}`,
    owner_node_id: agentId,
    tool_name: graphToolName(agentId, index, toolName),
    arguments_summary: inputSummaryForAgent(agentId, context),
    result_summary: outputSummaryForAgent(
      agentId,
      runAgent(agentId, context).output,
    ),
    status: "completed",
    schema_name: toolSchemaName(agentId),
    validated: true,
    trace_metadata: trace,
  }));
}

function graphToolName(
  agentId: AgentId,
  index: number,
  fallbackName: string,
): string {
  const toolNames: Partial<Record<AgentId, string[]>> = {
    "coverage-requirement": ["retrieve_payer_policy"],
    "evidence-retrieval": [
      "retrieve_chart_artifacts",
      "search_evidence_spans",
      "write_evidence_matrix",
    ],
    "missing-evidence": ["create_clinician_validation_task"],
    "submission-packet": [
      "build_submission_packet",
      "attempt_payer_api_submission",
    ],
    "denial-rescue": ["classify_denial"],
    "appeal-packet": ["draft_appeal_packet", "create_appeal_signoff_task"],
    "care-continuity": ["create_care_handoff"],
  };
  return toolNames[agentId]?.[index] ?? fallbackName;
}

function toolSchemaName(agentId: AgentId): string {
  const schemaNames: Record<AgentId, string> = {
    "coverage-requirement": "CoverageRequirementAgentOutput",
    "evidence-retrieval": "EvidenceRetrievalAgentOutput",
    "missing-evidence": "HumanGate",
    "submission-packet": "SubmissionAttempt",
    "denial-rescue": "DenialRescueAgentOutput",
    "appeal-packet": "AppealPacketAgentOutput",
    "care-continuity": "PharmacyHandoff",
  };
  return schemaNames[agentId];
}

function outputSchemaName(agentId: AgentId): string {
  const schemaNames: Record<AgentId, string> = {
    "coverage-requirement": "CoverageRequirementAgentOutputSchema",
    "evidence-retrieval": "EvidenceRetrievalAgentOutputSchema",
    "missing-evidence": "MissingEvidenceAgentOutputSchema",
    "submission-packet": "SubmissionPacketAgentOutputSchema",
    "denial-rescue": "DenialRescueAgentOutputSchema",
    "appeal-packet": "AppealPacketAgentOutputSchema",
    "care-continuity": "CareContinuityAgentOutputSchema",
  };
  return schemaNames[agentId];
}

function promptForAgent(agentId: AgentId): string {
  const prompts: Record<AgentId, string> = {
    "coverage-requirement":
      "Resolve payer authorization requirements with policy citations only.",
    "evidence-retrieval":
      "Map synthetic chart artifacts to payer criteria and flag unsupported clinical claims.",
    "missing-evidence":
      "Find blocking evidence gaps and create human gate requests instead of bypassing them.",
    "submission-packet":
      "Build a source-backed administrative packet only after evidence and human gates pass.",
    "denial-rescue":
      "Classify the denial and select a source-grounded rescue strategy.",
    "appeal-packet":
      "Draft administrative appeal language for clinician review, not medical or legal advice.",
    "care-continuity":
      "Prepare post-approval pharmacy and scheduling handoff state.",
  };
  return prompts[agentId];
}

function statusForOutput(output: AgentOutput): AgentTrace["status"] {
  const hasBlockingFlag = output.safety_flags.some(
    (flag) => flag.severity === "blocking",
  );
  const needsHuman = output.safety_flags.some(
    (flag) => flag.requires_human_approval,
  );
  if (hasBlockingFlag) {
    return "failed";
  }
  if (needsHuman) {
    return "needs_human";
  }
  return "completed";
}

function graphStepStatusForTraceStatus(
  status: AgentTrace["status"],
): TreatmentAccessGraphStep["status"] {
  if (status === "failed") {
    return "blocked";
  }
  if (status === "running" || status === "not_started") {
    return "skipped";
  }
  return status;
}

function modeFromEnvironment(): TreatmentAccessGraphMode {
  return process.env.AGENT_MODE === "live" ? "live" : "deterministic";
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
    clinicalApproval: toggles.clinician_rejects_assertion
      ? "rejected"
      : "pending",
  };
}

function createGraphRuntimeContext(
  options: TreatmentAccessAgentRuntimeOptions,
  clinicalApproval: RuntimeContext["clinicalApproval"] = "pending",
): RuntimeContext {
  const context = createRuntimeContext(options);
  return {
    ...context,
    clinicalApproval,
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
    context.clinicalApproval,
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
    context.clinicalApproval,
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
    context.clinicalApproval,
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
  if (
    fixture.case.payer_status === "approved" ||
    fixture.case.payer_status === "appeal_approved"
  ) {
    const baseDecision = fixture.payerDecisions[0];
    if (baseDecision) {
      return {
        ...baseDecision,
        decision_id: `decision-${fixture.case.payer_status}`,
        status: fixture.case.payer_status,
        reason:
          "Synthetic approval decision supplied by fixture for graph branch verification.",
        denial_code: undefined,
        appeal_deadline: undefined,
        raw_response:
          "Synthetic approval response for deterministic graph mode only.",
      };
    }
  }

  return (
    denialLetterScenarios[toggles.denial_reason] ?? fixture.payerDecisions[0]
  );
}

function clinicalAssertionsForMappings(
  mappings: EvidenceMapping[],
  toggles: DemoToggles,
  clinicalApproval: RuntimeContext["clinicalApproval"] = toggles.clinician_rejects_assertion
    ? "rejected"
    : "pending",
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
      status:
        clinicalApproval === "approved"
          ? "supported"
          : clinicalApproval === "rejected"
            ? "unsupported"
            : "needs_human_approval",
      evidence_refs: artifactIdsFromMappings([diagnosisMapping]),
      policy_citations: diagnosisMapping.citations.map(
        (citation) => citation.label,
      ),
      human_approval_required: clinicalApproval !== "approved",
      warning:
        clinicalApproval === "approved"
          ? undefined
          : clinicalApproval === "rejected"
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

function uniqueBy<T>(items: T[], keyForItem: (item: T) => string): T[] {
  const seen = new Set<string>();
  const uniqueItems: T[] = [];
  for (const item of items) {
    const key = keyForItem(item);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }
  return uniqueItems;
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw new Error("Provider response did not contain a JSON object.");
  }
}

function compactTraceMetadata(
  metadata: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(metadata).filter((entry): entry is [
      string,
      string | number | boolean,
    ] => entry[1] !== undefined),
  );
}

export const runtimeScenarioFixtures = {
  missingSafetyLab: missingSafetyLabScenario,
} as const;
