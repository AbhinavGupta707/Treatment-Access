import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  DatabaseZap,
  FileCheck2,
  FileText,
  HeartPulse,
  History,
  KeyRound,
  Network,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  ToggleLeft,
  Truck,
  UserCheck,
  Workflow,
} from "lucide-react";
import type {
  AuditEvent,
  DemoToggles,
  EvidenceMapping,
  PolicyCriterion,
  TreatmentAccessCase,
} from "@tacc/shared-schemas";
import { loadRuntimeState, resetDemoState, updateDemoToggles } from "./lib/api";
import type {
  ActorFilter,
  DemoState,
  MirrorSubmission,
  RuntimeState,
} from "./lib/types";
import "./styles.css";

const stages: Array<{
  id: TreatmentAccessCase["current_stage"];
  label: string;
  owner: string;
}> = [
  { id: "intake", label: "Intake", owner: "Maestro" },
  { id: "policy_evidence", label: "Policy + evidence", owner: "Agents" },
  { id: "clinical_validation", label: "Clinical gate", owner: "Action Center" },
  { id: "submission", label: "Payer submit", owner: "API Workflow" },
  { id: "payer_decision", label: "Decision", owner: "Payer" },
  { id: "denial_rescue", label: "Denial rescue", owner: "Agents" },
  { id: "care_continuity", label: "Care handoff", owner: "API Workflow" },
  { id: "closure", label: "Audit packet", owner: "Maestro" },
];

const actorFilters: Array<{ id: ActorFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "agent", label: "Agents" },
  { id: "api_workflow", label: "API" },
  { id: "robot", label: "Robot" },
  { id: "human", label: "Humans" },
  { id: "system", label: "System" },
];

const agentDefinitions = [
  {
    name: "Coverage Requirement",
    traceNeedle: "Coverage Requirement Agent",
    role: "Reads payer policy into criteria",
    tool: "Policy fixture + citations",
  },
  {
    name: "Evidence Retrieval",
    traceNeedle: "Evidence Retrieval Agent",
    role: "Maps chart artifacts to criteria",
    tool: "EHR fixtures + evidence matrix",
  },
  {
    name: "Missing Evidence",
    traceNeedle: "Missing Evidence Agent",
    role: "Finds blocking documentation gaps",
    tool: "Action Center task packet",
  },
  {
    name: "Submission Packet",
    traceNeedle: "Submission Packet Agent",
    role: "Builds payer-ready packet",
    tool: "Attachments + unsupported warnings",
  },
  {
    name: "Denial Rescue",
    traceNeedle: "Denial Rescue Agent",
    role: "Classifies denial and strategy",
    tool: "Payer decision + policy citation",
  },
  {
    name: "Appeal Packet",
    traceNeedle: "Appeal Packet Agent",
    role: "Drafts administrative appeal",
    tool: "Source-grounded draft",
  },
  {
    name: "Care Continuity",
    traceNeedle: "Care Continuity Agent",
    role: "Routes approval to pharmacy",
    tool: "Handoff + scheduling task",
  },
];

function App() {
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");

  const refresh = useCallback(async (quiet = false) => {
    const controller = new AbortController();
    if (quiet) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setMutationError(null);

    try {
      const nextRuntime = await loadRuntimeState(controller.signal);
      setRuntime(nextRuntime);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }

    return () => controller.abort();
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(true), 8000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const updateToggle = async (patch: Partial<DemoToggles>) => {
    setMutationError(null);
    try {
      await updateDemoToggles(patch);
      await refresh(true);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to update toggle",
      );
    }
  };

  const resetDemo = async () => {
    setMutationError(null);
    try {
      await resetDemoState();
      await refresh(true);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to reset demo",
      );
    }
  };

  if (isLoading || !runtime) {
    return <LoadingShell />;
  }

  return (
    <Dashboard
      actorFilter={actorFilter}
      isRefreshing={isRefreshing}
      mutationError={mutationError}
      onActorFilterChange={setActorFilter}
      onRefresh={() => void refresh(true)}
      onReset={() => void resetDemo()}
      onToggle={(patch) => void updateToggle(patch)}
      runtime={runtime}
    />
  );
}

