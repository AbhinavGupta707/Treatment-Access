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

## Next Checkpoint

Checkpoint 3 orchestration is being launched from the verified Checkpoint 2 `main` state.

Base commit: `9a78504 Finalize checkpoint 2 integration`.

Control runbook: `docs/checkpoint-3-orchestrator.md`.

Active lanes:

| Lane                                    | Thread ID                              | Worktree path                                                |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Shared Agent Contracts & Runtime        | `019f10b3-b8cb-7911-96d9-b1f186c15717` | `/Users/abhinavgupta/.codex/worktrees/64e0/Treatment Access` |
| Policy/Evidence/Missing Evidence Agents | `019f10b4-1074-76b1-871e-4e59780e4bd0` | `/Users/abhinavgupta/.codex/worktrees/00e2/Treatment Access` |
| Submission/Denial/Appeal Agents         | `019f10b4-6b34-77c2-98de-1aab237a998a` | `/Users/abhinavgupta/.codex/worktrees/f839/Treatment Access` |
| Care Continuity/Audit/Extraction        | `019f10b4-cda5-73a1-8ec4-cad9b3470ac4` | `/Users/abhinavgupta/.codex/worktrees/04aa/Treatment Access` |

Runtime safety remains unchanged: live UiPath agent debug, publish/deploy/upload, IXP project mutation, Action Center task creation, Maestro debug, and Data Service writes require explicit user approval. Checkpoint 3 workers may perform static/local authoring and read-only UiPath discovery.
