import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type PriorAuthFormValues = {
  caseId: string;
  orderId: string;
  memberId: string;
  payer: string;
  medication: string;
  diagnosis: string;
  evidenceAttachment: string;
  evidenceSummary: string;
};

type FallbackStageId =
  "api_unavailable" | "robot_requested" | "confirmation_received";

type MirrorEventSemantic = {
  stageId: FallbackStageId;
  action: string;
  actorType: "api_workflow" | "robot";
  source: "mock_api_event_mirror" | "uipath_robot_event";
  summary: string;
};

const syntheticSubmissionDefaults: PriorAuthFormValues = {
  caseId: "case-syn-001",
  orderId: "order-syn-001",
  memberId: "SYN-MEMBER-001",
  payer: "Northstar Health Plan",
  medication: "Fictionalimab",
  diagnosis: "Moderate-to-severe inflammatory bowel disease",
  evidenceAttachment:
    "artifact-progress-note, artifact-med-history, artifact-safety-labs",
  evidenceSummary:
    "Synthetic evidence packet assembled by UiPath for clinician-reviewed prior authorization. Demo use only.",
};

const portalReceipt = {
  confirmationId: "AVFH-PORTAL-SYN-001",
  status: "Submitted - pending payer review",
  submittedAt: "2026-06-29T09:00:00.000Z",
  robotRunId: "robot-fallback-demo-001",
};

const apiUnavailableEvent: MirrorEventSemantic = {
  stageId: "api_unavailable",
  action: "payer_prior_auth_unavailable",
  actorType: "api_workflow",
  source: "mock_api_event_mirror",
  summary: "Payer API is unavailable; portal fallback is required.",
};

const robotRequestedEvent: MirrorEventSemantic = {
  stageId: "robot_requested",
  action: "robot_fallback_requested",
  actorType: "robot",
  source: "uipath_robot_event",
  summary: "UiPath robot fallback request prepared; no live job started.",
};

const confirmationReceivedEvent: MirrorEventSemantic = {
  stageId: "confirmation_received",
  action: "payer_portal_fallback_submitted",
  actorType: "robot",
  source: "uipath_robot_event",
  summary: "Synthetic portal confirmation received for the fallback path.",
};

function readFormValues(form: HTMLFormElement): PriorAuthFormValues {
  const formData = new FormData(form);

  return {
    caseId: String(
      formData.get("caseId") ?? syntheticSubmissionDefaults.caseId,
    ),
    orderId: String(
      formData.get("orderId") ?? syntheticSubmissionDefaults.orderId,
    ),
    memberId: String(
      formData.get("memberId") ?? syntheticSubmissionDefaults.memberId,
    ),
    payer: String(formData.get("payer") ?? syntheticSubmissionDefaults.payer),
    medication: String(
      formData.get("medication") ?? syntheticSubmissionDefaults.medication,
    ),
    diagnosis: String(
      formData.get("diagnosis") ?? syntheticSubmissionDefaults.diagnosis,
    ),
    evidenceAttachment: String(
      formData.get("evidenceAttachment") ??
        syntheticSubmissionDefaults.evidenceAttachment,
    ),
    evidenceSummary: String(
      formData.get("evidenceSummary") ??
        syntheticSubmissionDefaults.evidenceSummary,
    ),
  };
}

function Field({
  label,
  name,
  value,
  testId,
  uiPath,
  className,
}: {
  label: string;
  name: keyof PriorAuthFormValues;
  value: string;
  testId: string;
  uiPath: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      <input
        name={name}
        defaultValue={value}
        data-testid={testId}
        data-uipath={uiPath}
        autoComplete="off"
      />
    </label>
  );
}

function StageBadge({ submitted }: { submitted: boolean }) {
  const stage = submitted ? confirmationReceivedEvent : robotRequestedEvent;

  return (
    <section
      className="stage-badge"
      data-testid="fallback-stage"
      data-uipath="fallback-stage"
      data-stage-id={stage.stageId}
      data-mirror-action={stage.action}
      data-actor-type={stage.actorType}
      aria-label="Current portal fallback stage"
    >
      <span>{submitted ? "Confirmation received" : "Robot requested"}</span>
      <strong>{stage.action}</strong>
      <p>{stage.summary}</p>
    </section>
  );
}

function StatusRail({ submitted }: { submitted: boolean }) {
  const steps = [
    {
      label: "API unavailable",
      value: "payer_prior_auth_unavailable",
      state: "complete",
      event: apiUnavailableEvent,
    },
    {
      label: "Robot requested",
      value: "robot_fallback_requested",
      state: submitted ? "complete" : "current",
      event: robotRequestedEvent,
    },
    {
      label: "Confirmation received",
      value: submitted
        ? portalReceipt.confirmationId
        : "Awaiting portal submit",
      state: submitted ? "complete" : "pending",
      event: confirmationReceivedEvent,
    },
  ];

  return (
    <aside className="status-rail" aria-label="Submission fallback status">
      <div className="rail-heading">
        <span>Synthetic fallback route</span>
        <strong>Automation target</strong>
      </div>
      <ol>
        {steps.map((step) => (
          <li
            className={step.state}
            key={step.event.stageId}
            data-testid={`stage-${step.event.stageId}`}
            data-uipath={`stage-${step.event.stageId}`}
            data-stage-id={step.event.stageId}
            data-mirror-action={step.event.action}
            data-actor-type={step.event.actorType}
            data-source={step.event.source}
          >
            <span aria-hidden="true" />
            <div>
              <strong>{step.label}</strong>
              <small>{step.value}</small>
            </div>
          </li>
        ))}
      </ol>
      <p>
        Synthetic demo portal. No real patient, provider, payer, credential, or
        health data may be entered.
      </p>
    </aside>
  );
}