function Dashboard({
  actorFilter,
  isRefreshing,
  mutationError,
  onActorFilterChange,
  onRefresh,
  onReset,
  onToggle,
  runtime,
}: {
  actorFilter: ActorFilter;
  isRefreshing: boolean;
  mutationError: string | null;
  onActorFilterChange: (filter: ActorFilter) => void;
  onRefresh: () => void;
  onReset: () => void;
  onToggle: (patch: Partial<DemoToggles>) => void;
  runtime: RuntimeState;
}) {
  const { data } = runtime;
  const selectedCase = data.case;
  const evidenceByCriterion = useMemo(
    () => new Map(data.evidenceMappings.map((row) => [row.criterion_id, row])),
    [data.evidenceMappings],
  );
  const summary = summarizeEvidence(data.evidenceMappings);

  if (!selectedCase) {
    return (
      <main className="empty-shell">
        <EmptyState
          detail={runtime.error ?? "No cases returned from the event mirror."}
          title="No cases available"
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="case-rail" aria-label="Command Center navigation">
        <BrandLockup />
        <SourceCard runtime={runtime} />
        <CaseQueueItem
          caseRecord={selectedCase}
          event={latestEvent(data.events)}
          patientName={data.patient?.synthetic_name ?? "Synthetic patient"}
          selected
        />
        <DemoRunbook data={data} />
      </aside>

      <section className="workspace">
        <TopBar
          isRefreshing={isRefreshing}
          lastError={runtime.error}
          mutationError={mutationError}
          onRefresh={onRefresh}
          onReset={onReset}
          runtime={runtime}
        />

        <CaseHeader
          caseRecord={selectedCase}
          data={data}
          foundCount={summary.found}
          pendingCount={summary.pending}
        />

        <StageRail activeStage={selectedCase.current_stage} />

        <ProofStrip data={data} runtime={runtime} />

        <div className="content-grid">
          <section className="primary-stack">
            <AgentTraceBoard data={data} />
            <EvidenceMatrix
              criteria={data.criteria}
              evidenceByCriterion={evidenceByCriterion}
            />
          </section>

          <aside className="right-rail" aria-label="Runtime proof points">
            <FallbackPanel data={data} runtime={runtime} />
            <HumanGatesPanel data={data} />
            <AppealCarePanel data={data} />
            <DemoTogglesPanel
              disabled={runtime.source !== "api"}
              onToggle={onToggle}
              toggles={data.toggles}
            />
            <TimelinePanel
              actorFilter={actorFilter}
              events={data.events}
              onActorFilterChange={onActorFilterChange}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}

function BrandLockup() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark" aria-hidden="true">
        <HeartPulse size={20} />
      </div>
      <div>
        <strong>Treatment Access</strong>
        <span>Command Center</span>
      </div>
    </div>
  );
}

function SourceCard({ runtime }: { runtime: RuntimeState }) {
  const isLive = runtime.source === "api";
  return (
    <section className="rail-section">
      <div className="rail-label">State source</div>
      <div className={`source-card ${isLive ? "live" : "fallback"}`}>
        <DatabaseZap size={18} />
        <div>
          <strong>{isLive ? "Event mirror API" : "Fallback cache"}</strong>
          <span>{runtime.apiBaseUrl}</span>
        </div>
      </div>
      <p className="source-note">
        Visualization only. UiPath workflows, agents, robots, and human actions
        write the case records this screen reads.
      </p>
    </section>
  );
}

function TopBar({
  isRefreshing,
  lastError,
  mutationError,
  onRefresh,
  onReset,
  runtime,
}: {
  isRefreshing: boolean;
  lastError: string | null;
  mutationError: string | null;
  onRefresh: () => void;
  onReset: () => void;
  runtime: RuntimeState;
}) {
  return (
    <header className="top-bar">
      <div className="status-cluster">
        <span className={`source-chip ${runtime.source}`}>
          <DatabaseZap size={14} />
          {runtime.source === "api"
            ? "Live event mirror"
            : "Mirror unreachable"}
        </span>
        <span className="time-chip">
          Fetched {formatTime(runtime.lastFetchedAt)}
        </span>
        {lastError ? <span className="inline-alert">{lastError}</span> : null}
        {mutationError ? (
          <span className="inline-alert">{mutationError}</span>
        ) : null}
      </div>
      <div className="toolbar">
        <button className="icon-button" onClick={onRefresh} type="button">
          <RefreshCw size={16} className={isRefreshing ? "spin" : undefined} />
          <span>Refresh</span>
        </button>
        <button className="icon-button" onClick={onReset} type="button">
          <RotateCcw size={16} />
          <span>Reset demo</span>
        </button>
      </div>
    </header>
  );
}

