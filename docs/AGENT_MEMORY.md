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

Post-checkpoint RPA unblock: `.NET 8` is installed through Homebrew
`dotnet@8`, and `scripts/uipath-with-dotnet8.sh` selects it for UiPath RPA
build/pack commands. The real `PayerPortalFallback` project shell exists under
`uipath/robots/PayerPortalFallback`, is imported into
`uipath/solution/treatment-access-command-center/PayerPortalFallback`, validates,
builds, and passes solution pack dry-run. Remaining live risk is UIA target
capture plus approved robot/job/deploy/write execution, not project creation.

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

Checkpoint 4 is merged and locally verified on `main`.

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
  notes. At Checkpoint 4 closeout, a real RPA project had not yet been created
  because `uip rpa init` was blocked by the local missing .NET SDK/Helm restore
  prerequisite.
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

## Checkpoint 5 Status

Checkpoint 5 is merged and locally verified on `main`.

Launch base commit: `2142714`.
Launch commit and worker base: `97413b9`.

Control runbook: `docs/checkpoint-5-orchestrator.md`.

Checkpoint 5 outcome:

- Resolve or precisely document the local RPA SDK/Studio prerequisite.
- Create/import the real `PayerPortalFallback` UiPath project if safe and
  available, without faking RPA artifacts.
- Prepare Devpost-ready README/submission materials, demo script, deck outline,
  screenshots/evidence, and final QA proof.
- Keep all live UiPath side effects behind explicit approval.

Integrated lanes:

| Merge order | Lane                          | Thread ID                              | Worktree path                                                | Ownership                                                              |
| ----------- | ----------------------------- | -------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1           | RPA Runtime & Solution Import | `019f1111-dd23-7811-808d-6026e4185b1a` | `/Users/abhinavgupta/.codex/worktrees/97ee/Treatment Access` | `uipath/robots/**`, `uipath/solution/**`, RPA setup notes              |
| 2           | Evidence Capture & Final QA   | `019f1111-dcf9-7ae3-9dbf-c92a53b13d79` | `/Users/abhinavgupta/.codex/worktrees/5d6a/Treatment Access` | `uipath/screenshots/**`, `docs/testing.md`, final QA scripts/docs      |
| 3           | README & Submission Package   | `019f1111-dcd9-7411-b1d7-cbed628604b0` | `/Users/abhinavgupta/.codex/worktrees/284a/Treatment Access` | `README.md`, `docs/submission.md`, license/submission checklist        |
| 4           | Demo Script & Deck Outline    | `019f1111-df2e-7991-aaab-4643545917ea` | `/Users/abhinavgupta/.codex/worktrees/55e8/Treatment Access` | `docs/demo-script.md`, `docs/architecture.md`, deck/video outline docs |

Integrated commits:

- `3f332fe` merged RPA runtime readiness documentation from `c56b40e`.
- `53d6e93` merged evidence capture and final QA from `e6876c1`.
- `f2c380c` merged README and Devpost submission packaging from `055c067`.
- `2cd1e19` merged demo script and deck outline from `cd5bae8`.

Checkpoint 5 delivered:

- Updated RPA/solution/setup notes with fresh `uip rpa init` evidence and an
  approval-gated live smoke path. No fake XAML, fake RPA `project.json`, or fake
  solution metadata was added.
- Added local synthetic screenshots and an evidence manifest under
  `uipath/screenshots`.
- Added `CI=true pnpm verify:submission-readiness` as a static final-submission
  guard.
- Replaced stale scaffold README/submission text with judge-readable setup,
  UiPath component, mocked-vs-live, safety, and Devpost answer-bank content.
- Added a five-minute demo script, expanded architecture story, and deck outline.

Closeout verification passed:

- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm verify:setup`
- `CI=true pnpm verify:submission-readiness`
- `CI=true pnpm seed`
- `DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint1 -- --port 8878`
- `CI=true pnpm smoke:agents`
- `DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint4 -- --port 8894`
- `git diff --check`

Checkpoint 5 evidence screenshots:

- `uipath/screenshots/command-center-local.png`
- `uipath/screenshots/mock-payer-portal-local.png`
- `uipath/screenshots/mock-payer-portal-confirmation-local.png`

Post-checkpoint RPA unblock:

- Homebrew `dotnet@8` installed .NET 8.0.128 SDK / 8.0.28 runtime side-by-side
  with the existing .NET 10 install.
- Added `scripts/uipath-with-dotnet8.sh` so local UiPath build/pack commands use
  the .NET 8 runtime expected by `UiPath.WorkflowCompiler.dll`.
- Created the real `uipath/robots/PayerPortalFallback` project via
  `uip rpa init`.
- Verified `Main.xaml` with `uip rpa validate`, built with
  `scripts/uipath-with-dotnet8.sh uip rpa build`, imported the project into the
  local solution, ran `uip solution resource refresh`, and confirmed
  `scripts/uipath-with-dotnet8.sh uip solution pack ... --dry-run` returns
  `Status: Valid`.

Known remaining live-readiness work:

- Complete UIA target indication against the synthetic mock payer portal, then
  re-run RPA validate/build and solution pack dry-run.

Runtime safety remains unchanged: live RPA run/debug, Orchestrator job start,
solution upload/publish/deploy/activate, agent debug, Maestro debug, IXP
mutation, Action Center task creation, Data Service writes, and payer submission
require explicit user approval.

## Checkpoint 6 Status

Checkpoint 6 is merged and locally verified on `main`.

Prep/base commit: `6e1648f`.

Control runbook: `docs/checkpoint-6-live-product-orchestrator.md`.

Checkpoint 6 outcome:

- Redesign the Command Center into a premium customer-facing product UI based on
  `/Ui References`, with dashboard, case detail, evidence matrix, submission,
  and appeal surfaces.
- Add live agentic runtime foundations using Fireworks model calls, LangGraph
  workflow shape, LangSmith trace metadata, and schema-validated outputs.
- Keep deterministic mode available for repeatable smoke tests.
- Keep UiPath as the orchestration/governance layer and custom UI as a
  visualization surface for governed state.
- Keep all live UiPath side effects behind explicit user approval.

Integrated lanes:

| Merge order | Lane                                  | Thread ID                              | Worktree path                                                | Ownership                                                                    |
| ----------- | ------------------------------------- | -------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 1           | Live Agent Provider & Runtime Schemas | `019f130f-ec37-7e01-9d7b-0efe8670ccda` | `/Users/abhinavgupta/.codex/worktrees/7465/Treatment Access` | `packages/shared-schemas/**`, `packages/agent-runtime/**`, readiness scripts |
| 2           | LangGraph Multi-Agent Workflow        | `019f1310-5cbd-7d13-81ad-0a1e4b4171f7` | `/Users/abhinavgupta/.codex/worktrees/64fd/Treatment Access` | `packages/agent-runtime/**`, workflow smoke                                  |
| 3           | Premium Product UI                    | `019f1310-e132-7e60-9577-31d66b79b61c` | `/Users/abhinavgupta/.codex/worktrees/99a4/Treatment Access` | `apps/command-center/**`                                                     |
| 4           | UiPath Live Wiring & Safe Hooks       | `019f1311-7436-7503-925a-0a9ac79883fc` | `/Users/abhinavgupta/.codex/worktrees/d3d4/Treatment Access` | `uipath/**`, UiPath readiness docs/scripts                                   |
| 5           | Live Demo QA & Submission Readiness   | `019f1312-0bc3-7b72-98e7-49e743de79d5` | `/Users/abhinavgupta/.codex/worktrees/f649/Treatment Access` | `scripts/**`, demo/submission/testing docs                                   |

Launch constraints:

- The user has created local `.env.local` with Fireworks and LangSmith keys;
  the file is ignored by git and must never be printed or committed.
- Do not run live `uip agent debug`, Maestro run/debug, Action Center task
  creation, Data Service/Data Fabric writes, Orchestrator job start, RPA
  run/debug, solution upload/publish/deploy/activate, IXP mutation, or payer
  submission without explicit user approval.

Integrated commits:

- `aa9a697` merged live provider/runtime schemas from `25b6f2b`.
- `e118098` merged the LangGraph multi-agent workflow from `26aa32d`.
- `22db000` merged the premium product UI from `2e9d32c`.
- `6e7e656` merged UiPath live wiring/readiness gates from `b253417`.
- `3110eda` merged demo QA/submission readiness from `29ae549`.

Checkpoint 6 delivered:

- Premium customer-facing Command Center with dark SaaS dashboard, case,
  evidence, submission, appeal, analytics, and audit surfaces inspired by the
  supplied UI references.
- Fireworks/LangSmith runtime configuration with safe env summaries,
  deterministic/live modes, and no secret printing.
- LangGraph-shaped seven-agent workflow with schema-validated agent outputs,
  human gates, robot fallback request records, denial-to-appeal branching, and
  care handoff branching.
- Checkpoint 6 readiness scripts:
  `smoke:checkpoint6-readiness`, `smoke:checkpoint6-live-providers`,
  `smoke:checkpoint6-ui`, and `verify:checkpoint6`.
- UiPath no-side-effect readiness wrapper for command discovery, RPA
  validate/build, and solution pack dry-run.

Closeout verification passed:

- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm verify:checkpoint6`
- `CI=true pnpm seed`
- `CI=true pnpm smoke:agents`
- `DEBUG_SMOKE=1 CI=true pnpm smoke:checkpoint4 -- --port 8894`
- `CI=true pnpm smoke:checkpoint6-live-providers`
- `CI=true pnpm smoke:live-agents -- --require-live --call-model` after
  loading ignored local `.env.local`
- `CI=true pnpm smoke:checkpoint6-ui`
- `CI=true pnpm uipath:readiness local`
- `git diff --check`

Checkpoint 6 evidence:

- Fireworks read-only `/models` connectivity passed.
- LangSmith read-only project/session connectivity passed.
- A tiny synthetic Fireworks model call passed with
  `accounts/fireworks/models/deepseek-v4-pro`; no UiPath, payer, Action Center,
  or Data Service side effects were invoked.
- Command Center UI smoke passed for `/`, `/dashboard`, `/cases`, and
  `/analytics` on `http://127.0.0.1:5173`.
- Premium UI screenshots reviewed:
  `/tmp/tacc-command-center-desktop-cdp.png` and
  `/tmp/tacc-command-center-mobile-cdp.png`.
- UiPath local readiness passed: `uip rpa validate` reported no diagnostics,
  `uip rpa build` succeeded, and `uip solution pack ... --dry-run` returned
  `Status: Valid`.

Remaining live-readiness work:

- Live Agent Builder/Coded Agent run/debug, Maestro run/debug, Action Center
  task creation, Data Service/Data Fabric writes, Orchestrator job start, RPA
  run/debug, solution upload/publish/deploy/activate, IXP mutation, and payer
  submission remain explicit user-approval-gated actions.
- Keep using only synthetic data and the `TreatmentAccessHackathon` UiPath
  folder for this project.

## Checkpoint 7 Launch Prep

Checkpoint 7 target: a narrow live UiPath proof slice that turns the premium
Checkpoint 6 product into a user-triggered live run. The run should execute
Fireworks-backed agent work, capture LangSmith trace metadata when available,
write synthetic governed events, and let the Command Center show progress and
approval gates as a real product flow.

New control docs:

- `docs/live-uipath-proof-plan.md`
- `docs/checkpoint-7-live-uipath-proof-orchestrator.md`

Prep commit: `02ddaf0`.

Active Checkpoint 7 lanes:

| Merge order | Lane                                       | Thread ID                              | Worktree path                                                | Ownership                                                                                                     |
| ----------- | ------------------------------------------ | -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1           | Live Proof Schemas, API, and Agent Runtime | `019f1416-f3a2-7fe3-b026-975286bded43` | `/Users/abhinavgupta/.codex/worktrees/4428/Treatment Access` | `packages/shared-schemas/**`, `packages/agent-runtime/**`, `services/mock-healthcare-api/**`, focused scripts |
| 2           | UiPath Coded Agent and Governed Hooks      | `019f1417-4829-74f3-a071-8e45f0887c1a` | `/Users/abhinavgupta/.codex/worktrees/be2c/Treatment Access` | `uipath/coded-agents/**`, `uipath/live-proof/**`, UiPath hook docs/scripts                                    |
| 3           | RPA Portal Fallback Live-Smoke Hardening   | `019f1417-a274-7321-b8cf-f68151f7b2a9` | `/Users/abhinavgupta/.codex/worktrees/460e/Treatment Access` | `uipath/robots/**`, `apps/mock-payer-portal/**`, RPA readiness docs/scripts                                   |
| 4           | Command Center Live Proof UX               | `019f1417-fcf6-7e41-851c-fc5e2fd9c4ca` | `/Users/abhinavgupta/.codex/worktrees/8c4d/Treatment Access` | `apps/command-center/**`                                                                                      |
| 5           | Checkpoint 7 QA, Demo, and Submission      | `019f1418-4f58-72c3-ad1c-8f73e27d8189` | `/Users/abhinavgupta/.codex/worktrees/8790/Treatment Access` | `scripts/**`, `docs/**`, final smoke/readiness documentation                                                  |

Critical product framing:

- The demo should lead with healthcare value: less manual chart review, fewer
  preventable denials, faster submission, safer appeal preparation, and
  auditable human gates.
- The UI should remain a customer-facing product surface. Technical proof
  belongs in details, trace drawers, readiness logs, and docs.
- The custom UI visualizes governed state. UiPath remains the orchestration and
  governance layer.

Live side effects remain approval-gated:

- No live `uip agent debug` or live agent run/debug.
- No Maestro run/debug.
- No Action Center task creation, assignment, or completion.
- No Data Service/Data Fabric writes.
- No Orchestrator job start.
- No RPA run/debug or UiPath Assistant robot execution.
- No solution upload, publish, deploy, or activate.
- No IXP mutation.
- No payer submission.
