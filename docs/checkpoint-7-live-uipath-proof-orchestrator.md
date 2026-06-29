# Checkpoint 7 Live UiPath Proof Orchestrator

## Objective

Build a narrow live proof slice for the Treatment Access Command Center:

- A user can start one synthetic treatment-access live proof run from the
  premium Command Center UI.
- Fireworks-backed agents execute real schema-bounded work for the run.
- LangSmith trace metadata or trace URLs are captured when available.
- The UI displays governed synthetic events and proof source labels.
- UiPath remains the orchestration and governance layer, with all live side
  effects gated by explicit user approval.

## Workspace

- Workspace: `/Users/abhinavgupta/Desktop/UiPath/Treatment Access`
- Integration branch: `main`
- Planning base before Checkpoint 7 docs: `ee13d47`
- Checkpoint 7 prep commit: `02ddaf0`
- Project memory: `docs/AGENT_MEMORY.md`
- Orchestration log: `docs/orchestration-log.md`
- Live proof plan: `docs/live-uipath-proof-plan.md`
- Checkpoint 6 plan: `docs/live-agentic-product-plan.md`
- Product implementation plan:
  `treatment_access_command_center_implementation_plan.md`

## Lane Plan

| Merge order | Lane                                       | Thread ID                              | Worktree path                                                | Ownership                                                                                                     | Goal                                                                                                                                   |
| ----------- | ------------------------------------------ | -------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1           | Live Proof Schemas, API, and Agent Runtime | `019f1416-f3a2-7fe3-b026-975286bded43` | `/Users/abhinavgupta/.codex/worktrees/4428/Treatment Access` | `packages/shared-schemas/**`, `packages/agent-runtime/**`, `services/mock-healthcare-api/**`, focused scripts | Add the live proof run contract, backend runner, event writes, live Fireworks execution, LangSmith metadata capture, and smoke script. |
| 2           | UiPath Coded Agent and Governed Hooks      | `019f1417-4829-74f3-a071-8e45f0887c1a` | `/Users/abhinavgupta/.codex/worktrees/be2c/Treatment Access` | `uipath/coded-agents/**`, `uipath/live-proof/**`, UiPath hook docs/scripts                                    | Add safe wrappers and authoring artifacts for UiPath-owned live proof state without running side effects by default.                   |
| 3           | RPA Portal Fallback Live-Smoke Hardening   | `019f1417-a274-7321-b8cf-f68151f7b2a9` | `/Users/abhinavgupta/.codex/worktrees/460e/Treatment Access` | `uipath/robots/**`, `apps/mock-payer-portal/**`, RPA readiness docs/scripts                                   | Harden the synthetic portal fallback proof, local validation, and mirror event contract.                                               |
| 4           | Command Center Live Proof UX               | `019f1417-fcf6-7e41-851c-fc5e2fd9c4ca` | `/Users/abhinavgupta/.codex/worktrees/8c4d/Treatment Access` | `apps/command-center/**`                                                                                      | Add a product-clear live proof action, progress view, trace/evidence detail surfaces, and no-overclaim wording.                        |
| 5           | Checkpoint 7 QA, Demo, and Submission      | `019f1418-4f58-72c3-ad1c-8f73e27d8189` | `/Users/abhinavgupta/.codex/worktrees/8790/Treatment Access` | `scripts/**`, `docs/**`, final smoke/readiness documentation                                                  | Add final smoke/readiness gates and demo language that explains healthcare value before technical mechanics.                           |

## Lane Requirements

### Live Proof Schemas, API, and Agent Runtime

- Define `LiveProofRun`, `LiveProofStep`, `LiveProofTrace`,
  `LiveProofApprovalGate`, and `UiPathEvidenceRef` contracts.
- Add a no-secret live proof runner that can be invoked by a local script or
  API endpoint.
- Execute the existing seven-agent workflow in `AGENT_MODE=live` when live keys
  are present.
- Require schema validation for each agent output.
- Emit synthetic event mirror records for the visible run timeline.
- Add `smoke:checkpoint7-live-proof` or the implementation needed by the QA
  lane to wire it.

### UiPath Coded Agent and Governed Hooks

- Follow local UiPath skills and official docs for Coded Agent, Action Center,
  Data Service, Orchestrator, Maestro, RPA, and Solution lifecycle work.
