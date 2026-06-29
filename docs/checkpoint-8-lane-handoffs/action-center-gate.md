# Checkpoint 8 Lane Handoff: Action Center Human Gate Proof

## Summary

H2 is now live for the hackathon tenant. The lane first prepared the synthetic
clinician validation payload and read-only discovery proof, then the main
orchestrator created, assigned, completed, and read back one approved synthetic
Action Center ExternalTask.

Live Action Center ExternalTask created, assigned, and completed.

## Files Changed

- `uipath/action-center/live-proof/clinician-validation-task-payload.json`
- `uipath/live-proof/action-center-human-gate-proof.manifest.json`
- `docs/action-center-live-proof.md`
- `docs/checkpoint-8-lane-handoffs/action-center-gate.md`
- `scripts/verify-checkpoint8-action-center-proof.ts`
- `package.json`
- `uipath/action-center/README.md`
- `uipath/solution/treatment-access-command-center/TreatmentAccessCase/**`
- `uipath/solution/treatment-access-command-center/ClinicianValidationFlow/**`

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
- Initial `uip tasks list --folder-id 7986316 --output json` returned an empty
  task list.
- `uip tasks --help` exposes list/get/users/assign/reassign/unassign/complete,
  but not direct task creation.

## Live Task Evidence

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Task ID        | `4401667`                              |
| Task type      | `ExternalTask`                         |
| Task key       | `93c09da5-3edb-455e-9679-d513113fd4fa` |
| Folder ID      | `7986316`                              |
| ExternalTag    | `TACC-2026-001`                        |
| Status         | `Completed`                            |
| Completed time | `2026-06-29T19:44:16.577Z`             |

The task was created through the installed UiPath Tasks SDK
`GenericTasks/CreateTask` surface because the public `uip tasks` CLI has no
create verb. Assignment and completion used the public CLI:

```bash
uip tasks assign 4401667 --user-id <task-eligible-user-id> --output json
uip tasks get 4401667 --task-type ExternalTask --folder-id 7986316 --output json
uip tasks complete 4401667 --type ExternalTask --folder-id 7986316 --data '{"clinicalAttestation":"Approved for synthetic demo after reviewing policy citations and evidence matrix. No real patient data used.","reviewNotes":"Evidence is source-backed; diagnosis severity remains governed by clinician attestation before payer submission."}' --output json
uip tasks get 4401667 --task-type ExternalTask --folder-id 7986316 --output json
```

## Maestro HITL Boundary

The lane now also owns the final Maestro artifacts:

- `TreatmentAccessCase` validates, packs, and creates a live case instance.
  Debug instance `cad900ae-e4f9-4e59-a1c8-c6f15934f5bc` faulted at the action
  task boundary because no deployed Action App binding was available.
- `ClinicianValidationFlow` validates, packs, and creates a live flow debug
  instance. Instance `4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0` completed the
  trigger and synthetic packet-prep node, then reached the inline Maestro Flow
  HITL QuickForm node `clinicianEvidenceReview1`.
- Inline HITL task creation faulted in the AppTasks request with an `ExternalTag`
  validation issue. This is the remaining production-hardening gap; it is not a
  login, folder, or Action Center read/complete blocker.

## Task Creation Requirements

Use
`uipath/action-center/live-proof/clinician-validation-task-payload.json` with
`uipath/action-center/contracts/clinician-evidence-validation.quickform.json`.

For a future tenant or clean rerun, the live task must be created only after
explicit approval through one of:

- deployed Maestro/HITL node with Action App/FormTask binding;
- Coded Agent or API Workflow that creates exactly one synthetic task;
- the installed UiPath Tasks SDK `GenericTasks/CreateTask` surface used in this
  proof.

Required evidence before claiming H2 live Action Center:

- numeric task ID;
- task type;
- folder ID `7986316`;
- created/assigned/completed status snapshots as applicable;
- tenant-qualified deep link containing `/galacticus/DefaultTenant/`;
- `human.task.created` and, if completed, `human.task.completed` event mirror
  records or Action Center readbacks.

## Fallback Label

Fallback is now only for tenants where task creation cannot be made available.
If fallback is used, label it exactly:

```text
UiPath-controlled human gate fallback - no live Action Center task created
```

The current `TreatmentAccessHackathon` proof does not rely on that fallback
because Task ID `4401667` exists and was completed.

## Verification

QA should run:

```bash
CI=true pnpm smoke:checkpoint8-action-center-proof
```

The smoke now requires the live ExternalTask proof and the Maestro inline-HITL
fault boundary.
