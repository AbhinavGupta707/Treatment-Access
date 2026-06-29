# Demo Script

Target runtime: 4:35 to 4:55. Use synthetic fixture data only. Start on the
beautiful product dashboard, then drill into case, evidence, appeal, fallback,
and audit proof only as needed. The Command Center visualizes UiPath-written
case state and events; it is not the source of truth.

Lead with healthcare value before architecture: less manual chart review, fewer
preventable denials, faster PA submission, safer appeal prep, auditable human
gates, and UiPath-governed execution. Then show the technical proof that backs
those claims.

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

Run the Checkpoint 7 demo-readiness gate after the live-proof lanes are merged:

```bash
CI=true pnpm smoke:checkpoint7-live-proof
```

This is a static no-side-effect smoke. It verifies that value claims are paired
with scripts, screenshots, logs, captured evidence, or explicit caveats before a
recording treats them as demo-ready.

Run the Checkpoint 8 final readiness gate before recording:

```bash
CI=true pnpm smoke:checkpoint8-live-uipath
```

This is also a no-side-effect smoke. It verifies the final Command Center proof
manifest and the wording boundary between Local Synthetic Proof, live provider
proof, and Live UiPath Proof. It does not create Action Center tasks, Data
Service records, Orchestrator jobs, deployments, robot runs, or payer
submissions. The approved live UiPath closeout is documented separately in
`docs/live-uipath-proof-closeout.md`.

The Checkpoint 4 smoke proves the local synthetic path without live UiPath side
effects:

1. reset the mock runtime;
2. force the payer API unavailable path;
3. verify the `api_failure_portal_fallback` secondary stage;
4. submit through `channel: "portal_fallback"`;
5. write a synthetic robot fallback event;
6. confirm the event is visible in the Command Center state;
7. confirm the Command Center and Mock Payer Portal build.

Future live UiPath actions still require explicit approval before recording.
The approved final proof already created Data Fabric proof records, published
and activated the solution, and ran one scaffold-only Orchestrator job. Do not
claim live Action Center task creation, portal UI automation, live Agent Builder
debug/run, Maestro debug/run, IXP mutation, or any payer submission outside the
local synthetic mock.

## Five-Minute Video Run Of Show

