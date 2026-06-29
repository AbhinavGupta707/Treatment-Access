# Deck Outline

Target: 8 slides, production-minded, readable in three minutes or as a
five-minute video companion.

## 1. Problem

**Title:** Specialty treatment access is exception-heavy case work

- Prior authorization, missing evidence, payer outages, denials, and appeal
  deadlines create delays after a clinician orders therapy.
- Staff must prove coverage criteria from chart evidence without making
  unsupported clinical claims.
- The cost is operational drag: rework, delays, audit risk, and fragmented
  handoffs.

Visual: one treatment order splitting into payer policy, evidence review,
human approval, submission, denial, appeal, and pharmacy handoff.

## 2. Why Now

**Title:** Agentic automation needs governance, not another chat window

- Agents can extract, map, draft, and summarize, but treatment access needs
  accountable handoffs.
- UiPath can coordinate agents, humans, APIs, robots, and audit events in one
  governed case.
- The demo shows exception handling instead of a happy-path assistant.

Visual: "Agents + humans + robots + APIs" inside a UiPath case boundary.

## 3. Product

**Title:** Treatment Access Command Center

- A synthetic specialty medication order moves from intake to payer approval,
  denial rescue, appeal review, and pharmacy handoff.
- Command Center shows the case, evidence matrix, seven agent outputs, human
  gates, fallback submission, denial rescue, and audit timeline.
- The custom UI visualizes UiPath-written state; UiPath remains the source of
  orchestration and governance.

Visual: screenshot of Command Center with `Live event mirror` and synthetic
case label.

## 4. Architecture

**Title:** UiPath-governed case architecture

- Maestro Case owns stages and exception paths.
- Agent Builder owns seven structured operators.
- API Workflows call synthetic EHR, payer, pharmacy, and event APIs.
- Action Center gates clinician validation and appeal signoff.
- Orchestrator/Robot handles portal fallback when the payer API is unavailable.
- Data Service/event mirror is the state contract consumed by the Command
  Center.

Visual: architecture diagram from UiPath layer to event mirror to Command
Center.

## 5. UiPath Depth

**Title:** Seven agents with distinct jobs

| Agent                | Output to show                            |
| -------------------- | ----------------------------------------- |
| Coverage Requirement | criteria, citations, required documents   |
| Evidence Retrieval   | evidence matrix and confidence            |
| Missing Evidence     | blocking gaps and human task prompt       |
| Submission Packet    | packet fields, attachments, risk warnings |
| Denial Rescue        | denial code, deadline, rescue strategy    |
| Appeal Packet        | cited administrative draft and warnings   |
| Care Continuity      | pharmacy handoff and scheduling task      |

Visual: agent trace strip, not a generic agent cloud.

## 6. Demo Flow

**Title:** Five-minute judge walkthrough

1. Start in UiPath `TreatmentAccessHackathon`.
2. Show Maestro lifecycle and exception stages.
3. Switch to Command Center event mirror.
4. Walk seven agents and evidence matrix.
5. Show clinician/human approval gate.
6. Force payer API `PAYER_API_DOWN`.
7. Show portal fallback and `AVFH-PORTAL-SYN-*` confirmation.
8. Open the proof manifest for folder ID `7986316`, folder key
   `4fba2fa1-012b-469a-b6aa-e5be3811c173`, event/record ID, task ID, job ID,
   confirmation ID, source labels, timestamp, and safety status.
9. Return to robot event, denial rescue, appeal signoff, care handoff, audit.

Visual: timeline with exact screen sequence.

## 7. Safety And Governance

**Title:** Human-controlled clinical and appeal posture

- Synthetic data only.
- Every clinical assertion needs source evidence, policy citation, or human
  approval.
- Missing safety evidence blocks submission.
- Appeal language is an administrative draft for clinician review, not
  autonomous medical or legal advice.
- Live side effects are approval-gated: RPA run/debug, Orchestrator job start,
  solution deploy/activate, Action Center task creation, Data Service writes,
  IXP mutation, and payer submission.

Visual: gate icons for evidence, clinician approval, robot handback, audit.

## 8. Roadmap

**Title:** From hackathon proof to governed deployment

- Complete UIA target indication and approved live robot smoke for the real
  `PayerPortalFallback` RPA project.
- Run approved live smoke for Maestro, Agent Builder, Action Center, Data
  Service, Orchestrator, and solution deployment.
- Add production IXP/Document Understanding extraction where available.
- Expand payer policy library, denial scenarios, and care-continuity handoffs.
- Add operational metrics: time to packet, missing-evidence cycle time, denial
  rescue turnaround, and audit completeness.

Visual: four-stage roadmap: local proof, live UiPath smoke, pilot workflow,
production governance.

## One-Slide Closing Line

"Treatment Access Command Center turns prior authorization into governed case
work: agents gather and draft, humans approve sensitive claims, robots handle
portal exceptions, and UiPath records the whole lifecycle."
