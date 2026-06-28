# Checkpoint 1 Orchestrator Runbook

## Purpose

This is the control document for the main orchestration session while Checkpoint 1 worktree lanes run in isolation.

Checkpoint 1 outcome: UiPath can call live mock endpoints and the Command Center can display event-backed case state.

## Source Of Truth

- Project root: `/Users/abhinavgupta/Desktop/UiPath/Treatment Access`
- Integration branch: `main`
- Worker base commit: `e2dcce8 Document UiPath project runtime assignment`
- Launch-log commit on main: `cb56adc Launch checkpoint 1 orchestration lanes`
- Heartbeat automation: `treatment-access-checkpoint-1-orchestrator`
- Orchestration log: `docs/orchestration-log.md`
- Implementation plan: `treatment_access_command_center_implementation_plan.md`

## Active Lanes

| Merge order | Lane                      | Thread ID                              | Worktree path                                                |
| ----------- | ------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| 1           | Demo Data & Fixture       | `019f105f-d13c-7021-b53a-740ffa29e38a` | `/Users/abhinavgupta/.codex/worktrees/a333/Treatment Access` |
| 2           | Mock Healthcare API       | `019f105f-90ac-7ee3-be9b-7854e00e8dee` | `/Users/abhinavgupta/.codex/worktrees/17fd/Treatment Access` |
| 3           | QA/Reset                  | `019f1060-44e8-73d1-9457-568ed29838f0` | `/Users/abhinavgupta/.codex/worktrees/1b65/Treatment Access` |
| 4           | Command Center Data Shell | `019f1060-0b18-7b31-8cda-bb5778f445da` | `/Users/abhinavgupta/.codex/worktrees/f760/Treatment Access` |

## Monitoring Rules

- Heartbeat cadence: approximately every 90 seconds while active.
- Do not constantly message active workers.
- On each heartbeat, inspect thread status and recent summaries first.
- Only steer a worker when it is blocked, violating ownership, or requesting integration guidance.
- If a worker is still active and has no obvious blocker, leave it alone.
- If a worker is idle or reports completion, inspect its worktree before merging.

## Review Commands

For a completed lane, run:

```bash
git -C "<WORKTREE>" status --short
git -C "<WORKTREE>" log --oneline -5
git -C "<WORKTREE>" diff --stat e2dcce8...HEAD
git -C "<WORKTREE>" diff e2dcce8...HEAD -- <owned-paths>
```

Then run the lane-specific checks from the worker prompt.

## Merge Policy

Merge in dependency order:

1. Demo Data & Fixture
2. Mock Healthcare API
3. QA/Reset
4. Command Center Data Shell

If a later lane completes first, review it but hold the merge unless it is independent of earlier contract changes.

After each merge:

```bash
CI=true pnpm verify:setup
git diff --check
```

After all Checkpoint 1 lanes are merged:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm seed
```

Also run the new checkpoint smoke command if the QA lane adds one.

## Integration Responsibilities

The orchestrator session owns:

- conflict resolution;
- schema/API/UI contract reconciliation;
- final checkpoint verification;
- updates to `docs/orchestration-log.md`, `docs/AGENT_MEMORY.md`, and any checkpoint testing docs;
- final commit and push to `main`.

## Stop Conditions

Pause and ask the user only if:

- a worker requires a secret, browser account action, or paid/external setup;
- a merge would require discarding work from another lane;
- UiPath/GitHub/package registry access is unavailable after retry with proper escalation;
- a lane discovers the checkpoint objective is technically impossible as specified.
