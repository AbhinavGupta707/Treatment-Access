import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  DatabaseZap,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  Folder,
  Gauge,
  Gavel,
  HeartPulse,
  Home,
  Info,
  KeyRound,
  MoreVertical,
  Network,
  PanelRightOpen,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Truck,
  Upload,
  UserCheck,
  UserRound,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import type {
  AuditEvent,
  DemoToggles,
  EvidenceMapping,
  PolicyCriterion,
  TreatmentAccessCase,
} from "@tacc/shared-schemas";
import {
  buildSyntheticLiveProofRun,
  loadRuntimeState,
  resetDemoState,
  startLiveProofRun,
  updateDemoToggles,
} from "./lib/api";
import type {
  ActorFilter,
  DemoState,
  LiveProofRun,
  LiveProofStep,
  MirrorSubmission,
  RuntimeState,
} from "./lib/types";
import "./styles.css";

type AppView =
  | "dashboard"
  | "cases"
  | "case-detail"
  | "evidence"
  | "submissions"
  | "appeals"
  | "analytics";

type Tone = "good" | "warn" | "danger" | "idle" | "info" | "neutral";

type CaseListRow = {
  id: string;
  initials: string;
  patient: string;
  age: number;
  treatment: string;
  payer: string;
  stage: string;
  risk: "High" | "Medium" | "Low";
  nextAction: string;
  owner: string;
  accent: "red" | "amber" | "green" | "blue";
};

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "cases", label: "Cases", icon: Folder },
  { id: "evidence", label: "Evidence", icon: FileText },
  { id: "submissions", label: "Submissions", icon: Send },
  { id: "appeals", label: "Appeals", icon: Gavel },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const PROGRESS_STEPS = [
  { id: "intake", label: "Intake", status: "Completed", owner: "Maestro" },
  {
    id: "policy_evidence",
    label: "Policy Check",
    status: "Completed",
    owner: "Coverage Agent",
  },
  {
    id: "evidence_mapping",
    label: "Evidence Mapping",
    status: "In Progress",
    owner: "Evidence Agent",
  },
  {
    id: "clinical_validation",
    label: "Clinician Signoff",
    status: "Pending",
    owner: "Action Center",
  },
  {
    id: "submission",
    label: "Submission",
    status: "Pending",
    owner: "API Workflow",
  },
  { id: "payer_decision", label: "Denial", status: "Pending", owner: "Payer" },
  {
    id: "denial_rescue",
    label: "Appeal",
    status: "Pending",
    owner: "Appeal Agent",
  },
  {
    id: "care_continuity",
    label: "Approved",
    status: "Pending",
    owner: "Care Agent",
  },
  {
    id: "closure",
    label: "Pharmacy",
    status: "Pending",
    owner: "Care Continuity",
  },
] as const;

const AGENTS = [
  {
    name: "Coverage Requirement",
    traceNeedle: "Coverage Requirement Agent",
    role: "Policy criteria",
    owner: "CareGuide AI",
  },
  {
    name: "Evidence Retrieval",
    traceNeedle: "Evidence Retrieval Agent",
    role: "Chart evidence",
    owner: "EvidenceBot",
  },
  {
    name: "Missing Evidence",
    traceNeedle: "Missing Evidence Agent",
    role: "Gap detection",
    owner: "EvidenceBot",
  },
  {
    name: "Submission Packet",
    traceNeedle: "Submission Packet Agent",
    role: "Payer packet",
    owner: "PacketBot",
  },
  {
    name: "Denial Rescue",
    traceNeedle: "Denial Rescue Agent",
    role: "Denial strategy",
    owner: "RescueBot",
  },
  {
    name: "Appeal Packet",
    traceNeedle: "Appeal Packet Agent",
    role: "Appeal draft",
    owner: "AppealBot",
  },
  {
    name: "Care Continuity",
    traceNeedle: "Care Continuity Agent",
    role: "Care handoff",
    owner: "CareGuide AI",
  },
];

const ACTOR_FILTERS: Array<{ id: ActorFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "agent", label: "Agents" },
  { id: "api_workflow", label: "API" },
  { id: "robot", label: "Robot" },
  { id: "human", label: "Human" },
  { id: "system", label: "System" },
];

function App() {
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isLiveProofOpen, setIsLiveProofOpen] = useState(false);
  const [isLiveProofStarting, setIsLiveProofStarting] = useState(false);
  const [liveProofRun, setLiveProofRun] = useState<LiveProofRun | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  );

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
      if (nextRuntime.liveProofRun) {
        setLiveProofRun(nextRuntime.liveProofRun);
      }
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
      setLiveProofRun(null);
      await refresh(true);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Unable to reset demo",
      );
    }
  };

  const runLiveProof = async () => {
    const currentRuntime = runtime;
    if (!currentRuntime?.data.case) return;

    setMutationError(null);
    setIsLiveProofStarting(true);

    try {
      const run = await startLiveProofRun(currentRuntime.data.case.case_id);
      setLiveProofRun(run);
      setIsLiveProofOpen(true);
      await refresh(true);
    } catch (error) {
      const preview = buildSyntheticLiveProofRun(
        currentRuntime.data,
        new Date().toISOString(),
        {
          status: "blocked",
          sourceLabel:
            "Live proof API not available yet; showing contract-ready synthetic preview",
        },
      );
      setLiveProofRun(preview);
      setIsLiveProofOpen(true);
      setMutationError(
        error instanceof Error
          ? error.message
          : "Live proof endpoint unavailable",
      );
    } finally {
      setIsLiveProofStarting(false);
    }
  };

  if (isLoading || !runtime) {
    return <LoadingShell />;
  }

  if (!runtime.data.case) {
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
    <CommandCenter
      activeView={activeView}
      actorFilter={actorFilter}
      isAuditOpen={isAuditOpen}
      isLiveProofOpen={isLiveProofOpen}
      isLiveProofStarting={isLiveProofStarting}
      isRefreshing={isRefreshing}
      liveProofRun={liveProofRun ?? runtime.liveProofRun}
      mutationError={mutationError}
      onActorFilterChange={setActorFilter}
      onAuditOpenChange={setIsAuditOpen}
      onLiveProofOpenChange={setIsLiveProofOpen}
      onRefresh={() => void refresh(true)}
      onReset={() => void resetDemo()}
      onRunLiveProof={() => void runLiveProof()}
      onSelectedEvidenceIdChange={setSelectedEvidenceId}
      onToggle={(patch) => void updateToggle(patch)}
      onViewChange={setActiveView}
      runtime={runtime}
      selectedEvidenceId={selectedEvidenceId}
    />
  );
}

