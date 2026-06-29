# Devpost Submission Package

Use this as the final answer bank and checklist for the UiPath AgentHack 2026
Devpost submission. Keep the live-vs-local wording intact unless a later
approved run actually changes the project status.

## Title And Tagline

Title: Treatment Access Command Center

Tagline: UiPath-governed specialty-medication access, from policy evidence to
portal fallback, denial rescue, clinician-reviewed appeal, and care handoff.

Short description:

Treatment Access Command Center turns prior authorization into a governed
UiPath case. Seven agents assemble policy requirements, source-ground chart
evidence, block missing evidence, draft packet and appeal materials for human
review, and coordinate downstream care while UiPath keeps the audit trail across
agents, APIs, humans, robots, and workflows.

## Healthcare Value First

Treatment Access Command Center is built to deliver less manual chart review,
fewer preventable denials, faster PA submission, safer appeal prep, auditable
human gates, and UiPath-governed execution. In the demo, those claims should be
paired with actual scripts, smoke commands, screenshots, logs, captured
evidence, or explicit caveats. Do not lead with architecture until the value to
access teams, clinicians, and patients is clear.

## Final Proof Boundary

Keep these proof types separate in the Devpost text, video narration, and judge
walkthrough:

| Proof type            | Evidence to show                                                                                                                                       | Claim boundary                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local Synthetic Proof | Local Command Center, mock healthcare API, mock payer portal, deterministic agent runtime, screenshots, and smokes.                                    | Proves the workflow semantics with synthetic data only.                                                                                                                                                                                                                                                                                                                 |
| Live Provider Proof   | Fireworks/LangSmith readiness or traces after provider smoke passes.                                                                                   | Does not imply UiPath task, job, record, deployment, or payer submission.                                                                                                                                                                                                                                                                                               |
| Live UiPath Proof     | `TreatmentAccessHackathon` folder evidence with event/record ID, task ID, job ID, solution deployment ID, timestamp, source labels, and safety status. | Claim only the live pieces documented in `docs/live-uipath-proof-closeout.md`: Data Fabric proof records, one completed Action Center ExternalTask, solution publish/deploy/activation, one Orchestrator job, and Maestro debug proof up to the HITL boundary. Do not claim portal UI automation, live Agent Builder execution, IXP mutation, or real payer submission. |

## Inspiration

Prior authorization is not just a form problem. It is a coordination problem
across payer rules, chart evidence, clinical review, submission channels, denial
reasoning, appeals, and treatment handoff. Staff often spend time rebuilding the
same context after every exception, and clinicians can be asked to sign language
without a clear link to the chart or policy.

We wanted to show a better operating model: UiPath as the governed case layer,
with specialized agents and automations doing the repetitive assembly work while
humans remain accountable for clinical assertions and appeal signoff.

## What It Does

- Starts with a synthetic specialty-medication order.
- Hydrates a synthetic patient/order/payer snapshot through the mock healthcare
  API.
- Resolves payer authorization criteria and required evidence.
- Maps chart artifacts to a policy-to-evidence matrix with citations, source
  spans, confidence, and human-review flags.
- Blocks submission when required evidence is missing, such as safety screening.
- Builds a submission packet only after evidence and clinician gates are ready.
- Demonstrates payer API failure and a portal fallback path through a mock payer
  portal.
- Parses denial/RFI scenarios and changes the rescue strategy based on denial
  reason.
- Drafts administrative appeal language for clinician review, with unsupported
  claim warnings.
- Shows approval-to-pharmacy/scheduling handoff instead of ending at payer
  approval.
- Preserves an audit timeline with agents, humans, robots, workflows, and source
  evidence references.

## How We Built It

The repo is a TypeScript/pnpm monorepo with shared schemas used by the local
apps, mock API, deterministic agent runtime, and UiPath handoff artifacts.

Core implementation pieces:

- `apps/command-center`: Vite/React operational cockpit for judges.
- `apps/mock-payer-portal`: automation-friendly local portal for RPA fallback.
- `services/mock-healthcare-api`: Fastify API for synthetic EHR, payer,
  pharmacy, demo toggles, and event mirror behavior.