function Confirmation({ values }: { values: PriorAuthFormValues }) {
  const confirmationEvent = confirmationReceivedEvent;

  return (
    <section
      className="confirmation"
      data-testid="portal-confirmation"
      data-uipath="portal-confirmation"
      data-stage-id={confirmationEvent.stageId}
      data-mirror-action={confirmationEvent.action}
      data-confirmation-id={portalReceipt.confirmationId}
      aria-labelledby="confirmation-title"
    >
      <div className="receipt-banner">
        <span>Confirmation received</span>
        <strong data-testid="submission-status" data-uipath="submission-status">
          {portalReceipt.status}
        </strong>
      </div>
      <h1 id="confirmation-title">Prior authorization receipt</h1>
      <dl className="receipt-grid">
        <div>
          <dt>Confirmation ID</dt>
          <dd data-testid="confirmation-id" data-uipath="confirmation-id">
            {portalReceipt.confirmationId}
          </dd>
        </div>
        <div>
          <dt>Case ID</dt>
          <dd data-testid="confirmation-case-id">{values.caseId}</dd>
        </div>
        <div>
          <dt>Order ID</dt>
          <dd data-testid="confirmation-order-id">{values.orderId}</dd>
        </div>
        <div>
          <dt>Robot run</dt>
          <dd data-testid="robot-run-id" data-uipath="robot-run-id">
            {portalReceipt.robotRunId}
          </dd>
        </div>
        <div>
          <dt>Mirror event</dt>
          <dd
            data-testid="mirror-event-action"
            data-uipath="mirror-event-action"
          >
            {confirmationEvent.action}
          </dd>
        </div>
      </dl>
      <div className="receipt-summary">
        <strong>{values.medication}</strong>
        <span>{values.diagnosis}</span>
        <small>{values.evidenceAttachment}</small>
      </div>
      <p className="receipt-footnote">
        Deterministic local confirmation for UiPath RPA fallback testing. This
        is not a real payer submission.
      </p>
    </section>
  );
}

function App() {
  const [submittedValues, setSubmittedValues] =
    useState<PriorAuthFormValues | null>(null);

  return (
    <main className="portal">
      <section
        className="app-shell"
        aria-label="Mock payer prior authorization portal"
      >
        <header className="portal-header">
          <div>
            <span>Northstar Health Plan</span>
            <strong>Prior Authorization Portal</strong>
          </div>
          <p>Synthetic-only local demo</p>
        </header>

        <div className="workspace">
          <StatusRail submitted={submittedValues !== null} />

          {submittedValues ? (
            <Confirmation values={submittedValues} />
          ) : (
            <form
              className="prior-auth-form"
              data-testid="prior-auth-form"
              data-uipath="prior-auth-form"
              data-stage-id="robot_requested"
              data-mirror-action="robot_fallback_requested"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedValues(readFormValues(event.currentTarget));
              }}
            >
              <div className="form-title">
                <div>
                  <span>Portal fallback entry</span>
                  <h1>Synthetic prior authorization</h1>
                </div>
                <strong>Robot requested</strong>
              </div>

              <StageBadge submitted={false} />

              <div className="form-grid">
                <Field
                  label="Case ID"
                  name="caseId"
                  value={syntheticSubmissionDefaults.caseId}
                  testId="case-id-input"
                  uiPath="case-id"
                />
                <Field
                  label="Order ID"
                  name="orderId"
                  value={syntheticSubmissionDefaults.orderId}
                  testId="order-id-input"
                  uiPath="order-id"
                />
                <Field
                  label="Member ID"
                  name="memberId"
                  value={syntheticSubmissionDefaults.memberId}
                  testId="member-id-input"
                  uiPath="member-id"
                />
                <Field
                  label="Payer"
                  name="payer"
                  value={syntheticSubmissionDefaults.payer}
                  testId="payer-input"
                  uiPath="payer"
                />
                <Field
                  label="Medication"
                  name="medication"
                  value={syntheticSubmissionDefaults.medication}
                  testId="medication-input"
                  uiPath="medication"
                />
                <Field
                  label="Diagnosis"
                  name="diagnosis"
                  value={syntheticSubmissionDefaults.diagnosis}
                  testId="diagnosis-input"
                  uiPath="diagnosis"
                />
                <Field
                  className="span-full"
                  label="Evidence attachment IDs"
                  name="evidenceAttachment"
                  value={syntheticSubmissionDefaults.evidenceAttachment}
                  testId="evidence-attachment-input"
                  uiPath="evidence-attachment"
                />
                <label className="span-full">
                  <span>Evidence summary</span>
                  <textarea
                    name="evidenceSummary"
                    defaultValue={syntheticSubmissionDefaults.evidenceSummary}
                    data-testid="evidence-summary-input"
                    data-uipath="evidence-summary"
                  />
                </label>
              </div>

              <div className="action-bar">
                <span>
                  Confirmation is created only after portal submit:
                  {" " + portalReceipt.confirmationId}
                </span>
                <button
                  type="submit"
                  data-testid="submit-prior-auth"
                  data-uipath="submit-prior-auth"
                >
                  Submit prior authorization
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