function CommandCenter({
  activeView,
  actorFilter,
  isAuditOpen,
  isLiveProofOpen,
  isLiveProofStarting,
  isRefreshing,
  liveProofRun,
  mutationError,
  onActorFilterChange,
  onAuditOpenChange,
  onLiveProofOpenChange,
  onRefresh,
  onReset,
  onRunLiveProof,
  onSelectedEvidenceIdChange,
  onToggle,
  onViewChange,
  runtime,
  selectedEvidenceId,
}: {
  activeView: AppView;
  actorFilter: ActorFilter;
  isAuditOpen: boolean;
  isLiveProofOpen: boolean;
  isLiveProofStarting: boolean;
  isRefreshing: boolean;
  liveProofRun: LiveProofRun | null;
  mutationError: string | null;
  onActorFilterChange: (filter: ActorFilter) => void;
  onAuditOpenChange: (isOpen: boolean) => void;
  onLiveProofOpenChange: (isOpen: boolean) => void;
  onRefresh: () => void;
  onReset: () => void;
  onRunLiveProof: () => void;
  onSelectedEvidenceIdChange: (id: string | null) => void;
  onToggle: (patch: Partial<DemoToggles>) => void;
  onViewChange: (view: AppView) => void;
  runtime: RuntimeState;
  selectedEvidenceId: string | null;
}) {
  const caseRecord = runtime.data.case!;
  const patient = casePatient(runtime.data);
  const rows = useMemo(
    () => buildCaseRows(runtime.data, patient),
    [runtime.data, patient],
  );
  const selectedEvidence =
    runtime.data.evidenceMappings.find(
      (mapping) => mapping.mapping_id === selectedEvidenceId,
    ) ?? runtime.data.evidenceMappings[0];

  return (
    <main className="app-shell">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      <section className="workspace" aria-label="Treatment access workspace">
        <TopBar
          isRefreshing={isRefreshing}
          mutationError={mutationError}
          onAuditOpen={() => onAuditOpenChange(true)}
          onRefresh={onRefresh}
          onReset={onReset}
          runtime={runtime}
        />
        {activeView === "dashboard" ? (
          <DashboardView
            data={runtime.data}
            onOpenAppeal={() => onViewChange("appeals")}
            onOpenCase={() => onViewChange("case-detail")}
            onOpenEvidence={() => onViewChange("evidence")}
            onOpenLiveProof={() => onLiveProofOpenChange(true)}
            onRunLiveProof={onRunLiveProof}
            isLiveProofStarting={isLiveProofStarting}
            liveProofRun={liveProofRun}
            rows={rows}
            runtime={runtime}
          />
        ) : null}
        {activeView === "cases" || activeView === "case-detail" ? (
          <CaseDetailView
            caseRecord={caseRecord}
            data={runtime.data}
            onOpenEvidence={() => onViewChange("evidence")}
            onOpenSubmission={() => onViewChange("submissions")}
          />
        ) : null}
        {activeView === "evidence" ? (
          <EvidenceView
            criteria={runtime.data.criteria}
            data={runtime.data}
            onSelectedEvidenceIdChange={onSelectedEvidenceIdChange}
            selectedEvidence={selectedEvidence}
          />
        ) : null}
        {activeView === "submissions" ? (
          <SubmissionView data={runtime.data} runtime={runtime} />
        ) : null}
        {activeView === "appeals" ? (
          <AppealView
            data={runtime.data}
            onOpenEvidence={() => onViewChange("evidence")}
          />
        ) : null}
        {activeView === "analytics" ? <AnalyticsView rows={rows} /> : null}
      </section>
      {isAuditOpen ? (
        <AuditDrawer
          actorFilter={actorFilter}
          data={runtime.data}
          onActorFilterChange={onActorFilterChange}
          onClose={() => onAuditOpenChange(false)}
          onToggle={onToggle}
          runtime={runtime}
        />
      ) : null}
      {isLiveProofOpen && liveProofRun ? (
        <LiveProofDrawer
          onClose={() => onLiveProofOpenChange(false)}
          run={liveProofRun}
        />
      ) : null}
    </main>
  );
}

function Sidebar({
  activeView,
  onViewChange,
}: {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}) {
  return (
    <aside className="sidebar" aria-label="Command Center navigation">
      <BrandLockup />
      <nav className="primary-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const selected =
            activeView === item.id ||
            (item.id === "cases" && activeView === "case-detail");
          return (
            <button
              aria-current={selected ? "page" : undefined}
              className={selected ? "nav-item selected" : "nav-item"}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <Shield size={30} />
        <span>Better access.</span>
        <span>Better outcomes.</span>
      </div>
    </aside>
  );
}

function BrandLockup() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark" aria-hidden="true">
        <HeartPulse size={24} />
      </div>
      <strong>Treatment Access Command Center</strong>
    </div>
  );
}