- `packages/shared-schemas`: Zod contracts for cases, evidence, agent outputs,
  submissions, decisions, appeals, tasks, traces, and audit events.
- `packages/demo-data`: synthetic patient, policy, document, denial, and event
  fixtures.
- `packages/agent-runtime`: deterministic local seven-agent runtime used by
  smoke tests.
- `uipath/**`: Maestro, API Workflow, Action Center, Data Service, Agent
  Builder, RPA, and solution artifacts/runbooks.
- `scripts/**`: setup, seed, reset, and smoke verification.

## UiPath Components

| Component                  | How it is used                                                                               | Current proof                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Maestro Case               | Coordinates the treatment access lifecycle and secondary exception stages.                   | SDD and case lifecycle documented under `uipath/maestro`.                                                                                              |
| Agent Builder              | Hosts seven domain agents with distinct contracts and visible trace payloads.                | Local Agent Builder packets exist; static `uip agent validate` was recorded during Checkpoint 3.                                                       |
| API Workflows              | Calls mock EHR, payer, pharmacy, and event mirror endpoints.                                 | Workflow JSON artifacts exist and Checkpoint 2 validation was recorded.                                                                                |
| Action Center              | Holds clinician evidence approval, appeal signoff, and exception review gates.               | Live ExternalTask `4401667` was created, assigned, completed, and read back in `TreatmentAccessHackathon` with synthetic clinician-attestation output. |
| Data Service/Data Fabric   | Stores case, evidence, task, decision, appeal, and audit shapes in the intended live system. | Live folder-scoped `TreatmentAccessProofEvent` entity and four synthetic proof records were created in `TreatmentAccessHackathon`.                     |
| Orchestrator               | Provides folder, runtime, assets, logs, and robot job governance.                            | Solution folder/process/machine assignment are live; job `6d9b9fa9-f582-4983-98fa-167e87d57f2a` completed successfully.                                |
| Assistant/Robot            | Executes the payer portal fallback when payer API is unavailable.                            | `PayerPortalFallback` is deployed and job-runnable; current `Main.xaml` is scaffold-only, so captured portal UI automation is not claimed.             |
| IXP/Document Understanding | Preferred production extraction path for policies, chart evidence, and denial letters.       | Service is reachable, but local CLI lacks `uip ixp`; fallback parser preserves source spans and confidence.                                            |
| UiPath Apps                | Intended case intake/operator surface.                                                       | Intake contracts and launch workflow documentation exist.                                                                                              |
| Solutions                  | Packages the live UiPath project boundary.                                                   | Published, deployed, and activated as `treatment-access-command-center@1.0.20260629` with deployment `46ec1e63-3b09-4308-8b44-ed4b65e4e7f7`.           |

## Seven-Agent Story

| Agent                      | Devpost wording                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Coverage Requirement Agent | Reads payer policy context and outputs authorization requirement, criteria, required documents, channels, citations, and source spans. |
| Evidence Retrieval Agent   | Pulls synthetic chart artifacts and maps them to policy criteria with confidence and review flags.                                     |
| Missing Evidence Agent     | Stops unsafe submission by detecting blocking gaps and drafting human task payloads.                                                   |
| Submission Packet Agent    | Builds payer packet fields and attachment lists only after evidence and clinician gates are satisfied.                                 |
| Denial Rescue Agent        | Parses the denial/RFI reason and selects a strategy that changes across step therapy, safety screen, and documentation-gap scenarios.  |
| Appeal Packet Agent        | Drafts administrative appeal content for clinician review with citations and unsupported-claim warnings.                               |
| Care Continuity Agent      | After approval, prepares pharmacy/scheduling handoff and closure readiness.                                                            |

Suggested phrasing:

> The agents do not replace clinician judgment. They prepare structured,
> source-grounded work products and route claims that need accountability to
> human approval gates.

## Technical Architecture

Reader-friendly diagram:

```text
Synthetic order
  -> UiPath Maestro Case
  -> API Workflows hydrate EHR/payer/pharmacy/event data
  -> Seven Agent Builder packets produce criteria, evidence, packet, denial,
     appeal, and care handoff outputs
  -> Action Center gates clinician review
  -> Payer API submission
  -> Orchestrator/Robot portal fallback when API is unavailable
  -> Event mirror / Data Service audit records
  -> Command Center visualizes UiPath-written state
```

Important boundary:

The Command Center is not the live source of truth. It visualizes case snapshots,
agent traces, events, and approval gates that UiPath workflows or UiPath-called
event records are responsible for writing in the live architecture.

## Demo Path

Use this path for the five-minute video and live judge walkthrough:

1. Open Command Center at `http://127.0.0.1:5173` and start on the polished
   product dashboard.
2. Show the priority KPIs, urgent case, case queue, SLA risk, and synthetic-data
   disclosure.
3. Open the synthetic case `TACC-2026-001`.
4. Show the current stage, next best action, evidence matrix, and seven agent
   activity/trace drawer.
5. Drill into `TreatmentAccessHackathon`, the UiPath audit drawer, or
   architecture proof to explain that UiPath governs the case lifecycle.
6. Toggle or explain missing evidence to show that submission blocks rather
   than hiding unsupported clinical claims.
7. Show clinician validation/Action Center gates as accountable human review
   surfaces.
8. Turn on `Payer API unavailable`.
9. Show direct API submission failing with `PAYER_API_DOWN`.
10. Open Mock Payer Portal at `http://127.0.0.1:5174`.
11. Submit the synthetic portal form and show confirmation
    `AVFH-PORTAL-SYN-001`.
12. Return to the Command Center and show the robot/fallback-flavored event
    state.
13. Show denial rescue, clinician-reviewed appeal draft, care handoff, and audit
    timeline.
14. Close by showing `docs/live-uipath-proof-closeout.md` and stating exactly
    which UiPath proof IDs are live versus which parts remain intentionally not
    claimed.

For the final approved proof, say:

> UiPath Automation Cloud now owns the final proof trail: Data Fabric proof
> records, a completed Action Center ExternalTask, a published and activated
> solution, a successful Orchestrator job, and Maestro debug proof up to the
> HITL boundary in `TreatmentAccessHackathon`. We are not claiming captured
> portal UI automation, live Agent Builder execution, IXP mutation, or real
> payer submission; those are visibly labelled as the next production-hardening
> steps.

## Mocked Vs Live Statement

Use this as the Devpost transparency section:

| Area                | What is working locally or after smoke                                                                                                                                                                  | What is not claimed                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Synthetic data      | Deterministic fictional patient, payer, policy, evidence, denial, and audit data.                                                                                                                       | No real PHI, payer, provider, credential, or patient data.                                                                                                        |
| Command Center      | Renders product dashboard, case state, evidence matrix, agent traces, fallback, denial, appeal, care, and proof manifest.                                                                               | It is not claimed as the live system of record.                                                                                                                   |
| Mock API            | Supports health, reset, toggles, event ingestion, payer unavailable behavior, portal fallback success, and state reads.                                                                                 | It is not a real payer/EHR/pharmacy integration.                                                                                                                  |
| Seven agents        | Local contracts and deterministic smoke runtime prove behavior and trace/audit payloads.                                                                                                                | No live Agent Builder run/debug is claimed.                                                                                                                       |
| Fireworks/LangSmith | Live provider readiness is claimed only after `CI=true pnpm smoke:checkpoint6-live-providers` passes or equivalent evidence exists.                                                                     | No live LLM output or LangSmith trace is claimed from deterministic local proof alone.                                                                            |
| UiPath workflows    | Maestro/API Workflow/Action Center/Data Service artifacts and runbooks exist; final manifest displays live folder, record, Action Center task, job, deployment, source, timestamp, and safety evidence. | Live Maestro debug reached the HITL/action-task boundary but faulted there; no live Agent Builder run, portal UI automation, or real payer submission is claimed. |
| Portal fallback     | Mock payer portal, local fallback smoke, and real UiPath RPA project/solution shell prove the API-down-to-portal handoff boundary.                                                                      | A live scaffold Orchestrator job completed; captured portal UI automation and external payer portal submission are not claimed.                                   |
| IXP/DU              | Fallback parser keeps source spans and confidence so IXP can be swapped in later.                                                                                                                       | No IXP project mutation or live extraction deployment is claimed.                                                                                                 |
| Solution            | Local solution shell includes `PayerPortalFallback`, packs, publishes, deploys, and activates in UiPath.                                                                                                | No cross-project or `AgentFactoryDemo` deployment is claimed.                                                                                                     |

