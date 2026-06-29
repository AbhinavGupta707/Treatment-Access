# Checkpoint 8 Lane Handoff: Final Demo UX, Evidence Manifest, And Submission Claims

## Scope

Prepared the final judge-facing product layer for Treatment Access Command
Center without running live UiPath side effects. The main screen now stays
healthcare-value first, while UiPath task/job/record proof is contained in the
proof manifest drawer.

## Changes

- Added a Command Center proof manifest surface for folder
  `TreatmentAccessHackathon`, folder ID `7986316`, folder key
  `4fba2fa1-012b-469a-b6aa-e5be3811c173`, event/record ID, task ID, job ID,
  confirmation ID, source labels, timestamp, and safety status.
- Normalized shared `LiveProofRun` API responses into the Command Center drawer
  shape so deterministic runtime proof does not render blank fields.
- Updated proof copy to say "ready for live UiPath proof" when live execution
  has not run.
- Updated README, demo script, submission package, testing docs, deck outline,
  and screenshot manifest to separate Local Synthetic Proof, live provider
  proof, and Live UiPath Proof.
- Added `CI=true pnpm smoke:checkpoint8-live-uipath`, a no-side-effect final
  readiness smoke.

## Remaining Live Evidence Placeholders

- Action Center task ID remains pending until approved live task creation.
- Data Service/event record ID remains local/ready unless a live UiPath write is
  approved and captured.
- Orchestrator job ID remains pending until approved robot/job execution.
- Portal confirmation ID is local synthetic unless written back by an approved
  UiPath robot path.
- Solution upload/publish/deploy/activate remains approval-gated.

## Integration Notes

- The Command Center still treats UiPath as the governance/source-of-truth layer.
  The UI visualizes proof records; it does not claim to write live case state.
- The new smoke intentionally does not call UiPath Cloud, create records, create
  Action Center tasks, start jobs, run robots, deploy solutions, or submit to a
  payer.
- If a later lane provides live UiPath IDs, feed them through the existing live
  proof run contract or event mirror and they will appear in the manifest.

## Verification

Run:

```bash
CI=true pnpm --filter @tacc/command-center typecheck
CI=true pnpm --filter @tacc/command-center build
CI=true pnpm verify:submission-readiness
CI=true pnpm smoke:checkpoint8-live-uipath
CI=true pnpm format:check
git diff --check
```
