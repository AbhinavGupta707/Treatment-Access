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
