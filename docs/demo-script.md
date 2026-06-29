# Demo Script

Target runtime: 4:35 to 4:55. Use synthetic fixture data only. Start from
UiPath or prove the UiPath-controlled lifecycle before showing the custom
Command Center. The Command Center visualizes UiPath-written case state and
events; it is not the source of truth.

Appeal language is an administrative draft for clinician review. It is not
autonomous medical or legal advice. Every clinical assertion must have source
evidence, a policy citation, or human approval.

## Recording Prep

Run the deterministic local proof before recording:

```bash
CI=true pnpm verify:setup
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint4
```

The Checkpoint 4 smoke proves the local synthetic path without live UiPath side
effects:

1. reset the mock runtime;
2. force the payer API unavailable path;
3. verify the `api_failure_portal_fallback` secondary stage;
4. submit through `channel: "portal_fallback"`;
5. write a synthetic robot fallback event;
6. confirm the event is visible in the Command Center state;
7. confirm the Command Center and Mock Payer Portal build.

Live UiPath actions still require explicit approval before recording: RPA
run/debug, Orchestrator job start, solution upload/publish/deploy/activate,
live Agent Builder debug/run, Maestro debug/run, IXP mutation, Action Center
task creation, Data Service writes, and any payer submission outside the local
synthetic mock.

## Five-Minute Video Run Of Show

| Time      | Screen                                                     | Transition and action                                                                                                                                                       | Narration bullets                                                                                                                                                                                                                                                                                                                                                                                                                                                  | If live step is approval-gated or unavailable                                                                                                                                                                                                                                                     |
| --------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00-0:20 | UiPath Automation Cloud / Orchestrator folder              | Open `TreatmentAccessHackathon`. Show tenant `DefaultTenant`, folder name, and available runtime or solution artifacts.                                                     | "This starts in UiPath, because UiPath is the orchestration and governance layer. The custom app you will see later is a visibility surface over UiPath-authored workflow and event records."                                                                                                                                                                                                                                                                      | "For this recording, live case execution is approval-gated, so I am proving the lifecycle from the UiPath folder and repo artifacts before switching to deterministic local synthetic proof. No live Action Center task, Data Service write, RPA job, or payer submission is being claimed here." |
| 0:20-0:45 | UiPath Maestro / case design or lifecycle artifact         | Show the Treatment Access case stages: intake, policy/evidence, clinical validation, submission, payer decision, denial rescue/appeal, care continuity, audit.              | "Maestro is the outer case. It coordinates agents, API workflows, human approvals, robot fallback, and audit events. Exception stages are first-class: missing evidence, API failure and portal fallback, denial rescue, and human exception review."                                                                                                                                                                                                              | "If the live Maestro instance is not approved for debug, show `uipath/maestro/sdd.md` or the case artifact and say: this is the validated case design waiting on explicit live-run approval."                                                                                                     |
| 0:45-1:05 | Command Center case queue                                  | Switch to the Command Center. Select `TACC-2026-001`. Point to `Live event mirror`, current stage, SLA, synthetic patient disclaimer.                                       | "Now we are in the judge cockpit. This screen reads the same case snapshot and audit stream shape that UiPath API Workflows write. All data is synthetic."                                                                                                                                                                                                                                                                                                         | "The event mirror is local for the demo proof, but it is called by UiPath workflow contracts. The UI does not independently decide case state."                                                                                                                                                   |
| 1:05-1:45 | Agent trace strip and evidence matrix                      | Move left to right through the seven agent cards, then down into the policy-to-evidence matrix.                                                                             | "The agents are distinct operators, not decorative labels. Coverage Requirement extracts payer criteria and citations. Evidence Retrieval maps chart artifacts to each criterion. Missing Evidence blocks unsafe submission and drafts the human task. Submission Packet builds only approved fields. Denial Rescue classifies payer denial strategy. Appeal Packet drafts administrative appeal language. Care Continuity plans pharmacy handoff after approval." | "If live Agent Builder traces are not approved, this view shows the deterministic local agent runtime envelopes validated by `CI=true pnpm smoke:agents`, with the same schemas used by the Agent Builder packets."                                                                               |
| 1:45-2:15 | Action Center / human gate surface or Command Center gates | Show clinician validation gate for high-impact claims and safety evidence. If live Action Center is available, open the task. Otherwise show the Command Center gate panel. | "The system does not autonomously assert medical necessity. High-impact claims need source evidence, policy citation, or a clinician approval event. Missing TB or hepatitis safety screening blocks submission instead of being guessed."                                                                                                                                                                                                                         | "Live Action Center task creation was not run in this recording. The repository includes the Action Center task schemas and local gate proof; task creation remains an explicit approval-gated live step."                                                                                        |
| 2:15-2:45 | Submission panel and API failure state                     | Toggle or show payer API unavailable. Submit the prior-auth packet through the API path. Show `PAYER_API_DOWN` and secondary stage `api_failure_portal_fallback`.           | "The first channel is the payer API. When it returns `PAYER_API_DOWN`, UiPath does not strand the case. Maestro moves into the API failure and portal fallback path, and Orchestrator is the intended owner of the robot job."                                                                                                                                                                                                                                     | "If Orchestrator job start was not approved, say: I am not starting a live robot job here. I will show the deterministic synthetic fallback proof that uses the same payload and confirmation contract."                                                                                          |
| 2:45-3:20 | Mock Payer Portal                                          | Open the Mock Payer Portal. Show synthetic defaults, stable robot-friendly fields, submit, and confirmation `AVFH-PORTAL-SYN-001` or `AVFH-PORTAL-SYN-*`.                   | "This is the synthetic payer portal used for robot fallback. The robot path fills the same prior-auth packet through UI automation when the API channel is down. The confirmation format is `AVFH-PORTAL-SYN-*`, which is written back to the case event stream."                                                                                                                                                                                                  | "In this local proof, the browser submission and smoke event stand in for the approval-gated robot run. It proves the portal contract without claiming a live UiPath RPA job was executed."                                                                                                       |
| 3:20-3:45 | Command Center timeline filtered to Robot                  | Return to Command Center. Filter timeline to Robot. Show `portal_fallback_submitted`, confirmation ID, channel `portal_fallback`, and fallback secondary stage.             | "The important part is the handback. The robot result is not a screenshot sitting outside the process; it becomes a governed event tied to the case, with actor, timestamp, channel, and confirmation."                                                                                                                                                                                                                                                            | "If no live robot event exists, say: this event was written by the local smoke harness using the UiPath event contract; the live robot write remains approval-gated."                                                                                                                             |
| 3:45-4:20 | Denial rescue, appeal packet, clinician signoff            | Show denial reason toggle or denial panel. Show Denial Rescue strategy and Appeal Packet draft with warnings/citations. Show human signoff gate.                            | "If the payer denies, Denial Rescue parses the reason and changes strategy. A step-therapy denial routes to prior therapy evidence; a safety-screen denial routes back to missing evidence. Appeal Packet drafts administrative language with citations and unsupported-claim warnings, then waits for clinician signoff."                                                                                                                                         | "Do not say the appeal was submitted unless a live approved submission has actually run. Use: this draft is ready for clinician review; submission remains blocked until human approval."                                                                                                         |
| 4:20-4:40 | Care continuity and audit timeline                         | Show pharmacy/scheduling handoff and audit packet/timeline.                                                                                                                 | "The case does not end at payer approval. Care Continuity creates the pharmacy and scheduling handoff, and the audit packet records agents, API calls, human gates, robot fallback, and citations."                                                                                                                                                                                                                                                                | "If the handoff API is local-only, say: this is synthetic local proof of the handoff contract, not a live pharmacy transaction."                                                                                                                                                                  |
| 4:40-4:55 | Architecture slide or architecture doc                     | End on architecture: UiPath layer on top, event mirror, custom UI, mock systems, contract layer.                                                                            | "The product is Treatment Access orchestration: UiPath governs the lifecycle; agents produce structured outputs; humans approve sensitive claims; robots handle portal fallback; the Command Center makes the governed case understandable."                                                                                                                                                                                                                       | "Close with the mocked-vs-live statement instead of overclaiming: local synthetic proof is complete; live side-effecting UiPath steps are documented and approval-gated."                                                                                                                         |

