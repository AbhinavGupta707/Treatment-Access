# Checkpoint 8 Lane Handoff: Action Center Human Gate Proof

## Summary

Prepared the H2 Action Center proof packet without live task side effects. The
lane defines the synthetic clinician validation payload, records read-only
Action Center discovery, provides exact approval-gated assignment/completion
commands, and documents the UiPath-controlled fallback label if task creation is
blocked by tenant capabilities.

## Files Changed

- `uipath/action-center/live-proof/clinician-validation-task-payload.json`
- `uipath/live-proof/action-center-human-gate-proof.manifest.json`
- `docs/action-center-live-proof.md`
- `docs/checkpoint-8-lane-handoffs/action-center-gate.md`
- `scripts/verify-checkpoint8-action-center-proof.ts`
- `package.json`
- `uipath/action-center/README.md`

## Read-Only Commands Run

```bash
uip login status --output json
uip tasks users 7986316 --output json
uip tasks list --folder-id 7986316 --output json
uip tasks --help
uip api-workflow run --help
```

Results:

- Logged into `cloud.uipath.com`, org `galacticus`, tenant `DefaultTenant`.
- Folder `7986316` exposes one task-eligible DirectoryUser. The personal
  reviewer identifier is intentionally not committed.
- `uip tasks list --folder-id 7986316 --output json` returned an empty task
  list.
- `uip tasks --help` exposes list/get/users/assign/reassign/unassign/complete,
  but not direct task creation.
- No Action Center task was created, assigned, completed, reassigned, or
  unassigned.

## Task Creation Requirements

Use
`uipath/action-center/live-proof/clinician-validation-task-payload.json` with
`uipath/action-center/contracts/clinician-evidence-validation.quickform.json`.

The live task must be created only after explicit approval through an official
UiPath HITL creation path: Maestro, Flow, Coded Agent, API Workflow, or Studio
Web workflow with a Human-in-the-Loop QuickForm node.

Required evidence before claiming H2 live Action Center:

- numeric task ID;
- task type, expected `FormTask`;
- folder ID `7986316`;
- created/assigned/completed status snapshots as applicable;
- tenant-qualified deep link containing `/galacticus/DefaultTenant/`;
- `human.task.created` and, if completed, `human.task.completed` event mirror
  records.

## Approval-Needed Commands

Assignment, after a task ID exists and approval is granted:

```bash
uip tasks users 7986316 --output json
uip tasks assign <task-id> --user <reviewer-email> --output json
uip tasks get <task-id> --task-type FormTask --folder-id 7986316 --output json
```

Completion, after separate approval is granted:

```bash
uip tasks get <task-id> --task-type FormTask --folder-id 7986316 --output json
uip tasks complete <task-id> --type FormTask --folder-id 7986316 --action "Approve" --data '{"reviewerfinaltext":"Clinician-approved synthetic evidence text goes here.","policycitationfinal":"Aurora Vale Fictionalimab Policy 2026, Section 2.1","reviewerdecision":"approved","attestationconfirmed":true,"reviewernotes":"Synthetic demo attestation only; no real patient or medical advice.","moreevidencereason":""}' --output json
uip tasks get <task-id> --task-type FormTask --folder-id 7986316 --output json
```

Fallback event write, only if Action Center creation is blocked and the H1
UiPath-controlled event path has approval:

```bash
uip api-workflow run uipath/api-workflows/write-event.workflow.json --input-arguments '{"apiBaseUrl":"<mock-healthcare-api-url>","caseId":"case-syn-001","maestroCaseId":"maestro-case-placeholder-001","actorName":"UiPath Human Gate Fallback","taskOrAgentName":"TreatmentAccessWriteEvent","action":"human_gate_fallback_recorded","inputSummary":"Action Center task creation was blocked or unavailable after discovery; synthetic unsupported claim remains gated.","outputSummary":"Human gate shown as UiPath-controlled fallback, not as a live Action Center task.","evidenceRefs":["uipath/action-center/live-proof/clinician-validation-task-payload.json","uipath/action-center/contracts/clinician-evidence-validation.quickform.json"],"traceId":"checkpoint8-action-center-fallback"}' --output json
```

## Blockers

- There is no direct `uip tasks create` command in the discovered CLI surface.
  Live task creation requires an approved HITL workflow surface.
- No live task ID or deep link exists yet, so the final demo must not claim a
  live Action Center task until creation evidence is captured.

## Integration Notes

- Final UX lane should display the H2 payload as pending approval until a real
  task ID/deep link exists.
- If fallback is used, label it exactly:
  `UiPath-controlled human gate fallback - no live Action Center task created`.
- Do not display the fallback as a completed clinician signoff.
- QA should run `CI=true pnpm smoke:checkpoint8-action-center-proof` before
  final demo evidence capture.
