# Checkpoint 2 Orchestrator Runbook

## Purpose

This is the control document for the main orchestration session while Checkpoint 2 worktree lanes run in isolation.

Status: closed after final integration on 2026-06-29.

Checkpoint 2 outcome: UiPath becomes the live orchestration source for the Treatment Access case. A Maestro Case shape, Data Fabric/Data Service state plan, API Workflow integration surface, Action Center review gates, and intake/launch path are created and validated far enough that the integrated system can advance into live UiPath runtime smoke with explicit consent for any side-effecting run/publish step.

## Source Of Truth

- Project root: `/Users/abhinavgupta/Desktop/UiPath/Treatment Access`
- Integration branch: `main`
- Checkpoint 1 verified commit: `799e0c1 Finalize checkpoint 1 integration`
- Checkpoint 2 launch commit: `27ff4f6 Launch checkpoint 2 orchestration`
- UiPath folder: `TreatmentAccessHackathon`
- UiPath folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Orchestration log: `docs/orchestration-log.md`
- Implementation plan: `treatment_access_command_center_implementation_plan.md`
- Project memory: `docs/AGENT_MEMORY.md`

## Lanes

| Merge order | Lane                 | Thread ID                              | Worktree path                                                | Ownership                                     |
| ----------- | -------------------- | -------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| 1           | Maestro/Data Service | `019f1084-f0bc-7bd3-a9fe-7cb4d7cab18b` | `/Users/abhinavgupta/.codex/worktrees/ccc5/Treatment Access` | `uipath/maestro/**`, `uipath/data-service/**` |
| 2           | API Workflows        | `019f1085-484a-7b12-badf-31919d339e04` | `/Users/abhinavgupta/.codex/worktrees/a6c0/Treatment Access` | `uipath/api-workflows/**`                     |
| 3           | Action Center        | `019f1085-9b20-7680-aaaf-3491421897d5` | `/Users/abhinavgupta/.codex/worktrees/75e4/Treatment Access` | `uipath/action-center/**`                     |
| 4           | Apps/Intake          | `019f1086-19a4-7871-ab0b-0941097ea50f` | `/Users/abhinavgupta/.codex/worktrees/37c3/Treatment Access` | `uipath/apps/**`, intake docs only            |

Final integration results:

- Maestro/Data Service merged from worker commit `c1f0460`.
- API Workflows merged from worker commit `33e27a4`.
- Action Center was sanitized and integrated as `1237dc0`.
- Apps/Intake merged from worker commit `87aaa60`.
- Cross-lane launch contract reconciliation landed in `92c2d37`.

## Monitoring Rules

- Heartbeat cadence: approximately every 90 seconds while active.
- Do not constantly message active workers.
- On each heartbeat, inspect thread status and recent summaries first.
- Only steer a worker when it is blocked, violating ownership, or requesting integration guidance.
- If a worker is idle or reports completion, inspect its worktree before merging.

## Merge Policy

Merge in dependency order:

1. Maestro/Data Service
2. API Workflows
3. Action Center
4. Apps/Intake

Hold a later lane if it depends on an earlier local contract that is not integrated yet.

After each merge:

```bash
CI=true pnpm verify:setup
git diff --check
```

After all Checkpoint 2 lanes are merged:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm seed
CI=true pnpm smoke:checkpoint1 -- --port 8877
```

Then run any new Checkpoint 2 local validation or smoke command added by the lanes.

## UiPath Run/Publish Safety

- Static validation, registry discovery, folder listing, and non-destructive setup checks may run autonomously.
- Do not run `uip maestro case debug` automatically.
- Do not run side-effecting workflow execution or publish/deploy commands unless the user has explicitly approved the exact action.
- If a lane reaches a hard stop from a UiPath skill, it should commit all local artifacts and report the exact next command or approval needed.
- Keep `TreatmentAccessHackathon` separate from `AgentFactoryDemo`.

## Integration Responsibilities

The orchestrator session owns:

- conflict resolution;
- Data Fabric/API Workflow/Case/App contract reconciliation;
- final checkpoint verification;
- updates to `docs/orchestration-log.md`, `docs/AGENT_MEMORY.md`, and checkpoint testing docs;
- final commit and push to `main`.

## Stop Conditions

Pause and ask the user only if:

- a live UiPath publish/debug/run step needs explicit approval;
- a worker requires a browser account action, new UiPath permission, or paid/external setup;
- a merge would require discarding work from another lane;
- UiPath/GitHub/package registry access is unavailable after retry with proper escalation;
- a lane discovers the checkpoint objective is technically impossible as specified.
