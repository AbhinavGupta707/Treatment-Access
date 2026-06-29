# Action Center Live Proof

This is the Checkpoint 8 H2 proof packet for the human gate in Treatment Access
Command Center. It records one approved synthetic Action Center task in the
`TreatmentAccessHackathon` folder. No real patient, payer, provider, credential,
or PHI was used.

## Live Task Result

Live Action Center ExternalTask created, assigned, and completed.

| Field           | Value                                                                                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| Task ID         | `4401667`                                                                                                            |
| Task type       | `ExternalTask`                                                                                                       |
| Task key        | `93c09da5-3edb-455e-9679-d513113fd4fa`                                                                               |
| Folder          | `TreatmentAccessHackathon` / `7986316`                                                                               |
| ExternalTag     | `TACC-2026-001`                                                                                                      |
| Priority        | `High`                                                                                                               |
| Created time    | `2026-06-29T19:43:14.197Z`                                                                                           |
| Completed time  | `2026-06-29T19:44:16.577Z`                                                                                           |
| Standalone link | `https://cloud.uipath.com/galacticus/DefaultTenant/actions_/current-task/tasks/4401667`                              |
| Inbox link      | `https://cloud.uipath.com/galacticus/DefaultTenant/orchestrator_/actions/inbox/93c09da5-3edb-455e-9679-d513113fd4fa` |

The task was created through the installed UiPath Tasks SDK
`GenericTasks/CreateTask` surface because the public `uip tasks` CLI exposes
read, assign, and complete commands but no create command.

## Discovery

Read-only discovery was run first against the expected UiPath scope:

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
- One task-eligible DirectoryUser was discoverable in the folder. The personal
  identifier is not committed; the proof manifest uses a placeholder.
- Initial task list was empty before the approved live task was created.

## Commands Used

After explicit approval, the live task was created, assigned, read back,
completed, and read back again.

```bash
uip tasks assign 4401667 --user-id <task-eligible-user-id> --output json
uip tasks get 4401667 --task-type ExternalTask --folder-id 7986316 --output json
uip tasks complete 4401667 --type ExternalTask --folder-id 7986316 --data '{"clinicalAttestation":"Approved for synthetic demo after reviewing policy citations and evidence matrix. No real patient data used.","reviewNotes":"Evidence is source-backed; diagnosis severity remains governed by clinician attestation before payer submission."}' --output json
uip tasks get 4401667 --task-type ExternalTask --folder-id 7986316 --output json
```

Final readback returned status `Completed` and the synthetic completion payload.

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
- a completion data template for a synthetic human task;
- no PHI, no real payer, no real provider, no credential, and no real contact
  data.

The payload binds to the existing QuickForm contract:

```text
uipath/action-center/contracts/clinician-evidence-validation.quickform.json
```

## Maestro HITL Boundary

The live Maestro artifacts were also exercised:

- Maestro Case instance `cad900ae-e4f9-4e59-a1c8-c6f15934f5bc` was created and
  faulted at the case action task boundary because the tenant registry exposed
  no deployed Action App binding.
- Maestro Flow instance `4e17f6d2-a2d7-4730-b1ed-9d0dcadef9b0` completed the
  trigger and synthetic packet-prep node, then reached the
  inline Maestro Flow HITL QuickForm node `clinicianEvidenceReview1`.
- The inline HITL node faulted inside the AppTasks request with an `ExternalTag`
  validation error. The flow package remains valid; the live runtime boundary is
  the inline QuickForm serializer, not login, folder, or task-read access.

For production hardening, bind the HITL step to a deployed Action App/FormTask
catalog surface or keep using the verified ExternalTask creation path.

## Fallback Criteria

Fallback is still documented for environments where Action Center creation is
not available. Use the fallback only after layer-ordered diagnosis:

1. Confirm login, org, tenant, folder, and `uip tasks` command registration.
2. Confirm Actions/Action Center discovery with `uip tasks users` and
   `uip tasks list`.
3. Confirm official activation flows: Actions service, reviewer permissions,
   task catalog if used, and a workflow identity that can create tasks.
4. Only then diagnose permissions, licensing, runtime, or catalog blockers.

If fallback is used in another tenant, the Command Center must label it exactly:

```text
UiPath-controlled human gate fallback - no live Action Center task created
```

The fallback event action remains `human_gate_fallback_recorded`.

The current `TreatmentAccessHackathon` proof does not rely on that fallback:
Task ID `4401667` is the live Action Center evidence.

## Verifier

Run:

```bash
CI=true pnpm smoke:checkpoint8-action-center-proof
```

The verifier checks that the H2 packet is synthetic, includes the unsupported
claim, policy citation, evidence refs, allowed outcomes, the live ExternalTask
ID/deep links, the completed task timestamp, the Maestro HITL boundary, and the
fallback wording for tenants where task creation is unavailable.
