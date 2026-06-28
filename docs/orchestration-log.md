# Orchestration Log

## 2026-06-28 - Checkpoint 0 Setup

Base folder:

```text
/Users/abhinavgupta/Desktop/UiPath/Treatment Access
```

UiPath setup verified:

- Organization: `galacticus`
- Tenant: `DefaultTenant`
- Project folder: `TreatmentAccessHackathon`
- Folder ID: `7986316`
- Folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Assistant installed and running
- Action Center task user visible
- Connected workspace machine assigned to `TreatmentAccessHackathon`
- Folder runtime now reports `Development: Total 1, Connected 1, Available 1`
- The tenant's single `Unattended` license remains unallocated for now

Checkpoint 0 goal:

- initialize git;
- link GitHub remote;
- create monorepo skeleton;
- add docs and setup verification;
- create a clean baseline commit before launching worktree lanes.

No worktree lanes had been launched at the end of Checkpoint 0.

Checkpoint 0 is ready for Checkpoint 1 orchestration.

## 2026-06-28 - Checkpoint 1 Launch

Base commit:

```text
e2dcce8 Document UiPath project runtime assignment
```

Launched worktree lanes:

| Lane                      | Thread ID                              | Worktree path                                                | Ownership                                             |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| Mock Healthcare API       | `019f105f-90ac-7ee3-be9b-7854e00e8dee` | `/Users/abhinavgupta/.codex/worktrees/17fd/Treatment Access` | `services/mock-healthcare-api/**`                     |
| Demo Data & Fixture       | `019f105f-d13c-7021-b53a-740ffa29e38a` | `/Users/abhinavgupta/.codex/worktrees/a333/Treatment Access` | `packages/demo-data/**`, `packages/shared-schemas/**` |
| Command Center Data Shell | `019f1060-0b18-7b31-8cda-bb5778f445da` | `/Users/abhinavgupta/.codex/worktrees/f760/Treatment Access` | `apps/command-center/**`                              |
| QA/Reset                  | `019f1060-44e8-73d1-9457-568ed29838f0` | `/Users/abhinavgupta/.codex/worktrees/1b65/Treatment Access` | `scripts/**`, checkpoint testing docs                 |

Merge order:

1. Demo Data & Fixture
2. Mock Healthcare API
3. QA/Reset
4. Command Center Data Shell

Integration target: `main`.

Control runbook: `docs/checkpoint-1-orchestrator.md`.

Heartbeat automation: `treatment-access-checkpoint-1-orchestrator`.

Main branch launch-log commit:

```text
cb56adc Launch checkpoint 1 orchestration lanes
```

## 2026-06-28 - Checkpoint 1 Partial Integration

Merged lanes:

| Lane                | Worker commit | Integration result |
| ------------------- | ------------- | ------------------ |
| Demo Data & Fixture | `c9d4e42`     | Merged into `main` |
| Mock Healthcare API | `e978bcf`     | Merged into `main` |
| QA/Reset            | `20efb54`     | Merged into `main` |

Active lane still running:

| Lane                      | Thread ID                              | Worktree path                                                |
| ------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Command Center Data Shell | `019f1060-0b18-7b31-8cda-bb5778f445da` | `/Users/abhinavgupta/.codex/worktrees/f760/Treatment Access` |

Integration patches applied:

- Updated mock API test expectation for the enriched synthetic patient label.
- Updated `active_secondary_stages` values to use shared-schema secondary stage flags.
- Updated `scripts/verify-demo.ts` so the smoke test checks payer API unavailable fallback and denial-reason behavior as two separate payer states.

Checks run after integration:

- `CI=true pnpm --filter @tacc/shared-schemas test`
- `CI=true pnpm --filter @tacc/demo-data test`
- `CI=true pnpm build:contracts`
- `CI=true pnpm --filter @tacc/mock-healthcare-api test`
- `CI=true pnpm --filter @tacc/mock-healthcare-api typecheck`
- `CI=true pnpm --filter @tacc/mock-healthcare-api build`
- `CI=true pnpm verify:setup`
- `CI=true pnpm format:check`
- `git diff --check`
- `CI=true pnpm test`
- `CI=true pnpm smoke:checkpoint1 -- --port 8877`

Note: the default smoke port `8787` was already occupied by a local API process, so the integrated smoke was verified on alternate port `8877`.

## 2026-06-28 - Checkpoint 1 Final Integration

Merged final lane:

| Lane                      | Worker commit | Integration result |
| ------------------------- | ------------- | ------------------ |
| Command Center Data Shell | `a86bc68`     | Merged into `main` |

Integration patches applied:

- Updated the Command Center API-unavailable fallback to use the enriched shared contract: valid secondary stage flags, patient synthetic disclaimer fields, required toggle fields, payer unavailable status, and citation-backed fallback evidence mappings.
- Updated the evidence matrix rendering so both legacy string spans and structured source spans display cleanly.

Final checks passed:

- `CI=true pnpm verify:setup`
- `git diff --check`
- `CI=true pnpm --filter @tacc/command-center typecheck`
- `CI=true pnpm --filter @tacc/command-center build`
- `CI=true pnpm verify`
- `CI=true pnpm format:check`
- `CI=true pnpm seed`
- `CI=true pnpm smoke:checkpoint1 -- --port 8877`

Checkpoint 1 result:

- Enriched synthetic fixture contracts are available for UiPath workflow lanes.
- Mock healthcare API exposes live local endpoints for demo state, reset, toggles, payer decisions, pharmacy handoff, and events.
- Repeatable seed/reset/smoke tooling is in place.
- Command Center renders an API-backed operations console with honest fallback behavior.

Known note: rendered browser screenshot capture remained unavailable in the Codex environment because the in-app browser backend was not discovered and Playwright is not installed in this repo. Build and live HTTP smoke coverage passed.

Next checkpoint: start UiPath Core Case Integration from the verified `main` branch.

## 2026-06-29 - Checkpoint 2 Launch Prep

Starting point:

```text
799e0c1 Finalize checkpoint 1 integration
```

Checkpoint 2 outcome:

- Create the UiPath core case integration layer: Maestro Case/Data Service shape, API Workflow calls into the mock healthcare API, Action Center review gates, and an intake/launch path.
- Keep UiPath as the orchestration and governance source. The Command Center should visualize UiPath-written state/events rather than becoming the runtime system of record.

Planned isolated lanes:

| Merge order | Lane                 | Ownership                                     |
| ----------- | -------------------- | --------------------------------------------- |
| 1           | Maestro/Data Service | `uipath/maestro/**`, `uipath/data-service/**` |
| 2           | API Workflows        | `uipath/api-workflows/**`                     |
| 3           | Action Center        | `uipath/action-center/**`                     |
| 4           | Apps/Intake          | `uipath/apps/**`, intake docs only            |

Control runbook: `docs/checkpoint-2-orchestrator.md`.

UiPath baseline checks before launch:

- `uip --version` reports `1.195.1`.
- `uip login status --output json` reports org `galacticus`, tenant `DefaultTenant`.
- `uip or folders list --output json` includes `TreatmentAccessHackathon` with key `4fba2fa1-012b-469a-b6aa-e5be3811c173`.
- Installed/registered command surfaces include `maestro case`, `api-workflow`, `tasks`, `df`, and `codedapp`.

Runtime safety:

- Workers may run static validation and non-destructive discovery.
- Workers must not run live Maestro debug, side-effecting workflow execution, publish, or deploy steps without explicit user approval.