Checkpoint 6 adds `CI=true pnpm uipath:readiness` as the no-side-effect UiPath
readiness sweep. It verifies registration/discovery state, RPA validate/build,
and solution dry-run without running live UiPath side effects.

Checkpoint 8 adds `CI=true pnpm smoke:checkpoint8-live-uipath` as the final
no-side-effect readiness sweep. It verifies the Command Center proof manifest,
the `TreatmentAccessHackathon` folder identifiers, local/provider/UiPath proof
separation, and final safety wording. The smoke itself creates no records,
tasks, jobs, deployments, robot runs, or payer submissions; the approved live
proof IDs are recorded separately in `docs/live-uipath-proof-closeout.md`.

## Safety And Privacy

Submission wording:

Treatment Access Command Center uses synthetic data only. The demo contains no
real patient, payer, provider, credential, or personal health data. Every
clinical assertion must have source evidence, a policy citation, or a human
approval route. Missing or low-confidence evidence blocks submission. Appeal
language is administrative draft text for clinician review, not autonomous
medical or legal advice.

Live approval gates:

- RPA run/debug or Assistant robot execution.
- Orchestrator job start.
- Solution upload, publish, deploy, or activation.
- Agent Builder run/debug.
- Maestro debug/run.
- IXP project creation, upload, publish, or mutation.
- New Action Center task creation beyond completed proof task `4401667`.
- Data Service writes.
- Any payer submission outside the local synthetic mock.

## Coding-Agent And Orchestration Evidence

This repo was built through isolated Codex implementation lanes with an explicit
merge order and checkpoint log. The process is documented in:

- `docs/orchestration-log.md`
- `docs/AGENT_MEMORY.md`
- `docs/checkpoint-1-orchestrator.md`
- `docs/checkpoint-2-orchestrator.md`
- `docs/checkpoint-3-orchestrator.md`
- `docs/checkpoint-4-orchestrator.md`
- `docs/checkpoint-5-orchestrator.md`

Evidence to mention:

- Checkpoint 1 built synthetic fixtures, mock API, Command Center data shell,
  and reset/smoke tooling.
- Checkpoint 2 added Maestro/Data Service/API Workflow/Action Center/Apps
  integration artifacts.
- Checkpoint 3 added seven agent contracts, local runtime, Agent Builder
  packets, extraction fallback, and agent smoke proof.
- Checkpoint 4 added mock payer portal, portal fallback contract, Command Center
  demo UX, fallback smoke, and browser proof.
- Checkpoint 5 packages the repo for truthful Devpost review and documents
  remaining live-readiness gates.

Coding-agent contribution summary:

> Codex was used as an implementation orchestrator. Separate lanes built data,
> APIs, UI, UiPath artifacts, agent contracts, RPA wiring docs, QA proof, and
> submission materials. The orchestrator merged lanes in checkpoint order,
> resolved integration issues, and ran verification commands after each
> checkpoint. The output is not just generated prose: it includes runnable
> TypeScript packages, smoke tests, schemas, UiPath artifact packets, and
> documented live approval gates.

## Screenshots, Video, And Deck Checklist

Screenshots to include:

- Command Center desktop case overview.
- Command Center evidence matrix with source-grounding.
- Seven agent trace/cards section.
- Payer API unavailable / portal fallback panel.
- Mock Payer Portal confirmation `AVFH-PORTAL-SYN-001`.
- Audit timeline showing agent, human, robot, workflow, and system events.
- UiPath folder/runtime or artifact views, if available without side effects.
- Agent Builder/API Workflow/Maestro artifacts or validation screenshots, if
  available.

Video checklist:

- Under five minutes.
- Starts in or immediately proves UiPath governance context.
- Uses synthetic data only.
- Shows seven agents as distinct, not a generic assistant.
- Shows a human approval gate before clinical/appeal assertions are treated as
  approved.
- Shows payer API failure and portal fallback.
- States live RPA/job/deploy/task/write steps truthfully.
- Ends with auditability and care-continuity handoff.

Deck checklist:

- Problem: treatment access is an exception-heavy coordination workflow.
- Solution: UiPath-governed case with agents, humans, APIs, robot fallback, and
  audit trail.
- Architecture: UiPath orchestration layer plus mock systems and Command Center
  visualization.
- Demo screenshots: case, evidence, agents, fallback, denial/appeal, care
  handoff, audit.
- Safety: synthetic data, source grounding, clinician review, approval gates.
- Technical proof: tests, smoke commands, UiPath artifacts, coding-agent
  orchestration.
- Limitations and next steps.

## Verification Commands

Run these before final submission:

```bash
CI=true pnpm verify:setup
CI=true pnpm uipath:readiness -- local
CI=true pnpm format:check
CI=true pnpm verify:submission-readiness
CI=true pnpm smoke:checkpoint6-readiness
CI=true pnpm smoke:checkpoint7-live-proof
CI=true pnpm smoke:checkpoint8-live-uipath
git diff --check
```

Recommended full local proof, time permitting:

```bash
CI=true pnpm verify
CI=true pnpm seed
CI=true pnpm smoke:checkpoint1
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint4
CI=true pnpm verify:checkpoint6
```

After live Fireworks and LangSmith credentials are configured, run the
no-side-effect live provider proof:

```bash
CI=true pnpm smoke:checkpoint6-live-providers
```

After the redesigned Command Center is running locally, run the page smoke:

```bash
CI=true pnpm smoke:checkpoint6-ui
```

If a live UiPath, GitHub, Vercel, or network dependency is unavailable, state
the dependency and list the narrower local check that was run instead.

## Limitations

- Real RPA project creation is unblocked locally. `PayerPortalFallback` exists
  as a UiPath project shell, validates, builds with `scripts/uipath-with-dotnet8.sh`,
  is imported into the local solution, and passes solution pack dry-run.
- Additional live RPA execution, Orchestrator job start, solution deployment,
  Action Center task creation, Data Service writes, IXP mutation, Agent Builder
  run/debug, and Maestro run/debug remain explicit approval-gated steps.
- The local UI and mock API prove the workflow semantics with synthetic data,
  not production integrations.
- The extraction fallback is deterministic and source-spanned, but it is not a
  deployed IXP/Document Understanding model.
- The prototype is not medical or legal advice, and appeal drafts require
  clinician review.

## Future Production Steps

- Complete UiPath UI Automation indication for the real `PayerPortalFallback`
  project against the synthetic mock payer portal.
- Re-run RPA validate/build and solution pack dry-run after UIA targets are
  captured.
- Configure Orchestrator assets for API, Command Center, portal URL, and
  synthetic credentials.
- Publish and run a live approval-gated robot smoke against the mock payer
  portal.
- Deploy UiPath workflows/agents/tasks/Data Service records in the
  `TreatmentAccessHackathon` folder.
- Replace fallback extraction with IXP/Document Understanding where available.
- Connect the Command Center to UiPath-written Data Service/event records in a
  deployed environment.
- Add production-grade auth, audit retention, PHI controls, payer/EHR connector
  governance, monitoring, and clinician signoff workflows.

## Final Submission Checklist

- Public GitHub repo is accessible.
- MIT license is present and matches `package.json`.
- README explains setup, smoke tests, UiPath role, safety, and mocked-vs-live
  status.
- `docs/demo-script.md` aligns with the actual recording.
- Screenshots are captured and named clearly.
- Video is under five minutes and avoids unsupported live claims.
- Deck or slides include architecture, demo proof, safety, limitations, and next
  steps.
- No real PHI, credentials, payer data, provider identifiers, or unsupported
  medical/legal claims are committed.
- Final verification commands and any unavailable live dependencies are recorded.
