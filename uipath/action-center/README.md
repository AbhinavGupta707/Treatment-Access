# Action Center

Checkpoint 2 Action Center contracts for the Treatment Access Command Center.
These contracts define the human review layer that Maestro/API Workflow lanes can
bind to. The final live proof created, assigned, completed, and read back one
synthetic Action Center task in `TreatmentAccessHackathon`.

## Contracts

- `contracts/clinician-evidence-validation.quickform.json` - clinician validates
  mapped evidence, source citations, policy criterion, and confidence before the
  submission packet may use a clinical assertion.
- `contracts/appeal-signoff.quickform.json` - clinician reviews denial reason,
  administrative appeal draft, citations, requested edits, and approves or
  rejects appeal submission.
- `contracts/human-exception-review.quickform.json` - reviewer resolves repeated
  API/portal failure, low-confidence extraction, contradictory evidence, or SLA
  risk.

Each contract includes QuickForm-style fields, outcomes, assignment target,
priority, timeout, pause/resume behavior, downstream case-state updates, and the
event mirror payload to write when the task completes.

## Runtime Surface

- UiPath org: `galacticus`
- Tenant: `DefaultTenant`
- Folder: `TreatmentAccessHackathon`
- Folder ID: `7986316`
- Folder key: `4fba2fa1-012b-469a-b6aa-e5be3811c173`
- Preferred reviewer group: `Treatment Access Clinician Reviewers`
- Current discovered assignable user fallback: resolved during live smoke from
  `uip tasks users 7986316 --output json`.

Use group assignment for demo resilience once the group is created and granted
Action Center permissions. Use the discovered user only as a fallback for the
single-reviewer hackathon tenant.

## Permission Checklist

Before live smoke, verify in `TreatmentAccessHackathon`:

- Reviewer user or group has Actions access.
- Reviewer user or group has Action Assignment or Self Assignment permission as
  needed for the task routing model.
- Reviewer user or group can access the relevant Action Catalog, if catalogs are
  used by the final Maestro/API Workflow implementation.
- Reviewer has signed in to Action Center at least once.
- The workflow identity that creates tasks can create FormTask/AppTask actions
  in the folder.
- The event mirror workflow can write `human.task.created` and
  `human.task.completed` records after task creation/completion.

## Discovery And Live Task Run

Read-only commands run before mutation:

```bash
uip login status --output json
uip tasks users 7986316 --output json
uip tasks list --folder-id 7986316 --output json
```

Findings:

- Active session is logged into `https://cloud.uipath.com`,
  org `galacticus`, tenant `DefaultTenant`.
- Folder `7986316` currently exposes at least one assignable Action Center user.
  The exact reviewer identifier is intentionally not stored in this repository;
  resolve it during live smoke with `uip tasks users 7986316 --output json`.
- No Action Center tasks were listed in the folder at initial discovery time.

Approved live proof then created, assigned, completed, and read back one
synthetic task:

- Task ID `4401667`
- Task type `ExternalTask`
- Task key `93c09da5-3edb-455e-9679-d513113fd4fa`
- ExternalTag `TACC-2026-001`
- Final status `Completed`
- Completed time `2026-06-29T19:44:16.577Z`

The task was created through the installed UiPath Tasks SDK
`GenericTasks/CreateTask` surface because the public `uip tasks` CLI exposes
list/get/users/assign/complete but no create verb. Assignment and completion
used the public CLI.

Checkpoint 6 safe wrapper:

```bash
CI=true pnpm uipath:readiness -- cloud
```

This lists task-eligible users and current tasks only. Future live task creation
must still be explicitly approved and should use either a deployed
Maestro/HITL/Action App binding or the documented ExternalTask creation path.

## Integration Notes

Maestro should create each task at the named pause point and wait only on the
HITL `completed` handle. Downstream logic should read the result object from
`$vars.<nodeId>.output` and route by either the selected outcome or the explicit
decision output field defined in the contract.

The API Workflow/Event Mirror lane should write the contract's
`downstreamEventPayload` after task creation and completion. The Command Center
must read those UiPath-written events as the source of live human-task state.

Appeal text is an administrative draft for clinician review. Do not submit an
appeal unless the appeal signoff task completes with an approval outcome.

## Checkpoint 8 H2 Proof Packet

The final Action Center human gate proof packet is documented in
`docs/action-center-live-proof.md` and
`uipath/live-proof/action-center-human-gate-proof.manifest.json`.

The synthetic clinician validation payload is
`uipath/action-center/live-proof/clinician-validation-task-payload.json`. It
defines the case ID, unsupported claim, policy citation, evidence refs, allowed
outcomes, completion data template, and no-PHI safety flags for the final H2
live proof.

Do not claim a live Action Center task unless a numeric task ID and
tenant-qualified deep link exist. For the final proof, Task ID `4401667` is the
live Action Center evidence. If Action Center task creation is blocked by tenant
capabilities in another environment, the Command Center must label the
alternative exactly:
`UiPath-controlled human gate fallback - no live Action Center task created`.

Verify the packet locally with:

```bash
CI=true pnpm smoke:checkpoint8-action-center-proof
```
