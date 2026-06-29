# Demo Script

Target runtime: 4:35 to 4:55. Use synthetic fixture data only. Start on the
beautiful product dashboard, then drill into case, evidence, appeal, fallback,
and audit proof only as needed. The Command Center visualizes UiPath-written
case state and events; it is not the source of truth.

Appeal language is an administrative draft for clinician review. It is not
autonomous medical or legal advice. Every clinical assertion must have source
evidence, a policy citation, or human approval.

## Recording Prep

Run the deterministic local proof before recording:

```bash
CI=true pnpm verify:setup
CI=true pnpm smoke:checkpoint6-readiness
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint4
```

Run live provider proof only after Fireworks and LangSmith keys are configured:

```bash
CI=true pnpm smoke:checkpoint6-live-providers
```

This command performs read-only provider checks. It does not create live UiPath
records, start jobs, create tasks, write Data Service records, deploy solutions,
or submit payer packets.

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

| Time      | Screen                                                     | Transition and action                                                                                                                                                       | Narration bullets                                                                                                                                                                                                                                                                                                                                              | If live step is approval-gated or unavailable                                                                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0:00-0:25 | Command Center dashboard                                   | Start on the product dashboard. Show priority KPIs, urgent case, case queue, SLA risk, and synthetic-data disclosure.                                                       | "This is Treatment Access Command Center: a governed operations cockpit for specialty medication access. The screen starts with what the access team needs to know today: which cases are at risk, why they are blocked, and what action should happen next. All data is synthetic."                                                                           | "The dashboard is the product view over the governed case stream. It does not independently advance live case state."                                                                                                                                                                            |
| 0:25-0:50 | Case detail for `TACC-2026-001`                            | Open the featured urgent case. Point to current stage, owner, next best action, timeline, and UiPath-governed source label.                                                 | "This case is not a generic chat session. It is a treatment-access lifecycle with policy evidence, clinical validation, submission, fallback, denial rescue, appeal, and care handoff. UiPath is the orchestration and governance layer; the Command Center makes the state readable."                                                                         | "If the live event mirror is not connected, say: this recording uses deterministic local synthetic state shaped like the UiPath-written event records; no live UiPath write is being claimed."                                                                                                   |
| 0:50-1:20 | Evidence matrix                                            | Drill into policy criteria, source spans, confidence, missing/conflicting flags, and unsupported-claim warnings.                                                            | "The evidence matrix is where the workflow becomes safe. Coverage requirements are tied to payer citations, and clinical assertions are tied to source evidence or routed to human approval. Missing TB or hepatitis safety screening blocks submission instead of being guessed."                                                                             | "If live retrieval is unavailable, say: this is the deterministic local evidence contract validated by smoke tests; live model retrieval is claimed only after provider smoke and trace evidence succeed."                                                                                       |
| 1:20-1:50 | Agent activity / trace drawer                              | Show seven agent actors and, if available, a LangSmith trace link or read-only provider smoke evidence.                                                                     | "The agents are distinct operators, not decorative labels. Coverage Requirement extracts criteria. Evidence Retrieval maps chart artifacts. Missing Evidence drafts review gates. Submission Packet builds approved fields. Denial Rescue changes strategy. Appeal Packet drafts administrative language for clinician review. Care Continuity plans handoff." | "If live Fireworks or LangSmith proof is not available, say: this view shows deterministic local agent envelopes validated by `CI=true pnpm smoke:agents`. Live LLM and trace claims require `CI=true pnpm smoke:checkpoint6-live-providers` and captured evidence."                             |
| 1:50-2:20 | Action Center / human gate surface or Command Center gates | Show clinician validation gate for high-impact claims and safety evidence. If live Action Center is available, open the task. Otherwise show the Command Center gate panel. | "The system does not autonomously assert medical necessity. High-impact claims need source evidence, policy citation, or a clinician approval event. Appeal language remains an administrative draft until a clinician signs off."                                                                                                                             | "Live Action Center task creation was not run in this recording. The repository includes the Action Center task schemas and local gate proof; task creation remains an explicit approval-gated live step."                                                                                       |
| 2:20-2:50 | Submission panel and API failure state                     | Toggle or show payer API unavailable. Submit the prior-auth packet through the API path. Show `PAYER_API_DOWN` and secondary stage `api_failure_portal_fallback`.           | "The first channel is the payer API. When it returns `PAYER_API_DOWN`, UiPath does not strand the case. Maestro moves into the API failure and portal fallback path, and Orchestrator is the intended owner of the robot job."                                                                                                                                 | "If Orchestrator job start was not approved, say: I am not starting a live robot job here. I will show the deterministic synthetic fallback proof that uses the same payload and confirmation contract."                                                                                         |
| 2:50-3:20 | Mock Payer Portal                                          | Open the Mock Payer Portal. Show synthetic defaults, stable robot-friendly fields, submit, and confirmation `AVFH-PORTAL-SYN-001` or `AVFH-PORTAL-SYN-*`.                   | "This is the synthetic payer portal used for robot fallback. The robot path fills the same prior-auth packet through UI automation when the API channel is down. The confirmation format is `AVFH-PORTAL-SYN-*`, which is written back to the case event stream."                                                                                              | "In this local proof, the browser submission and smoke event stand in for the approval-gated robot run. It proves the portal contract without claiming a live UiPath RPA job was executed."                                                                                                      |
| 3:20-3:45 | Command Center timeline filtered to Robot                  | Return to Command Center. Filter timeline to Robot. Show `portal_fallback_submitted`, confirmation ID, channel `portal_fallback`, and fallback secondary stage.             | "The important part is the handback. The robot result is not a screenshot sitting outside the process; it becomes a governed event tied to the case, with actor, timestamp, channel, and confirmation."                                                                                                                                                        | "If no live robot event exists, say: this event was written by the local smoke harness using the UiPath event contract; the live robot write remains approval-gated."                                                                                                                            |
| 3:45-4:15 | Denial rescue, appeal packet, clinician signoff            | Show denial reason toggle or denial panel. Show Denial Rescue strategy and Appeal Packet draft with warnings/citations. Show human signoff gate.                            | "If the payer denies, Denial Rescue parses the reason and changes strategy. A step-therapy denial routes to prior therapy evidence; a safety-screen denial routes back to missing evidence. Appeal Packet drafts administrative language with citations and unsupported-claim warnings, then waits for clinician signoff."                                     | "Do not say the appeal was submitted unless a live approved submission has actually run. Use: this draft is ready for clinician review; submission remains blocked until human approval."                                                                                                        |
| 4:15-4:35 | UiPath governance / audit proof                            | Open the audit drawer, architecture panel, or UiPath folder evidence. Show `TreatmentAccessHackathon`, case stages, events, and approval gates.                             | "The product view is clean because the governance layer is underneath it. UiPath coordinates the lifecycle, agents, API workflows, human gates, robot fallback, and audit events. Exception stages are first-class: missing evidence, API failure, portal fallback, denial rescue, and human exception review."                                                | "For this recording, live case execution is approval-gated, so I am proving the lifecycle from the UiPath folder and repo artifacts plus deterministic local proof. No live Action Center task, Data Service write, RPA job, or payer submission is being claimed unless evidence is on screen." |
| 4:35-4:55 | Architecture slide or architecture doc                     | End on architecture: UiPath layer on top, event mirror, custom UI, mock systems, contract layer.                                                                            | "Treatment Access Command Center is not a prettier form. It is UiPath-governed access orchestration: agents produce structured outputs, humans approve sensitive claims, robots handle portal fallback, and the Command Center makes the governed case understandable."                                                                                        | "Close with the mocked-vs-live statement instead of overclaiming: local synthetic proof is complete; live provider proof is claimed only after smoke; live side-effecting UiPath steps are documented and approval-gated."                                                                       |

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
