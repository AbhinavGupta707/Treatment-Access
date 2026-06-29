# Checkpoint 3 Orchestrator Runbook

## Purpose

This is the control document for the main orchestration session while Checkpoint 3 worktree lanes run in isolation.

Checkpoint 3 outcome: the Treatment Access case has seven distinct agent contracts/artifacts, deterministic local agent-output verification, extraction fallback readiness, and UiPath Agent Builder implementation notes far enough to move into live agent debug/runtime smoke with explicit approval for every side-effecting UiPath action.

## Source Of Truth

- Project root: `/Users/abhinavgupta/Desktop/UiPath/Treatment Access`
- Integration branch: `main`
- Checkpoint 2 verified commit: `9a78504 Finalize checkpoint 2 integration`
- UiPath folder: `TreatmentAccessHackathon`
- UiPath folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Orchestration log: `docs/orchestration-log.md`
- Implementation plan: `treatment_access_command_center_implementation_plan.md`
- Project memory: `docs/AGENT_MEMORY.md`

## Lanes

| Merge order | Lane                                    | Thread ID | Worktree path | Ownership                                                                                                                 |
| ----------- | --------------------------------------- | --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1           | Shared Agent Contracts & Runtime        | TBD       | TBD           | `packages/shared-schemas/**`, `packages/agent-runtime/**`, agent smoke scripts                                            |
| 2           | Policy/Evidence/Missing Evidence Agents | TBD       | TBD           | `uipath/agents/coverage-requirement/**`, `uipath/agents/evidence-retrieval/**`, `uipath/agents/missing-evidence/**`       |
| 3           | Submission/Denial/Appeal Agents         | TBD       | TBD           | `uipath/agents/submission-packet/**`, `uipath/agents/denial-rescue/**`, `uipath/agents/appeal-packet/**`                  |
| 4           | Care Continuity/Audit/Extraction        | TBD       | TBD           | `uipath/agents/care-continuity/**`, `uipath/agents/audit-packet/**`, `uipath/agents/extraction/**`, extraction setup docs |

## Monitoring Rules

- Heartbeat cadence: approximately every 90 seconds while active.
- Do not constantly message active workers.
- If a worker is active and not blocked, leave it alone.
- If a worker is blocked or asks for guidance, steer only inside its ownership boundary.
- If a worker completes, inspect its handoff, git status, log, and diff before merging.

## Merge Policy

Merge in dependency order:

1. Shared Agent Contracts & Runtime
2. Policy/Evidence/Missing Evidence Agents
3. Submission/Denial/Appeal Agents
4. Care Continuity/Audit/Extraction

After each merge:

```bash
CI=true pnpm verify:setup
git diff --check
```

After all Checkpoint 3 lanes are merged:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm seed
CI=true pnpm smoke:checkpoint1 -- --port 8878
```

Then run any new Checkpoint 3 agent smoke/eval command added by the lanes.

## UiPath Run/Publish Safety

- Static validation, local file validation, registry discovery, folder listing, and non-destructive setup checks may run autonomously.
- Do not run live `uip agent debug`, `uip solution upload`, `uip solution publish`, `uip solution deploy`, `uip maestro case debug`, IXP project creation/upload/publish, Action Center task creation, or Data Service writes without explicit user approval.
- If a lane reaches a UiPath skill hard stop, commit all local artifacts and report the exact next approval or command needed.
- Keep `TreatmentAccessHackathon` separate from `AgentFactoryDemo`.

## Integration Responsibilities

The orchestrator session owns:

- conflict resolution;
- seven-agent contract reconciliation;
- shared schema and local simulator consistency;
- extraction fallback and IXP-readiness wording;
- final checkpoint verification;
- updates to `docs/orchestration-log.md`, `docs/AGENT_MEMORY.md`, and checkpoint testing docs;
- final commit and push to `main`.

## Stop Conditions

Pause and ask the user only if:

- a live UiPath publish/debug/run/deploy/create step needs explicit approval;
- a worker requires browser account action, new UiPath permission, or paid/external setup;
- a merge would require discarding work from another lane;
- UiPath/GitHub/package registry access is unavailable after retry with proper escalation;
- a lane discovers the checkpoint objective is technically impossible as specified.
