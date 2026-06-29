# Checkpoint 8 Live UiPath Final Orchestrator

## Objective

Checkpoint 8 is the final checkpoint. It should turn the Checkpoint 7 product
proof into a live UiPath Automation Cloud proof that is defensible under the
UiPath AgentHack judging criteria.

The target is not a broad production deployment. The target is a narrow,
visible, synthetic, live UiPath proof:

- UiPath Automation Cloud in `TreatmentAccessHackathon` visibly owns at least
  one case/event transition.
- The Command Center displays that proof as governed state.
- The final demo can show agents, people, robots/APIs, exceptions, and audit
  evidence without overclaiming.

## Workspace

- Workspace: `/Users/abhinavgupta/Desktop/UiPath/Treatment Access`
- Integration branch: `main`
- Checkpoint 8 base commit: `7c4d233`
- Project memory: `docs/AGENT_MEMORY.md`
- Orchestration log: `docs/orchestration-log.md`
- Final execution plan: `docs/live-uipath-final-execution-plan.md`
- Previous live proof plan: `docs/live-uipath-proof-plan.md`
- Final build spec: `treatment_access_command_center_final_build_spec.md`

## Lane Plan

| Merge order | Lane                                                    | Ownership                                                                                                                       | Goal                                                                                                                   | Thread ID                              | Worktree path                                                |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| 1           | Cloud Discovery, Permissions, and Approval Matrix       | `docs/**`, `scripts/**`, read-only `uip` probes                                                                                 | Produce exact tenant/folder/product discovery, side-effect approval matrix, and final live proof decision tree.        | `019f1460-9441-7b61-bd2b-99f549af25d6` | `/Users/abhinavgupta/.codex/worktrees/6f77/Treatment Access` |
| 2           | UiPath Event State and Data Service Bridge              | `uipath/data-service/**`, `uipath/live-proof/**`, `services/mock-healthcare-api/**`, `packages/shared-schemas/**`, `scripts/**` | Make at least one UiPath-written synthetic event/case-state path verifiable and distinguishable from local-only state. | `019f1460-9666-7403-903f-0b2ca513f2e3` | `/Users/abhinavgupta/.codex/worktrees/8cbc/Treatment Access` |
| 3           | Action Center Human Gate Proof                          | `uipath/action-center/**`, `uipath/live-proof/**`, `apps/command-center/**`, `scripts/**`, docs                                 | Prepare live task creation/read/complete proof or a documented UiPath-controlled fallback with UI evidence.            | `019f1460-9235-76a0-9821-043542d0f7a6` | `/Users/abhinavgupta/.codex/worktrees/46af/Treatment Access` |
| 4           | Orchestrator RPA Portal Fallback Proof                  | `uipath/robots/**`, `uipath/solution/**`, `apps/mock-payer-portal/**`, `scripts/**`, docs                                       | Prepare publish/run/job proof for `PayerPortalFallback` against the synthetic portal and confirmation write-back.      | `019f1460-9487-75f2-898d-f8aab81f0ab3` | `/Users/abhinavgupta/.codex/worktrees/8ca5/Treatment Access` |
| 5           | Final Demo UX, Evidence Manifest, and Submission Claims | `apps/command-center/**`, `README.md`, `docs/**`, `uipath/screenshots/**`, `scripts/**`                                         | Make final demo flow and submission wording match live proof evidence, with no overclaims.                             | `019f1460-96bc-7e13-93ed-7e9dc3dcf2fd` | `/Users/abhinavgupta/.codex/worktrees/5299/Treatment Access` |

## Required Worker Rules

- Read `AGENTS.md`, this runbook, and
  `docs/live-uipath-final-execution-plan.md` first.
- Follow local UiPath skills before touching UiPath artifacts.
- Diagnose in layer order: discovery/install/registration, then activation,
  then permissions/runtime.
- Use only synthetic data.
- Do not run any live side-effecting UiPath command without explicit approval
  from the main orchestrator thread.
- Keep `TreatmentAccessHackathon` separate from `AgentFactoryDemo`.
- Do not commit secrets, generated caches, screenshots with secrets, or real
  patient/payer/provider data.

## Live Side-Effect Gate

These commands/actions require explicit user approval before any worker or
orchestrator runs them:

- `uip agent debug`, `uip agent run`, `uip codedagent run/debug/invoke/deploy`.
- Maestro run/debug.
- Action Center task creation, assignment, completion, or mutation.
- Data Service/Data Fabric entity or record creation/update/delete.
- Orchestrator job start/stop, queue item creation, process/release mutation.
- RPA run/debug or UiPath Assistant robot execution.
- Solution upload, publish, deploy, activate, or uninstall.
- IXP mutation.
- Payer submission, even to a non-synthetic external system.

Allowed before approval:

- Read-only discovery.
- Local static validation/build.
- Solution pack dry-run.
- No-secret provider readiness.
- Script/runbook authoring.

## Merge Order

Merge only after lane review, in this order:

1. Cloud Discovery, Permissions, and Approval Matrix.
2. UiPath Event State and Data Service Bridge.
3. Action Center Human Gate Proof.
4. Orchestrator RPA Portal Fallback Proof.
5. Final Demo UX, Evidence Manifest, and Submission Claims.

Hold later lanes if earlier lanes change the live proof source-of-truth
contract.

## Verification

After each merge:

```bash
CI=true pnpm verify:setup
git diff --check
```

Final no-side-effect verification:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm smoke:checkpoint7-live-proof
CI=true pnpm smoke:agents
CI=true pnpm verify:checkpoint6
CI=true pnpm uipath:readiness local
CI=true pnpm uipath:readiness cloud
git diff --check
```

Checkpoint 8 lanes should add a final smoke/readiness command, expected shape:

```bash
CI=true pnpm smoke:checkpoint8-live-uipath
```

Live proof verification after explicit approval should record:

- UiPath folder/org/tenant.
- record/task/job/deploy identifiers.
- timestamp and actor.
- Command Center evidence.
- reset/rollback notes.
- demo wording updates.

## Stop Conditions

Stop and ask the user if:

- a live side-effect command is required;
- `TreatmentAccessHackathon` is not the active folder;
- a required UiPath feature is absent after discovery/activation checks;
- a permission or license blocker prevents the minimum final proof;
- any step would need real PHI, real payer credentials, or a real payer
  submission;
- workers produce conflicting source-of-truth contracts.

## Launch Checklist

- [x] Reconcile Checkpoint 7 and push `main`.
- [x] Create Checkpoint 8 final execution plan.
- [x] Commit Checkpoint 8 prep docs.
- [x] Spawn five Checkpoint 8 lane worktrees.
- [x] Record thread IDs/worktree paths in project memory.
- [x] Begin heartbeat monitoring.
