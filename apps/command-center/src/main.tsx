import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDashed,
  Clock3,
  DatabaseZap,
  FileCheck2,
  HeartPulse,
  History,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  ToggleLeft,
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
import type { ActorFilter, DemoState, RuntimeState } from "./lib/types";
import "./styles.css";

const stages: Array<{
  id: TreatmentAccessCase["current_stage"];
  label: string;
  owner: string;
}> = [
  { id: "intake", label: "Intake", owner: "Maestro" },
  { id: "policy_evidence", label: "Evidence", owner: "Agent" },
  { id: "clinical_validation", label: "Validation", owner: "Action Center" },
  { id: "submission", label: "Submission", owner: "API Workflow" },
  { id: "payer_decision", label: "Decision", owner: "Payer" },
  { id: "denial_rescue", label: "Appeal", owner: "Agent" },
  { id: "care_continuity", label: "Care handoff", owner: "API Workflow" },
  { id: "closure", label: "Audit", owner: "Maestro" },
];

const actorFilters: Array<{ id: ActorFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "agent", label: "Agent" },
  { id: "api_workflow", label: "API Workflow" },
  { id: "robot", label: "Robot" },
  { id: "human", label: "Action Center" },
  { id: "system", label: "System" },
];

const agentTracks = [
  "Coverage Requirement",
  "Evidence Retrieval",
  "Missing Evidence",
  "Submission Packet",
  "Denial Rescue",
  "Appeal Packet",
  "Care Continuity",
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
        error instanceof Error ? error.message : "Unable to reset",
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
      <aside className="case-queue" aria-label="Case queue">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <HeartPulse size={20} />
          </div>
          <div>
            <strong>Treatment Access</strong>
            <span>Command Center</span>
          </div>
        </div>

        <div className="queue-meta">
          <span>
            {runtime.source === "api" ? "Event mirror" : "Fallback cache"}
          </span>
          <span>{formatTime(runtime.lastFetchedAt)}</span>
        </div>

        <CaseQueueItem
          caseRecord={selectedCase}
          event={latestEvent(data.events)}
          patientName={data.patient?.synthetic_name ?? "Synthetic patient"}
          selected
        />

        <div className="queue-footer">
          <StatusDot tone={runtime.source === "api" ? "good" : "danger"} />
          <span>{runtime.apiBaseUrl}</span>
        </div>
      </aside>

      <section className="workspace">
        <TopBar
          apiUnavailable={runtime.source === "fallback"}
          isRefreshing={isRefreshing}
          lastError={runtime.error}
          mutationError={mutationError}
          onRefresh={onRefresh}
          onReset={onReset}
          source={runtime.source}
        />

        <CaseHeader
          caseRecord={selectedCase}
          foundCount={summary.found}
          orderMedication={
            data.order?.medication_name ?? selectedCase.medication_name
          }
          patientName={data.patient?.synthetic_name ?? "Synthetic patient"}
          pendingCount={summary.pending}
        />

        <StageRail activeStage={selectedCase.current_stage} />

        <div className="content-grid">
          <section className="primary-stack">
            <AgentTraceStrip data={data} />
            <EvidenceMatrix
              criteria={data.criteria}
              evidenceByCriterion={evidenceByCriterion}
            />
          </section>

          <aside className="right-rail" aria-label="Operational state">
            <PayerStatusCard data={data} />
            <DemoTogglesPanel
              disabled={runtime.source !== "api"}
              onToggle={onToggle}
              toggles={data.toggles}
            />
            <HumanActionPanel data={data} />
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

function TopBar({
  apiUnavailable,
  isRefreshing,
  lastError,
  mutationError,
  onRefresh,
  onReset,
  source,
}: {
  apiUnavailable: boolean;
  isRefreshing: boolean;
  lastError: string | null;
  mutationError: string | null;
  onRefresh: () => void;
  onReset: () => void;
  source: RuntimeState["source"];
}) {
  return (
    <header className="top-bar">
      <div className="status-cluster">
        <span className={`source-chip ${source}`}>
          <DatabaseZap size={14} />
          {source === "api" ? "Live mock API" : "API unavailable"}
        </span>
        {apiUnavailable ? (
          <span className="inline-alert">{lastError}</span>
        ) : null}
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
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
}

function CaseHeader({
  caseRecord,
  foundCount,
  orderMedication,
  patientName,
  pendingCount,
}: {
  caseRecord: TreatmentAccessCase;
  foundCount: number;
  orderMedication: string;
  patientName: string;
  pendingCount: number;
}) {
  return (
    <section className="case-header">
      <div>
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
          {labelize(caseRecord.urgency)}
        </p>
      </div>
      <div className="case-stats" aria-label="Case state summary">
        <MetricTile label="Evidence found" value={`${foundCount}`} />
        <MetricTile label="Human gates" value={`${pendingCount}`} />
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
    <nav className="stage-rail" aria-label="Case stages">
      {stages.map((stage, index) => {
        const state =
          index < activeIndex
            ? "complete"
            : index === activeIndex
              ? "active"
              : "";
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

function AgentTraceStrip({ data }: { data: DemoState }) {
  const missing = data.evidenceMappings.some((row) => row.status === "missing");
  const needsHuman = data.evidenceMappings.some(
    (row) => row.needs_human_review,
  );

  return (
    <section className="panel trace-strip" aria-label="Agent traces">
      <PanelTitle icon={<Bot size={17} />} title="Agent Trace Strip" />
      <div className="trace-grid">
        {agentTracks.map((name, index) => {
          const tone =
            (name === "Missing Evidence" && missing) ||
            (name === "Submission Packet" && needsHuman)
              ? "warn"
              : index < 2
                ? "good"
                : "idle";
          return (
            <div className={`trace-card ${tone}`} key={name}>
              <span>{name}</span>
              <strong>{traceStatus(name, data)}</strong>
            </div>
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
      <PanelTitle icon={<FileCheck2 size={17} />} title="Evidence Matrix" />
      {criteria.length === 0 ? (
        <EmptyState
          detail="No policy criteria returned."
          title="Matrix empty"
        />
      ) : (
        <div className="matrix-table" role="table" aria-label="Evidence matrix">
          <div className="matrix-row matrix-head" role="row">
            <span role="columnheader">Policy criterion</span>
            <span role="columnheader">Evidence</span>
            <span role="columnheader">Confidence</span>
            <span role="columnheader">Review</span>
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
                    value={labelize(evidence?.status ?? "not_mapped")}
                  />
                  <p>{evidence?.evidence_summary ?? "No mapping available."}</p>
                  <small>
                    {evidence?.source_span ?? criterion.source_span}
                  </small>
                </div>
                <div role="cell">
                  <ConfidenceMeter value={evidence?.confidence ?? 0} />
                </div>
                <div role="cell">
                  <strong>
                    {labelize(evidence?.reviewer_decision ?? "pending")}
                  </strong>
                  <small>
                    {evidence?.needs_human_review
                      ? evidence.human_review_reason
                      : "No human gate"}
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

function PayerStatusCard({ data }: { data: DemoState }) {
  const apiDown = data.toggles.payer_api_unavailable;
  const missing = data.evidenceMappings.some((row) => row.status === "missing");
  const needsHuman = data.evidenceMappings.some(
    (row) => row.needs_human_review,
  );
  const status = missing
    ? "Blocked before submission"
    : needsHuman
      ? "Awaiting clinical validation"
      : apiDown
        ? "Portal fallback armed"
        : "API channel ready";

  return (
    <section className="panel payer-card">
      <PanelTitle icon={<ShieldCheck size={17} />} title="Payer Status" />
      <div className={`payer-indicator ${apiDown ? "danger" : "good"}`}>
        {apiDown ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
        <div>
          <strong>{status}</strong>
          <span>{apiDown ? "PAYER_API_DOWN" : "Northstar prior auth API"}</span>
        </div>
      </div>
      <div className="status-list">
        <KeyValue
          label="Denial mode"
          value={labelize(data.toggles.denial_reason)}
        />
        <KeyValue
          label="Submission path"
          value={apiDown ? "Robot fallback" : "API workflow"}
        />
        <KeyValue label="Decision state" value="Not submitted" />
      </div>
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
      <PanelTitle icon={<ToggleLeft size={17} />} title="Degraded States" />
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
    </section>
  );
}

function HumanActionPanel({ data }: { data: DemoState }) {
  const pendingRows = data.evidenceMappings.filter(
    (row) => row.needs_human_review || row.status === "missing",
  );
  const rejection = data.toggles.clinician_rejects_assertion;

  return (
    <section className="panel">
      <PanelTitle icon={<UserCheck size={17} />} title="Human Actions" />
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
        {rejection ? (
          <div className="action-row danger">
            <AlertTriangle size={16} />
            <div>
              <strong>Clinician rework</strong>
              <span>Unsupported assertion rejected by reviewer</span>
            </div>
          </div>
        ) : null}
        {pendingRows.length === 0 && !rejection ? (
          <div className="quiet-state">No pending human gates</div>
        ) : null}
      </div>
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
      <PanelTitle icon={<History size={17} />} title="Audit Timeline" />
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
          <div className="quiet-state">No events for this actor</div>
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
        <p>{event.output_summary}</p>
        {event.trace_id || event.orchestrator_job_id ? (
          <small>{event.trace_id ?? event.orchestrator_job_id}</small>
        ) : null}
      </div>
    </article>
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
      <small>{event?.output_summary ?? "No events recorded"}</small>
    </button>
  );
}

function LoadingShell() {
  return (
    <main className="loading-shell">
      <div className="loading-card">
        <CircleDashed className="spin" size={28} />
        <strong>Loading command state</strong>
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

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
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

function StatusPill({ tone, value }: { tone?: string; value: string }) {
  return <span className={`status-pill ${tone ?? "neutral"}`}>{value}</span>;
}

function StatusDot({ tone }: { tone: "good" | "danger" | "warn" }) {
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
      if (row.status === "found") acc.found += 1;
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

function traceStatus(name: string, data: DemoState) {
  if (name === "Coverage Requirement")
    return `${data.criteria.length} criteria`;
  if (name === "Evidence Retrieval")
    return `${summarizeEvidence(data.evidenceMappings).found} mapped`;
  if (name === "Missing Evidence") {
    return data.evidenceMappings.some((row) => row.status === "missing")
      ? "Blocking gap"
      : "Clear";
  }
  if (name === "Submission Packet") {
    return data.evidenceMappings.some((row) => row.needs_human_review)
      ? "Human gate"
      : "Ready";
  }
  if (name === "Denial Rescue") return labelize(data.toggles.denial_reason);
  if (name === "Appeal Packet") return "Clinician signoff";
  return "Pending approval";
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
