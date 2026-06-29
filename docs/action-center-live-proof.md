# Action Center Live Proof

This is the Checkpoint 8 H2 proof packet for the human gate in Treatment Access
Command Center. It is safe by default: no task creation, assignment, completion,
Data Service write, RPA run, payer submission, or deployment is performed by
reading this document or running the verifier.

## Current Discovery

Read-only discovery was run against the expected UiPath scope:

```bash
uip login status --output json
uip tasks users 7986316 --output json
uip tasks list --folder-id 7986316 --output json
```

Findings:

- Active UiPath session: `cloud.uipath.com`, org `galacticus`, tenant
  `DefaultTenant`.
- Folder: `TreatmentAccessHackathon`, folder ID `7986316`, folder key
  `4fba2fa1-012b-469a-b6aa-e5be3811c173`.
- One task-eligible DirectoryUser is discoverable in the folder. Do not commit
  that user's personal identifier; resolve it during live smoke.
- No tasks were listed in the folder at discovery time.
- No task was created, assigned, completed, or modified.

## Synthetic Clinician Task Payload

The H2 clinician validation payload is:

```text
uipath/action-center/live-proof/clinician-validation-task-payload.json
```

It contains:

- case ID `case-syn-001` and external demo key `TACC-2026-001`;
- one unsupported high-impact claim requiring clinician attestation;
- policy citation `Aurora Vale Fictionalimab Policy 2026, Section 2.1`;
- evidence references to synthetic fixture sources only;
- allowed outcomes: `Approve`, `Approve With Edits`, `Reject`, and
  `Request More Evidence`;
- a completion data template for a synthetic FormTask;
- no PHI, no real payer, no real provider, no credential, and no real contact
  data.

The payload binds to the existing QuickForm contract:

```text
uipath/action-center/contracts/clinician-evidence-validation.quickform.json
```

## Approval-Gated Live Path

Task creation is approval-gated. The current `uip tasks` CLI surface supports
runtime list/get/users/assign/complete operations, but it does not expose a
direct `uip tasks create` command. Create the task only through an approved
UiPath HITL creation surface: Maestro, Flow, Coded Agent, API Workflow, or a
Studio Web workflow that contains the Human-in-the-Loop QuickForm node bound to
the clinician validation contract.

After explicit approval to create exactly one synthetic task:

1. Run the approved HITL workflow using
   `uipath/action-center/live-proof/clinician-validation-task-payload.json`.
2. Capture the numeric task ID, task type, status, actor, timestamp, and folder.
3. Build the standalone deep link with the tenant slug:
   `https://cloud.uipath.com/galacticus/DefaultTenant/actions_/current-task/tasks/<task-id>`.
4. If UiPath returns a task key, also capture the inbox link:
   `https://cloud.uipath.com/galacticus/DefaultTenant/orchestrator_/actions/inbox/<task-key>`.
5. Write or capture the `human.task.created` event mirror record.

Assignment remains a separate approval-gated action:

```bash
uip tasks users 7986316 --output json
uip tasks assign <task-id> --user <reviewer-email> --output json
uip tasks get <task-id> --task-type FormTask --folder-id 7986316 --output json
```

Completion remains a separate approval-gated action:

```bash
uip tasks get <task-id> --task-type FormTask --folder-id 7986316 --output json
uip tasks complete <task-id> --type FormTask --folder-id 7986316 --action "Approve" --data '{"reviewerfinaltext":"Clinician-approved synthetic evidence text goes here.","policycitationfinal":"Aurora Vale Fictionalimab Policy 2026, Section 2.1","reviewerdecision":"approved","attestationconfirmed":true,"reviewernotes":"Synthetic demo attestation only; no real patient or medical advice.","moreevidencereason":""}' --output json
uip tasks get <task-id> --task-type FormTask --folder-id 7986316 --output json
```

Do not claim a live Action Center task unless a task ID and tenant-qualified
deep link exist.

## Fallback Criteria

Use the fallback only after layer-ordered diagnosis:

1. Confirm login, org, tenant, folder, and `uip tasks` command registration.
2. Confirm Actions/Action Center discovery with `uip tasks users` and
   `uip tasks list`.
3. Confirm official activation flows: Actions service, reviewer permissions,
   task catalog if used, and a workflow identity that can create FormTask
   actions.
4. Only then diagnose permissions, licensing, runtime, or catalog blockers.

Fallback is allowed if Action Center task creation is blocked by tenant
capabilities, permissions, missing reviewer access, missing catalog activation,
or absence of an approved HITL creation surface before the final recording.

The fallback proof surface is not a frontend-only switch. It must be a
UiPath-controlled event mirror record from the approved H1 Data Service/API
Workflow path with action `human_gate_fallback_recorded`.

The Command Center must label it exactly:

```text
UiPath-controlled human gate fallback - no live Action Center task created
```

The UI must not label this as a live Action Center task, clinician completion,
or task signoff.

## Verifier

Run:

```bash
CI=true pnpm smoke:checkpoint8-action-center-proof
```

The verifier checks that the H2 packet is synthetic, includes the unsupported
claim, policy citation, evidence refs, allowed outcomes, approval-gated command
templates, tenant-qualified deep-link patterns, fallback criteria, and no live
task claim.