function TopBar({
  isRefreshing,
  mutationError,
  onAuditOpen,
  onRefresh,
  onReset,
  runtime,
}: {
  isRefreshing: boolean;
  mutationError: string | null;
  onAuditOpen: () => void;
  onRefresh: () => void;
  onReset: () => void;
  runtime: RuntimeState;
}) {
  return (
    <header className="top-bar">
      <div className="search-box" role="search">
        <Search size={18} />
        <input
          aria-label="Search cases, patients, payers"
          placeholder="Search cases, patients, payers..."
          type="search"
        />
        <kbd>⌘</kbd>
        <kbd>K</kbd>
      </div>
      <div className="top-actions">
        <span className={`state-chip ${runtime.source}`}>
          <DatabaseZap size={14} />
          {runtime.source === "api" ? "Live event mirror" : "Fallback cache"}
        </span>
        {runtime.error ? (
          <span className="top-error">{runtime.error}</span>
        ) : null}
        {mutationError ? (
          <span className="top-error">{mutationError}</span>
        ) : null}
        <button
          aria-label="Open audit trace"
          className="round-button"
          onClick={onAuditOpen}
          type="button"
        >
          <PanelRightOpen size={18} />
        </button>
        <button
          aria-label="Refresh state"
          className="round-button"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw className={isRefreshing ? "spin" : undefined} size={18} />
        </button>
        <button
          aria-label="Reset demo state"
          className="round-button"
          onClick={onReset}
          type="button"
        >
          <RotateCcw size={18} />
        </button>
        <button
          aria-label="Notifications"
          className="round-button"
          type="button"
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
        <button className="user-menu" type="button">
          <span>AM</span>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}

function DashboardView({
  data,
  isLiveProofStarting,
  liveProofRun,
  onOpenAppeal,
  onOpenCase,
  onOpenEvidence,
  onOpenLiveProof,
  onRunLiveProof,
  rows,
  runtime,
}: {
  data: DemoState;
  isLiveProofStarting: boolean;
  liveProofRun: LiveProofRun | null;
  onOpenAppeal: () => void;
  onOpenCase: () => void;
  onOpenEvidence: () => void;
  onOpenLiveProof: () => void;
  onRunLiveProof: () => void;
  rows: CaseListRow[];
  runtime: RuntimeState;
}) {
  const patient = casePatient(data);
  const summary = summarizeEvidence(data.evidenceMappings);
  const urgentCase = rows[0];
  const hasDenial = hasDenialSignal(data);

  return (
    <div className="view-stack">
      <PageHeader
        action={
          <button className="secondary-button" type="button">
            <Filter size={16} />
            Filters
          </button>
        }
        subtitle="Real-time overview of governed case activity and access risk."
        title="Treatment Access Dashboard"
      />
      <KpiGrid
        items={[
          {
            icon: UsersRound,
            label: "Active Cases",
            value: "128",
            trend: "+12 vs yesterday",
            tone: "info",
          },
          {
            icon: AlertTriangle,
            label: "At-Risk Delays",
            value: String(22 + summary.pending),
            trend: "+5 vs yesterday",
            tone: "danger",
          },
          {
            icon: UserCheck,
            label: "Awaiting Clinician Signoff",
            value: String(16 + summary.pending),
            trend: "-3 vs yesterday",
            tone: "warn",
          },
          {
            icon: ShieldCheck,
            label: "Denials Rescued",
            value: hasDenial ? "32" : "31",
            trend: "+8 vs yesterday",
            tone: "good",
          },
          {
            icon: CheckCircle2,
            label: "Approved Today",
            value: data.handoffs.length > 0 ? "15" : "14",
            trend: "+6 vs yesterday",
            tone: "good",
          },
        ]}
      />
      <LiveProofPanel
        data={data}
        isStarting={isLiveProofStarting}
        onOpenDetail={onOpenLiveProof}
        onRun={onRunLiveProof}
        run={liveProofRun}
        runtime={runtime}
      />
      <div className="dashboard-grid">
        <section className="main-column">
          {urgentCase ? (
            <FeaturedCase
              caseRecord={data.case!}
              onOpenCase={onOpenCase}
              patient={patient}
              row={urgentCase}
              runtime={runtime}
            />
          ) : null}
          <ActiveCasesTable
            onOpenAppeal={onOpenAppeal}
            onOpenCase={onOpenCase}
            rows={rows}
          />
        </section>
        <aside className="right-panel">
          <NextBestActions
            data={data}
            onOpenAppeal={onOpenAppeal}
            onOpenEvidence={onOpenEvidence}
            rows={rows}
          />
        </aside>
      </div>
    </div>
  );
}

function CaseDetailView({
  caseRecord,
  data,
  onOpenEvidence,
  onOpenSubmission,
}: {
  caseRecord: TreatmentAccessCase;
  data: DemoState;
  onOpenEvidence: () => void;
  onOpenSubmission: () => void;
}) {
  const patient = casePatient(data);

  return (
    <div className="view-stack">
      <PageHeader
        action={
          <button
            className="secondary-button"
            onClick={onOpenSubmission}
            type="button"
          >
            Actions
            <MoreVertical size={16} />
          </button>
        }
        breadcrumb="Cases / Case ID"
        subtitle="Where the case stands, who owns the next step, and why."
        title="Treatment Case"
      />
      <CaseSummaryBand caseRecord={caseRecord} data={data} patient={patient} />
      <div className="detail-grid">
        <section className="main-column">
          <ProgressPanel caseRecord={caseRecord} />
          <NextActionCards data={data} onOpenEvidence={onOpenEvidence} />
        </section>
        <aside className="side-stack">
          <ActorsPanel data={data} />
          <RecentActivity events={data.events} />
        </aside>
      </div>
    </div>
  );
}

function EvidenceView({
  criteria,
  data,
  onSelectedEvidenceIdChange,
  selectedEvidence,
}: {
  criteria: PolicyCriterion[];
  data: DemoState;
  onSelectedEvidenceIdChange: (id: string) => void;
  selectedEvidence?: EvidenceMapping;
}) {
  const patient = casePatient(data);
  const evidenceByCriterion = new Map(
    data.evidenceMappings.map((row) => [row.criterion_id, row]),
  );

  return (
    <div className="view-stack">
      <PageHeader
        action={
          <div className="button-row">
            <button className="secondary-button" type="button">
              <Upload size={16} />
              Upload Evidence
            </button>
            <button className="primary-button" type="button">
              Export Matrix
              <ChevronDown size={16} />
            </button>
          </div>
        }
        subtitle="Review payer requirements and supporting synthetic clinical evidence."
        title="Evidence Matrix"
      />
      <EvidenceSummaryBand data={data} patient={patient} />
      <div className="evidence-grid">
        <section className="glass-panel evidence-table-panel">
          <div
            className="evidence-table"
            role="table"
            aria-label="Evidence matrix"
          >
            <div className="evidence-row evidence-head" role="row">
              <span role="columnheader">Payer Requirement</span>
              <span role="columnheader">Evidence Found</span>
              <span role="columnheader">Source</span>
              <span role="columnheader">Confidence</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" aria-label="Actions" />
            </div>
            {criteria.map((criterion) => {
              const evidence = evidenceByCriterion.get(criterion.criterion_id);
              const tone = evidenceTone(evidence?.status);
              return (
                <button
                  className={
                    selectedEvidence?.mapping_id === evidence?.mapping_id
                      ? "evidence-row selected"
                      : "evidence-row"
                  }
                  key={criterion.criterion_id}
                  onClick={() => {
                    if (evidence)
                      onSelectedEvidenceIdChange(evidence.mapping_id);
                  }}
                  role="row"
                  type="button"
                >
                  <div role="cell">
                    <StatusIcon tone={tone} />
                    <div>
                      <strong>{criterion.description}</strong>
                      <span>{criterion.policy_citation}</span>
                    </div>
                  </div>
                  <div role="cell">
                    <StatusIcon tone={tone} />
                    <div>
                      <strong>
                        {evidence ? evidenceLabel(evidence) : "Not found"}
                      </strong>
                      <span>
                        {evidence?.evidence_summary ?? "No evidence mapped."}
                      </span>
                    </div>
                  </div>
                  <div role="cell">
                    <FileText size={18} />
                    <div>
                      <strong>{sourceTitle(evidence, criterion)}</strong>
                      <span>
                        {formatSourceReference(
                          evidence?.source_span ?? criterion.source_span,
                        )}
                      </span>
                    </div>
                  </div>
                  <div role="cell">
                    <ConfidenceArc value={evidence?.confidence ?? 0} />
                    <span>{confidenceLabel(evidence?.confidence ?? 0)}</span>
                  </div>
                  <div role="cell">
                    <StatusPill tone={tone} value={statusCopy(evidence)} />
                  </div>
                  <div role="cell">
                    <MoreVertical size={18} />
                  </div>
                </button>
              );
            })}
          </div>
          <UnsupportedWarning />
        </section>
        <EvidenceDrawer evidence={selectedEvidence} />
      </div>
    </div>
  );
}

function SubmissionView({
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
    <div className="view-stack">
      <PageHeader
        subtitle="Submission and robot fallback status mirrored from governed UiPath events."
        title="Submission Status"
      />
      <div className="submission-layout">
        <section className="glass-panel submission-flow">
          <PanelHeader
            icon={<Network size={20} />}
            title="Payer Channel Routing"
          />
          <div className="route-flow">
            <FlowNode
              icon={<ShieldCheck size={20} />}
              label="Payer API"
              state={apiDown ? "danger" : "good"}
              value={apiDown ? "Unavailable" : "Ready"}
            />
            <ArrowRight size={22} />
            <FlowNode
              icon={<Activity size={20} />}
              label="UiPath Robot"
              state={
                portalAttempt || robotEvent ? "good" : apiDown ? "warn" : "idle"
              }
              value={
                portalAttempt || robotEvent ? "Portal submitted" : "Waiting"
              }
            />
            <ArrowRight size={22} />
            <FlowNode
              icon={<FileCheck2 size={20} />}
              label="Confirmation"
              state={confirmation ? "good" : "idle"}
              value={confirmation ?? "Not mirrored"}
            />
          </div>
        </section>
        <section className="glass-panel">
          <PanelHeader
            icon={<DatabaseZap size={20} />}
            title="Submission Detail"
          />
          <div className="detail-list">
            <KeyValue
              label="API attempt"
              value={
                apiAttempt
                  ? attemptStatus(apiAttempt)
                  : apiDown
                    ? "Armed by current state"
                    : "Not attempted"
              }
            />
            <KeyValue
              label="Robot job"
              value={jobId ?? "Unavailable until Orchestrator writes"}
            />
            <KeyValue
              label="Portal confirmation"
              value={confirmation ?? "No confirmation in mirror yet"}
            />
            <KeyValue
              label="State source"
              value={
                runtime.source === "api"
                  ? "Live event mirror"
                  : "Local fallback cache"
              }
            />
          </div>
          <p className="governance-note">
            Robot fallback is shown only after UiPath job or event records are
            present. No live payer submission is implied by this UI.
          </p>
        </section>
      </div>
    </div>
  );
}

function AppealView({
  data,
  onOpenEvidence,
}: {
  data: DemoState;
  onOpenEvidence: () => void;
}) {
  const patient = casePatient(data);
  const denialAttempt =
    data.submissions.find(
      (submission) => submission.decision_status === "denied",
    ) ?? data.submissions.find((submission) => submission.denial_code);
  const appeal = data.appeals.at(-1);
  const denialReason =
    denialAttempt?.denial_reason ?? data.toggles.denial_reason;
  const needsSignoff = !appeal?.clinician_approved;

  return (
    <div className="view-stack">
      <PageHeader
        action={
          <button
            className="secondary-button"
            onClick={onOpenEvidence}
            type="button"
          >
            <ArrowRight size={16} />
            Evidence
          </button>
        }
        subtitle="Build a source-backed administrative appeal packet for clinician review."
        title="Denial Rescue / Appeal Builder"
      />
      <AppealSummaryBand data={data} patient={patient} />
      <div className="appeal-grid">
        <section className="glass-panel denial-panel">
          <PanelHeader icon={<FileText size={20} />} title="Denial Summary" />
          <StatusPill tone="danger" value="Denied" />
          <div className="denial-list">
            <StateLine
              icon={<AlertTriangle size={18} />}
              label="Denial Reason"
              state="danger"
              value={denialReasonText(denialReason)}
            />
            <StateLine
              icon={<FileText size={18} />}
              label="Referenced Payer Rule"
              state="idle"
              value="Northstar Biologic Policy 2026, Section 2.4. Requires trial and failure of two preferred therapies."
            />
            <StateLine
              icon={<ShieldAlert size={18} />}
              label="Missing / Insufficient Evidence"
              state="warn"
              value={missingEvidenceText(data)}
            />
            <StateLine
              icon={<CalendarDays size={18} />}
              label="Due Date"
              state="danger"
              value="Jul 12, 2026 - decision due soon"
            />
          </div>
        </section>
        <section className="glass-panel">
          <PanelHeader
            icon={<ClipboardCheck size={20} />}
            right={
              <StatusPill
                tone={needsSignoff ? "warn" : "good"}
                value={needsSignoff ? "Awaiting Signoff" : "Ready"}
              />
            }
            title="Appeal Packet Builder"
          />
          <div className="packet-list">
            <PacketStep
              icon={<FileText size={18} />}
              label="Appeal Letter"
              meta="Personalized administrative draft with clinical rationale."
              state="good"
              value="Complete"
            />
            <PacketStep
              icon={<FileCheck2 size={18} />}
              label="Supporting Attachments"
              meta="Clinical notes, labs, prior treatment history, and policy citations."
              state="good"
              value={`${Math.max(8, data.evidenceMappings.length + 5)} documents`}
            />
            <PacketStep
              icon={<ShieldCheck size={18} />}
              label="Clinician Attestation"
              meta="Statement of medical necessity and supporting rationale."
              state="good"
              value="Complete"
            />
            <PacketStep
              cta="Request Signoff"
              icon={<UserCheck size={18} />}
              label="Clinician Signoff"
              meta="Requires clinician review and electronic signature."
              state={needsSignoff ? "warn" : "good"}
              value={needsSignoff ? "Pending" : "Approved"}
            />
          </div>
        </section>
      </div>
      <section className="glass-panel recommended-actions">
        <PanelHeader
          icon={<CheckCircle2 size={20} />}
          title="Recommended Next Actions"
        />
        <div className="action-card-grid">
          <ActionCard
            icon={<UserCheck size={20} />}
            label="Request Clinician Signoff"
            meta="Send to reviewer for source-backed approval."
          />
          <ActionCard
            icon={<FileText size={20} />}
            label="Add Missing Evidence"
            meta="Attach labs and prior therapy documentation."
          />
          <ActionCard
            icon={<Send size={20} />}
            label="Review & Submit Appeal"
            meta="Final review before payer deadline."
          />
        </div>
      </section>
    </div>
  );
}

function AnalyticsView({ rows }: { rows: CaseListRow[] }) {
  return (
    <div className="view-stack">
      <PageHeader
        subtitle="Synthetic operational KPIs for the demo portfolio."
        title="Analytics"
      />
      <KpiGrid
        items={[
          {
            icon: Clock3,
            label: "Median delay avoided",
            value: "4.2d",
            trend: "Across active cases",
            tone: "good",
          },
          {
            icon: Gauge,
            label: "Automation coverage",
            value: "86%",
            trend: "UiPath-governed steps",
            tone: "info",
          },
          {
            icon: ShieldCheck,
            label: "Evidence-linked claims",
            value: "100%",
            trend: "No unsupported assertions submitted",
            tone: "good",
          },
          {
            icon: Bot,
            label: "Agent steps mirrored",
            value: "7",
            trend: "Specialist agents",
            tone: "info",
          },
          {
            icon: UsersRound,
            label: "Case mix",
            value: String(rows.length),
            trend: "Visible synthetic queue",
            tone: "warn",
          },
        ]}
      />
      <section className="glass-panel analytics-panel">
        <PanelHeader icon={<BarChart3 size={20} />} title="Outcome Trend" />
        <div className="bar-chart" aria-label="Synthetic approvals trend">
          {[38, 52, 46, 65, 58, 72, 69, 82].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <p className="governance-note">
          Analytics are synthetic and demo-oriented. Live production measures
          would be written by UiPath workflows and event records before this UI
          visualizes them.
        </p>
      </section>
    </div>
  );
}

function PageHeader({
  action,
  breadcrumb,
  subtitle,
  title,
}: {
  action?: React.ReactNode;
  breadcrumb?: string;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="page-header">
      <div>
        {breadcrumb ? <span className="breadcrumb">{breadcrumb}</span> : null}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </div>
  );
}

function KpiGrid({
  items,
}: {
  items: Array<{
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    value: string;
    trend: string;
    tone: Tone;
  }>;
}) {
  return (
    <section className="kpi-grid" aria-label="Portfolio KPIs">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article className={`kpi-card ${item.tone}`} key={item.label}>
            <div className="kpi-top">
              <span>{item.label}</span>
              <Icon size={28} />
            </div>
            <strong>{item.value}</strong>
            <Sparkline tone={item.tone} />
            <em>{item.trend}</em>
          </article>
        );
      })}
    </section>
  );
}

