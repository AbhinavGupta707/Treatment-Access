# Treatment Access Command Center

Treatment Access Command Center is a UiPath AgentHack 2026 Track 1 project for
specialty-medication prior authorization, payer fallback, denial rescue, and
care-continuity handoff.

The demo reframes prior authorization as a governed treatment-access case. A
synthetic medication order moves through policy extraction, source-grounded
evidence mapping, clinician validation, payer submission, portal fallback when
the API is unavailable, denial analysis, administrative appeal drafting, approval,
pharmacy handoff, and audit packaging.

UiPath is the orchestration and governance layer. The custom apps are
judge-facing visual surfaces; live proof state is now also recorded in UiPath
Data Fabric, Solution, and Orchestrator under the `TreatmentAccessHackathon`
folder.

## Current Status

This repository is demo-ready for the local synthetic product path and has a
completed Checkpoint 8 live UiPath proof. The final Command Center leads with
healthcare value while keeping task, job, record, confirmation, source, and
safety evidence in a proof drawer/manifest instead of cluttering the product
screen.

Already implemented:

- TypeScript monorepo with shared Zod contracts, deterministic synthetic data,
  setup verification, reset, seed, and smoke scripts.
- Mock healthcare API covering EHR, payer, pharmacy, demo toggles, and event
  mirror endpoints.
- Command Center UI that shows the case queue, event mirror state, seven agent
  traces, evidence matrix, Action Center gates, payer API failure, portal robot
  fallback state, denial rescue, appeal/care handoff, and audit timeline.
- Final proof manifest in the Command Center for UiPath folder
  `TreatmentAccessHackathon`, folder ID `7986316`, folder key
  `4fba2fa1-012b-469a-b6aa-e5be3811c173`, event/record ID, task ID, job ID,
  confirmation ID, source labels, timestamp, and safety status when available.
- Live UiPath proof closeout in `docs/live-uipath-proof-closeout.md`: Data
  Fabric proof entity `feea1705-e673-f111-ac9a-002248a16d28`, solution package
  `treatment-access-command-center@1.0.20260629`, deployment
  `46ec1e63-3b09-4308-8b44-ed4b65e4e7f7`, and successful Orchestrator job
  `6d9b9fa9-f582-4983-98fa-167e87d57f2a`.
- Mock Payer Portal with stable automation selectors and deterministic synthetic
  confirmation IDs such as `AVFH-PORTAL-SYN-001`.
- UiPath design artifacts for Maestro Case, Data Service/Data Fabric shape, API
  Workflows, Action Center contracts, Apps intake, Agent Builder packets, and a
  local solution shell.
- Seven local agent contracts and deterministic runtime smoke coverage.
- Local proof that direct payer API submission can fail while
  `portal_fallback` succeeds and writes robot-flavored event state.

Still not claimed:

- No real payer submission, real PHI, real payer credential use, IXP mutation,
  live Maestro run, live Agent Builder run, or autonomous clinical/appeal
  approval is claimed.
- Action Center is live-readable and task-ready, but no live Action Center task
  was created because the installed `uip tasks` CLI exposes no create verb.
- The real `PayerPortalFallback` process was deployed and completed one live
  Orchestrator job, but the current `Main.xaml` is scaffold-only. UI Automation
  target capture and actual browser portal form submission remain future work.

## Proof Types

| Proof type            | What it means                                                                                                    | Current wording rule                                                                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local Synthetic Proof | Deterministic local apps, mock API, mock portal, event mirror, agent runtime, screenshots, and smoke commands.   | Can be shown as working local proof with synthetic data only.                                                                                                                              |
| Live Provider Proof   | Fireworks/LangSmith readiness or traces after provider credentials are configured and the provider smoke passes. | Claimed only after `CI=true pnpm smoke:checkpoint6-live-providers` or equivalent captured evidence.                                                                                        |
| Live UiPath Proof     | UiPath Automation Cloud evidence in `TreatmentAccessHackathon`: record/task/job/confirmation IDs and timestamps. | Completed for Data Fabric proof state, solution publish/deploy/activation, and one Orchestrator job; Action Center task creation and portal UIA remain honestly labelled as not completed. |

## Problem

Specialty-medication access breaks down when payer policy requirements, chart
evidence, clinician attestations, payer submissions, denials, appeals, and
handoffs live in separate systems. Staff lose time reconstructing why a case is
blocked, clinicians are asked to approve unsupported wording, and patients wait
while prior authorization exceptions bounce between teams.

## Solution

Treatment Access Command Center coordinates the case as a governed workflow:

1. Start with a synthetic treatment order.
2. Resolve payer criteria and required documents.
3. Map each clinical assertion to source evidence, a policy citation, or a
   human approval gate.
4. Block submission when required safety evidence is missing.
5. Build a payer packet only after validation.
6. Attempt payer API submission.
7. Trigger a portal fallback path when the API is unavailable.
8. Analyze denial reason and draft an administrative appeal for clinician
   review.
9. Hand approved therapy to pharmacy/scheduling.
10. Preserve an audit trail of agents, humans, robots, workflows, and evidence.

Appeal language is always an administrative draft for clinician review. It is not
autonomous medical or legal advice.

## UiPath Role

The intended live architecture keeps UiPath in charge of orchestration,
governance, approvals, and auditability:

| UiPath component           | Role in this project                                                                    | Current repo status                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Maestro Case               | Outer treatment-access lifecycle with stages and secondary exception paths.             | SDD and case design documented under `uipath/maestro`.                                                                              |
| Agent Builder              | Seven domain agents with distinct inputs, outputs, trace summaries, and audit payloads. | Local Agent Builder packets exist and were statically validated during Checkpoint 3.                                                |
| API Workflows              | EHR hydration, payer submission/status, pharmacy handoff, and event writes.             | Workflow JSON artifacts and validation notes exist under `uipath/api-workflows`.                                                    |
| Action Center              | Clinician evidence approval, appeal signoff, and exception review gates.                | Live users/tasks surface verified; no task created because this CLI has no `tasks create` command.                                  |
| Data Service/Data Fabric   | Case, evidence, decision, human task, and audit data model.                             | Live folder-scoped `TreatmentAccessProofEvent` entity and proof records created under `TreatmentAccessHackathon`.                   |
| Orchestrator               | Folder, assets, logs, job launch, and robot runtime governance.                         | Solution folder, process, machine assignment, and successful Development-runtime job are recorded.                                  |
| Assistant/Robot            | Mock payer portal fallback when payer API is unavailable.                               | `PayerPortalFallback` is deployed and job-runnable; current XAML is scaffold-only, so portal UIA capture/submission is not claimed. |
| IXP/Document Understanding | Preferred production extraction path for policy, chart, lab, and denial documents.      | Tenant service reachable, but local CLI lacks the `uip ixp` command prefix; fallback parser preserves source spans.                 |

## Seven Agents

| Agent                      | Responsibility                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Coverage Requirement Agent | Resolves authorization requirements, criteria, required documents, submission channels, and policy citations. |
| Evidence Retrieval Agent   | Maps synthetic chart artifacts to criteria and flags evidence confidence, source spans, and review needs.     |
| Missing Evidence Agent     | Detects blocking gaps such as missing TB/hepatitis safety screening and drafts human task payloads.           |
| Submission Packet Agent    | Builds payer packet fields only when evidence and clinician gates allow submission.                           |
| Denial Rescue Agent        | Parses denial/RFI category and selects a source-grounded rescue strategy.                                     |
| Appeal Packet Agent        | Drafts administrative appeal language with citations, warnings, and clinician signoff requirements.           |
| Care Continuity Agent      | Plans pharmacy and scheduling handoff after payer or appeal approval.                                         |

An Audit Packet Agent packet also exists for closure/audit packaging, but the
core product story and runtime smoke focus on the seven treatment-access domain
agents above.

## Local App And API Surfaces

| Surface             | Command                   | Default URL             | Purpose                                                    |
| ------------------- | ------------------------- | ----------------------- | ---------------------------------------------------------- |
| Mock Healthcare API | `pnpm dev:api`            | `http://127.0.0.1:8787` | Synthetic EHR, payer, pharmacy, toggles, and event mirror. |
| Command Center      | `pnpm dev:command-center` | `http://127.0.0.1:5173` | Judge-facing case cockpit and audit walkthrough.           |
| Mock Payer Portal   | `pnpm dev:mock-payer`     | `http://127.0.0.1:5174` | Browser portal for the RPA fallback path.                  |

Key local API endpoints include:

- `GET /health`
- `GET /demo/state`
- `POST /demo/reset`
- `POST /demo/toggles`
- `POST /events`
- `POST /payer/prior-auth`
- `GET /payer/prior-auth/:submissionId/status`

## Quick Start

Install dependencies:

```bash
CI=true pnpm install
```

Run the main verification suite:

```bash
CI=true pnpm verify
```

Use `CI=true` in non-interactive shells so pnpm never pauses for an install
confirmation prompt.

Run the three local demo surfaces in separate terminals:

```bash
CI=true pnpm dev:api
CI=true pnpm dev:command-center
CI=true pnpm dev:mock-payer
```