function CaseHeader({
  caseRecord,
  data,
  foundCount,
  pendingCount,
}: {
  caseRecord: TreatmentAccessCase;
  data: DemoState;
  foundCount: number;
  pendingCount: number;
}) {
  const orderMedication =
    data.order?.medication_name ?? caseRecord.medication_name;
  const patientName = data.patient?.synthetic_name ?? "Synthetic patient";
  const latest = latestEvent(data.events);

  return (
    <section className="case-header">
      <div className="case-header-copy">
        <div className="case-key">
          <span>{caseRecord.external_case_key ?? caseRecord.case_id}</span>
          <StatusPill tone="informational" value="synthetic data" />
          <span className={`sla-badge ${caseRecord.sla_state}`}>
            {labelize(caseRecord.sla_state)}
          </span>
        </div>
        <h1>{patientName}</h1>
        <p>
          {orderMedication} · {caseRecord.payer_id} ·{" "}
          {labelize(caseRecord.urgency)} · {caseRecord.status}
        </p>
        <div className="latest-line">
          <Clock3 size={14} />
          <span>
            {latest
              ? displayEventSummary(latest)
              : "Waiting for first event mirror write."}
          </span>
        </div>
      </div>
      <div className="case-stats" aria-label="Case state summary">
        <MetricTile
          label="Evidence mapped"
          value={`${foundCount}/${data.criteria.length}`}
        />
        <MetricTile label="Human gates" value={`${pendingCount}`} />
        <MetricTile label="Mirror events" value={`${data.events.length}`} />
        <MetricTile
          label="SLA due"
          value={formatShortDate(caseRecord.sla_due_at)}
        />
      </div>
    </section>
  );
}

