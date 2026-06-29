# Checkpoint 8 Event State Bridge Handoff

## Lane Scope

This lane prepares the H1 proof path for a UiPath-controlled synthetic
case/event state bridge. It does not create live Data Service entities or
records. It adds local validation so the Command Center and QA lanes can
distinguish:

- `live_uipath_written`: a synthetic event produced by a UiPath source and
  backed by a UiPath record, task, or job identifier.
- `uipath_shaped_pending_approval`: a payload shaped for UiPath but not yet
  written by live UiPath.
- `local_synthetic_mirror`: a local-only mirror event that must not be claimed
  as live UiPath execution.

## Contract Changes

Shared schemas now define `UiPathEventStateRecord` and
`UiPathEventStateProvenance`. Required H1 fields include:

- `source_system` / Data Fabric `sourceSystem`
- `source_actor` / `sourceActor`
- `source_verification` / `sourceVerification`
- UiPath folder: `uipath_folder_name`, `uipath_folder_id`,
  `uipath_folder_key`
- UiPath identifiers: `uipath_record_id`, `uipath_task_id`, or
  `uipath_job_id`
- Event identity: `case_id`, `event_type`, `event_action`, `timestamp`
- Confirmation: `confirmation_id`, `confirmation_status`
- Labels: `source_labels`, `safety_labels`

Validation rejects `source_verification=live_uipath_written` unless
`source_system` starts with `uipath_` and at least one UiPath runtime identifier
is present. `safety_labels` must include `synthetic_data_only`.

## Local Bridge API

The mock healthcare API has local no-side-effect endpoints:

```text
POST /uipath/event-state-records/validate
POST /uipath/event-state-records
GET  /uipath/event-state-records?case_id=case-syn-001&verification=live_uipath_written
```

The ingest route stores the validated record and mirrors it into the existing
case event timeline as an `AuditEvent` with `source_provenance`.

## Samples

- Valid UiPath-written sample:
  `uipath/live-proof/samples/uipath-written-event-state.sample.json`
- Invalid local/UI overclaim sample:
  `uipath/live-proof/samples/local-overclaim-event-state.invalid.sample.json`

## Data Service Discovery And Approval Gates

Read-only discovery is allowed and should happen before mutation:

```bash
uip login status --output json
uip df entities list --include-folders --output json
uip df entities list --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 --output json
uip df entities get <TaccAuditEvent-entity-id> --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 --output json
```

Read-only discovery result on June 29, 2026:

- `uip login status --output json` returned logged in for org `galacticus`,
  tenant `DefaultTenant`.
- `uip tools list --output json` showed `data-fabric-tool` version `1.195.0`.
- `uip df entities list --output json` returned an empty tenant-level
  `Data` array.
- `uip df entities list --include-folders --output json` and
  `uip df entities list --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 --output json`
  returned `unknown option` validation errors. Per the local UiPath Data Fabric
  reference, folder-scoped discovery requires a newer Data Fabric tool version
  with `--include-folders` and `--folder-key` support.

Approval-gated write command, not run by this lane:

```bash
uip df records insert <TaccAuditEvent-entity-id> \
  --folder-key 4fba2fa1-012b-469a-b6aa-e5be3811c173 \
  --file /path/to/uipath-written-event-state-record.json \
  --output json
```

Entity creation or schema evolution is also approval-gated. If needed, extract
only the `TaccAuditEvent` body from `uipath/data-service/entities.json`, review
the proposed Data Fabric schema with the orchestrator, then run
`uip df entities create` only after explicit approval.

## UI Integration Notes

The Command Center should not treat an event as live UiPath proof merely because
`actor_name` says UiPath. Use `event.source_provenance.source_verification`:

- Show live proof only for `live_uipath_written`.
- Show a pending/ready state for `uipath_shaped_pending_approval`.
- Label `local_synthetic_mirror` as local synthetic mirror state.

For proof drawers, display folder name/key, `source_system`, `source_actor`,
`uipath_record_id`, `uipath_task_id`, `uipath_job_id`, `confirmation_status`,
and `captured_at`.

## Verification

Run the lane verifier locally:

```bash
node --import tsx/esm scripts/verify-checkpoint8-event-bridge.ts
```

The final QA lane may wire this into a package script, but this lane leaves
`package.json` unchanged.
