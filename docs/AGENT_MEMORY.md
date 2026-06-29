# Agent Memory

## Current Project

Treatment Access Command Center for UiPath AgentHack 2026 Track 1 - Maestro Case.

## Key Decisions

- Keep seven domain agents, but require distinct input/output contracts and visible runtime traces.
- Use `TreatmentAccessHackathon` as the UiPath folder.
- Keep `AgentFactoryDemo` untouched.
- Use a hybrid UI strategy: polished custom Command Center plus visible UiPath surfaces.
- Keep IXP/Document Understanding as preferred extraction path, with a schema-compatible fallback parser.
- Treat appeal language as clinician-reviewed administrative draft language.

## Current Setup Risk

Assistant/Robot is installed and available. The connected workspace machine is assigned to `TreatmentAccessHackathon`, and the folder reports one connected/available `Development` runtime. The tenant's single `Unattended` license is intentionally unallocated; reserve it later only if the final RPA portal fallback must run as a fully unattended Orchestrator job.

## Checkpoint 1 Status

Checkpoint 1 is merged and verified on `main`.

Integrated lane commits:

- Demo Data & Fixture: `c9d4e42`
- Mock Healthcare API: `e978bcf`
- QA/Reset: `20efb54`
- Command Center Data Shell: `a86bc68`

Closeout checks passed:

- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm seed`
- `CI=true pnpm smoke:checkpoint1 -- --port 8877`

Integration note: Command Center fallback state was reconciled with the enriched shared schema after merge. The default smoke port `8787` was occupied locally, so live smoke was verified on `8877`.

## Checkpoint 2 Status

Checkpoint 2 is merged and locally verified on `main`.

Launch commit: `27ff4f6 Launch checkpoint 2 orchestration`.

Integrated lanes:

| Lane                 | Thread ID                              | Worktree path                                                |
| -------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Maestro/Data Service | `019f1084-f0bc-7bd3-a9fe-7cb4d7cab18b` | `/Users/abhinavgupta/.codex/worktrees/ccc5/Treatment Access` |
| API Workflows        | `019f1085-484a-7b12-badf-31919d339e04` | `/Users/abhinavgupta/.codex/worktrees/a6c0/Treatment Access` |
| Action Center        | `019f1085-9b20-7680-aaaf-3491421897d5` | `/Users/abhinavgupta/.codex/worktrees/75e4/Treatment Access` |
| Apps/Intake          | `019f1086-19a4-7871-ab0b-0941097ea50f` | `/Users/abhinavgupta/.codex/worktrees/37c3/Treatment Access` |

Integration summary:

- Maestro/Data Service backbone merged from `c1f0460`.
- API Workflow lane merged from `33e27a4` and normalized to standard `Content-Type` request headers.
- Action Center lane was sanitized and integrated as `1237dc0`; reusable repo artifacts use assignment placeholders instead of personal reviewer identifiers.
- Apps/Intake lane merged from `87aaa60`.
- Cross-lane launch reconciliation landed in `92c2d37`, adding `start-treatment-access-case.workflow.json` and aligning Apps, API Workflow, Maestro, and Data Service event contracts.

UiPath baseline before launch:

- CLI `uip` version `1.195.1`.
- Logged into org `galacticus`, tenant `DefaultTenant`.
- Folder `TreatmentAccessHackathon` visible with key `4fba2fa1-012b-469a-b6aa-e5be3811c173`.
- Command surfaces registered: Maestro Case, API Workflow, Action Center Tasks, Data Fabric, Coded Apps.

Closeout checks passed:

- `uip api-workflow validate` for all six Checkpoint 2 workflows.
- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm seed`
- `DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint1 -- --port 8878`

Smoke note: local server binding was blocked by the sandbox without escalation, so the checkpoint smoke ran with approved local-listen escalation on port `8878`.

Run/publish safety: no live Maestro debug, side-effecting workflow execution, publish, deploy, Action Center task creation, or Data Service entity creation has been performed. Those actions still require explicit user approval.