function StageRail({
  activeStage,
}: {
  activeStage: TreatmentAccessCase["current_stage"];
}) {
  const activeIndex = stages.findIndex((stage) => stage.id === activeStage);

  return (
    <nav className="stage-rail" aria-label="Maestro case stages">
      {stages.map((stage, index) => {
        const state =
          index < activeIndex
            ? "complete"
            : index === activeIndex
              ? "active"
              : "queued";
        return (
          <div className={`stage-node ${state}`} key={stage.id}>
            <span className="stage-dot" aria-hidden="true" />
            <div>
              <strong>{stage.label}</strong>
              <span>{stage.owner}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function ProofStrip({
  data,
  runtime,
}: {
  data: DemoState;
  runtime: RuntimeState;
}) {
  const hasRobotProof = hasRobotEvent(data) || Boolean(portalSubmission(data));
  const hasHumanGate = data.evidenceMappings.some(
    (row) => row.needs_human_review || row.status === "missing",
  );
  const hasAppeal = data.appeals.length > 0 || hasEventAction(data, "appeal");
  const hasHandoff =
    data.handoffs.length > 0 || hasEventAction(data, "handoff");

  return (
    <section className="proof-strip" aria-label="Walkthrough proof chain">
      <ProofStep
        icon={<DatabaseZap size={16} />}
        label="Live source"
        state={runtime.source === "api" ? "good" : "warn"}
        value={
          runtime.source === "api"
            ? "Event mirror reachable"
            : "Showing local cache"
        }
      />
      <ProofStep
        icon={<Bot size={16} />}
        label="Seven agents"
        state="good"
        value={`${agentDefinitions.length} surfaced distinctly`}
      />
      <ProofStep
        icon={<UserCheck size={16} />}
        label="Action Center"
        state={hasHumanGate ? "warn" : "good"}
        value={hasHumanGate ? "Gate pending/needed" : "No open evidence gate"}
      />
      <ProofStep
        icon={<ShieldAlert size={16} />}
        label="API failure"
        state={apiFailureActive(data) ? "danger" : "idle"}
        value={
          apiFailureActive(data) ? "Fallback required" : "API channel ready"
        }
      />
      <ProofStep
        icon={<Activity size={16} />}
        label="Portal robot"
        state={
          hasRobotProof ? "good" : apiFailureActive(data) ? "warn" : "idle"
        }
        value={
          hasRobotProof ? "Job/confirmation present" : "Awaiting robot event"
        }
      />
      <ProofStep
        icon={<Truck size={16} />}
        label="Appeal + care"
        state={hasHandoff ? "good" : hasAppeal ? "warn" : "idle"}
        value={
          hasHandoff
            ? "Handoff created"
            : hasAppeal
              ? "Appeal in review"
              : "Queued later"
        }
      />
    </section>
  );
}

function ProofStep({
  icon,
  label,
  state,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  state: "good" | "warn" | "danger" | "idle";
  value: string;
}) {
  return (
    <div className={`proof-step ${state}`}>
      <div className="proof-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function AgentTraceBoard({ data }: { data: DemoState }) {
  return (
    <section className="panel trace-board" aria-label="Seven agent traces">
      <PanelTitle
        icon={<Bot size={17} />}
        kicker="Agent Builder"
        title="Seven Specialized Agents"
      />
      <div className="agent-grid">
        {agentDefinitions.map((agent) => {
          const view = agentView(agent.name, agent.traceNeedle, data);
          return (
            <article className={`agent-card ${view.tone}`} key={agent.name}>
              <div className="agent-card-top">
                <span className="agent-index">{view.index}</span>
                <StatusPill tone={view.tone} value={view.status} />
              </div>
              <h3>{agent.name}</h3>
              <p>{agent.role}</p>
              <dl>
                <div>
                  <dt>Tooling</dt>
                  <dd>{agent.tool}</dd>
                </div>
                <div>
                  <dt>Output hint</dt>
                  <dd>{view.output}</dd>
                </div>
              </dl>
              <small>{view.traceLabel}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EvidenceMatrix({
  criteria,
  evidenceByCriterion,
}: {
  criteria: PolicyCriterion[];
  evidenceByCriterion: Map<string, EvidenceMapping>;
}) {
  return (
    <section className="panel evidence-panel">
      <PanelTitle
        icon={<FileCheck2 size={17} />}
        kicker="Policy to chart"
        title="Evidence Matrix"
      />
      {criteria.length === 0 ? (
        <EmptyState
          detail="No policy criteria returned."
          title="Matrix empty"
        />
      ) : (
        <div className="matrix-table" role="table" aria-label="Evidence matrix">
          <div className="matrix-row matrix-head" role="row">
            <span role="columnheader">Policy criterion</span>
            <span role="columnheader">Mapped evidence</span>
            <span role="columnheader">Source / confidence</span>
            <span role="columnheader">Governance</span>
          </div>
          {criteria.map((criterion) => {
            const evidence = evidenceByCriterion.get(criterion.criterion_id);
            return (
              <div
                className="matrix-row"
                key={criterion.criterion_id}
                role="row"
              >
                <div role="cell">
                  <StatusPill
                    tone={criterion.severity}
                    value={criterion.severity}
                  />
                  <strong>{criterion.description}</strong>
                  <small>{criterion.policy_citation}</small>
                </div>
                <div role="cell">
                  <StatusPill
                    tone={evidenceTone(evidence?.status)}
                    value={labelize(evidence?.status ?? "not mapped")}
                  />
                  <p>{evidence?.evidence_summary ?? "No mapping available."}</p>
                  {evidence?.source_quote_short ? (
                    <small>{evidence.source_quote_short}</small>
                  ) : null}
                </div>
                <div role="cell">
                  <ConfidenceMeter value={evidence?.confidence ?? 0} />
                  <small>
                    {formatSourceReference(
                      evidence?.source_span ?? criterion.source_span,
                    )}
                  </small>
                </div>
                <div role="cell">
                  <strong>
                    {evidence?.needs_human_review
                      ? "Action Center review"
                      : "Evidence-linked"}
                  </strong>
                  <small>
                    {evidence?.needs_human_review
                      ? evidence.human_review_reason
                      : "Clinical assertion has evidence or policy citation."}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FallbackPanel({
  data,
  runtime,
}: {
  data: DemoState;
  runtime: RuntimeState;
}) {
  const apiAttempt = apiSubmission(data);
  const portalAttempt = portalSubmission(data);
  const robotEvent = latestRobotEvent(data);
  const apiDown = apiFailureActive(data);
  const confirmation =
    portalAttempt?.portal_confirmation_id ??
    extractConfirmation(robotEvent?.output_summary);
  const jobId =
    portalAttempt?.orchestrator_job_id ?? robotEvent?.orchestrator_job_id;

  return (
    <section className="panel fallback-panel">
      <PanelTitle
        icon={<Network size={17} />}
        kicker="Exception path"
        title="API Failure To Portal Robot"
      />
      <div className="fallback-flow">
        <FlowNode
          icon={<ShieldCheck size={16} />}
          label="Payer API"
          state={apiDown ? "danger" : "good"}
          value={apiDown ? "Unavailable" : "Ready"}
        />
        <ArrowRight className="flow-arrow" size={16} />
        <FlowNode
          icon={<Activity size={16} />}
          label="UiPath robot"
          state={
            portalAttempt || robotEvent ? "good" : apiDown ? "warn" : "idle"
          }
          value={
            portalAttempt || robotEvent ? "Portal submitted" : "Awaiting event"
          }
        />
      </div>
      <div className="status-list">
        <KeyValue
          label="API attempt"
          value={
            apiAttempt
              ? attemptStatus(apiAttempt)
              : apiDown
                ? "Armed by toggle"
                : "Not attempted"
          }
        />
        <KeyValue
          label="Robot job"
          value={
            jobId ??
            (apiDown
              ? "Unavailable until Orchestrator writes"
              : "Not requested")
          }
        />
        <KeyValue
          label="Portal confirmation"
          value={confirmation ?? "No confirmation in mirror yet"}
        />
        <KeyValue
          label="Mirror source"
          value={
            runtime.source === "api" ? "Live API state" : "Local cache only"
          }
        />
      </div>
      <p className="panel-note">
        Portal fallback is displayed only as a mirror of UiPath robot/job
        events. When no job or confirmation is present, the UI labels it
        unavailable.
      </p>
    </section>
  );
}

function HumanGatesPanel({ data }: { data: DemoState }) {
  const pendingRows = data.evidenceMappings.filter(
    (row) => row.needs_human_review || row.status === "missing",
  );
  const rejection = data.toggles.clinician_rejects_assertion;
  const appealNeedsReview = data.appeals.some(
    (appeal) => appeal.status === "blocked" || !appeal.clinician_approved,
  );

  return (
    <section className="panel">
      <PanelTitle
        icon={<UserCheck size={17} />}
        kicker="Action Center"
        title="Human Gates"
      />
      <div className="action-list">
        {pendingRows.map((row) => (
          <div className="action-row" key={row.mapping_id}>
            <Stethoscope size={16} />
            <div>
              <strong>{actionTitle(row)}</strong>
              <span>{row.human_review_reason ?? labelize(row.status)}</span>
            </div>
          </div>
        ))}
        <div className={`action-row ${appealNeedsReview ? "warn" : ""}`}>
          <ClipboardCheck size={16} />
          <div>
            <strong>Appeal signoff</strong>
            <span>
              {appealNeedsReview
                ? "Administrative draft awaiting clinician approval."
                : "Appeal gate will appear after denial rescue."}
            </span>
          </div>
        </div>
        {rejection ? (
          <div className="action-row danger">
            <AlertTriangle size={16} />
            <div>
              <strong>Clinician rework</strong>
              <span>Unsupported assertion rejected by reviewer.</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AppealCarePanel({ data }: { data: DemoState }) {
  const denialAttempt =
    data.submissions.find(
      (submission) => submission.decision_status === "denied",
    ) ?? data.submissions.find((submission) => submission.denial_code);
  const appeal = data.appeals.at(-1);
  const handoff = data.handoffs.at(-1);
  const task = data.schedulingTasks.at(-1);

  return (
    <section className="panel">
      <PanelTitle
        icon={<FileText size={17} />}
        kicker="Rescue loop"
        title="Denial, Appeal, Care"
      />
      <div className="handoff-stack">
        <StateLine
          icon={<ShieldAlert size={15} />}
          label="Denial rescue"
          state={denialAttempt ? "warn" : "idle"}
          value={
            denialAttempt?.denial_code ?? labelize(data.toggles.denial_reason)
          }
        />
        <StateLine
          icon={<ClipboardCheck size={15} />}
          label="Appeal review"
          state={
            appeal?.decision_status === "approved"
              ? "good"
              : appeal
                ? "warn"
                : "idle"
          }
          value={
            appeal
              ? appeal.clinician_approved
                ? "Clinician approved"
                : "Clinician review required"
              : "Appeal packet not mirrored yet"
          }
        />
        <StateLine
          icon={<Truck size={15} />}
          label="Care handoff"
          state={handoff ? "good" : "idle"}
          value={
            handoff
              ? (handoff.approval_reference ?? handoff.status ?? "Created")
              : "Waiting for approval event"
          }
        />
        <StateLine
          icon={<KeyRound size={15} />}
          label="Coordinator task"
          state={task ? "good" : "idle"}
          value={
            task ? `${task.scheduling_task_id} · ${task.owner}` : "Not created"
          }
        />
      </div>
      <p className="panel-note">
        Appeal language is an administrative draft for clinician review, not
        autonomous medical or legal advice.
      </p>
    </section>
  );
}

function DemoTogglesPanel({
  disabled,
  onToggle,
  toggles,
}: {
  disabled: boolean;
  onToggle: (patch: Partial<DemoToggles>) => void;
  toggles: DemoToggles;
}) {
  return (
    <section className="panel">
      <PanelTitle
        icon={<ToggleLeft size={17} />}
        kicker="Demo controls"
        title="Degraded States"
      />
      <ToggleRow
        checked={toggles.missing_safety_lab}
        disabled={disabled}
        label="Missing safety screen"
        onChange={(checked) => onToggle({ missing_safety_lab: checked })}
      />
      <ToggleRow
        checked={toggles.payer_api_unavailable}
        disabled={disabled}
        label="Payer API unavailable"
        onChange={(checked) => onToggle({ payer_api_unavailable: checked })}
      />
      <ToggleRow
        checked={toggles.clinician_rejects_assertion}
        disabled={disabled}
        label="Clinician rejects assertion"
        onChange={(checked) =>
          onToggle({ clinician_rejects_assertion: checked })
        }
      />
      <label className="select-row">
        <span>Denial reason</span>
        <select
          disabled={disabled}
          onChange={(event) =>
            onToggle({
              denial_reason: event.target.value as DemoToggles["denial_reason"],
            })
          }
          value={toggles.denial_reason}
        >
          <option value="step_therapy">Step therapy</option>
          <option value="safety_screen">Safety screen</option>
          <option value="medical_necessity">Medical necessity</option>
        </select>
      </label>
      {disabled ? (
        <p className="panel-note">
          Controls are disabled because the event mirror is unavailable.
        </p>
      ) : null}
    </section>
  );
}

function TimelinePanel({
  actorFilter,
  events,
  onActorFilterChange,
}: {
  actorFilter: ActorFilter;
  events: AuditEvent[];
  onActorFilterChange: (filter: ActorFilter) => void;
}) {
  const filteredEvents =
    actorFilter === "all"
      ? events
      : events.filter((event) => event.actor_type === actorFilter);

  return (
    <section className="panel timeline-panel">
      <PanelTitle
        icon={<History size={17} />}
        kicker="Audit trail"
        title="Runtime Events"
      />
      <div
        className="actor-filter"
        role="tablist"
        aria-label="Timeline actor filter"
      >
        {actorFilters.map((filter) => (
          <button
            aria-selected={actorFilter === filter.id}
            className={actorFilter === filter.id ? "selected" : ""}
            key={filter.id}
            onClick={() => onActorFilterChange(filter.id)}
            role="tab"
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="timeline-list">
        {filteredEvents.length === 0 ? (
          <div className="quiet-state">No events for this actor yet.</div>
        ) : (
          filteredEvents
            .slice()
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
            .map((event) => (
              <TimelineEvent event={event} key={event.event_id} />
            ))
        )}
      </div>
    </section>
  );
}

function TimelineEvent({ event }: { event: AuditEvent }) {
  return (
    <article className={`timeline-event ${event.actor_type}`}>
      <div className="timeline-icon" aria-hidden="true">
        {actorIcon(event.actor_type)}
      </div>
      <div>
        <div className="timeline-head">
          <strong>{event.task_or_agent_name}</strong>
          <time dateTime={event.timestamp}>{formatTime(event.timestamp)}</time>
        </div>
        <span>{event.actor_name}</span>
        <p>{displayEventSummary(event)}</p>
        {event.trace_id || event.orchestrator_job_id ? (
          <small>{event.trace_id ?? event.orchestrator_job_id}</small>
        ) : null}
      </div>
    </article>
  );
}

function DemoRunbook({ data }: { data: DemoState }) {
  const steps = [
    {
      label: "Maestro case started",
      active: Boolean(data.case?.maestro_case_id),
    },
    {
      label: "Policy and evidence mapped",
      active: data.criteria.length > 0 && data.evidenceMappings.length > 0,
    },
    {
      label: "Human gate shown",
      active: data.evidenceMappings.some((row) => row.needs_human_review),
    },
    {
      label: "API failure triggers fallback",
      active: apiFailureActive(data),
    },
    {
      label: "Robot writes confirmation",
      active: Boolean(portalSubmission(data) || latestRobotEvent(data)),
    },
    {
      label: "Appeal and handoff complete",
      active: data.appeals.length > 0 || data.handoffs.length > 0,
    },
  ];

  return (
    <section className="rail-section runbook">
      <div className="rail-label">Judge walkthrough</div>
      {steps.map((step) => (
        <div
          className={step.active ? "runbook-step active" : "runbook-step"}
          key={step.label}
        >
          <StatusDot tone={step.active ? "good" : "idle"} />
          <span>{step.label}</span>
        </div>
      ))}
    </section>
  );
}

function CaseQueueItem({
  caseRecord,
  event,
  patientName,
  selected,
}: {
  caseRecord: TreatmentAccessCase;
  event?: AuditEvent;
  patientName: string;
  selected?: boolean;
}) {
  return (
    <button className={`case-card ${selected ? "selected" : ""}`} type="button">
      <div className="case-card-top">
        <strong>{caseRecord.external_case_key ?? caseRecord.case_id}</strong>
        <StatusPill
          tone={caseRecord.sla_state}
          value={labelize(caseRecord.sla_state)}
        />
      </div>
      <span>{patientName}</span>
      <p>{caseRecord.status}</p>
      <small>{event ? displayEventSummary(event) : "No events recorded"}</small>
    </button>
  );
}

function LoadingShell() {
  return (
    <main className="loading-shell">
      <div className="loading-card">
        <CircleDashed className="spin" size={28} />
        <strong>Loading command state</strong>
        <span>Reading the UiPath event mirror or local synthetic cache.</span>
      </div>
    </main>
  );
}

function EmptyState({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="empty-state">
      <CircleDashed size={26} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function PanelTitle({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <div className="panel-title">
      <div className="panel-icon">{icon}</div>
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="key-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ToggleRow({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function FlowNode({
  icon,
  label,
  state,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  state: "good" | "warn" | "danger" | "idle";
  value: string;
}) {
  return (
    <div className={`flow-node ${state}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StateLine({
  icon,
  label,
  state,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  state: "good" | "warn" | "danger" | "idle";
  value: string;
}) {
  return (
    <div className={`state-line ${state}`}>
      <div className="state-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function StatusPill({ tone, value }: { tone?: string; value: string }) {
  return <span className={`status-pill ${tone ?? "neutral"}`}>{value}</span>;
}

function StatusDot({ tone }: { tone: "good" | "danger" | "warn" | "idle" }) {
  return <span className={`status-dot ${tone}`} aria-hidden="true" />;
}

function ConfidenceMeter({ value }: { value: number }) {
  const percentage = Math.round(value * 100);
  return (
    <div className="confidence-meter">
      <div>
        <span style={{ width: `${percentage}%` }} />
      </div>
      <strong>{percentage}%</strong>
    </div>
  );
}

function summarizeEvidence(rows: EvidenceMapping[]) {
  return rows.reduce(
    (acc, row) => {
      if (row.status === "found" || row.status === "needs_human_validation") {
        acc.found += 1;
      }
      if (row.needs_human_review || row.status === "missing") acc.pending += 1;
      return acc;
    },
    { found: 0, pending: 0 },
  );
}

function latestEvent(events: AuditEvent[]) {
  return events
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
}

function agentView(name: string, traceNeedle: string, data: DemoState) {
  const index = String(
    agentDefinitions.findIndex((agent) => agent.name === name) + 1,
  ).padStart(2, "0");
  const event = [...data.events]
    .reverse()
    .find((candidate) =>
      `${candidate.actor_name} ${candidate.task_or_agent_name}`.includes(
        traceNeedle,
      ),
    );
  const missing = data.evidenceMappings.some((row) => row.status === "missing");
  const needsHuman = data.evidenceMappings.some(
    (row) => row.needs_human_review,
  );
  const denial = data.submissions.some(
    (submission) =>
      submission.decision_status === "denied" ||
      Boolean(submission.denial_code),
  );
  const appeal = data.appeals.at(-1);
  const handoff = data.handoffs.at(-1);

  if (event) {
    return {
      index,
      tone: "good",
      status: "completed",
      output: event.output_summary,
      traceLabel: event.trace_id ?? event.action,
    };
  }

  if (name === "Missing Evidence") {
    return {
      index,
      tone: missing ? "danger" : "good",
      status: missing ? "blocking" : "clear",
      output: missing
        ? "Blocking gap routed for human follow-up."
        : "No missing blocking evidence in current matrix.",
      traceLabel: "derived from evidence matrix",
    };
  }

  if (name === "Submission Packet") {
    return {
      index,
      tone: needsHuman ? "warn" : "idle",
      status: needsHuman ? "needs human" : "queued",
      output: needsHuman
        ? "Packet waits for clinician-attested assertion."
        : "Ready after evidence gate completion.",
      traceLabel: "awaiting packet trace",
    };
  }

  if (name === "Denial Rescue") {
    return {
      index,
      tone: denial ? "warn" : "idle",
      status: denial ? "active" : "queued",
      output: denial
        ? `Classify ${labelize(data.toggles.denial_reason)} denial.`
        : "Starts after payer denial event.",
      traceLabel: "payer decision dependent",
    };
  }

  if (name === "Appeal Packet") {
    return {
      index,
      tone: appeal ? "warn" : "idle",
      status: appeal ? "review" : "queued",
      output: appeal
        ? "Administrative draft must be approved by clinician."
        : "Draft appears after denial rescue.",
      traceLabel: "Action Center signoff required",
    };
  }

  if (name === "Care Continuity") {
    return {
      index,
      tone: handoff ? "good" : "idle",
      status: handoff ? "handoff" : "queued",
      output: handoff
        ? "Approval routed to specialty pharmacy coordinator."
        : "Waits for approval or appeal approval.",
      traceLabel: "care handoff event",
    };
  }

  return {
    index,
    tone: "idle",
    status: "queued",
    output: "Waiting for UiPath runtime trace.",
    traceLabel: "not mirrored yet",
  };
}

function actionTitle(row: EvidenceMapping) {
  if (row.status === "missing") return "Missing evidence";
  if (row.needs_human_review) return "Clinician validation";
  return "Review";
}

function evidenceTone(status?: EvidenceMapping["status"]) {
  if (status === "found") return "found";
  if (status === "missing") return "missing";
  if (status === "needs_human_validation") return "needs_human_validation";
  if (status === "conflicting") return "conflicting";
  return "neutral";
}

function actorIcon(actorType: AuditEvent["actor_type"]) {
  if (actorType === "agent") return <Bot size={14} />;
  if (actorType === "api_workflow") return <Workflow size={14} />;
  if (actorType === "robot") return <Activity size={14} />;
  if (actorType === "human") return <UserCheck size={14} />;
  return <Clock3 size={14} />;
}

function apiSubmission(data: DemoState) {
  return data.submissions.find((submission) =>
    ["api", "payer_api"].includes(submission.channel),
  );
}

function portalSubmission(data: DemoState) {
  return data.submissions.find((submission) =>
    ["portal_fallback", "payer_portal_rpa"].includes(submission.channel),
  );
}

function apiFailureActive(data: DemoState) {
  return (
    data.toggles.payer_api_unavailable ||
    data.case?.active_secondary_stages.includes(
      "api_failure_portal_fallback",
    ) ||
    data.submissions.some(
      (submission) =>
        submission.status === "unavailable" ||
        submission.status === "fallback_required" ||
        submission.fallback_required,
    ) ||
    data.events.some((event) => event.action.includes("unavailable"))
  );
}

function latestRobotEvent(data: DemoState) {
  return data.events
    .slice()
    .reverse()
    .find((event) => event.actor_type === "robot");
}

function hasRobotEvent(data: DemoState) {
  return data.events.some((event) => event.actor_type === "robot");
}

function hasEventAction(data: DemoState, needle: string) {
  return data.events.some((event) => event.action.includes(needle));
}

function attemptStatus(attempt: MirrorSubmission) {
  return [
    labelize(attempt.status),
    attempt.error_code,
    attempt.decision_status ? labelize(attempt.decision_status) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function extractConfirmation(value?: string) {
  if (!value) return undefined;
  return value.match(/[A-Z]{3,}[-A-Z0-9]*SYN[-A-Z0-9]*/)?.[0];
}

function displayEventSummary(event: AuditEvent) {
  if (event.action === "demo_toggles_updated") {
    const apiDown = event.output_summary.includes(
      '"payer_api_unavailable":true',
    );
    const missingLab = event.output_summary.includes(
      '"missing_safety_lab":true',
    );
    const rejected = event.output_summary.includes(
      '"clinician_rejects_assertion":true',
    );
    const active = [
      apiDown ? "payer API failure" : undefined,
      missingLab ? "missing safety screen" : undefined,
      rejected ? "clinician rejection" : undefined,
    ].filter(Boolean);

    return active.length > 0
      ? `Demo toggles updated: ${active.join(", ")} active.`
      : "Demo toggles updated: baseline path restored.";
  }

  return event.output_summary;
}

function formatSourceReference(
  source:
    EvidenceMapping["source_span"] | PolicyCriterion["source_span"] | undefined,
) {
  if (!source) return "No source reference";
  if (typeof source === "string") return source;

  return [source.source_uri, source.section_label].filter(Boolean).join(" · ");
}

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

createRoot(document.getElementById("root")!).render(<App />);