- Diagnose in layer order: discovery/registration/install state first,
  activation flows second, permissions/runtime last.
- Add safe wrappers and docs for approved live proof actions.
- Do not run live side-effect commands.
- Keep `TreatmentAccessHackathon` separate from `AgentFactoryDemo`.

### RPA Portal Fallback Live-Smoke Hardening

- Keep the mock payer portal synthetic-only.
- Make local portal confirmation and mirror event semantics explicit.
- Validate/build/pack dry-run only unless the user approves live robot work.
- Ensure portal state never implies a real payer submission.

### Command Center Live Proof UX

- The main screen should feel like a customer product, not an engineering
  console.
- The primary CTA should be obvious and plain-language.
- Show live proof status, human approval gate, agent activity, and value to
  staff in simple terms.
- Put trace/provider/UiPath evidence behind detail surfaces.
- Verify desktop and mobile no-overflow.

### Checkpoint 7 QA, Demo, and Submission

- Add or update smoke/readiness scripts.
- Update docs so claims match evidence.
- Update demo script to lead with value: less manual chart review, fewer
  preventable denials, faster submission, safer appeals, and auditable human
  gates.
- Check no secret values are printed or committed.

## Safety Gates

Do not run any of these without explicit user approval in the orchestrator
thread:

- `uip agent debug` or live agent run/debug.
- Maestro run/debug.
- Action Center task creation, assignment, or completion.
- Data Service/Data Fabric writes.
- Orchestrator job start.
- RPA run/debug or UiPath Assistant robot execution.
- Solution upload, publish, deploy, or activate.
- IXP mutation.
- Payer submission.

Allowed without extra approval:

- Read-only discovery.
- Local static validation.
- Local builds.
- Dry-run packaging.
- No-side-effect provider/readiness checks that do not print secrets.

## Merge and Verification Flow

Merge only after review, in this order:

1. Live Proof Schemas, API, and Agent Runtime.
2. UiPath Coded Agent and Governed Hooks.
3. RPA Portal Fallback Live-Smoke Hardening.
4. Command Center Live Proof UX.
5. Checkpoint 7 QA, Demo, and Submission.

After each merge, run from the integration worktree:

```bash
CI=true pnpm verify:setup
git diff --check
```

After all lanes merge, run:

```bash
CI=true pnpm verify
CI=true pnpm format:check
CI=true pnpm verify:checkpoint6
CI=true pnpm smoke:agents
CI=true pnpm smoke:checkpoint6-live-providers
CI=true pnpm smoke:live-agents -- --require-live --call-model
CI=true pnpm smoke:checkpoint6-ui
CI=true pnpm smoke:checkpoint7-live-proof
CI=true pnpm uipath:readiness local
git diff --check
```

Use browser or Chrome testing for the redesigned live proof UI and the mock
payer portal if available.

## Heartbeat Behavior

1. Inspect the integration worktree and the five lane thread statuses.
2. Do not message active workers that are not blocked.
3. If a worker is blocked or asking for guidance, steer only within that lane's
   ownership.
4. If a worker is idle or complete, read its handoff, inspect git status/log/diff
   in its worktree, and run lane-specific checks.
5. Hold later lanes if earlier contract-producing lanes are not integrated yet.
6. Patch small cross-lane integration gaps directly on `main` when clearly
   integration-owned.
7. Update `docs/orchestration-log.md` and `docs/AGENT_MEMORY.md` with merges,
   checks, evidence, risks, and next state.
8. Commit and push verified integration changes.

## Stop Conditions

Stop and ask the user before proceeding if:

- The next required step needs a live side-effecting UiPath command.
- A UiPath feature is absent after discovery/install/official activation checks
  and needs user action in the cloud UI.
- Live provider keys are missing or invalid and no deterministic equivalent can
  prove the contract.
- Real patient, payer, provider, credential, or health data would be needed.
- Worker outputs create conflicting contracts that cannot be safely reconciled.

## Launch Checklist

- [x] Commit Checkpoint 7 planning and control docs.
- [x] Spawn the five lane worktree sessions from the prep commit.
- [x] Record thread IDs and worktree paths in this runbook and project memory.
- [x] Begin heartbeat monitoring and merge only after lane review.
- [x] Merge all five lanes to `main` in planned order.
- [x] Patch cross-lane integration gaps in the integration worktree.
- [x] Run final no-side-effect verification and record remaining live approval
      gates.
