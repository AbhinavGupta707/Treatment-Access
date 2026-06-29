# Checkpoint 4 Orchestrator Runbook

## Purpose

This is the control document for the main orchestration session while Checkpoint
4 worktree lanes run in isolation.

Checkpoint 4 outcome: the demo becomes judge-walkthrough ready. Payer API
failure should drive a real UiPath robot fallback against the mock payer portal,
the Command Center should present a polished operational view of case state,
agent traces, fallback, denial rescue, and care continuity, and QA should prove
the API failure to robot fallback to event mirror to UI path as far as possible
without unapproved live side effects.

## Source Of Truth

- Project root: `/Users/abhinavgupta/Desktop/UiPath/Treatment Access`
- Integration branch: `main`
- Checkpoint 3 verified commit: `c37da07 Finalize checkpoint 3 integration`
- UiPath org logical name: `galacticus`
- UiPath tenant: `DefaultTenant`
- UiPath folder: `TreatmentAccessHackathon`
- UiPath folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Orchestration log: `docs/orchestration-log.md`
- Implementation plan: `treatment_access_command_center_implementation_plan.md`
- Project memory: `docs/AGENT_MEMORY.md`

## Lanes

| Merge order | Lane                          | Thread ID                              | Worktree path                                                | Ownership                                                                                |
| ----------- | ----------------------------- | -------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1           | Mock Payer Portal             | `019f10d2-fc7c-7e32-8acd-4f3a27e56f97` | `/Users/abhinavgupta/.codex/worktrees/48d8/Treatment Access` | `apps/mock-payer-portal/**`, portal-facing API contract notes                            |
| 2           | UiPath Robot & Runtime Wiring | `019f10d2-fc8a-7483-97a8-a79852aeb0a3` | `/Users/abhinavgupta/.codex/worktrees/8bba/Treatment Access` | `uipath/robots/**`, `uipath/solution/**`, robot/runtime setup docs                       |
| 3           | Command Center Demo UX        | `019f10d2-fcc0-70e2-a617-486b3e2af8c1` | `/Users/abhinavgupta/.codex/worktrees/2a44/Treatment Access` | `apps/command-center/**`, UI-facing types/helpers when needed                            |
| 4           | Integration QA & Demo Proof   | `019f10d2-fe34-77d3-85e8-84fc46ac8913` | `/Users/abhinavgupta/.codex/worktrees/6573/Treatment Access` | `scripts/**`, `docs/testing.md`, `docs/demo-script.md`, `uipath/screenshots/**`, QA docs |

## Monitoring Rules

- Heartbeat cadence: approximately every 90 seconds while active.
- Do not constantly message active workers.
- If a worker is active and not blocked, leave it alone.
- If a worker is blocked or asks for guidance, steer only inside its ownership boundary.
- If a worker completes, inspect its handoff, git status, log, and diff before merging.

## Merge Policy

Merge in dependency order:

1. Mock Payer Portal
2. UiPath Robot & Runtime Wiring
3. Command Center Demo UX
4. Integration QA & Demo Proof

After each merge:

```bash
CI=true pnpm verify:setup
git diff --check
```

After all Checkpoint 4 lanes are merged:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm seed
CI=true pnpm smoke:checkpoint1 -- --port 8878
CI=true pnpm smoke:agents
```

Then run any new Checkpoint 4 smoke or browser verification command added by
the QA lane. If a local browser/dev-server smoke is added, run it against both
the Command Center and mock payer portal.

## UiPath Run/Publish Safety

- Static validation, local file validation, command-surface probing, registry
  discovery, folder listing, and non-destructive setup checks may run
  autonomously.
- Do not run live `uip rpa run`, `uip rpa debug`, `uip or jobs start`,
  `uip solution upload`, `uip solution publish`, `uip solution deploy`,
  `uip solution deploy activate`, `uip maestro case debug`, `uip agent debug`,
  IXP project creation/upload/publish, Action Center task creation, Data Service
  writes, or payer submission without explicit user approval.
- If a lane reaches a UiPath skill hard stop, commit all local artifacts and
  report the exact next approval or command needed.
- Keep `TreatmentAccessHackathon` separate from `AgentFactoryDemo`.

## Runtime Baseline

- `uip --version`: `1.195.1`
- `uip login status --output json`: logged into `galacticus / DefaultTenant`.
- `uip solution init --help --output json`: post-rename `solution init`
  surface is available.
- `uip or folders list --output json`: `TreatmentAccessHackathon` is present
  with key `4fba2fa1-012b-469a-b6aa-e5be3811c173`.
- `uip or folders runtimes TreatmentAccessHackathon --output json`:
  `Development` runtime reports total `1`, connected `1`, available `1`.

## Integration Responsibilities

The orchestrator session owns:

- conflict resolution;
- API failure/fallback contract reconciliation across portal, robot, API, and UI;
- UiPath runtime-safety gating;
- browser/manual QA decision-making;
- final checkpoint verification;
- updates to `docs/orchestration-log.md`, `docs/AGENT_MEMORY.md`, and checkpoint
  testing docs;
- final commit and push to `main`.

## Stop Conditions

Pause and ask the user only if:

- a live UiPath publish/debug/run/deploy/create/write step needs explicit approval;
- a worker requires browser account action, new UiPath permission, paid setup, or
  manual Studio indication that cannot be represented safely in repo artifacts;
- a merge would require discarding work from another lane;
- UiPath/GitHub/package registry access is unavailable after retry with proper escalation;
- a lane discovers the checkpoint objective is technically impossible as specified.