| Time      | Screen                                                     | Transition and action                                                                                                                                                                                                                                            | Narration bullets                                                                                                                                                                                                                                                                                                                                              | If live step is approval-gated or unavailable                                                                                                                                                                                                                                         |
| --------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00-0:25 | Command Center dashboard                                   | Start on the product dashboard. Show priority KPIs, urgent case, case queue, SLA risk, and synthetic-data disclosure.                                                                                                                                            | "This is Treatment Access Command Center: a governed operations cockpit for specialty medication access. It is designed to reduce manual chart review, prevent avoidable denials, speed prior authorization submission, make appeal prep safer, and preserve auditable human gates. All data is synthetic."                                                    | "The dashboard is the product view over the governed case stream. It does not independently advance live case state."                                                                                                                                                                 |
| 0:25-0:50 | Case detail for `TACC-2026-001`                            | Open the featured urgent case. Point to current stage, owner, next best action, timeline, and UiPath-governed source label.                                                                                                                                      | "This case is not a generic chat session. It is a treatment-access lifecycle with policy evidence, clinical validation, submission, fallback, denial rescue, appeal, and care handoff. UiPath is the orchestration and governance layer; the Command Center makes the state readable."                                                                         | "If the live event mirror is not connected, say: this recording uses deterministic local synthetic state shaped like the UiPath-written event records; no live UiPath write is being claimed."                                                                                        |
| 0:50-1:20 | Evidence matrix                                            | Drill into policy criteria, source spans, confidence, missing/conflicting flags, and unsupported-claim warnings.                                                                                                                                                 | "The evidence matrix is where the workflow becomes safe. Coverage requirements are tied to payer citations, and clinical assertions are tied to source evidence or routed to human approval. Missing TB or hepatitis safety screening blocks submission instead of being guessed."                                                                             | "If live retrieval is unavailable, say: this is the deterministic local evidence contract validated by smoke tests; live model retrieval is claimed only after provider smoke and trace evidence succeed."                                                                            |
| 1:20-1:50 | Agent activity / trace drawer                              | Show seven agent actors and, if available, a LangSmith trace link or read-only provider smoke evidence.                                                                                                                                                          | "The agents are distinct operators, not decorative labels. Coverage Requirement extracts criteria. Evidence Retrieval maps chart artifacts. Missing Evidence drafts review gates. Submission Packet builds approved fields. Denial Rescue changes strategy. Appeal Packet drafts administrative language for clinician review. Care Continuity plans handoff." | "If live Fireworks or LangSmith proof is not available, say: this view shows deterministic local agent envelopes validated by `CI=true pnpm smoke:agents`. Live LLM and trace claims require `CI=true pnpm smoke:checkpoint6-live-providers` and captured evidence."                  |
| 1:50-2:20 | Action Center / human gate surface or Command Center gates | Show clinician validation gate for high-impact claims and safety evidence. If live Action Center is available, show the live read surface. Otherwise show the Command Center gate panel.                                                                         | "The system does not autonomously assert medical necessity. High-impact claims need source evidence, policy citation, or a clinician approval event. Appeal language remains an administrative draft until a clinician signs off."                                                                                                                             | "The live Action Center users/tasks surface was verified, but this CLI does not expose task creation. I am not claiming a live Action Center task ID."                                                                                                                                |
| 2:20-2:50 | Submission panel and API failure state                     | Toggle or show payer API unavailable. Submit the prior-auth packet through the API path. Show `PAYER_API_DOWN` and secondary stage `api_failure_portal_fallback`.                                                                                                | "The first channel is the payer API. When it returns `PAYER_API_DOWN`, UiPath does not strand the case. Maestro moves into the API failure and portal fallback path, and Orchestrator is the governed owner of robot execution."                                                                                                                               | "A live Orchestrator job completed for the deployed `PayerPortalFallback` process. The current XAML is scaffold-only, so I am not claiming browser portal UI automation or a portal confirmation write-back from that job."                                                           |
| 2:50-3:20 | Mock Payer Portal                                          | Open the Mock Payer Portal. Show synthetic defaults, stable robot-friendly fields, submit, and confirmation `AVFH-PORTAL-SYN-001` or `AVFH-PORTAL-SYN-*`.                                                                                                        | "This is the synthetic payer portal used for robot fallback. The target fields are stable for UI automation, and the confirmation format is `AVFH-PORTAL-SYN-*`, which the production-hardening step would write back to the case event stream."                                                                                                               | "The local portal form and confirmation contract are proven. The live Orchestrator job proves UiPath deployment and execution, but not browser UI automation yet."                                                                                                                    |
| 3:20-3:45 | Command Center timeline filtered to Robot                  | Return to Command Center. Filter timeline to Robot. Show local `portal_fallback_submitted` evidence when present, and then open the live proof manifest.                                                                                                         | "The important part is the handback. Robot results must become governed events tied to the case, with actor, timestamp, channel, and confirmation. The final proof drawer separates the local portal contract from the live scaffold job evidence."                                                                                                            | "No live portal confirmation event exists yet. The live proof is Orchestrator job completion plus Data Fabric proof records, not a completed portal submission."                                                                                                                      |
| 3:45-4:15 | Denial rescue, appeal packet, clinician signoff            | Show denial reason toggle or denial panel. Show Denial Rescue strategy and Appeal Packet draft with warnings/citations. Show human signoff gate.                                                                                                                 | "If the payer denies, Denial Rescue parses the reason and changes strategy. A step-therapy denial routes to prior therapy evidence; a safety-screen denial routes back to missing evidence. Appeal Packet drafts administrative language with citations and unsupported-claim warnings, then waits for clinician signoff."                                     | "Do not say the appeal was submitted unless a live approved submission has actually run. Use: this draft is ready for clinician review; submission remains blocked until human approval."                                                                                             |
| 4:15-4:35 | UiPath governance / proof manifest                         | Open the proof manifest drawer and/or `docs/live-uipath-proof-closeout.md`. Show `TreatmentAccessHackathon`, folder ID `7986316`, folder key `4fba2fa1-012b-469a-b6aa-e5be3811c173`, Data Fabric record ID, deployment ID, job ID, timestamp, and safety status. | "The product view is clean because the governance layer is underneath it. UiPath owns the proof trail: Data Fabric records, a published and activated solution, and a completed Orchestrator job. Where a live task, portal confirmation, or UI automation has not run, the product says so instead of pretending."                                            | "For this recording, we are claiming live Data Fabric, solution lifecycle, and Orchestrator job evidence. We are not claiming live Action Center task creation, portal UI automation, a portal confirmation write-back, or real payer submission."                                    |
| 4:35-4:55 | Architecture slide or architecture doc                     | End on architecture: UiPath layer on top, event mirror, custom UI, mock systems, contract layer.                                                                                                                                                                 | "Treatment Access Command Center is not a prettier form. It is UiPath-governed access orchestration: agents produce structured outputs, humans approve sensitive claims, robots handle portal fallback, and the Command Center makes the governed case understandable."                                                                                        | "Close with the mocked-vs-live statement instead of overclaiming: local synthetic product flow is complete; live provider proof is available; live UiPath proof covers Data Fabric, solution lifecycle, and one Orchestrator job, with remaining production-hardening clearly named." |

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
- Action Center task creation: "The live users/tasks read surface was verified,
  but the installed CLI exposes no task-create command. I am not claiming a
  live Action Center task ID."
- Data Service/Data Fabric writes: "For the final proof, UiPath Data Fabric
  contains synthetic proof records. The customer workflow still uses synthetic
  data only and does not write real PHI."
- Agent Builder debug/run: "These are deterministic local agent traces using
  the same seven output schemas. Live Agent Builder debug remains an
  approval-gated step."
- RPA run or Orchestrator job start: "A live Orchestrator job completed for the
  deployed `PayerPortalFallback` process. The current XAML is scaffold-only, so
  I am not claiming browser portal UI automation."
- Solution publish/deploy/activate: "The UiPath solution was published,
  deployed, and activated in the `TreatmentAccessHackathon` folder; the
  deployment ID is in the live proof closeout."
- IXP mutation: "Document extraction is designed for IXP/Document Understanding
  where available. The current proof uses the schema-compatible fallback parser
  and preserves source spans."
- Payer submission: "All submissions in this video use the local synthetic mock
  payer. No real payer, patient, provider, credential, or PHI is used."

## Do Not Say

- Do not say Action Center task creation, portal UI automation, IXP project
  mutation, or payer submission happened. Live Data Fabric proof writes,
  solution deployment/activation, and one scaffold Orchestrator job are
  documented as actually run.
- Do not describe appeal text as medical advice, legal advice, final clinical
  judgment, or autonomous payer communication.
- Do not imply the Command Center itself advances case state. Say it visualizes
  UiPath-written state and events.