## Checkpoint 3 Status

Checkpoint 3 is merged and locally verified on `main`.

Launch commit: `2ba229f Launch checkpoint 3 orchestration`.

Control runbook: `docs/checkpoint-3-orchestrator.md`.

Integrated lanes:

| Lane                                    | Thread ID                              | Worktree path                                                |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Shared Agent Contracts & Runtime        | `019f10b3-b8cb-7911-96d9-b1f186c15717` | `/Users/abhinavgupta/.codex/worktrees/64e0/Treatment Access` |
| Policy/Evidence/Missing Evidence Agents | `019f10b4-1074-76b1-871e-4e59780e4bd0` | `/Users/abhinavgupta/.codex/worktrees/00e2/Treatment Access` |
| Submission/Denial/Appeal Agents         | `019f10b4-6b34-77c2-98de-1aab237a998a` | `/Users/abhinavgupta/.codex/worktrees/f839/Treatment Access` |
| Care Continuity/Audit/Extraction        | `019f10b4-cda5-73a1-8ec4-cad9b3470ac4` | `/Users/abhinavgupta/.codex/worktrees/04aa/Treatment Access` |

Integration summary:

- Shared runtime merged from `e38cfd6`, adding `@tacc/agent-runtime`, seven agent contracts, `CI=true pnpm smoke:agents`, and UiPath-facing contract docs.
- Policy/Evidence/Missing Evidence Agent Builder packets merged from `d818d7b`.
- Submission/Denial/Appeal Agent Builder packets merged from `61173cc`.
- Care Continuity, Audit Packet, and Extraction readiness/fallback packets merged from `a50690c`.
- Integration reconciliation landed in `761ef07`, mapping legacy `medical_necessity` demo toggles to the agent-facing `documentation_gap` denial strategy and replacing stale `uip agent refresh` docs with the local `uip agent migrate` command.

Closeout checks passed:

- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm seed`
- `DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint1 -- --port 8878`
- `CI=true pnpm smoke:agents`
- `git diff --check`
- `uip agent validate --output json` for Coverage Requirement, Evidence Retrieval, Missing Evidence, Submission Packet, Denial Rescue, Appeal Packet, Care Continuity, and Audit Packet projects.

Extraction/IXP note:

- Read-only `uip ixp projects list --output json` is unavailable in local CLI `1.195.1` because the `ixp` command prefix is not registered. This remains a command-surface/registration blocker, not a permissions/runtime diagnosis.

Runtime safety remains unchanged: live UiPath agent debug/run, solution upload/publish/deploy, IXP project mutation, Action Center task creation, Maestro debug, Data Service writes, and payer submission require explicit user approval.

## Checkpoint 4 Status

Checkpoint 4 orchestration is active on `main`.

Launch prep commit: `d2500bd Launch checkpoint 4 orchestration prep`.

Control runbook: `docs/checkpoint-4-orchestrator.md`.

Checkpoint 4 outcome:

- Build the payer API failure to UiPath robot portal fallback path.
- Polish the custom Command Center into a judge-facing operational walkthrough.
- Add deterministic QA/demo proof for API failure, portal fallback, event mirror,
  and UI visibility.
- Prepare live UiPath runtime/solution wiring, while keeping all side-effecting
  UiPath operations behind explicit approval.

Active isolated lanes:

| Merge order | Lane                          | Thread ID                              | Worktree path                                                |
| ----------- | ----------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| 1           | Mock Payer Portal             | `019f10d2-fc7c-7e32-8acd-4f3a27e56f97` | `/Users/abhinavgupta/.codex/worktrees/48d8/Treatment Access` |
| 2           | UiPath Robot & Runtime Wiring | `019f10d2-fc8a-7483-97a8-a79852aeb0a3` | `/Users/abhinavgupta/.codex/worktrees/8bba/Treatment Access` |
| 3           | Command Center Demo UX        | `019f10d2-fcc0-70e2-a617-486b3e2af8c1` | `/Users/abhinavgupta/.codex/worktrees/2a44/Treatment Access` |
| 4           | Integration QA & Demo Proof   | `019f10d2-fe34-77d3-85e8-84fc46ac8913` | `/Users/abhinavgupta/.codex/worktrees/6573/Treatment Access` |

UiPath runtime baseline before launch:

- CLI `uip` version `1.195.1`.
- Logged into org `galacticus`, tenant `DefaultTenant`.
- Folder `TreatmentAccessHackathon` visible with key
  `4fba2fa1-012b-469a-b6aa-e5be3811c173`.
- `uip solution init` is the active solution command surface.
- Folder runtime reports `Development: Total 1, Connected 1, Available 1`.

Runtime safety remains unchanged: live UiPath RPA run/debug, Orchestrator job
start, solution upload/publish/deploy/activate, agent debug, Maestro debug, IXP
mutation, Action Center task creation, Data Service writes, and payer submission
require explicit user approval.

Checkpoint 4 interim merge progress before final closeout:

- Mock Payer Portal merged into `main` as `c82780b`; `portal_fallback` now
  succeeds while `payer_api_unavailable=true`, while direct `channel="api"`
  still returns `PAYER_API_DOWN`.
- UiPath Robot & Runtime Wiring merged into `main` as `2e9979a`; it includes a
  solution shell, robot contract, Studio indication checklist, and validation
  notes. A real RPA project is not yet created because `uip rpa init` is blocked
  by the local missing .NET SDK/Helm restore prerequisite.
- Command Center Demo UX was still active in
  `/Users/abhinavgupta/.codex/worktrees/2a44/Treatment Access`.
- Integration QA & Demo Proof committed `c1c518b` and was reviewed but held
  until the Command Center UX lane landed.

Checkpoint 4 is now merged and locally verified on `main`.

Integrated commits:

- `c82780b` merged the Mock Payer Portal fallback lane.
- `2e9979a` merged the UiPath robot/runtime wiring lane.
- `59ca800` merged the Command Center demo UX lane.
- `0f5c383` merged the Integration QA/demo-proof lane.

Main-branch integration fixes:

- Robot runtime docs/contract were formatted for repository-wide Prettier.
- Checkpoint 4 smoke and demo docs now use the integrated portal confirmation
  format `AVFH-PORTAL-SYN-*`.

Closeout verification passed:

- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm verify:setup`
- `CI=true pnpm seed`
- `DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint1 -- --port 8878`
- `CI=true pnpm smoke:agents`
- `DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint4 -- --port 8894`
- `git diff --check`
- Integrated Chrome headless browser smoke through DevTools Protocol:
  `Live event mirror`, 7 agent cards, evidence matrix rows, fallback panel,
  mobile fallback state, no horizontal overflow, and mock payer portal
  confirmation `AVFH-PORTAL-SYN-001`.

Browser smoke screenshots:

- `/private/tmp/tacc-cp4-integrated/chrome-command-center-desktop.png`
- `/private/tmp/tacc-cp4-integrated/chrome-command-center-mobile-fallback.png`
- `/private/tmp/tacc-cp4-integrated/chrome-mock-payer-confirmation.png`

Checkpoint 4 delivered:

- API-down payer path remains unavailable for direct `channel="api"`.
- `channel="portal_fallback"` succeeds under the same API-down toggle and
  records robot/fallback-flavored event state.
- Command Center displays a polished judge walkthrough for the seven agents,
  evidence, Action Center gates, API failure, portal robot fallback, denial
  rescue, appeal/care handoff, and audit timeline.
- Mock Payer Portal has stable robot selectors and deterministic synthetic
  receipt state.
- `CI=true pnpm smoke:checkpoint4` proves the local fallback story without live
  UiPath side effects.

Known remaining blocker:

- The UiPath robot lane could not create a real RPA project because
  `uip rpa init` fails on this Mac with no .NET SDK available to the local
  UiPath Assistant/Robot restore path. This is a setup prerequisite for
  Checkpoint 5, not hidden demo behavior.