function Sparkline({ tone }: { tone: Tone }) {
  return (
    <svg
      aria-hidden="true"
      className={`sparkline ${tone}`}
      viewBox="0 0 120 24"
    >
      <path d="M2 16 C10 11 13 18 21 13 S31 17 38 12 S50 19 59 14 S71 9 79 13 S89 10 96 14 S107 7 118 9" />
    </svg>
  );
}

function LiveProofPanel({
  data,
  isStarting,
  onOpenDetail,
  onRun,
  run,
  runtime,
}: {
  data: DemoState;
  isStarting: boolean;
  onOpenDetail: () => void;
  onRun: () => void;
  run: LiveProofRun | null;
  runtime: RuntimeState;
}) {
  const previewRun =
    run ??
    buildSyntheticLiveProofRun(data, runtime.lastFetchedAt, {
      status: "not_started",
      sourceLabel: "Ready to start a synthetic governed proof",
    });
  const progress = liveProofProgress(previewRun.steps);
  const activeSteps = previewRun.steps.slice(0, 4);

  return (
    <section className="live-proof-panel">
      <div className="live-proof-copy">
        <span className="eyebrow">Checkpoint 7 live proof</span>
        <h2>{previewRun.headline}</h2>
        <p>
          Start one synthetic treatment-access run to show fewer preventable
          denials, less manual chart review, faster prior authorization prep,
          safer appeal review, and auditable human gates.
        </p>
        <div className="live-proof-actions">
          <button
            className="primary-button run-live-proof-button"
            disabled={isStarting}
            onClick={onRun}
            type="button"
          >
            {isStarting ? (
              <RefreshCw className="spin" size={16} />
            ) : (
              <Workflow size={16} />
            )}
            {run ? "Run live proof again" : "Run live proof"}
          </button>
          <button
            className="secondary-button"
            disabled={!run}
            onClick={onOpenDetail}
            type="button"
          >
            View proof detail
            <PanelRightOpen size={16} />
          </button>
        </div>
      </div>
      <div className="live-proof-status-card">
        <div className="live-proof-status-head">
          <StatusPill
            tone={liveRunTone(previewRun.status)}
            value={liveProofStatusCopy(previewRun.status)}
          />
          <span>{previewRun.source_label}</span>
        </div>
        <div className="proof-meter" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="live-proof-current">
          <Bot size={22} />
          <div>
            <span>Current work</span>
            <strong>{previewRun.current_agent}</strong>
          </div>
        </div>
        <div className="live-proof-mini-steps">
          {activeSteps.map((step) => (
            <div className="mini-step" key={step.step_id}>
              <StatusDot tone={liveStepDot(step.status)} />
              <span>{step.label}</span>
              <em>{step.agent}</em>
            </div>
          ))}
        </div>
      </div>
      <div className="live-proof-value-list">
        {previewRun.value_summary.map((value) => (
          <div className="value-proof" key={value}>
            <ShieldCheck size={18} />
            <span>{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCase({
  caseRecord,
  onOpenCase,
  patient,
  row,
  runtime,
}: {
  caseRecord: TreatmentAccessCase;
  onOpenCase: () => void;
  patient: string;
  row: CaseListRow;
  runtime: RuntimeState;
}) {
  return (
    <section className="featured-case">
      <div className="case-person">
        <Avatar initials={row.initials} tone={row.accent} />
        <div>
          <span>Featured Case - Urgent</span>
          <h2>{patient}</h2>
          <p>{row.treatment} - Specialty biologic authorization</p>
          <div className="case-tags">
            <span>
              Case ID: {caseRecord.external_case_key ?? caseRecord.case_id}
            </span>
            <span>{row.payer}</span>
          </div>
        </div>
      </div>
      <div className="risk-box">
        <span>Risk Level</span>
        <strong>{row.risk}</strong>
        <em>Decision due {formatRelativeDue(caseRecord.sla_due_at)}</em>
      </div>
      <div className="risk-copy">
        <strong>Why at risk?</strong>
        <p>
          Prior authorization requires additional source-backed evidence and
          clinician signoff before payer submission.
        </p>
        <button className="primary-button" onClick={onOpenCase} type="button">
          Open Case
        </button>
      </div>
      <div className="source-footnote">
        {runtime.source === "api"
          ? "Deterministic state from event mirror"
          : "Deterministic fallback cache"}
      </div>
    </section>
  );
}

function ActiveCasesTable({
  onOpenAppeal,
  onOpenCase,
  rows,
}: {
  onOpenAppeal: () => void;
  onOpenCase: () => void;
  rows: CaseListRow[];
}) {
  return (
    <section className="glass-panel active-cases">
      <div className="section-title">
        <h2>Active Cases</h2>
        <button onClick={onOpenCase} type="button">
          View all cases
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="case-table" role="table" aria-label="Active cases">
        <div className="case-table-row case-table-head" role="row">
          <span role="columnheader">Patient</span>
          <span role="columnheader">Treatment</span>
          <span role="columnheader">Payer</span>
          <span role="columnheader">Stage</span>
          <span role="columnheader">Risk</span>
          <span role="columnheader">Next Action</span>
          <span role="columnheader" aria-label="More" />
        </div>
        {rows.map((row) => (
          <button
            className="case-table-row"
            key={row.id}
            onClick={row.stage === "Appeal" ? onOpenAppeal : onOpenCase}
            role="row"
            type="button"
          >
            <span role="cell">
              <Avatar initials={row.initials} tone={row.accent} />
              {row.patient}, {row.age}
            </span>
            <span role="cell">{row.treatment}</span>
            <span role="cell">{row.payer}</span>
            <span role="cell">
              <StatusPill tone={stageTone(row.stage)} value={row.stage} />
            </span>
            <span role="cell">
              <StatusPill tone={riskTone(row.risk)} value={row.risk} />
            </span>
            <span role="cell">{row.nextAction}</span>
            <span role="cell">
              <MoreVertical size={16} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function NextBestActions({
  data,
  onOpenAppeal,
  onOpenEvidence,
  rows,
}: {
  data: DemoState;
  onOpenAppeal: () => void;
  onOpenEvidence: () => void;
  rows: CaseListRow[];
}) {
  const primaryActions = [
    {
      row: rows[0],
      cta: "Resolve evidence gap",
      handler: onOpenEvidence,
      priority: "High",
    },
    {
      row: rows[1],
      cta: "Confirm prior therapy",
      handler: onOpenEvidence,
      priority: "Medium",
    },
    {
      row: rows[2],
      cta: "Submit appeal brief",
      handler: onOpenAppeal,
      priority: "Low",
    },
  ].filter((item): item is NonNullable<typeof item> & { row: CaseListRow } =>
    Boolean(item.row),
  );

  return (
    <section className="glass-panel next-actions">
      <PanelHeader icon={<Gauge size={20} />} title="Next Best Actions" />
      <div className="next-action-list">
        {primaryActions.map((item) => (
          <button
            className="next-action-item"
            key={`${item.row.id}-${item.cta}`}
            onClick={item.handler}
            type="button"
          >
            <Avatar initials={item.row.initials} tone={item.row.accent} />
            <span>
              <strong>{item.row.patient}</strong>
              <em>{item.row.treatment}</em>
              <small>{item.cta}</small>
            </span>
            <StatusPill tone={riskTone(item.priority)} value={item.priority} />
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      <button className="link-button" type="button">
        View all actions
        <ChevronRight size={16} />
      </button>
      <p className="deterministic-note">
        {data.events.length} mirrored events drive the visible recommendations.
      </p>
    </section>
  );
}

function CaseSummaryBand({
  caseRecord,
  data,
  patient,
}: {
  caseRecord: TreatmentAccessCase;
  data: DemoState;
  patient: string;
}) {
  return (
    <section className="summary-band">
      <div className="summary-person">
        <Avatar initials={initialsFor(patient)} tone="red" large />
        <div>
          <h2>{patient}</h2>
          <p>MRN SYN-7845123 - Age {data.patient?.age ?? 34} - Synthetic</p>
        </div>
      </div>
      <SummaryItem
        label="Diagnosis"
        value={
          data.order?.diagnosis ??
          "Moderate-to-severe inflammatory bowel disease"
        }
        meta={data.patient?.diagnosis_codes.join(", ") ?? "K50.90"}
      />
      <SummaryItem
        label="Requested Treatment"
        value={data.order?.medication_name ?? caseRecord.medication_name}
        meta={data.order?.dose ?? "Dose in order"}
      />
      <SummaryItem
        label="Payer"
        value={caseRecord.payer_id}
        meta={data.patient?.coverage_plan ?? "Commercial"}
      />
      <SummaryItem
        label="Case ID"
        value={caseRecord.external_case_key ?? caseRecord.case_id}
        meta={`Created ${formatShortDate(caseRecord.last_event_at)}`}
      />
      <SummaryItem
        label="Urgency"
        value={labelize(caseRecord.urgency)}
        meta={`Decision due ${formatRelativeDue(caseRecord.sla_due_at)}`}
        tone="danger"
      />
    </section>
  );
}

function ProgressPanel({ caseRecord }: { caseRecord: TreatmentAccessCase }) {
  const activeIndex = stageIndex(caseRecord.current_stage);

  return (
    <section className="glass-panel progress-panel">
      <PanelHeader icon={<Activity size={20} />} title="Case Progress" />
      <div className="progress-track">
        {PROGRESS_STEPS.map((step, index) => {
          const state =
            index < activeIndex
              ? "done"
              : index === activeIndex
                ? "active"
                : "queued";
          return (
            <div className={`progress-step ${state}`} key={step.id}>
              <span>
                {state === "done" ? <CheckCircle2 size={18} /> : index + 1}
              </span>
              <strong>{step.label}</strong>
              <em>{state === "active" ? "In Progress" : step.status}</em>
            </div>
          );
        })}
      </div>
      <div className="current-step-card">
        <div className="step-icon">
          <FileCheck2 size={24} />
        </div>
        <div>
          <h3>{PROGRESS_STEPS[activeIndex]?.label ?? "Case review"}</h3>
          <p>
            Building the prior authorization package and aligning evidence to
            payer policy.
          </p>
        </div>
        <div>
          <span>Estimated completion</span>
          <strong>{formatShortDate(caseRecord.sla_due_at)}</strong>
        </div>
      </div>
    </section>
  );
}

function NextActionCards({
  data,
  onOpenEvidence,
}: {
  data: DemoState;
  onOpenEvidence: () => void;
}) {
  const pendingRows = data.evidenceMappings.filter(
    (row) => row.needs_human_review || row.status === "missing",
  );

  return (
    <section className="glass-panel">
      <PanelHeader icon={<Gauge size={20} />} title="Next Best Actions" />
      <div className="action-card-grid">
        <ActionCard
          icon={<FileText size={20} />}
          label={
            pendingRows[0]
              ? "Confirm clinical assertion"
              : "Confirm disease severity"
          }
          meta={
            pendingRows[0]?.human_review_reason ??
            "Review mapped evidence and sign the authorization package."
          }
          onClick={onOpenEvidence}
          priority="High"
        />
        <ActionCard
          icon={<Upload size={20} />}
          label="Upload trial intolerance notes"
          meta="Add documentation of inadequate response or intolerance."
          onClick={onOpenEvidence}
          priority="Medium"
        />
        <ActionCard
          icon={<UserRound size={20} />}
          label="Clinician signoff"
          meta="Review source-backed evidence and approve the packet."
          priority="Low"
        />
      </div>
      <button className="link-button" type="button">
        View all actions
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function ActorsPanel({ data }: { data: DemoState }) {
  const actors = [
    { icon: Bot, label: "Agent", name: "CareGuide AI", state: "Active" },
    { icon: Bot, label: "Robot", name: "EvidenceBot", state: "Active" },
    {
      icon: UserRound,
      label: "Human",
      name: "Clinician reviewer",
      state: "In Progress",
    },
    {
      icon: Workflow,
      label: "API",
      name: "Payer Gateway",
      state: apiFailureActive(data) ? "Fallback" : "Active",
    },
  ];

  return (
    <section className="glass-panel side-panel">
      <PanelHeader icon={<UsersRound size={20} />} title="Involved Actors" />
      <div className="actor-list">
        {actors.map((actor) => {
          const Icon = actor.icon;
          return (
            <div className="actor-row" key={`${actor.label}-${actor.name}`}>
              <span className="actor-icon">
                <Icon size={18} />
              </span>
              <div>
                <strong>{actor.label}</strong>
                <em>{actor.name}</em>
              </div>
              <StatusDot
                tone={
                  actor.state === "Fallback"
                    ? "warn"
                    : actor.state === "In Progress"
                      ? "warn"
                      : "good"
                }
              />
              <small>{actor.state}</small>
            </div>
          );
        })}
      </div>
      <button className="link-button" type="button">
        View all actors
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function RecentActivity({ events }: { events: AuditEvent[] }) {
  const visibleEvents = events
    .slice()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 4);

  return (
    <section className="glass-panel side-panel">
      <PanelHeader icon={<Clock3 size={20} />} title="Recent Activity" />
      <div className="activity-list">
        {visibleEvents.length > 0 ? (
          visibleEvents.map((event) => (
            <article className="activity-row" key={event.event_id}>
              <StatusDot tone={actorTone(event.actor_type)} />
              <div>
                <strong>{event.task_or_agent_name}</strong>
                <span>{event.actor_name}</span>
              </div>
              <time dateTime={event.timestamp}>
                {formatTime(event.timestamp)}
              </time>
            </article>
          ))
        ) : (
          <div className="quiet-state">No mirrored activity yet.</div>
        )}
      </div>
      <button className="link-button" type="button">
        View all activity
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function EvidenceSummaryBand({
  data,
  patient,
}: {
  data: DemoState;
  patient: string;
}) {
  return (
    <section className="summary-band evidence-summary">
      <div className="summary-person">
        <Avatar initials={initialsFor(patient)} tone="red" large />
        <div>
          <h2>{patient}</h2>
          <p>MRN SYN-7845123 - Age {data.patient?.age ?? 34} - Synthetic</p>
        </div>
      </div>
      <SummaryItem
        label="Treatment"
        value={
          data.order?.medication_name ??
          data.case?.medication_name ??
          "Treatment"
        }
        meta={data.order?.diagnosis ?? "Clinical indication"}
      />
      <SummaryItem
        label="Case ID"
        value={data.case?.external_case_key ?? data.case?.case_id ?? "Case"}
        meta="Governed event record"
      />
      <SummaryItem
        label="Risk Level"
        value={labelize(data.case?.sla_state ?? "at risk")}
        meta={`Decision due ${formatRelativeDue(data.case?.sla_due_at ?? new Date().toISOString())}`}
        tone="danger"
      />
      <SummaryItem
        label="Stage"
        value={currentStageLabel(data.case?.current_stage)}
        meta="Next: payer review"
      />
    </section>
  );
}

function EvidenceDrawer({ evidence }: { evidence?: EvidenceMapping }) {
  return (
    <aside
      className="glass-panel selected-evidence"
      aria-label="Selected evidence"
    >
      <div className="drawer-title">
        <h2>Selected Evidence</h2>
        <button aria-label="Close selected evidence" type="button">
          <X size={18} />
        </button>
      </div>
      {evidence ? (
        <>
          <div className="source-card">
            <FileText size={28} />
            <div>
              <strong>{sourceTitle(evidence)}</strong>
              <span>{formatSourceReference(evidence.source_span)}</span>
            </div>
          </div>
          <div className="source-details">
            <h3>Source Details</h3>
            <KeyValue
              label="Evidence status"
              value={labelize(evidence.status)}
            />
            <KeyValue
              label="Confidence"
              value={`${Math.round(evidence.confidence * 100)}%`}
            />
            <KeyValue
              label="Review"
              value={
                evidence.needs_human_review
                  ? "Clinician review required"
                  : "Evidence linked"
              }
            />
          </div>
          <div className="evidence-snapshot">
            <h3>Evidence Snapshot</h3>
            <p>{evidence.source_quote_short ?? evidence.evidence_summary}</p>
          </div>
          <button className="secondary-button full-width" type="button">
            View Full Document
            <ExternalLink size={16} />
          </button>
        </>
      ) : (
        <EmptyState
          detail="Select a mapped requirement to inspect its source."
          title="No evidence selected"
        />
      )}
    </aside>
  );
}

function UnsupportedWarning() {
  return (
    <div className="unsupported-warning">
      <AlertTriangle size={24} />
      <div>
        <strong>Do not submit unsupported claims.</strong>
        <p>
          Payer guidelines require source-backed criteria, policy citations, or
          clinician approval before submission.
        </p>
      </div>
      <button className="secondary-button" type="button">
        View Payer Criteria
        <ExternalLink size={16} />
      </button>
    </div>
  );
}

function AppealSummaryBand({
  data,
  patient,
}: {
  data: DemoState;
  patient: string;
}) {
  return (
    <section className="summary-band appeal-summary">
      <div className="summary-person">
        <Avatar initials={initialsFor(patient)} tone="red" large />
        <div>
          <h2>{patient}</h2>
          <p>
            MRN SYN-7845123 - Case ID:{" "}
            {data.case?.external_case_key ?? data.case?.case_id}
          </p>
        </div>
      </div>
      <SummaryItem
        label="Treatment"
        value={
          data.order?.medication_name ??
          data.case?.medication_name ??
          "Treatment"
        }
        meta="Specialty medication"
      />
      <SummaryItem
        label="Payer"
        value={data.case?.payer_id ?? "Payer"}
        meta={data.patient?.coverage_plan ?? "Commercial"}
      />
      <SummaryItem
        label="Denied On"
        value="Jul 02, 2026"
        meta="Denied"
        tone="danger"
      />
      <SummaryItem
        label="Appeal Deadline"
        value="Jul 12, 2026"
        meta="Time sensitive"
        tone="danger"
      />
      <SummaryItem
        label="Current Risk Level"
        value="High"
        meta="Decision due soon"
        tone="danger"
      />
    </section>
  );
}

function LiveProofDrawer({
  onClose,
  run,
}: {
  onClose: () => void;
  run: LiveProofRun;
}) {
  const progress = liveProofProgress(run.steps);

  return (
    <div className="audit-backdrop" role="presentation">
      <aside className="live-proof-drawer" aria-label="Live proof detail">
        <div className="audit-header">
          <div>
            <span>Live proof detail</span>
            <h2>{run.headline}</h2>
          </div>
          <button
            aria-label="Close live proof detail"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <section className="audit-section proof-detail-summary">
          <div className="proof-detail-topline">
            <StatusPill
              tone={liveRunTone(run.status)}
              value={liveProofStatusCopy(run.status)}
            />
            <span>{run.source_label}</span>
          </div>
          <div className="proof-meter" aria-label={`${progress}% complete`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>
            The Command Center visualizes governed records and run metadata. It
            does not replace UiPath as the orchestration or source-of-truth
            layer, and it does not submit to a real payer.
          </p>
          <small>{run.synthetic_data_disclaimer}</small>
        </section>
        <section className="audit-section">
          <PanelHeader icon={<UserCheck size={18} />} title="Human Gate" />
          <div className="approval-gate-card">
            <div>
              <strong>{run.approval_gate.label}</strong>
              <span>{run.approval_gate.reason}</span>
            </div>
            <StatusPill
              tone={approvalGateTone(run.approval_gate.status)}
              value={labelize(run.approval_gate.status)}
            />
            <small>{run.approval_gate.owner}</small>
          </div>
        </section>
        <section className="audit-section">
          <PanelHeader icon={<Bot size={18} />} title="Agent Work" />
          <div className="proof-step-list">
            {run.steps.map((step) => (
              <LiveProofStepCard key={step.step_id} step={step} />
            ))}
          </div>
        </section>
        <section className="audit-section">
          <PanelHeader
            icon={<DatabaseZap size={18} />}
            title="Trace And Source Labels"
          />
          <div className="trace-list">
            {run.traces.map((trace) => (
              <article
                className="trace-card"
                key={`${trace.provider}-${trace.label}`}
              >
                <div>
                  <strong>{trace.provider}</strong>
                  <span>{trace.label}</span>
                </div>
                <StatusPill
                  tone={traceTone(trace.status)}
                  value={labelize(trace.status)}
                />
                <p>{trace.detail}</p>
                {trace.trace_url ? (
                  <a href={trace.trace_url} rel="noreferrer" target="_blank">
                    Open trace
                    <ExternalLink size={14} />
                  </a>
                ) : trace.trace_id ? (
                  <small>{trace.trace_id}</small>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function LiveProofStepCard({ step }: { step: LiveProofStep }) {
  return (
    <article className={`proof-step-card ${liveStepTone(step.status)}`}>
      <div className="proof-step-head">
        <StatusDot tone={liveStepDot(step.status)} />
        <div>
          <strong>{step.label}</strong>
          <span>{step.agent}</span>
        </div>
        <StatusPill
          tone={liveStepTone(step.status)}
          value={labelize(step.status)}
        />
      </div>
      <p>{step.summary}</p>
      <div className="source-label-row">
        <span className={`source-label ${sourceTone(step.source)}`}>
          {sourceKindLabel(step.source)}
        </span>
        {step.evidence_refs.slice(0, 3).map((ref) => (
          <span
            className={`source-label ${sourceTone(ref.source)}`}
            key={`${step.step_id}-${ref.label}`}
          >
            {ref.label}
          </span>
        ))}
      </div>
    </article>
  );
}

function AuditDrawer({
  actorFilter,
  data,
  onActorFilterChange,
  onClose,
  onToggle,
  runtime,
}: {
  actorFilter: ActorFilter;
  data: DemoState;
  onActorFilterChange: (filter: ActorFilter) => void;
  onClose: () => void;
  onToggle: (patch: Partial<DemoToggles>) => void;
  runtime: RuntimeState;
}) {
  const filteredEvents =
    actorFilter === "all"
      ? data.events
      : data.events.filter((event) => event.actor_type === actorFilter);

  return (
    <div className="audit-backdrop" role="presentation">
      <aside className="audit-drawer" aria-label="Audit and trace detail">
        <div className="audit-header">
          <div>
            <span>Audit / Trace</span>
            <h2>Runtime Proof</h2>
          </div>
          <button
            aria-label="Close audit drawer"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <section className="audit-section">
          <PanelHeader icon={<DatabaseZap size={18} />} title="State Source" />
          <p>
            {runtime.source === "api"
              ? "Reading deterministic state from the event mirror API."
              : "Mirror unavailable; showing local deterministic fallback cache."}
          </p>
          <small>
            {runtime.apiBaseUrl} - fetched {formatTime(runtime.lastFetchedAt)}
          </small>
        </section>
        <section className="audit-section">
          <PanelHeader icon={<Bot size={18} />} title="Specialist Agents" />
          <div className="compact-agent-grid">
            {AGENTS.map((agent) => {
              const view = agentView(agent.name, agent.traceNeedle, data);
              return (
                <div className="compact-agent" key={agent.name}>
                  <StatusDot
                    tone={
                      view.tone === "danger"
                        ? "danger"
                        : view.tone === "warn"
                          ? "warn"
                          : view.tone === "good"
                            ? "good"
                            : "idle"
                    }
                  />
                  <strong>{agent.name}</strong>
                  <span>{view.status}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="audit-section">
          <PanelHeader icon={<Info size={18} />} title="Demo Controls" />
          <DemoTogglesPanel
            disabled={runtime.source !== "api"}
            onToggle={onToggle}
            toggles={data.toggles}
          />
        </section>
        <section className="audit-section">
          <PanelHeader icon={<Activity size={18} />} title="Runtime Events" />
          <div
            className="actor-filter"
            role="tablist"
            aria-label="Timeline actor filter"
          >
            {ACTOR_FILTERS.map((filter) => (
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
      </aside>
    </div>
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
    <div className="toggle-stack">
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
    </div>
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

function PanelHeader({
  icon,
  right,
  title,
}: {
  icon: React.ReactNode;
  right?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="panel-header">
      <span>{icon}</span>
      <h2>{title}</h2>
      {right ? <div className="panel-header-right">{right}</div> : null}
    </div>
  );
}

function SummaryItem({
  label,
  meta,
  tone,
  value,
}: {
  label: string;
  meta: string;
  tone?: Tone;
  value: string;
}) {
  return (
    <div className={`summary-item ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{meta}</em>
    </div>
  );
}

function Avatar({
  initials,
  large,
  tone,
}: {
  initials: string;
  large?: boolean;
  tone: CaseListRow["accent"];
}) {
  return (
    <span className={`avatar ${tone} ${large ? "large" : ""}`}>{initials}</span>
  );
}

function StatusPill({ tone, value }: { tone?: string; value: string }) {
  return <span className={`status-pill ${tone ?? "neutral"}`}>{value}</span>;
}

function StatusDot({ tone }: { tone: "good" | "danger" | "warn" | "idle" }) {
  return <span className={`status-dot ${tone}`} aria-hidden="true" />;
}

function StatusIcon({ tone }: { tone: Tone }) {
  if (tone === "good")
    return <CheckCircle2 className="status-icon good" size={24} />;
  if (tone === "warn")
    return <AlertTriangle className="status-icon warn" size={24} />;
  if (tone === "danger") return <X className="status-icon danger" size={24} />;
  return <CircleDashed className="status-icon idle" size={24} />;
}

function ConfidenceArc({ value }: { value: number }) {
  const percentage = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <span
      className="confidence-arc"
      style={{ "--confidence": `${percentage}%` } as React.CSSProperties}
    >
      <span />
    </span>
  );
}

function ActionCard({
  icon,
  label,
  meta,
  onClick,
  priority,
}: {
  icon: React.ReactNode;
  label: string;
  meta: string;
  onClick?: () => void;
  priority?: "High" | "Medium" | "Low";
}) {
  return (
    <button className="action-card" onClick={onClick} type="button">
      <span className="action-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <em>{meta}</em>
        {priority ? <small>Due priority: {priority}</small> : null}
      </span>
      <ChevronRight size={18} />
    </button>
  );
}

function PacketStep({
  cta,
  icon,
  label,
  meta,
  state,
  value,
}: {
  cta?: string;
  icon: React.ReactNode;
  label: string;
  meta: string;
  state: "good" | "warn";
  value: string;
}) {
  return (
    <button className={`packet-step ${state}`} type="button">
      <span className="packet-icon">{icon}</span>
      <span>
        <strong>{label}</strong>
        <em>{meta}</em>
      </span>
      <span className="packet-state">
        <StatusPill tone={state} value={value} />
        {cta ? <small>{cta}</small> : <small>Preview</small>}
      </span>
      <ChevronRight size={18} />
    </button>
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

function LoadingShell() {
  return (
    <main className="loading-shell">
      <div className="loading-card">
        <CircleDashed className="spin" size={30} />
        <strong>Loading command state</strong>
        <span>Reading the UiPath event mirror or local synthetic cache.</span>
      </div>
    </main>
  );
}

function EmptyState({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="empty-state">
      <CircleDashed size={28} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function buildCaseRows(data: DemoState, patient: string): CaseListRow[] {
  const primary: CaseListRow = {
    id: data.case?.case_id ?? "case-syn-001",
    initials: initialsFor(patient),
    patient,
    age: data.patient?.age ?? 34,
    treatment:
      data.order?.medication_name ??
      data.case?.medication_name ??
      "Fictionalimab",
    payer: payerName(data.case?.payer_id ?? "Northstar Health"),
    stage: stageForCase(data.case),
    risk:
      data.case?.sla_state === "breached"
        ? "High"
        : data.case?.sla_state === "at_risk"
          ? "High"
          : "Medium",
    nextAction: nextActionForCase(data),
    owner: "CareGuide AI",
    accent: "red",
  };

  return [
    primary,
    {
      id: "case-syn-002",
      initials: "MP",
      patient: "Maya Patel",
      age: 52,
      treatment: "Stelara",
      payer: "Elevance Health",
      stage: "Evidence Gathering",
      risk: "Medium",
      nextAction: "Upload GI notes",
      owner: "EvidenceBot",
      accent: "amber",
    },
    {
      id: "case-syn-003",
      initials: "RW",
      patient: "Robert Williams",
      age: 61,
      treatment: "Entyvio",
      payer: "Aetna",
      stage: "Appeal",
      risk: "Low",
      nextAction: "Submit appeal brief",
      owner: "AppealBot",
      accent: "green",
    },
    {
      id: "case-syn-004",
      initials: "LC",
      patient: "Linda Chen",
      age: 34,
      treatment: "Dupixent",
      payer: "Cigna Healthcare",
      stage: "Payer Review",
      risk: "Low",
      nextAction: "Check status",
      owner: "Payer Gateway",
      accent: "blue",
    },
  ];
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

function agentView(name: string, traceNeedle: string, data: DemoState) {
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
  const denial = hasDenialSignal(data);
  const appeal = data.appeals.at(-1);
  const handoff = data.handoffs.at(-1);

  if (event) {
    return {
      tone: "good" as Tone,
      status: "completed",
      output: event.output_summary,
    };
  }
  if (name === "Missing Evidence") {
    return {
      tone: missing ? ("danger" as Tone) : ("good" as Tone),
      status: missing ? "blocking" : "clear",
      output: "Evidence gap routing.",
    };
  }
  if (name === "Submission Packet") {
    return {
      tone: needsHuman ? ("warn" as Tone) : ("idle" as Tone),
      status: needsHuman ? "needs human" : "queued",
      output: "Packet readiness.",
    };
  }
  if (name === "Denial Rescue") {
    return {
      tone: denial ? ("warn" as Tone) : ("idle" as Tone),
      status: denial ? "active" : "queued",
      output: "Denial strategy.",
    };
  }
  if (name === "Appeal Packet") {
    return {
      tone: appeal ? ("warn" as Tone) : ("idle" as Tone),
      status: appeal ? "review" : "queued",
      output: "Clinician review.",
    };
  }
  if (name === "Care Continuity") {
    return {
      tone: handoff ? ("good" as Tone) : ("idle" as Tone),
      status: handoff ? "handoff" : "queued",
      output: "Care handoff.",
    };
  }
  return {
    tone: "idle" as Tone,
    status: "queued",
    output: "Waiting for trace.",
  };
}

function evidenceTone(status?: EvidenceMapping["status"]): Tone {
  if (status === "found") return "good";
  if (status === "missing" || status === "conflicting") return "danger";
  if (status === "needs_human_validation") return "warn";
  return "idle";
}

function actorIcon(actorType: AuditEvent["actor_type"]) {
  if (actorType === "agent") return <Bot size={14} />;
  if (actorType === "api_workflow") return <Workflow size={14} />;
  if (actorType === "robot") return <Activity size={14} />;
  if (actorType === "human") return <UserCheck size={14} />;
  return <Clock3 size={14} />;
}

function actorTone(actorType: AuditEvent["actor_type"]) {
  if (actorType === "robot") return "warn";
  if (actorType === "system") return "idle";
  return "good";
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
    Boolean(
      data.case?.active_secondary_stages.includes(
        "api_failure_portal_fallback",
      ),
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

function hasDenialSignal(data: DemoState) {
  return data.submissions.some(
    (submission) =>
      submission.decision_status === "denied" ||
      Boolean(submission.denial_code),
  );
}

function attemptStatus(attempt: MirrorSubmission) {
  return [
    labelize(attempt.status),
    attempt.error_code,
    attempt.decision_status ? labelize(attempt.decision_status) : undefined,
  ]
    .filter(Boolean)
    .join(" - ");
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

function casePatient(data: DemoState) {
  return data.patient?.synthetic_name ?? "Synthetic Patient";
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function payerName(value: string) {
  return value
    .replace(/^payer-/i, "")
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stageForCase(caseRecord: TreatmentAccessCase | null) {
  if (!caseRecord) return "Intake";
  if (caseRecord.current_stage === "clinical_validation")
    return "Clinician Signoff";
  if (caseRecord.current_stage === "denial_rescue") return "Appeal";
  if (caseRecord.current_stage === "submission") return "Payer Review";
  if (caseRecord.current_stage === "policy_evidence")
    return "Evidence Gathering";
  return currentStageLabel(caseRecord.current_stage);
}

function nextActionForCase(data: DemoState) {
  if (data.evidenceMappings.some((row) => row.status === "missing")) {
    return "Upload missing evidence";
  }
  if (data.evidenceMappings.some((row) => row.needs_human_review)) {
    return "Request clinician signoff";
  }
  if (apiFailureActive(data)) return "Monitor robot fallback";
  if (hasDenialSignal(data)) return "Submit appeal brief";
  return "Check payer status";
}

function stageIndex(stage: TreatmentAccessCase["current_stage"]) {
  const index = PROGRESS_STEPS.findIndex((step) => step.id === stage);
  if (index >= 0) return index;
  if (stage === "policy_evidence") return 2;
  if (stage === "payer_decision") return 5;
  return 0;
}

function currentStageLabel(stage?: TreatmentAccessCase["current_stage"]) {
  if (!stage) return "Clinical Review";
  return labelize(stage)
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stageTone(stage: string) {
  if (stage.includes("Signoff") || stage.includes("Evidence")) return "warn";
  if (stage.includes("Appeal")) return "info";
  return "neutral";
}

function liveProofProgress(steps: LiveProofStep[]) {
  if (steps.length === 0) return 0;
  const completed = steps.filter((step) =>
    ["completed", "needs_human", "blocked"].includes(step.status),
  ).length;
  return Math.round((completed / steps.length) * 100);
}

function liveRunTone(status: LiveProofRun["status"]) {
  if (status === "completed") return "good";
  if (status === "waiting_for_approval" || status === "running") return "warn";
  if (status === "blocked" || status === "failed") return "danger";
  return "info";
}

function liveProofStatusCopy(status: LiveProofRun["status"]) {
  if (status === "waiting_for_approval") return "Waiting for approval";
  if (status === "not_started") return "Ready";
  return labelize(status);
}

function liveStepTone(status: LiveProofStep["status"]) {
  if (status === "completed") return "good";
  if (status === "needs_human" || status === "running") return "warn";
  if (status === "blocked" || status === "failed") return "danger";
  return "idle";
}

function liveStepDot(status: LiveProofStep["status"]) {
  return liveStepTone(status);
}

function approvalGateTone(status: LiveProofRun["approval_gate"]["status"]) {
  if (status === "approved" || status === "not_required") return "good";
  if (status === "waiting" || status === "required") return "warn";
  if (status === "rejected") return "danger";
  return "idle";
}

function traceTone(status: LiveProofRun["traces"][number]["status"]) {
  if (status === "available") return "good";
  if (status === "metadata_only" || status === "pending") return "warn";
  return "idle";
}

function sourceKindLabel(source: LiveProofStep["source"]) {
  if (source === "event_mirror") return "Event mirror";
  if (source === "deterministic") return "Deterministic fallback";
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function sourceTone(source: LiveProofStep["source"]) {
  if (source === "fireworks" || source === "langsmith") return "info";
  if (source === "uipath" || source === "event_mirror") return "good";
  if (source === "human") return "warn";
  return "idle";
}

function riskTone(risk: string) {
  if (risk.toLowerCase() === "high") return "danger";
  if (risk.toLowerCase() === "medium") return "warn";
  return "good";
}

function sourceTitle(evidence?: EvidenceMapping, criterion?: PolicyCriterion) {
  const span = evidence?.source_span ?? criterion?.source_span;
  const source = typeof span === "string" ? span : span?.source_uri;
  if (!source) return "Source pending";
  if (source.includes("lab")) return "Lab Report";
  if (source.includes("medication")) return "Medication History";
  if (source.includes("progress")) return "Progress Note";
  return "Clinical Source";
}

function evidenceLabel(evidence: EvidenceMapping) {
  if (evidence.status === "found") return "Yes";
  if (evidence.status === "needs_human_validation") return "Partial";
  if (evidence.status === "missing") return "Not found";
  return labelize(evidence.status);
}

function statusCopy(evidence?: EvidenceMapping) {
  if (!evidence) return "Not mapped";
  if (evidence.needs_human_review) return "Needs Signoff";
  if (evidence.status === "found") return "Complete";
  if (evidence.status === "missing") return "Blocker";
  return labelize(evidence.status);
}

function confidenceLabel(value: number) {
  if (value >= 0.85) return "High";
  if (value >= 0.6) return "Medium";
  return "Low";
}

function missingEvidenceText(data: DemoState) {
  const missing = data.evidenceMappings.filter(
    (row) => row.status === "missing" || row.needs_human_review,
  );
  if (missing.length === 0) return "No blocking gaps in the current matrix.";
  return missing
    .map((row) => row.human_review_reason ?? row.evidence_summary)
    .join("; ");
}

function denialReasonText(reason: DemoToggles["denial_reason"]) {
  if (reason === "safety_screen") {
    return "Safety screening criteria not met. Missing lab evidence must be attached before appeal submission.";
  }
  if (reason === "medical_necessity") {
    return "Medical necessity criteria not demonstrated with sufficient source-backed rationale.";
  }
  return "Step therapy criteria not met. Documentation must demonstrate inadequate response to preferred alternatives.";
}

function formatSourceReference(
  source:
    EvidenceMapping["source_span"] | PolicyCriterion["source_span"] | undefined,
) {
  if (!source) return "No source reference";
  if (typeof source === "string") return source;
  return [source.source_uri, source.section_label].filter(Boolean).join(" - ");
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

function formatRelativeDue(value: string) {
  const due = new Date(value).getTime();
  const now = new Date().getTime();
  const days = Math.max(1, Math.ceil((due - now) / 86_400_000));
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

createRoot(document.getElementById("root")!).render(<App />);