If the Command Center needs a non-default API URL, set
`VITE_TACC_API_BASE_URL` before starting it.

## Smoke And Verification Commands

Setup and formatting gates:

```bash
CI=true pnpm verify:setup
CI=true pnpm format:check
git diff --check
```

Focused local proof commands:

```bash
CI=true pnpm seed
CI=true pnpm smoke:checkpoint1
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint4
CI=true pnpm smoke:checkpoint8-live-uipath
```

Full local verification:

```bash
CI=true pnpm typecheck
CI=true pnpm test
CI=true pnpm build
CI=true pnpm verify
```

If another local process is using a smoke-test port, pass an alternate port, for
example:

```bash
CI=true pnpm smoke:checkpoint4 -- --port 8894
```

## Mocked Vs Live Matrix

| Capability                                       | Local synthetic proof                                                              | Live UiPath/payer status                                                                                  |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Synthetic case data and policy/evidence fixtures | Implemented in `packages/demo-data`.                                               | No real PHI, payer, provider, credential, or patient data.                                                |
| Event mirror and Command Center state            | Implemented through mock API and UI.                                               | Final proof IDs are recorded in UiPath Data Fabric and surfaced in the proof manifest.                    |
| Seven agent contracts and traces                 | Deterministic runtime smoke passes locally.                                        | Agent Builder packets validated statically; no live agent run/debug claimed.                              |
| Maestro case lifecycle                           | SDD, stage model, and integration contracts documented.                            | No live Maestro debug/run claimed.                                                                        |
| API Workflows                                    | Workflow JSON artifacts and local contracts exist.                                 | No side-effecting live workflow execution claimed.                                                        |
| Action Center gates                              | Task contracts and UI gates are represented locally.                               | Live read surface verified; no live task created because no CLI create surface exists.                    |
| Data Service/Data Fabric                         | Entity model documented.                                                           | Live proof entity and records created in `TreatmentAccessHackathon`.                                      |
| Payer API unavailable path                       | `channel="api"` returns `PAYER_API_DOWN` under the toggle.                         | No real payer submission claimed.                                                                         |
| Portal fallback                                  | Local `channel="portal_fallback"` succeeds and records robot-flavored event state. | Real UiPath process is deployed and job-complete; portal UIA capture/form submission remains not claimed. |
| Mock payer portal                                | Browser app produces deterministic synthetic receipt state.                        | No live external portal used.                                                                             |
| IXP/Document Understanding                       | Fallback parser preserves source spans and confidence.                             | Local CLI lacks registered `uip ixp`; no IXP mutation claimed.                                            |
| Solution packaging                               | Local solution shell includes `PayerPortalFallback` and passes pack dry-run.       | Published, deployed, and activated as `treatment-access-command-center@1.0.20260629`.                     |

## Safety And Privacy

- Use synthetic data only.
- Do not add real PHI, payer credentials, provider identifiers, or patient
  contact data.
- Every clinical assertion must have source evidence, a policy citation, or
  human approval.
- Missing or low-confidence evidence blocks submission instead of being hidden.
- Appeal content is administrative draft language for clinician review.
- Future live side effects still require explicit approval. The approved final
  proof already created Data Fabric proof records, deployed/activated the
  solution, assigned the workspace machine to the solution folder, and ran one
  Orchestrator job. No real payer submission or real PHI is allowed.

## Repo Layout

```text
apps/command-center          Judge-facing operational dashboard
apps/mock-payer-portal       Browser portal used by the RPA fallback path
services/mock-healthcare-api Mock EHR, payer, pharmacy, toggles, and event API
packages/shared-schemas      Shared TypeScript/Zod contracts
packages/demo-data           Synthetic seed data
packages/agent-runtime       Deterministic seven-agent local runtime
uipath/maestro               Maestro Case stage design
uipath/api-workflows         API Workflow artifacts and contracts
uipath/action-center         Human approval task contracts
uipath/data-service          Data Service/Data Fabric model
uipath/agents                Agent Builder packets and contracts
uipath/robots                Portal fallback robot project shell, contract, and approval gates
uipath/solution              Local UiPath solution shell with imported RPA process
docs                         Setup, testing, demo, submission, and logs
scripts                      Seed/reset/setup/smoke verification helpers
```

## Documentation

- [UiPath setup](docs/setup-uipath.md)
- [Testing](docs/testing.md)
- [Demo script](docs/demo-script.md)
- [Submission package](docs/submission.md)
- [Orchestration log](docs/orchestration-log.md)
- [Implementation plan](treatment_access_command_center_implementation_plan.md)

## License

MIT. See [LICENSE](LICENSE).