## Seven Agent Proof Points

Use this section as the narration checklist while the agent strip is visible.

| Agent                | Visible output to point at                                                       | Safety or governance callout                                            |
| -------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Coverage Requirement | criteria, required documents, submission channels, policy citations              | Coverage claims come from policy citations and source spans.            |
| Evidence Retrieval   | evidence matrix rows, source references, confidence, missing/conflicting flags   | Clinical assertions are mapped to evidence or routed to review.         |
| Missing Evidence     | blocking gaps, assigned role, task prompt, due date, SLA impact                  | Missing safety evidence blocks submission.                              |
| Submission Packet    | structured fields, attachments, cover language, risk warnings, `ready_to_submit` | Packet includes only source-backed or approved claims.                  |
| Denial Rescue        | denial reason, code, appeal deadline, contested criterion, strategy              | Strategy changes by denial type and does not draft appeal prose itself. |
| Appeal Packet        | administrative draft, citations, unsupported-claim warnings, approval task       | Draft cannot be submitted until clinician review/signoff.               |
| Care Continuity      | pharmacy handoff, scheduling task, coordinator notification, closure readiness   | Downstream care handoff follows payer or appeal approval.               |

## Exact Fallback Language

Use these lines verbatim if a live step has not been approved or cannot run.

- Maestro debug/run: "This recording does not run a live Maestro case because
  side-effecting debug is approval-gated. The case design and local event
  contract prove the lifecycle without creating live records."
- Action Center task creation: "I am showing the human-review gate and task
  payload. I am not claiming a live Action Center task was created unless that
  approval has been explicitly granted and verified."
- Data Service writes: "The Command Center reads a local event mirror for this
  proof. In the UiPath design, API Workflows/Data Service writes are the case
  source; no live Data Service write is claimed here."
- Agent Builder debug/run: "These are deterministic local agent traces using
  the same seven output schemas. Live Agent Builder debug remains an
  approval-gated step."
- RPA run or Orchestrator job start: "The robot fallback is represented by the
  synthetic portal contract and event handback. I am not claiming a live
  UiPath RPA job ran unless Orchestrator job evidence is on screen."
- Solution upload/publish/deploy/activate: "The repo contains the solution
  shell and setup path. Deployment remains approval-gated and is not implied by
  this local proof."
- IXP mutation: "Document extraction is designed for IXP/Document Understanding
  where available. The current proof uses the schema-compatible fallback parser
  and preserves source spans."
- Payer submission: "All submissions in this video use the local synthetic mock
  payer. No real payer, patient, provider, credential, or PHI is used."

## Do Not Say

- Do not say live deployment, solution activation, Action Center task creation,
  Data Service write, RPA job execution, IXP project mutation, or payer
  submission happened unless it is documented as actually run.
- Do not describe appeal text as medical advice, legal advice, final clinical
  judgment, or autonomous payer communication.
- Do not imply the Command Center itself advances case state. Say it visualizes
  UiPath-written state and events.
